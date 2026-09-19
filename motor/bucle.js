import { ABISMO } from '../escena.js';
import { clamp, opt, rango, fusiona } from './util.js';
import { V, vaciaCampos, indexaCampos,
         MOD, reiniciaMod, frente, PLANOS } from './estado.js';
import { ESPECIES, EVENTOS, especie, evento, paramsDe } from './registro.js';
import { resuelveEspectros, resiembraPaletas, paletaDe } from './color.js';
import { buildAgua, buildRuido, buildOndulacion, buildDispersion,
         resiembraAgua, pintaAgua, pintaDispersion,
         ruido, RUIDO } from './agua.js';
import { cableaTacto, envejeceOndas, olvidaOndas,
         avisaContactos } from './dedo.js';
import { M } from './api.js';

/* el reloj del bucle y el del redimensionado */
let ultimo=0;
let anchoPrev=0, altoPrev=0, tempRedim=null, corriendo=false;
/* los grupos son el reloj de cada evento; evVivos, los que corren ahora */
let evGrupos = [], evVivos = [];

/* ══════════════════════════════════════════════════════════════════
   POBLACIÓN
   ══════════════════════════════════════════════════════════════════ */
/* Un aviso por nombre y no uno por plano: puebla() recorre los tres. */
const avisadas = new Set();
function avisa(clave, texto){
  if (avisadas.has(clave)) return;
  avisadas.add(clave);
  console.warn(texto);
}

function puebla(){
  /* Lo que comparte toda una población se sortea aquí: una vez por pecera
     y no una por plano. El banco vive repartido en los tres planos pero es
     UN banco visto desde tres distancias, así que los tonos que lo mandan
     tienen que salir del mismo sorteo. */
  for (const conf of ABISMO.bichos){
    const def = ESPECIES[conf.especie];
    if (def && def.siembra) def.siembra(M, paramsDe(conf));
  }

  for (let li=0; li<PLANOS.length; li++){
    const L = PLANOS[li];
    L.grupos.length = 0;
    for (const conf of ABISMO.bichos){
      const def = ESPECIES[conf.especie];
      if (!def){
        avisa('sp:'+conf.especie, 'especie desconocida: ' + conf.especie);
        continue;
      }
      /* plano: número o lista. Sin él, la especie vive en los tres. */
      if (conf.plano !== undefined){
        const ok = Array.isArray(conf.plano) ? conf.plano.indexOf(li) >= 0
                                             : conf.plano === li;
        if (!ok) continue;
      }
      const p = paramsDe(conf);
      /* `reparto`, `por` y `tent` llevan UNA ENTRADA POR PLANO, y esa
         cuenta no está escrita en ningún sitio: es `ABISMO.planos.length`.
         Con un plano de más, `p.reparto[3]` es undefined, el conteo sale
         NaN y `for (i=0; i<NaN; i++)` no corre: el plano nuevo se queda
         vacío sin un solo error. */
      for (const k of ['reparto','por','tent'])
        if (Array.isArray(p[k]) && p[k].length !== PLANOS.length)
          avisa('planos:'+conf.especie+':'+k,
                conf.especie + '.' + k + ' tiene ' + p[k].length + ' entradas y hay '
                + PLANOS.length + ' planos: los que sobren se quedan vacíos');
      const q = def.conteo ? def.conteo(li, p) : 0;
      const gr = { def, p, items: [] };
      for (let i=0;i<q;i++) gr.items.push(def.crear(M, L, p));
      L.grupos.push(gr);
    }
  }
}

/* ══════════════════════════════════════════════════════════════════
   EVENTOS
   ══════════════════════════════════════════════════════════════════ */
function preparaEventos(){
  evGrupos = []; evVivos = [];
  for (const conf of ABISMO.eventos){
    const def = EVENTOS[conf.evento];
    if (!def){
      avisa('ev:'+conf.evento, 'evento desconocido: ' + conf.evento);
      continue;
    }
    const p = paramsDe(conf);
    /* `cada: null` es un evento DORMIDO: está en la escena, con sus
       parámetros, y no sale nunca por su cuenta. Es lo que deja probar
       uno desde el panel sin que se instale en la pieza, y sin que haya
       una segunda copia de sus parámetros en ninguna parte. */
    evGrupos.push({ def, p, vivo: null,
                    prox: p.cada === null ? Infinity
                        : rango(p.primero || def.primero || [20,60]) });
  }
}

