/* ══════════════════════════════════════════════════════════════════
   MEDUSA
   Pulso propio, tentáculos por historial y silueta paramétrica.
   ══════════════════════════════════════════════════════════════════ */
import { M, especie } from '../motor.js';
const {rgba, clamp, rnd, rango, rangoE, opt, TAU} = M;
import { porPlano, mancha, reparte, seAparta, reaccionBorde,
         avanza, silencio } from './comun.js';

/* cuánto se recoge la nube en este plano: es de la medusa y no del plano,
   así que sale de su entrada de escena (`tent`) y no de `ABISMO.planos`.
   OJO con el nombre: `tent` a secas ya es el degradado del tentáculo,
   dentro de dibuja(). */
const escNube = (p, L) => opt(p.tent && p.tent[L.i], 1);

const HIST = 48;              // muestras del buffer circular
/* Y NINGUNA CINTA PASA DE AHÍ: `TX`/`TY` miden HIST y el historial se
   indexa en módulo HIST, así que un `tent` por encima de 1 escribiría
   fuera —en un typed array eso no da error, se pierde— y la cinta se
   trazaría con `undefined`. El tope va aquí y no en la escena: es del
   búfer, no del bicho. */
const largoCinta = (n, suelo) => Math.min(HIST, Math.max(suelo, Math.round(n)));
const SAMPLE = 1/26;          // intervalo fijo de muestreo
const TX = new Float32Array(HIST), TY = new Float32Array(HIST);

/* contracción rápida el primer 26% del ciclo, relajación larga */
const pulso = u => u < 0.26 ? Math.sin(u/0.26 * Math.PI/2)
                            : Math.pow(Math.cos((u-0.26)/0.74 * Math.PI/2), 1.6);

/* Semiancho de la campana en función de la altura: v=0 es el ápice, v=1
   el margen. El exponente cambia la silueta entera: 0,47 disco achatado
   de hombros cuadrados, 0,60 cúpula redonda, 0,82 campana alta. */
const bellW = (v, perfil) => Math.sin(Math.PI/2 * Math.pow(v, perfil));

/* Altura del margen festoneado, 0 en las puntas y colgando en medio.
   mBase cerca de 1 deja el margen liso; bajo, muy ondulado. */
const bellM = (t, j, skirt) =>
  skirt * Math.pow(Math.sin(Math.PI*t), j.mEnv)
        * (j.mBase + (1-j.mBase)*Math.cos(j.lobes*TAU*t));

function bellPath(g, j, rx, ry, skirt){
  const N = 22, NM = 30, pf = j.perfil;
  g.beginPath();
  for (let i=0;i<=N;i++){                     // flanco derecho
    const v = i/N, x = rx*bellW(v,pf), y = -ry*(1-v);
    i ? g.lineTo(x,y) : g.moveTo(x,y);
  }
  for (let i=1;i<NM;i++){                     // margen, derecha → izquierda
    const t = i/NM;
    g.lineTo(rx*(1-2*t), bellM(t, j, skirt));
  }
  for (let i=N;i>=0;i--){                     // flanco izquierdo
    const v = i/N;
    g.lineTo(-rx*bellW(v,pf), -ry*(1-v));
  }
  g.closePath();
}

function margenPath(g, j, rx, skirt){
  const NM = 34;
  g.beginPath();
  for (let i=0;i<=NM;i++){
    const t = i/NM;
    const x = rx*(1-2*t), y = bellM(t, j, skirt);
    i ? g.lineTo(x,y) : g.moveTo(x,y);
  }
}

/* ── LAS CINTAS ─────────────────────────────────────────────────────
   Tentáculo y brazo oral son lo mismo con otras medidas: una tira que
   sigue al historial de la campana, se separa del eje y cuelga con la
   edad. `cinta` deja los puntos en TX/TY —compartidos— y `trazaCinta` los
   pinta en dos pasadas: una ancha y difusa que es la difusión en el agua,
   otra fina que es el filamento. */
