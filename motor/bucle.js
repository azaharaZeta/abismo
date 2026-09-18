import { ABISMO } from '../escena.js';
import { clamp, opt, rango, fusiona } from './util.js';
import { V, campos, MOD, reiniciaMod, frente, PLANOS } from './estado.js';
import { ESPECIES, EVENTOS, especie, evento, paramsDe } from './registro.js';
import { resuelveEspectros, resiembraPaletas, paletaDe } from './color.js';
import { buildAgua, buildRuido, buildOndulacion, buildDispersion,
         resiembraAgua, pintaAgua, pintaDispersion,
         ruido, RUIDO } from './agua.js';
import { cableaTacto, envejeceOndas, olvidaOndas,
         avisaContactos } from './dedo.js';
import { M } from './api.js';

/* Los cuatro de calidad arrancan desde ABISMO y sólo los baja
   degradar(): recortar sin tocar la configuración, que es la que dice
   qué se pedía. Los demás son el reloj del bucle y el del redimensionado. */
let conDither = ABISMO.dither !== false;
let calentando=0, lento=0, ema=16.7, ultimo=0;
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
  const area = V.W*V.H;

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
      const n = def.conteo ? def.conteo(area, li, p) : 0;
      const q = Math.round(n * (def.escalaCalidad ? V.calidad : 1));
      const gr = { def, p, items: [] };
      /* `calidad` recorta CUÁNTOS y `aligera` simplifica cada uno; las dos
         cosas hay que rehacerlas aquí, o repoblar después de degradar
         —redimensionado grande, botón del panel— le devuelve el detalle
         completo a la máquina que ya demostró que no podía con él. */
      const flojea = V.degradado && def.aligera;
      for (let i=0;i<q;i++){
        const o = def.crear(M, L, p);
        if (flojea) def.aligera(o);
        gr.items.push(o);
      }
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
    evGrupos.push({ def, p, vivo: null,
                    prox: rango(p.primero || def.primero || [20,60]) });
  }
}

function lanza(gr, x, y){
  const e = { def: gr.def, p: gr.p, gr, t: 0 };
  Object.assign(e, gr.def.arranca(M, gr.p, x, y) || {});
  evVivos.push(e);
  gr.vivo = e;
  return e;
}

/* Vuelve a poner el reloj de un grupo. Los grupos que se inventa el
   panel para lanzar un evento que la escena NO configura van marcados
   `suelto`: probarlo una vez no puede dejarlo instalado para siempre. */
function reprograma(gr){
  gr.vivo = null;
  gr.prox = gr.suelto ? Infinity
                      : rango(gr.p.cada || gr.def.cada || [90,240]);
}