function lanza(gr, x, y){
  const e = { def: gr.def, p: gr.p, gr, t: 0 };
  Object.assign(e, gr.def.arranca(M, gr.p, x, y) || {});
  evVivos.push(e);
  gr.vivo = e;
  return e;
}

/* Vuelve a poner el reloj de un grupo. Un dormido (`cada: null`) vuelve a
   dormirse: haberlo lanzado a mano una vez no puede instalarlo. */
function reprograma(gr){
  gr.vivo = null;
  gr.prox = gr.p.cada === null ? Infinity
                               : rango(gr.p.cada || gr.def.cada || [90,240]);
}

function pasoEventos(dt){
  /* se rehacen: un evento que ya no está no tiene que borrar nada */
  vaciaCampos();
  reiniciaMod();

  let hayGrande = evVivos.some(e => e.def.exclusivo);

  for (const gr of evGrupos){
    if (gr.vivo) continue;
    gr.prox -= dt;
    if (gr.prox > 0) continue;
    /* un exclusivo espera su turno en vez de perder el suyo, y espera de
       VERDAD: se le vuelve a armar el reloj. Dejándole el `prox` correr en
       negativo arrancaba en el mismo fotograma en que moría el que lo
       tapaba. Ver `relevo` en la escena. */
    if (gr.def.exclusivo && hayGrande){
      gr.prox = rango(gr.p.relevo || ABISMO.relevo || [25, 70]);
      continue;
    }
    lanza(gr);
    if (gr.def.exclusivo) hayGrande = true;
  }

  for (let i=evVivos.length-1; i>=0; i--){
    const e = evVivos[i];
    e.t += dt;
    if (e.def.actualiza(e, M, e.p, dt) === false){
      evVivos.splice(i, 1);
      reprograma(e.gr);
    }
  }
  /* `M.mod` es lo único de la API que un evento ESCRIBE, y clamp() deja
     pasar lo que no es un número: `undefined < 0.04` y `undefined > 2` son
     los dos falsos. Un solo `mod.ritmo` sin valor y `paso()` multiplica
     por él: todas las posiciones se vuelven NaN en el mismo fotograma y
     no hay vuelta atrás. Volver a 1 deja el 0 a salvo, que ése sí lo
     recorta el clamp. */
  MOD.agua  = Number.isFinite(MOD.agua)  ? clamp(MOD.agua,  0.04, 2.0) : 1;
  MOD.ritmo = Number.isFinite(MOD.ritmo) ? clamp(MOD.ritmo, 0.15, 2.0) : 1;
}

/* ── API DE PRUEBAS ─────────────────────────────────────────────────
   Nada de esto lo usa la pieza: es para el panel de `pruebas.js`. Está
   aquí porque `evGrupos`, `evVivos` y `ABISMO` son privados.        */

/* Dispara un evento a mano. Si ya está en marcha se reinicia; `extra`
   pisa parámetros sueltos.

   SUS PARÁMETROS SALEN DE LA ESCENA Y DE NINGÚN OTRO SITIO. Un evento
   tenía además un `def.prueba` con valores propios para poder lanzarlo
   sin que la escena lo configurase, y eran 102 claves que la pieza
   cargaba sólo para alimentar al panel: nadie las ejercitaba, así que
   envejecían solas —23 ya no coincidían con la escena—. Para probar uno
   sin instalarlo se le pone `cada: null` en la escena y queda dormido. */