function cinta(j, n, lat, crece, ly0, cae, sway){
  const h = j.hist;
  for (let k=0;k<n;k++){
    const age = k/(n-1), i = ((j.head - k + HIST) % HIST)*3;
    const cs = Math.cos(h[i+2]), sn = Math.sin(h[i+2]);
    const lx = lat*(1 + age*crece) + sway(age);   // transversal al cuerpo
    const ly = ly0 + age*cae;                     // a lo largo del cuerpo
    TX[k] = h[i]   + lx*cs - ly*sn;
    TY[k] = h[i+1] + lx*sn + ly*cs;
  }
}
function trazaCinta(g, n, stops, ancho, aAncho, fino, aFino){
  const gr = g.createLinearGradient(TX[0], TY[0], TX[n-1], TY[n-1]);
  for (const st of stops) gr.addColorStop(st[0], st[1]);
  g.beginPath();
  g.moveTo(TX[0], TY[0]);
  for (let k=1;k<n;k++) g.lineTo(TX[k], TY[k]);
  g.strokeStyle = gr;
  g.lineWidth = ancho; g.globalAlpha = aAncho; g.stroke();
  g.lineWidth = fino;  g.globalAlpha = aFino;  g.stroke();
}

/* El buffer arranca lleno de una trayectoria plausible: vacío, el primer
   segundo se ve la nube brotando de la nada. */
function siembraHistorial(j){
  const sep = j.r*0.05;              // separación entre muestras
  for (let k=0;k<HIST;k++){
    const age = k/(HIST-1), i = (HIST-1-k)*3;
    j.hist[i]   = j.x + Math.sin(age*2.6 + j.tiltFase)*j.r*0.35*age;
    j.hist[i+1] = j.y + k*sep;
    j.hist[i+2] = 0;
  }
  j.head = HIST-1;
}

/* mueve la medusa y todo su historial de golpe: al topar, si sólo se
   mueve el cuerpo los tentáculos cruzan la escena */
function teleporta(j, dx, dy){
  j.x += dx; j.y += dy;
  for (let k=0;k<HIST;k++){ const i=k*3; j.hist[i]+=dx; j.hist[i+1]+=dy; }
}

/* CONTENCIÓN. Una medusa no sabe girar: su locomoción es el pulso por el
   eje del cuerpo más una flotabilidad constante. Lo que sí puede hacer es
   cambiar de idea sobre si sube o baja: `flota` se espeja alrededor de 1,
   así que un 0,5 boyante pasa a ser un 1,5 que se hunde. Invertir el
   signo de `hundimiento` la dejaría boyante Y con el pulso hacia arriba:
   saldría disparada contra el techo. */
function topa(j, M, p){
  /* El cristal, sólo como respaldo duro. El cálculo es el del motor;
     aplicarlo no puede, porque una medusa es la campana MÁS su historial
     y las dos cosas tienen que saltar juntas. El inset va a su propio
     radio: contenida por el centro, una campana grande se mete en la
     pared. */
  const s = M.salto(j.x, j.y, j.r*1.05);
  if (s[0] || s[1]){
    teleporta(j, s[0], s[1]);
    if (s[2] && s[2]*j.vx < 0) j.vx = -j.vx*0.45;
    if (s[3] && s[3]*j.vy < 0) j.vy = -j.vy*0.40;
    /* el ladeo del dedo rebota igual, o un dedo que la empuja contra el
       cristal la deja pegada a él hasta que se le pasa */
    if (s[2] && s[2]*j.dx < 0) j.dx = -j.dx*0.45;
    if (s[3] && s[3]*j.dy < 0) j.dy = -j.dy*0.40;
  }

  /* MIGRACIÓN VERTICAL, y no un rebote contra el canto: cada medusa
     patrulla entre dos profundidades propias y da la vuelta al llegar.
     Esperando al canto se apelotonaban en dos capas de sedimento con el
     centro vacío —se mueven décimas de píxel por segundo y tardan minutos
     en cruzar el encuadre. */
  const yF = j.y / M.H;
  if ((j.flota < 1 && yF < j.zTop) || (j.flota > 1 && yF > j.zBot)){
    j.flota = clamp(2 - j.flota, 0.35, 1.8);
    j.hundimiento = (p.empuje/j.periodo) * j.flota;
  }
}