function pasoEventos(dt){
  /* se rehacen: un evento que ya no está no tiene que borrar nada */
  campos.length = 0;
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

/* Dispara un evento a mano. Si la escena no lo tiene configurado se le
   monta un grupo al vuelo con los valores de `def.prueba`. Si ya está
   en marcha se reinicia. `extra` pisa parámetros sueltos. */
function dispara(nombre, extra){
  const def = EVENTOS[nombre];
  if (!def) return false;
  let gr = evGrupos.find(g => g.def === def);
  if (!gr){
    gr = { def, p: fusiona(def.prueba || {}, extra || {}),
           vivo: null, prox: Infinity, suelto: true };
    evGrupos.push(gr);
  } else if (extra){
    gr.p = fusiona(gr.p, extra);
  }
  /* un `espectroX` que llega en `extra` tiene que tirar su `paletaX`:
     resuelveEspectros() respeta la paleta que ya esté puesta —es como se
     anula un espectro sin borrarlo—, así que sin esto el color editado
     desde el panel no se aplica nunca. Salvo que `extra` traiga también la
     paleta: ahí manda ella, que es la regla de la casa. */
  if (extra) for (const k in extra){
    const destino = paletaDe(k);
    if (destino && extra[destino] === undefined) delete gr.p[destino];
  }
  /* y sus espectros, que si no se queda sin `paleta`: los de la escena se
     resuelven al arrancar, pero los de un `def.prueba` no pasan por ahí y
     acaban en `M.color(undefined)`. */
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
  campos.length = 0;
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
  let d = Math.min(window.devicePixelRatio || 1, 2);
  const px = V.W*V.H*d*d;
  if (px > ABISMO.maxPx) d = Math.max(0.7, d*Math.sqrt(ABISMO.maxPx/px));
  return d;
}

/* Un solo escalón, y no se vuelve atrás: subir y bajar la calidad según
   el tiempo de fotograma oscila y se ve peor que ir lento. Se recorta la
   población viva en vez de repoblar, que daría un salto visible. El velo
   se queda —es lo que hace que esto sea agua—: se le recortan niveles. */
function degradar(){
  V.degradado = true;
  V.calidad = 0.55;
  conDither = false;
  V.topeOndas = Math.max(1, Math.round(V.topeOndas*0.5));
  if (V.topeNiveles > 2){ V.topeNiveles = 2; buildDispersion(); }
  for (const L of PLANOS)
    for (const gr of L.grupos){
      if (gr.def.escalaCalidad) gr.items.length = Math.round(gr.items.length*V.calidad);
      if (gr.def.aligera) for (const o of gr.items) gr.def.aligera(o);
    }
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

   La calidad NO se restaura: si la máquina ya demostró que no podía,
   devolverle el detalle al reiniciar es volver a hacerle la misma
   pregunta. Lo que sí se reinicia es la vigilancia, o los primeros
   fotogramas —lentos, como los de cualquier arranque— cuentan como
   máquina lenta. */
function reinicia(){
  para();
  ABISMO.bichos.forEach(resiembraPaletas);
  ABISMO.eventos.forEach(resiembraPaletas);
  resiembraAgua();
  olvidaOndas();
  preparaEventos();
  V.t = 0;
  calentando = 0; lento = 0; ema = 16.7;
  setup(true);
}

/* ── VIGILANCIA DEL FOTOGRAMA ───────────────────────────────────────
   La media móvil del tiempo de fotograma decide si degradar. Los primeros
   son lentos por el JIT y el primer pintado, y uno de más de 200 ms es
   una pausa del navegador: ni unos ni otros entran. */
function vigila(ms){
  if (calentando < 60){ calentando++; return; }
  if (V.degradado || ms >= 200) return;
  ema += (ms - ema)*0.05;
  lento = ema > 20 ? lento+1 : Math.max(0, lento-2);
  if (lento > 90) degradar();
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
function componePlanos(){
  V.ctx.globalCompositeOperation = 'lighter';
  for (const L of PLANOS){
    V.ctx.globalAlpha = L.alpha;
    V.ctx.drawImage(L.cv, 0, 0, V.W, V.H);
  }
  V.ctx.globalAlpha = 1;
  V.ctx.globalCompositeOperation = 'source-over';

  /* el velo va DENTRO del agua: después de la luz y antes del grano */
  pintaDispersion();

  if (conDither){
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
  vigila(ms);
  envejeceOndas(dt);

  V.ctx.setTransform(V.dpr,0,0,V.dpr,0,0);
  V.ctx.globalCompositeOperation = 'source-over';
  V.ctx.globalAlpha = 1;
  /* bilineal, no 'high': es más barato y desenfoca más, que es justo lo
     que se le pide al plano del fondo */
  V.ctx.imageSmoothingEnabled = true;

  pasoEventos(dt);
  pintaAgua();
  pasoPlanos(dt);
  componePlanos();
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
  /* volver de otra pestaña no es ir lento */
  document.addEventListener('visibilitychange', () => {
    ultimo = performance.now();
    calentando = 0; lento = 0; ema = 16.7;
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
    /* recoge los cambios de configuración. Con `nueva` sortea otra
       población; sin ella sólo recalcula (corriente, escala, planos). */
    aplica(nueva){ setup(!!nueva); },
  },
};

export { arranca, reinicia };