function dispara(nombre, extra){
  const def = EVENTOS[nombre];
  if (!def) return false;
  const gr = evGrupos.find(g => g.def === def);
  if (!gr){
    avisa('suelto:'+nombre, 'evento «' + nombre + '» sin parámetros: no está '
        + 'en ABISMO.eventos. Añádelo con `cada: null` para poder lanzarlo '
        + 'sin que salga solo.');
    return false;
  }
  if (extra) gr.p = fusiona(gr.p, extra);
  /* un `espectroX` que llega en `extra` tiene que tirar su `paletaX`:
     resuelveEspectros() respeta la paleta que ya esté puesta —es como se
     anula un espectro sin borrarlo—, así que sin esto el color editado
     desde el panel no se aplica nunca. Salvo que `extra` traiga también la
     paleta: ahí manda ella, que es la regla de la casa. */
  if (extra) for (const k in extra){
    const destino = paletaDe(k);
    if (destino && extra[destino] === undefined) delete gr.p[destino];
  }
  /* y sus espectros: los de la escena ya se resolvieron al arrancar, pero
     un `espectroX` escrito en el panel no ha pasado por ahí y se quedaría
     en `M.color(undefined)`. */
  resuelveEspectros(gr.p);
  para(nombre);
  /* un exclusivo a mano echa al que hubiera. Se saca de la lista aquí y no
     con otra llamada a para() porque para() recorre y corta la MISMA lista
     que este bucle. */
  if (def.exclusivo)
    for (let i=evVivos.length-1;i>=0;i--)
      if (evVivos[i].def.exclusivo){
        reprograma(evVivos[i].gr);
        evVivos.splice(i,1);
      }
  lanza(gr);
  return true;
}

function para(nombre){
  for (let i=evVivos.length-1;i>=0;i--){
    const e = evVivos[i];
    if (nombre && e.def.nombre !== nombre) continue;
    evVivos.splice(i,1);
    reprograma(e.gr);
  }
  vaciaCampos();
  reiniciaMod();
}

/* lo llama el dedo: un evento con `porContacto` puede nacer del gesto */
function contactoEventos(x, y){
  for (const gr of evGrupos){
    const q = gr.p.porContacto;
    if (!q || gr.vivo) continue;
    if (gr.def.exclusivo && evVivos.some(e => e.def.exclusivo)) continue;
    if (Math.random() < q) lanza(gr, x, y);
  }
}

/* ══════════════════════════════════════════════════════════════════
   RENDIMIENTO
   El coste es relleno: varias pasadas a pantalla completa por frame.
   Lo que importa no es el dpr sino los píxeles totales del lienzo.
   ══════════════════════════════════════════════════════════════════ */
function calcDpr(){
  const C = ABISMO.calidad;
  let d = Math.min(window.devicePixelRatio || 1, C.dprMax);
  const px = V.W*V.H*d*d;
  if (px > ABISMO.maxPx) d = Math.max(C.dprMin, d*Math.sqrt(ABISMO.maxPx/px));
  return d;
}

/* ══════════════════════════════════════════════════════════════════
   SETUP Y BUCLE
   ══════════════════════════════════════════════════════════════════ */
function setup(repoblar){
  V.W = Math.max(1, V.cv.clientWidth);
  V.H = Math.max(1, V.cv.clientHeight);
  anchoPrev = V.W; altoPrev = V.H;
  V.dpr = calcDpr();
  V.cv.width  = Math.round(V.W*V.dpr);
  V.cv.height = Math.round(V.H*V.dpr);
  V.U = Math.sqrt(V.W*V.H)/ABISMO.escala;

  const C = ABISMO.corriente;
  V.KY  = Math.PI/V.H * C.ondaY;
  V.KX  = Math.PI/V.W * C.ondaX;
  V.AMP = V.U*C.amplitud;

  /* la configuración se vuelca encima del plano vivo, así que tocar
     ABISMO.planos y recalcular surte efecto sin perder la población */
  PLANOS.length = ABISMO.planos.length;
  for (let i=0;i<PLANOS.length;i++){
    const L = PLANOS[i] || (PLANOS[i] = { cv: document.createElement('canvas'),
                                          grupos: [], luces: [], presas: [],
                                          cardumen: [] });
    Object.assign(L, ABISMO.planos[i]);
    /* su profundidad, que es lo que deja a un campo saber a quién puede
       tapar. Va después del assign: la constante no lo trae. */
    L.i = i;
    const r = V.dpr/L.resDiv;
    L.cv.width  = Math.max(1, Math.round(V.W*r));
    L.cv.height = Math.max(1, Math.round(V.H*r));
    L.g = L.cv.getContext('2d');
    L.r = r;
  }

  buildAgua();
  if (!ruido) buildRuido();
  buildOndulacion();
  buildDispersion();

  if (repoblar) puebla();
}