/* ── LA HORDA DE LA GEMACIÓN ────────────────────────────────────────
   Cada cría lleva tres tramos y una sola `u` de 0 a 1, que es todo lo que
   hace falta para que se lea la historia: BROTA pegada al costado, SE
   SUELTA y SE VA haciéndose pequeña. No hay medusa nueva en ningún
   momento: `esc` es su tamaño respecto a su madre y `dx,dy` lo lejos que
   está, y con eso la pinta `dibuja` llamándose a sí misma dentro de una
   transformación.

   Lo de encogerse mientras se aleja no es para taparlas: en esta pieza
   pequeño ES lejos —así codifican la distancia los tres planos—, así que
   se están yendo al fondo y no desapareciendo.

   El reparto de la `u` importa, y con las crías saliendo DE UNA EN UNA
   cambia respecto a cuando salían todas juntas: cada parto se mira
   entero, así que el brote y el desprendimiento se llevan más reloj
   —35 % y 25 %— y la marcha menos. Aun así la marcha no baja del 40 %:
   más corta se lee como que la cría se apaga, no como que se aleja.

   ── LO QUE HACE QUE SEAN UNA HORDA Y NO UNA FILA ───────────────────
   Cuatro sorteos, y ninguno es adorno:

     el ÁNGULO   en CORONA y no al azar: repartidas a `i/n` de la vuelta
                 con un temblor de menos de medio hueco. A ángulo
                 puramente aleatorio se apelotonan tres y dejan un cuarto
                 de cielo vacío, y eso se lee como un fallo.
     el RETARDO  negativo en `t`: la cría no existe hasta que su reloj
                 llega a cero. Saliendo todas a la vez se lee como una
                 explosión, y esto es un desove.
     el COLOR    una entrada VECINA de la paleta de su madre.
                 `generaPaleta` reparte el tono por el rango en orden, así
                 que vecina es el mismo color un poco corrido. Es el mismo
                 truco que el racimo de burbujas y por lo mismo: una
                 familia, no confeti.
     la NUBE     cuántos tentáculos lleva, y se recoge CON EL TAMAÑO. A un
                 sexto de su madre las cintas miden tres píxeles: cuestan
                 lo mismo que las de ella y no se ven. Medido, una cría
                 con la nube entera son 455 llamadas al lienzo y la
                 campana sola 266, y tres medusas ya son el 52 % del
                 fotograma. Se fija AL NACER y no por fotograma, o los
                 tentáculos aparecerían y desaparecerían al encoger. */
function gemar(j, p){
  const n = Math.max(2, rangoE(p.gemaCuantas)|0);
  const pal = p.paleta;
  const i0 = pal ? pal.indexOf(j.c) : -1;
  const roce = opt(p.gemaTono, 0), nube = opt(p.gemaNube, 1);
  const crias = [];
  for (let i=0;i<n;i++){
    const esc = rango(p.gemaEsc);
    crias.push({
      /* negativo: todavía no ha brotado */
      t: -i*rango(p.gemaEscalona),
      vida: rango(p.gemaVida),
      escMax: esc,
      lejos: rango(p.gemaLejos) * j.r,
      ang: (i/n)*TAU + rnd(-1, 1)*(Math.PI/n)*opt(p.gemaDesorden, 0),
      c: (i0 >= 0 && roce)
         ? pal[clamp(i0 + Math.round(rnd(-roce, roce)), 0, pal.length-1)]
         : j.c,
      nT: Math.max(2, Math.round(j.nT*esc*nube)),
      nA: Math.max(1, Math.round(j.nA*esc*nube)),
      d: 0, dx: 0, dy: 0, esc: 0,
    });
  }
  j.crias = crias;
}

function pasoCrias(j, dt){
  let vivas = 0;
  for (const q of j.crias){
    q.t += dt;
    if (q.t < 0){ vivas++; continue; }     // aún sin brotar
    const u = q.t/q.vida;
    if (u >= 1){ q.esc = 0; continue; }    // ya no está
    vivas++;
    const pegada = j.r*0.85, soltada = j.r*2.2;
    if (u < 0.35){
      const w = u/0.35;
      /* arranca en la décima parte de lo que va a ser, y la décima es
         RELATIVA: con un suelo absoluto una cría de 0,15 nacería ya al
         70 % de su tamaño y no se vería brotar. */
      q.esc = q.escMax*(0.10 + 0.90*w);
      /* NACE DENTRO DE ELLA y va saliendo: a 0,25 del radio el bulto
         está bien metido en la campana, y en aditivo eso es justo lo que
         parece —un hinchazón encendido en el costado— hasta que asoma.
         Empezando ya en el canto no se desprende de nada, aparece. */
      q.d = pegada*(0.25 + 0.75*w);
    } else if (u < 0.60){
      const w = (u - 0.35)/0.25;
      q.esc = q.escMax;
      q.d = pegada + (soltada - pegada)*w;
    } else {
      const w = (u - 0.60)/0.40;
      /* el tamaño se va antes que la distancia (exponente > 1), así que
         parece que se pierde en el agua y no que se ha ido del cuadro */
      q.esc = q.escMax*Math.pow(1 - w, 1.3);
      q.d = soltada + (q.lejos - soltada)*w;
    }
    q.dx = Math.cos(q.ang)*q.d;
    q.dy = Math.sin(q.ang)*q.d;
  }
  if (!vivas) j.crias = null;
}

/* ── Y LA MADRE SE VA VACIANDO ──────────────────────────────────────
   Lo hinchada que está NO LLEVA RELOJ PROPIO: sale de cuántas crías le
   quedan dentro. Llena al empezar, y cada parto le baja un escalón, así
   que se desinfla al ritmo al que pare y acaba exactamente como estaba.

   Ésa es la razón de que no haya un `gemaHinchaVida` que cuadrar a mano:
   un reloj aparte se descuadra en cuanto se toca `gemaEscalona` o
   `gemaCuantas` —y se descuadra en silencio, dejándola desinflarse con
   hijas todavía pegadas al costado—. Aquí no puede pasar.

   Lo único que hace falta es que no salte: el escalón se persigue con
   `gemaHinchaVel`, que es lo deprisa que alcanza al objetivo.

   Y `hincha` multiplica el radio SÓLO AL DIBUJAR (ver `dibuja`), que no
   es pereza: `j.r` es el número con el que la subasta de `gema` decide
   quién gema, así que moverlo de verdad cambiaría quién es «la mayor» a
   mitad de maniobra. Su luz y su campo tampoco se enteran, y está bien
   —lo que se pide es un gesto, no otra medusa—. */
function pasoHincha(j, p, dt){
  let obj = 1;
  if (j.crias){
    /* «dentro» es la que aún no ha terminado de brotar: la que va por el
       primer tramo de su `u` o ni siquiera ha empezado */
    let dentro = 0;
    for (const q of j.crias) if (q.t < q.vida*0.35) dentro++;
    obj = 1 + (p.gemaHincha - 1)*(dentro/j.crias.length);
  }
  j.hincha += (obj - j.hincha)*Math.min(1, dt*p.gemaHinchaVel);
  if (!j.crias && Math.abs(j.hincha - 1) < 1e-3) j.hincha = 1;
}