/* ── OTRA PECERA ────────────────────────────────────────────────────
   No es repoblar: es volver a sortearlo TODO, que es lo que pide el botón
   de reiniciar. Hay cuatro cosas que sobreviven a un `setup(true)` y que
   por tanto hay que tirar a mano:

     · las PALETAS: lo hace `resiembraPaletas()`, en motor/color.js, que es
       donde vive el convenio de los espectros y su marca.
     · las MANCHAS de la ondulación del agua.
     · los RELOJES de los eventos.
     · las ONDAS del dedo, que son del gesto y no de la pecera.

   */
function reinicia(){
  para();
  ABISMO.bichos.forEach(resiembraPaletas);
  ABISMO.eventos.forEach(resiembraPaletas);
  resiembraAgua();
  olvidaOndas();
  preparaEventos();
  V.t = 0;
  setup(true);
}

/* Cada plano en su propio lienzo y en aditivo: primero la población y
   después los eventos que dibujen. El dedo no pinta nada. */
/* ── EL TAJO: PINTAR UN BICHO MAL ───────────────────────────────────
   Todo dibujo de bicho pasa por aquí. Un campo `tajo` NO lo lee ninguna
   especie: lo lee el motor justo antes de pintarla, y lo que hace es
   pintarla ROTA. Mismo principio que `alFrente` —el dibujo de un objeto
   lo coloca el motor, no el objeto— y el único sitio donde se puede
   corromper un sprite sin que la especie sepa que existe.

   La rotura son BANDAS HORIZONTALES: el bicho se dibuja `d.bandas`
   veces, cada vez con el recorte de una banda y su propio
   desplazamiento. Miden `d.paso` píxeles de escena, así que a uno grande
   le tocan varias y a una mota una sola —y entonces lo que le pasa es
   que aparece desplazada, que también vale—. La primera banda y la
   última se van a infinito para que la escalera cubra al bicho entero;
   sin eso, lo que sobresalga de la pila no se dibuja.

   NADA DE ESTO SE SORTEA: el signo, la altura de los cortes, el salto de
   cada banda y el selector salen de la POSICIÓN del bicho. Tienen que
   ser estables entre fotogramas —un tajo que salta cada fotograma es
   ruido— y el motor no puede guardar estado en el objeto de una especie
   que no conoce. Con senos de periodo largo los cortes además se
   arrastran despacio mientras el bicho nada.

   Lo único que viene de fuera es `d.giro`, una fase que el que pone el
   campo va avanzando: sumada al seno de la banda las recoloca a todas un
   poco y a cada una lo suyo. Es lo que deja que la rotura dé pasos sin
   que el motor guarde nada. */
function pintaBicho(def, o, M, L, p, g){
  /* `rompible` lo declara la ESPECIE, no el evento: el que rompe no elige
     a quién, y aquí nadie pregunta de qué especie es nadie.

     Y es lo que hace barato preguntar: sin la bandera, `M.campo` se
     consultaría unas setecientas veces por fotograma; con ella, cuatro. */
  if (!def.rompible){ def.dibuja(o, M, L, p, g); return; }
  const t = M.campo('tajo', o.x, o.y, L.i);
  if (!t){ def.dibuja(o, M, L, p, g); return; }
  /* M.campo devuelve un objeto COMPARTIDO y def.dibuja lo va a volver a
     llamar —silencio() lo usa—, así que lo que haga falta se copia ahora. */
  const d = t.d, k = t.peso;
  if (!d){ def.dibuja(o, M, L, p, g); return; }
  /* `parte` es cuántos de los que caen dentro se rompen, y sirve cuando
     hay muchos candidatos: rompiéndolos todos se lee una REGIÓN averiada,
     que es otra vez un fallo de pantalla. El selector es otro seno de la
     posición, con periodo distinto al de los cortes para que no vaya
     correlacionado con ellos. */
  const sel = Math.sin(o.x*0.031 - o.y*0.023 + 11.3);
  if (sel < 1 - 2*opt(d.parte, 1)){ def.dibuja(o, M, L, p, g); return; }

  const n = Math.max(2, d.bandas|0);
  const paso = d.paso*L.scale;
  const sep = d.sep * k;
  const est = 1 + opt(d.estira, 0) * k;
  const fase = Math.sin(o.x*0.011 + o.y*0.017);
  /* la pila de cortes, centrada en el bicho */
  const y0 = o.y - (n-1)*0.5*paso + fase*paso*0.5;
  for (let i=0;i<n;i++){
    /* el salto de cada banda, al cuadrado con signo: así la mayoría se
       quedan cerca de su sitio y unas pocas se van lejos. Repartido por
       igual, la escalera sale regular y se lee como un efecto. */
    const q = Math.sin(i*2.399 + fase*7.3 + opt(d.giro, 0));
    const dx = sep * q * Math.abs(q);
    g.save();
    /* los cortes van en coordenadas de MUNDO y se fijan antes de mover
       nada: las líneas se quedan quietas y son las bandas las que se van */
    g.beginPath();
    const a = i === 0     ? -V.H : y0 + (i-1)*paso;
    const b = i === n-1   ? V.H*2 : y0 + i*paso;
    g.rect(-V.W, a, V.W*3, b - a);
    g.clip();
    /* escala alrededor del propio bicho: centrada en el origen, uno del
       canto derecho se iría media pantalla */
    g.translate(o.x + dx, o.y);
    g.scale(est, 1/est);
    g.translate(-o.x, -o.y);
    def.dibuja(o, M, L, p, g);
    g.restore();
  }
}

/* Deja el contexto de un plano listo para sumar. Pasa por aquí TODO el que
   pinta en él —población, los que piden frente y eventos—, así que ninguno
   hereda el estado en que lo dejó el anterior: el `globalAlpha` que se
   olvide un evento no puede apagarle el dibujo al siguiente. */
function abrePlano(L){
  const g = L.g;
  g.setTransform(L.r,0,0,L.r,0,0);
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = 1;
  return g;
}

function pasoPlanos(dt){
  frente.length = 0;

  /* ── LOS CAMPOS DE LOS CUERPOS, Y ANTES DE TODO ────────────────
     Un bicho puede empujar campos igual que un evento —el rape tapa con
     uno—, pero no en su `actualiza`: pasoEventos() vacía `campos` al
     empezar el fotograma y los planos van del fondo al frente, así que un
     campo empujado al actualizarse llegaría tarde para el plancton del
     fondo, que es el 82 %. */
  for (const L of PLANOS)
    for (const gr of L.grupos)
      if (gr.def.campos)
        for (const o of gr.items) gr.def.campos(o, M, L, gr.p);

  /* AQUÍ y no antes: es el último sitio del fotograma en que se empuja un
     campo, y el primero es éste el que tiene que ver todos. `pintaSombras`
     corre antes y no pasa por el índice —recorre `campos` a pelo—, que es
     lo correcto: el agua sólo la tapan los `apaga` de los eventos. */
  indexaCampos();

  for (const L of PLANOS){
    const g = abrePlano(L);
    g.clearRect(0,0,V.W,V.H);
    g.lineCap = 'round'; g.lineJoin = 'round';

    /* Tres listas por plano, y ninguna sabe de especies. luces: quién
       ilumina. presas: quién es comestible. cardumen: quién hace banco.
       Es el vocabulario con el que los bichos se relacionan sin
       conocerse. */
    L.luces.length = 0; L.presas.length = 0; L.cardumen.length = 0;
    for (const gr of L.grupos){
      if (gr.def.luz)      for (const o of gr.items) L.luces.push(o);
      if (gr.def.presa)    for (const o of gr.items) L.presas.push(o);
      if (gr.def.cardumen) for (const o of gr.items) L.cardumen.push(o);
    }

    for (const gr of L.grupos){
      const {def, p} = gr;
      for (const o of gr.items) def.actualiza(o, M, L, p, dt);
      /* `alFrente` lo CONSUME el motor: se apunta y se baja la bandera, que
         es lo que hace verdad el «ese fotograma» del contrato. Dejándola
         puesta, una especie que escriba `o.alFrente = true` sin reasignarla
         cada fotograma se quedaría delante el resto de la sesión. */
      for (const o of gr.items)
        if (o.alFrente){ o.alFrente = false; frente.push({gr, L, o}); }
        else             pintaBicho(def, o, M, L, p, g);
    }
  }

  /* ── LOS QUE PIDEN FRENTE ──────────────────────────────────────
     Adelantarlo dentro de su propio plano no serviría —en aditivo sumar es
     conmutativo—: lo que cambia las cosas es cambiar de PLANO. Se pinta
     con el `L` SUYO y el contexto del otro, así que no crece ni se afila:
     sólo deja de quedarse detrás. */
  if (frente.length){
    const g = abrePlano(PLANOS[PLANOS.length-1]);
    for (const q of frente) pintaBicho(q.gr.def, q.o, M, q.L, q.gr.p, g);
  }

  /* Los eventos que dibujan lo hacen en su plano, después de los bichos:
     son escena, no población. */
  for (const e of evVivos){
    if (!e.def.dibuja) continue;
    const L = PLANOS[clamp(opt(e.p.plano, PLANOS.length-1)|0, 0, PLANOS.length-1)];
    e.def.dibuja(e, M, e.p, abrePlano(L));
  }

}