const MEDUSA = {
  luz: true,
  /* Y SE LE PUEDE ROMPER EL DIBUJO: es el sprite más grande y el más
     lento, o sea el único en el que una escalera de bandas se ve y da
     tiempo a mirarla. La medusa no hace nada con esto —lo aplica el motor
     en pintaBicho()—, sólo declara que a ella se le puede hacer. */
  rompible: true,
  conteo: porPlano,

  crear(M, L, p){
    const r = rango(p.radio) * M.U * L.scale;
    /* al fondo, la mitad de tentáculos: a un tercio de resolución no se
       resuelve uno de otro y lo que cuestan es relleno. Por `resDiv` y no
       por índice de plano, y con `>=` para que subirla a 4 no apague el
       recorte sin avisar. */
    const nT = Math.max(6, Math.round(clamp(r/2.1, p.nTent[0], p.nTent[1])
                                      * (L.resDiv >= 3 ? 0.5 : 1)));
    const per = rango(p.periodo), fl = rango(p.flota);
    const pat = p.patrulla;
    /* la proporción se normaliza por área: variar la forma no puede
       convertir a unas en el doble de grandes que otras */
    let an = rango(p.ancho), al = rango(p.alto);
    const nrm = 1/Math.sqrt(an*al); an *= nrm; al *= nrm;

    const j = {
      c: M.color(p.paleta), r, nT,
      x: rango(p.banda)*M.W, y: rango(p.banda)*M.H,
      periodo: per, fase: Math.random(), contract: 0, destello: 0,
      /* flotabilidad medida contra su propio periodo: el pulso da EMPUJE de
         golpe y esto acumula hundimiento·T. Bajo 1 sube, sobre 1 baja, y
         que unas suban y otras bajen mantiene el encuadre poblado. Se
         guarda aparte porque hay que poder darle la vuelta al topar. */
      flota: fl, hundimiento: (p.empuje/per) * fl,
      /* PATRULLA: entre qué dos alturas va y viene. Los extremos se sortean
         POR SEPARADO, que con centro más amplitud el reparto vertical sale
         peor. Manda la CORRIENTE y no su flotabilidad: `flujoY` da hasta
         6,7 px/s en caja de móvil y ella se mueve a 0,16. */
      zTop: rango(pat), zBot: 1 - rango(pat),
      vigor: p.vigor[0] + (p.vigor[1]-p.vigor[0])*Math.pow(Math.random(), 0.45),
      vx:0, vy:0,
      /* dx,dy es la velocidad del LADEO del dedo, aparte de la del pulso */
      dx:0, dy:0,
      aparta: rango(p.aparta), lag: rango(p.lag),
      /* casi verticales, pero no del todo: bascula despacio */
      tilt: 0, tiltAmp: rango(p.tilt), tiltRate: rango(p.tiltVel),
      tiltFase: Math.random()*TAU,
      lobes:  rangoE(p.lobulos),
      perfil: rango(p.perfil), ancho: an, alto: al,
      faldon: rango(p.faldon), mEnv: rango(p.mEnv), mBase: rango(p.mBase),
      nC: rangoE(p.canales), nA: rangoE(p.brazos),
      cX: rango(p.ensancha), cY: rango(p.achata),
      hist: new Float32Array(HIST*3), head: 0, acc: 0,
      /* la horda, mientras la tiene, y lo hinchada que está mientras la
         suelta: ver `pasoCrias` y el evento `gemacion` */
      crias: null, hincha: 1,
      tLen: new Int16Array(nT), tSeed: new Float32Array(nT),
      tAmp: new Float32Array(nT), tLat: new Float32Array(nT),
      /* CUÁNTO ALUMBRA, en dos alcances: `rLuz` a cuánto enciende plancton,
         generoso, y `rCuerpo` a cuánto REVELA otro cuerpo, corto a
         propósito —se mueve tan despacio que si alumbra lejos se le queda
         aparcada al lado a un rape y lo delata durante minutos—. `luzI` se
         declara porque quien no lo declara vale 1, o sea más que un pez
         linterna entero. */
      rLuz: r*p.alcanceLuz,
      rCuerpo: r*p.alcanceCuerpo,
      luzI: 0,
    };
    for (let t=0;t<nT;t++){
      /* la potencia sesga los largos hacia corto: muchos junto a la campana
         y unos pocos que se van lejos. Eso es una nube. */
      j.tLen[t]  = largoCinta(HIST*(0.16+0.84*Math.pow(Math.random(),1.9))*escNube(p, L), 5);
      j.tSeed[t] = Math.random()*TAU;
      j.tAmp[t]  = rnd(0.5,1.7);
      j.tLat[t]  = reparte(t, nT) - 0.5 + rnd(-0.035,0.035);
    }
    j.contract = pulso(j.fase);
    siembraHistorial(j);
    return j;
  },

  actualiza(j, M, L, p, dt){
    const t = M.t;
    /* PULSO: al contraer, empujón; entre pulsos se hunde. Arrastre
       exponencial. Eso es toda la locomoción propia. */
    const f  = (t/j.periodo + j.fase) % 1;
    const f0 = ((t-dt)/j.periodo + j.fase) % 1;
    j.contract = pulso(f);
    const dC = (j.contract - pulso(f0)) / Math.max(dt, 1e-4);

    j.tilt = j.tiltAmp*Math.sin(t*j.tiltRate + j.tiltFase)
           + clamp(M.flujoX(j.x,j.y,t)*0.010, -0.09, 0.09);

    if (dC > 0){
      /* el empuje va por el eje del cuerpo: inclinada, avanza en diagonal, y
         sigue siendo sólo el pulso */
      const th = dC * j.r * p.empuje * dt;
      j.vx += Math.sin(j.tilt)*th;
      j.vy -= Math.cos(j.tilt)*th;
    }
    j.vy += j.r * j.hundimiento * dt;

    const drag = Math.pow(p.arrastre, dt);
    j.vx *= drag; j.vy *= drag;

    /* EL DEDO LA ENCIENDE Y LA LADEA, y son dos consultas distintas a
       propósito: el destello va con `luzDedo` —lo que la enciende es la luz,
       así que responde también al fogonazo de debajo del dedo— y el empujón
       con `empuje`, que es el frente y sólo el frente.

       El ladeo va en su PROPIA velocidad (dx,dy) y no en la del pulso: en
       vx,vy se lo comería el `arrastre`, que la deja en la mitad en medio
       segundo, y la medusa acabaría donde estaba. Es lo mismo que hace el
       banco, y por lo mismo. */
    j.destello *= Math.pow(0.20, dt);
    const ld = M.luzDedo(j.x, j.y);
    if (ld > 0) j.destello = Math.min(1, j.destello + 3.0*dt*ld);
    seAparta(j, M, p, M.empuje(j.x, j.y, j.r*1.6), dt);

    /* ── LA GEMACIÓN ──────────────────────────────────────────────
       Un campo `gema` es una orden en el agua y el cupo viaja en su `d`: la
       primera que lo lee lo descuenta, así que gema UNA medusa y no todas.
       Ni ella sabe quién la ha dado ni el evento sabe que hay medusas. */
    if (!j.crias){
      const gm = M.campo('gema', j.x, j.y);
      if (gm && gm.d && gm.d.quedan > 0){
        if (gm.d.elegido < 0){
          /* primer fotograma: se apunta con su radio y el cupo se queda
             con los `entre` mayores —o sea los más cercanos, que el radio
             lleva dentro la escala de su plano—. Se ordena y se corta a
             mano porque son tres medusas y una vez: cualquier cosa más
             lista aquí es más código que trabajo ahorrado. Ver por qué en
             eventos/gemacion.js. */
          const ms = gm.d.mejores;
          ms.push(j.r);
          ms.sort((a, b) => b - a);
          if (ms.length > gm.d.entre) ms.length = gm.d.entre;
        } else if (gm.d.elegido === j.r){
          /* y SE GASTA EL CUPO: es lo que mata al evento en el acto —lee
             su `quedan`— y lo que pone el «una y sólo una» en el cupo y no
             en el desempate por radio. */
          gm.d.quedan--;
          gemar(j, p);
        }
      }
    }
    if (j.crias) pasoCrias(j, dt);
    /* y sigue desinflándose después de la última: ver `pasoHincha` */
    if (j.crias || j.hincha !== 1) pasoHincha(j, p, dt);

    reaccionBorde(j, M, p, j.x, j.y, dt);

    /* ── RECELA DE LAS TRAMPAS ────────────────────────────────────
       Y NO SABE QUÉ ES UN RAPE, ni pregunta. Mira las luces de SU plano y
       se aparta de las que TIRAN —`senuelo`, que es la misma bandera con
       la que la presa se ACERCA (ver `cardumen` en pezlinterna)—. Lo que
       atrae a quien se come espanta a quien no, y las dos cosas salen del
       MISMO número: cuando el rape se sacia y la esca deja de tirar, la
       medusa deja de recelar en el mismo instante en que el banco deja de
       acudir. De paso, recela de la TRAMPA y no del animal: con la esca
       apagada el rape es un hueco invisible y se le acerca sin saberlo.

       De ahí sale gratis la profundidad: `L.luces` es por plano, así que
       una medusa del fondo no recela de una trampa que está delante. Con
       un campo habría hecho falta guarda, y la de `M.campo` va justo al
       revés de lo que aquí hace falta.

       ES UNA VELOCIDAD Y VA DIRECTA A `avanza`, no una fuerza sobre
       `vx,vy`, y ésa es la diferencia entre que funcione y que no: en
       vx,vy se lo come el `arrastre` —lo mismo que explica el ladeo del
       dedo cuatro bloques más arriba—, y de ahí no sale NINGUNA ganancia
       sobre no hacer nada. La corriente la mueve más que ella misma. */
    let rvx = 0, rvy = 0;
    const rec = M.U*p.recela;
    if (rec > 0) for (const o of L.luces){
      if (!(o.senuelo > 0)) continue;
      const r = rec*o.senuelo;
      const ex = j.x - o.x, ey = j.y - o.y, d2 = ex*ex + ey*ey;
      if (d2 > r*r) continue;
      const d = Math.sqrt(d2) || 1e-4;
      const w = (1 - d/r)*p.recelo*M.U;
      rvx += ex/d*w; rvy += ey/d*w;
    }
    avanza(j, M, L, dt, j.dx + rvx, j.dy + rvy);
    topa(j, M, p);

    /* lo que alumbra va con el pulso, no fijo: así lo que la medusa revela
       de paso late con ella —un rape asomando al ritmo de una campana */
    j.luzI = (0.58 + 0.42*j.contract) * j.vigor * p.emision;

    /* HISTORIAL: buffer circular a intervalo fijo. Sin muelles, sin Verlet,
       sin física: sólo dónde estuvo la campana. */
    j.acc += dt;
    while (j.acc >= SAMPLE){
      j.acc -= SAMPLE;
      j.head = (j.head + 1) % HIST;
      const i = j.head*3;
      j.hist[i] = j.x; j.hist[i+1] = j.y; j.hist[i+2] = j.tilt;
    }
  },

  dibuja(j, M, L, p, g){
    /* LAS CRÍAS SE PINTAN CON ESTA MISMA FUNCIÓN, cada una dentro de su
       transformación: son la misma medusa vista más pequeña y más lejos, y
       cualquier otra forma de dibujarlas sería un segundo sitio
       describiendo la misma campana —el vicio que esta casa persigue—.

       LO QUE CAMBIA DE UNA A OTRA SE LE PRESTA A LA MADRE y se le devuelve
       al salir: su color, cuántos tentáculos y cuántos brazos. Es el mismo
       apaño que apartar `j.crias` para no llamarse a sí misma sin fin, y
       la razón de que la cría pueda ser otro color sin que exista.

       Y `hincha` se pone a 1: la madre puede estar hinchada mientras las
       suelta, y sin esto las crías saldrían hinchadas también.

       Van ANTES que la madre y da igual: en aditivo sumar es conmutativo. */
    if (j.crias){
      const cr = j.crias, c0 = j.c, nT0 = j.nT, nA0 = j.nA, h0 = j.hincha;
      j.crias = null; j.hincha = 1;
      for (const q of cr){
        if (!(q.esc > 0.02)) continue;
        j.c = q.c; j.nT = q.nT; j.nA = q.nA;
        g.save();
        g.translate(j.x + q.dx, j.y + q.dy);
        g.scale(q.esc, q.esc);
        g.translate(-j.x, -j.y);
        MEDUSA.dibuja(j, M, L, p, g);
        g.restore();
      }
      j.crias = cr; j.c = c0; j.nT = nT0; j.nA = nA0; j.hincha = h0;
    }
    const c = j.contract;
    /* EL RADIO CON EL QUE SE DIBUJA, que no es `j.r`: mientras gema está
       hinchada. Todo el cuerpo sale de aquí —campana, nube y los dos
       halos—, y `j.r` se queda como está porque es el número con el que
       se decide quién gema. */
    const R = j.r * j.hincha;
    const rx = R * j.ancho * (0.94 + j.cX*c);
    const ry = R * j.alto  * (1.10 - j.cY*c);
    const skirt = ry * j.faldon;
    const bright = (0.58 + 0.42*c) * j.vigor * (1 + 0.40*j.destello) * p.brillo
                 * (1 - silencio(M, j.x, j.y, L));
    if (bright < 0.004) return;
    const sh = L.sharp, S = L.scale;

    const glow = j.c.glow;
    mancha(g, j.x, j.y, R*4.0, [
      [0.00, glow, 0.50*bright],  [0.14, glow, 0.24*bright],
      [0.36, glow, 0.085*bright], [0.64, glow, 0.024*bright],
      [1.00, glow, 0],
    ], R*0.08);

    const bx = j.x + Math.sin(j.tilt)*ry*0.14;
    const by = j.y - Math.cos(j.tilt)*ry*0.14;
    mancha(g, bx, by, R*1.35, [
      [0.00, j.c.mid, 0.46*bright],
      [0.35, j.c.mid, 0.17*bright],
      [1.00, j.c.mid, 0],
    ], R*0.04);

    /* ── LA NUBE ──────────────────────────────────────────────────
       El historial da el retardo y el serpenteo; la caída con la edad da
       el largo, que el recorrido de dos segundos no daría.          */
    const HANG = ry*p.cuelga;
    const tent = [
      [0.00, rgba(j.c.core, 0.34*bright*sh)], [0.12, rgba(j.c.mid, 0.30*bright)],
      [0.42, rgba(j.c.mid,  0.10*bright)],    [0.74, rgba(j.c.mid, 0.028*bright)],
      [1.00, rgba(j.c.mid,  0)],
    ];
    for (let ti=0; ti<j.nT; ti++){
      const seed = j.tSeed[ti], amp = j.tAmp[ti];
      /* la onda que crece con la antigüedad: el historial de una medusa que
         sube casi recta no curva nada por sí solo */
      cinta(j, j.tLen[ti], j.tLat[ti]*rx*1.72, 0.70, ry*0.30, HANG,
            age => (Math.sin(age*2.9 + seed + M.t*1.3)*0.50
                  + Math.sin(age*9.1 + seed*1.7 + M.t*2.1)*0.13) * rx*amp*age);
      trazaCinta(g, j.tLen[ti], tent, 3.2*S, 0.34, 0.85*S, sh);
    }

    const aLen = largoCinta(HIST*0.34*escNube(p, L), 8);
    const brazo = [
      [0.00, rgba(j.c.core, 0.52*bright)], [0.35, rgba(j.c.mid, 0.26*bright)],
      [1.00, rgba(j.c.mid,  0)],
    ];
    for (let ti=0; ti<j.nA; ti++){
      const seed = j.tiltFase*1.9 + ti*2.1;
      cinta(j, aLen, (reparte(ti, j.nA) - 0.5)*rx*0.60, 0.45, ry*0.20, HANG*0.55,
            age => Math.sin(age*3.0 + seed + M.t*1.1)*rx*0.26*age);
      trazaCinta(g, aLen, brazo, 6.0*S, 0.42, 1.9*S, sh);
    }
    g.globalAlpha = 1;

    /* ── LA CAMPANA ───────────────────────────────────────────── */
    g.save();
    g.translate(j.x, j.y);
    g.rotate(j.tilt);

    /* translúcida y encendida en todo su volumen. Un degradado vertical
       cubre la cúpula de lado a lado por igual; uno radial sería más
       brillante en el centro y dejaría los hombros apagados. */
    bellPath(g, j, rx, ry, skirt);
    const bg = g.createLinearGradient(0, -ry, 0, skirt);
    bg.addColorStop(0.00, rgba(j.c.core, 0.46*bright));
    bg.addColorStop(0.22, rgba(j.c.mid,  0.50*bright));
    bg.addColorStop(0.62, rgba(j.c.mid,  0.34*bright));
    bg.addColorStop(1.00, rgba(j.c.mid,  0.20*bright));
    g.fillStyle = bg;
    g.fill();

    /* el ápice concentra la luz. El radio va con el lado mayor y la caída es
       larga: si el degradado muere dentro de la campana se le ve el canto
       redondo y parece otra campana dentro. */
    const Ap = Math.max(rx, ry)*0.86;
    const ap = g.createRadialGradient(0, -ry*0.52, 0, 0, -ry*0.44, Ap);
    ap.addColorStop(0.00, rgba(j.c.core, 0.52*bright));
    ap.addColorStop(0.26, rgba(j.c.core, 0.16*bright));
    ap.addColorStop(0.60, rgba(j.c.core, 0.045*bright));
    ap.addColorStop(1.00, rgba(j.c.core, 0));
    g.fillStyle = ap;
    g.fill();

    bellPath(g, j, rx, ry, skirt);
    g.strokeStyle = rgba(j.c.mid,  0.40*bright);
    g.lineWidth = Math.max(1, R*0.19);
    g.stroke();
    g.strokeStyle = rgba(j.c.core, 0.44*bright*sh);
    g.lineWidth = Math.max(0.6, R*0.022);
    g.stroke();

    /* canales radiales: se apagan antes de llegar abajo; enteros, la campana
       parece el varillaje de un paraguas */
    const cg = g.createLinearGradient(0, -ry*0.78, 0, skirt*0.5);
    cg.addColorStop(0.00, rgba(j.c.core, 0.15*bright*sh));
    cg.addColorStop(0.45, rgba(j.c.core, 0.07*bright*sh));
    cg.addColorStop(1.00, rgba(j.c.core, 0));
    g.strokeStyle = cg;
    g.lineWidth = Math.max(0.5, R*0.024);
    for (let i=0;i<j.nC;i++){
      const t = (i+0.5)/j.nC, s = 1-2*t;
      g.beginPath();
      g.moveTo(rx*s*0.05, -ry*0.78);
      g.quadraticCurveTo(rx*s*0.55, -ry*0.46,
                         rx*s*bellW(0.97,j.perfil), bellM(t, j, skirt)*0.5);
      g.stroke();
    }

    margenPath(g, j, rx, skirt);
    g.strokeStyle = rgba(j.c.mid,  0.34*bright);
    g.lineWidth = Math.max(1.2, R*0.15);
    g.stroke();
    g.strokeStyle = rgba(j.c.core, 0.46*bright*sh);
    g.lineWidth = Math.max(0.7, R*0.030);
    g.stroke();

    g.restore();
  },
};
especie('medusa', MEDUSA);