/* Los planos sumados sobre el agua, y el remate: el velo y el grano. El
   grano va a resolución nativa —de ahí el transform a identidad— o el
   ruido se interpola y deja de romper el bandeado. */
/* ── EL REPARTO DEL FOTOGRAMA ───────────────────────────────────────
   Una media móvil por etapa, sólo para el panel. Cuesta seis
   `performance.now()` por fotograma —microsegundos contra decenas de
   milisegundos— y a cambio se deja de adivinar: «el coste es relleno» no
   dice si el relleno es el agua, los planos o el velo, y en el móvil de
   otro es lo único que se puede llegar a saber.

   OJO AL LEERLO: un `drawImage` se ENCOLA, no se ejecuta, así que lo que
   se mide es el tiempo de CPU de pedirlo. El parón real aparece en la
   primera etapa que necesite el resultado —normalmente `suma`, que es
   quien lee los tres lienzos de plano—. Sirve para ver quién se lleva el
   fotograma, no para sumar exactamente 100. */
/* cuánto pesa el último fotograma en la media: no es un mando de la
   pieza, es el filtro de un instrumento. */
const SUAVIZA = 0.05;
const etapas = {eventos:0, agua:0, planos:0, suma:0, velo:0, grano:0};
let tEtapa = 0;
function marca(k){
  const t = performance.now();
  etapas[k] += (t - tEtapa - etapas[k]) * SUAVIZA;
  tEtapa = t;
}

function componePlanos(){
  V.ctx.globalCompositeOperation = 'lighter';
  for (const L of PLANOS){
    V.ctx.globalAlpha = L.alpha;
    V.ctx.drawImage(L.cv, 0, 0, V.W, V.H);
  }
  V.ctx.globalAlpha = 1;
  V.ctx.globalCompositeOperation = 'source-over';
  marca('suma');

  /* el velo va DENTRO del agua: después de la luz y antes del grano */
  pintaDispersion();
  marca('velo');

  if (ABISMO.dither !== false){
    /* la baldosa donde toque este fotograma: el patrón se ancla al origen
       del contexto, así que mover el origen mueve el grano. En enteros y
       dentro de una baldosa —de fracción, el patrón se interpola. */
    const ox = (Math.random()*RUIDO)|0, oy = (Math.random()*RUIDO)|0;
    V.ctx.setTransform(1,0,0,1,ox,oy);
    V.ctx.globalCompositeOperation = 'lighter';
    V.ctx.fillStyle = ruido;
    V.ctx.fillRect(-ox, -oy, V.cv.width, V.cv.height);
    V.ctx.globalCompositeOperation = 'source-over';
  }
  marca('grano');
}

function frame(ahora){
  /* se pide el siguiente ANTES de pintar: con la petición al final, una
     excepción a mitad de fotograma no rompe un fotograma, rompe la pieza
     —el bucle no se vuelve a programar nunca */
  requestAnimationFrame(frame);

  const ms = ahora - ultimo;
  /* el suelo en 0 no es adorno: el reloj puede ir hacia atrás —el
     manejador de visibilidad reajusta `ultimo` y el fotograma en vuelo
     trae un sello de antes— y un dt negativo mete a `tiempo` en negativo,
     con lo que la fase del agua se sale del array de tonos para siempre. */
  const dt = clamp(ms/1000, 0, 1/20);
  ultimo = ahora;
  V.t += dt;
  envejeceOndas(dt);

  V.ctx.setTransform(V.dpr,0,0,V.dpr,0,0);
  V.ctx.globalCompositeOperation = 'source-over';
  V.ctx.globalAlpha = 1;
  /* bilineal, no 'high': es más barato y desenfoca más, que es justo lo
     que se le pide al plano del fondo */
  V.ctx.imageSmoothingEnabled = true;

  tEtapa = performance.now();
  pasoEventos(dt);  marca('eventos');
  pintaAgua();      marca('agua');
  pasoPlanos(dt);   marca('planos');
  componePlanos();  // se marca por dentro: suma, velo y grano
}

function alRedimensionar(){
  clearTimeout(tempRedim);
  tempRedim = setTimeout(() => {
    const w = Math.max(1, V.cv.clientWidth), h = Math.max(1, V.cv.clientHeight);
    if (w === anchoPrev && h === altoPrev) return;
    /* en móvil, esconder la barra de URL dispara un resize: hay que
       redimensionar igual, pero repoblar por eso sería tirar la escena a
       la vista del usuario.

       Y SE REPUEBLA AL VOLCAR, que el área no lo ve: girar el móvil
       intercambia ancho y alto, o sea que el área es la MISMA y sólo
       cambia la forma. Sin esta mitad la población se queda donde la dejó
       la caja anterior, amontonada contra un canto y con la mitad fuera.

       La comparación es por qué lado es más largo el cuadro: la barra de
       URL sólo cambia el alto y no puede cruzar esa línea salvo en un
       cuadro ya casi cuadrado, donde repoblar tampoco molesta. */
    const antes = anchoPrev*altoPrev;
    const vuelca = (anchoPrev > altoPrev) !== (w > h);
    setup(vuelca || Math.abs(w*h - antes) > antes*0.15);
  }, 180);
}

/* ══════════════════════════════════════════════════════════════════
   ARRANQUE
   ══════════════════════════════════════════════════════════════════ */

function arranca(){
  if (corriendo) return;
  corriendo = true;
  ABISMO.bichos.forEach(resuelveEspectros);
  ABISMO.eventos.forEach(resuelveEspectros);
  V.cv = document.getElementById('acuario') || document.querySelector('canvas');
  if (!V.cv){
    corriendo = false;
    throw new Error('Acuario: hace falta un <canvas id="acuario"> en la página');
  }
  V.ctx = V.cv.getContext('2d', {alpha:false});

  cableaTacto();
  addEventListener('resize', alRedimensionar);
  addEventListener('orientationchange', alRedimensionar);
  /* volver de otra pestaña trae un sello viejo, y con él el `dt` de ese
     fotograma saldría enorme */
  document.addEventListener('visibilitychange', () => {
    ultimo = performance.now();
  });

  avisaContactos(contactoEventos);
  preparaEventos();
  setup(true);
  ultimo = performance.now();
  requestAnimationFrame(frame);
}

window.Acuario = { arranca, reinicia, especie, evento, ESPECIES, EVENTOS, M,
  /* ── sólo para el panel de pruebas ── */
  pruebas: {
    dispara, para,
    get escena(){ return ABISMO; },
    /* qué hay en marcha ahora mismo */
    get vivos(){ return evVivos.map(e => ({nombre: e.def.nombre,
                                          t: +e.t.toFixed(1),
                                          exclusivo: !!e.def.exclusivo})); },
    /* ── A DÓNDE SE VA EL FOTOGRAMA ──────────────────────────────
       Sólo para el panel, y es lo único que queda de medir rendimiento
       aquí: el motor ya no decide nada con ello. El tiempo de fotograma
       lo lleva el propio panel con su `requestAnimationFrame`; esto es el
       reparto por etapas, que desde fuera no se puede ver.

       Y los PÍXELES DE LIENZO, que es el término que manda —el coste es
       relleno— y no se deducen de la pantalla: `dpr` sale de `calcDpr()`,
       que topa en `dprMax` y recorta contra `maxPx`. */
    get salud(){
      return {dpr: Math.round(V.dpr*100)/100,
              px: Math.round(V.W*V.dpr*V.H*V.dpr/1e4)/100,
              etapas}; },
    /* recoge los cambios de configuración. Con `nueva` sortea otra
       población; sin ella sólo recalcula (corriente, escala, planos). */
    aplica(nueva){ setup(!!nueva); },
  },
};

export { arranca, reinicia };
