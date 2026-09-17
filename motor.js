/* ══════════════════════════════════════════════════════════════════
   MOTOR DEL ABISMO
   Tres planos en mezcla aditiva, el agua, la dispersión de la luz en el
   agua, el grano, la corriente, el dedo, el bucle con control de
   rendimiento y el redimensionado. La escena vive abajo, en ABISMO.

       <script src="motor.js"></script>
       <script src="bichos.js"></script>
       <script> Acuario.arranca() </script>
   ══════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

/* ── UTILIDADES ─────────────────────────────────────────────────── */
const TAU = Math.PI*2;
const rgba  = (c,a) => 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';
const clamp = (v,a,b) => v<a?a:v>b?b:v;
/* compara con `undefined`: un 0 escrito a mano es una decisión */
const opt   = (v,d) => v === undefined ? d : v;
const rnd   = (a,b) => a + Math.random()*(b-a);
const suave = t => t*t*(3-2*t);
const elige = a => a[(Math.random()*a.length)|0];

/* Sorteo con peso: una entrada de paleta puede llevar `peso` (1 por
   defecto) en vez de repetirse en el array. */
function sumaPesos(pal){
  let t = 0;
  for (const p of pal) t += opt(p.peso, 1);
  return t;
}
function eligeColor(pal, total){
  let r = Math.random()*total;
  for (const p of pal){
    r -= opt(p.peso, 1);
    if (r <= 0) return p;
  }
  return pal[pal.length-1];
}
const mezcla = (a,b,t) => [Math.round(a[0]+(b[0]-a[0])*t),
                           Math.round(a[1]+(b[1]-a[1])*t),
                           Math.round(a[2]+(b[2]-a[2])*t)];
/* acepta un número o un par [min,max]; rangoE da enteros */
const rango = v => Array.isArray(v) ? rnd(v[0], v[1]) : v;
const rangoE = v => Array.isArray(v) ? (v[0] + ((Math.random()*(v[1]-v[0]+1))|0)) : v;

/* Fusión por clave, recursiva. Los objetos que sólo están en `base` se
   copian, así que el resultado no comparte subobjetos con ella. */
const llano = v => v && typeof v === 'object' && !Array.isArray(v);
function fusiona(base, extra){
  const r = {};
  for (const k in base) r[k] = llano(base[k]) ? fusiona(base[k], {}) : base[k];
  for (const k in extra){
    const a = base[k], b = extra[k];
    r[k] = (llano(a) && llano(b)) ? fusiona(a,b) : b;
  }
  return r;
}

/* ── ESPECTRO → PALETA ──────────────────────────────────────────────
   Un espectro —rangos de tono, saturación y luz— en vez de colores uno a
   uno. Se cuantiza en `tramos` porque el halo está pre-dibujado por
   entrada de paleta: un color por bicho obligaría a un halo por bicho.

   `core` es el tono casi blanco, `mid` la identidad, `glow` el halo. */
function hsl(h, s, l){
  h = (((h % 360) + 360) % 360) / 360;
  const a = s * Math.min(l, 1-l);
  const f = n => { const k = (n + h*12) % 12;
                   return l - a * Math.max(-1, Math.min(k-3, 9-k, 1)); };
  return [Math.round(f(0)*255), Math.round(f(8)*255), Math.round(f(4)*255)];
}

const ESPECTRO = {
/* grados; el segundo puede pasar de 360 para envolver por el rojo:
     [340, 400] va del magenta al ámbar cruzando el 0 */
  tono: [176, 236],            // la banda fría de la escena
  tramos: 14,
  sat: [0.82, 1.00], luz:  [0.62, 0.78],   // del mid: la identidad
  satGlow: [0.60, 0.80], luzGlow: [0.18, 0.30],
  luzCore: [0.94, 0.97],
  giroGlow: 5,                 // grados que el halo se va hacia el azul
};

function generaPaleta(esp){
  const e = fusiona(ESPECTRO, esp);
  const n = Math.max(2, Math.round(e.tramos));
  const pal = [];
  for (let i=0;i<n;i++){
/* el tono se reparte por el rango y lo demás se sortea por tramo: sin
       el sorteo se le ve la fórmula */
    const h = e.tono[0] + (e.tono[1]-e.tono[0])*(i/(n-1));
    const entrada = {
      core: hsl(h, 1, rango(e.luzCore)),
      mid:  hsl(h, rango(e.sat), rango(e.luz)),
      glow: hsl(h + e.giroGlow, rango(e.satGlow), rango(e.luzGlow)),
    };
    if (e.peso !== undefined) entrada.peso = e.peso;
    pal.push(entrada);
  }
  return pal;
}

/* ══════════════════════════════════════════════════════════════════
   LA ESCENA
   La regla que la sostiene: NADIE está iluminado por la escena, cada
   cuerpo existe sólo hasta donde llega la luz que le dan. De ahí que el
   rape viva a oscuras: su señuelo apunta al frente, no a él. Estar a
   oscuras no es no estar —su cuerpo sigue tapando lo de detrás.
   ══════════════════════════════════════════════════════════════════ */

/* Cada entrada: núcleo casi blanco, color de identidad, tono de halo.
   `peso` es cuánto sale en el sorteo. */
const AZUL    = {core:[226,238,255], mid:[ 96,150,255], glow:[ 22, 46,140], peso:1.6};
const CIAN    = {core:[226,252,255], mid:[ 88,214,236], glow:[ 16, 92,120], peso:1.2};
const HIELO   = {core:[228,248,255], mid:[126,206,238], glow:[ 22, 82,124], peso:1.0};
const VERDOSO = {core:[228,255,246], mid:[110,224,190], glow:[ 14, 96, 92], peso:0.9};
const PLATA   = {core:[240,248,255], mid:[176,206,224], glow:[ 54, 82,104], peso:0.3};
const ROJO    = {core:[255,226,220], mid:[228, 74, 62], glow:[120, 16, 14]};

const ABISMO = {
  nombre: 'Abismo',

  paleta: [AZUL, CIAN, HIELO, VERDOSO, PLATA],
  /* El color excepcional. El motor sólo lo OFRECE en M.raro; quien lo
     quiera se lo coge, con su propia probabilidad. No hay reparto
     automático. Hoy sólo lo usa el plancton, por mota. */
  raro: ROJO,

  agua: {
    pos: [0.000, 0.070, 0.220, 0.480, 0.760, 1.000],
    /* Casi negro de arriba abajo; el poco azul del techo evita que la
       pantalla sea un rectángulo plano. Perfil ajustado a mano. */
    tono: [[4,13,21],[3,10,17],[2,6,12],[1,3,7],[0,1,3],[0,0,1]],

    /* Cuánta luz del agua le quita un campo `apaga`: a 1 el cuerpo deja
       el agua en negro, a 0 el mecanismo se apaga. `nucleo` es hasta
       dónde llega el negro pleno antes de desvanecerse. */
    sombra: { fuerza: 1.0, nucleo: 0.55 },

    /* Cuatro manchas de azul oscuro cruzándose muy despacio, sumadas al
       agua con alfa mínima: rompen el negro plano en horizontal, que el
       degradado sólo varía en vertical. Van a `div` de resolución y se
       amplían, o sea con el desenfoque del bilineal. `fuerza` a 0 la
       apaga; a 0,32 el negro se rompe sin irse y el píxel más oscuro sigue
       en [0,1,3]; a 0,9 ya no hay negro. */
    ondulacion: {
      div: 6, manchas: 4, fuerza: 0.32,
      radio: [0.40, 0.80],        // en fracción de la diagonal
      vel: 0.035,                 // el recorrido, muy lento
      tonos: [[6,22,30], [4,12,32], [10,26,24], [14,10,30]],
    },
  },

  dither: true,

  /* ── LA DISPERSIÓN DEL AGUA ───────────────────────────────────────
     Lo que hace que esto sea AGUA y no vacío: sin ella, entre dos luces
     no hay nada y la pieza se lee como pegatinas sobre negro. Va por
     ESCENA, con la luz de los tres planos ya sumada: es lo único que
     puede unirlos. La luz baja a una pirámide de lienzos y se vuelve a
     sumar de pequeño a grande —reducir y ampliar con bilineal ES un
     desenfoque—, y en varias escalas da a la vez el velo corto pegado a
     una esca y el resplandor ancho de un banco. */
  dispersion: {
    div: 4,                       // el primer nivel, respecto al lienzo
    niveles: 4,                   // cada uno la mitad del anterior
    /* `fuerza` es cuánto velo hay y `caida` cuánto se ENSANCHA. El
       segundo es el que levanta el cuadro entero: a 0,86 se suman
       cientos de motas y deja de ser un abismo. */
    fuerza: 1.0,                  // cuánto velo se suma al final
    caida: 0.72,                  // lo que pierde cada nivel al ensanchar
  },

  /* dos senos en función de la posición; aquí abajo, lenta y corta */
  corriente: { amplitud: 0.16, ondaY: 0.7, ondaX: 0.7, vel: 0.05 },

  /* Tendencia a no salirse del encuadre, no una pared: el empuje aparece
     a `margen` del canto y crece al acercarse. El cristal duro es aparte,
     en salto(). */
  borde: { margen: 0.14, fuerza: 1.0 },   // fracción de min(W,H) · U/s²

  /* el dedo: sólo contacto, nunca hover */
  dedo: {
    alcance: 3.4,                 // en unidades de escena
    vida:    3.2,
    color:   [96,150,180],        // el color del agua, no de un bicho
    tinte:   [0.10, 0.34],        // cuánto tira del color de un bicho
    brillo:  0.048,               // el fondo es casi negro: poco basta
    paso:    0.9,                 // separación mínima entre ondas al arrastrar
    tope:    20,                  // ondas vivas a la vez como máximo
  },

  /* ── TRES PLANOS: fondo, medio, frente ────────────────────────────
     La distancia se lee por cuatro avisos a la vez: más pequeño
     (`scale`), más borroso (`resDiv`), más tenue (`alpha`) y más lento
     (`drift`). `sharp` atenúa los núcleos casi blancos; `tScale` es el
     largo de los tentáculos de la medusa. */
  planos: [
    {resDiv:3, alpha:0.58, scale:0.40, sharp:0.35, tScale:0.62, drift:0.44},
    {resDiv:2, alpha:0.86, scale:0.74, sharp:0.78, tScale:0.85, drift:0.72},
    {resDiv:1, alpha:1.00, scale:1.32, sharp:1.00, tScale:1.00, drift:1.00},
  ],

  escala: 26,                     // divisor de sqrt(área) → unidad U
  maxPx: 4.6e6,                   // tope de píxeles de lienzo

  /* Cuánto espera un evento exclusivo que le toca turno y se lo
     encuentra ocupado. Sin relevo se le sigue descontando el reloj, se
     queda en negativo y arranca en el mismo fotograma en que muere el que
     lo tapaba: un tercio de los exclusivos salían encadenados. */
  relevo: [25, 70],

  /* ── EVENTOS ──────────────────────────────────────────────────────
     Cada entrada: {evento, plano?, ...parámetros}. Un `porContacto: 0..1`
     deja que el dedo lo dispare. */
  eventos: [
    /* la cadena de encendido: un soplo que va prendiendo la nieve marina */
    { evento: 'contagio', vel: [3, 7], salto: 6.5,
      alcance: [0.55, 1.1], cada: [55, 145], primero: [18, 55],
      porContacto: 0.3 },

    /* ── EL LEVIATÁN ────────────────────────────────────────────────
       Imposiblemente grande, al fondo del todo, y lo que se ve de él es
       el hueco: dentro de su silueta la nieve marina se calla.

       Lo alto que ocupa lo llena la ONDULACIÓN (`onda`), no el cuerpo
       (`grosor`, que es el semigrosor): mide unas cinco veces más largo
       que ancho y lo que barre la banda es el latigazo. `velOnda` hace
       que la onda viaje del morro a la cola y `embestida` sincroniza el
       avance con el coletazo, así que no cruza a velocidad constante. */
    { evento: 'leviatan', plano: 0,
      cada: [150, 330], primero: [45, 120],
      /* El tamaño se ajusta contra el alto que ocupa la MASA oscura (donde
         el apagado pasa de 0,45), no contra la penumbra, y la esbeltez se
         mantiene en ~5:1: a 8:1 lee como anguila y no como leviatán. */
      largo: [0.72, 0.86], grosor: [0.086, 0.108], onda: [0.155, 0.185],
      ondas: [1.6, 2.4], velOnda: [0.45, 0.75], embestida: 0.55,
      vel: [0.5, 0.9],
      /* `banda` es dónde puede caer su eje, y de ella sale también el tope
         de la vertical: los dos sitios que la necesitan no se pueden
         desalinear. Casi de canto a canto; el margen sólo evita que acabe
         con el cuerpo entero fuera del cuadro. */
      banda: [0.12, 0.88],
      /* `rumbo` es cuánto se aparta de la horizontal (±0,22 rad ≈ 13°) y se
         replantea cada `cadaRumbo` segundos, así que a lo largo de la
         travesía se compensa y describe un camino sinuoso. Sostener la
         diagonal lo sacaría del cuadro: con `largo` de casi una pantalla,
         0,22 rad todo el trayecto son más de 300 px de subida. `velRumbo`
         bajo hace que vire en unos cuatro segundos y no de golpe. */
      rumbo: [-0.22, 0.22], cadaRumbo: [9, 20], velRumbo: 0.25,
      /* Sombra y no silueta, y hacen falta los dos números: el máximo de
         cada elipse cae en el espinazo, así que con `filo` a solas sale un
         canto duro o un degradado sin masa. `penumbra` agranda la elipse
         un 30 %, de modo que la silueta cae en la zona llena y el
         desvanecido ocurre fuera de ella. */
      hondura: [0.94, 1.0], filo: 2.2, penumbra: 1.3, segmentos: 22,
      /* la cresta dorsal, en campos aparte: sierra el canto de arriba y
         deja la panza lisa. Dientes desiguales. */
      espinas: 10, cresta: 0.55,
      /* `brillo` es SÓLO los dos cantos, los fotóforos y el ojo: el cuerpo
         no emite nada. */
      brillo: 0.32, fotoforos: 11,
      /* ── SU COLOR ────────────────────────────────────────────────
         De aquí sale todo lo que emite: ojo, hilo de la cresta, fotóforos
         y filo de la caudal. Un color por travesía, no por componente, y
         no es el azul del agua: el leviatán es lo único que no pertenece
         a esta pecera.

         Rojo o morado. `tono` cruza el 0 por el rojo y corta en 366: a
         378 (18°) el tramo del extremo sale ÁMBAR y el ojo parece una
         farola. `tramos` bajo porque el halo se cachea por entrada de
         paleta y aquí hay un leviatán cada vez. `giroGlow` NEGATIVO y no
         el +5 de la casa: con el +5 el halo del rojo se va al ámbar; con
         −6 el rojo tiene halo rojo y el morado, halo violeta. */
      espectro: { tono: [272, 366], tramos: 10,
                  sat: [0.86, 1.00], luz: [0.50, 0.64],
                  satGlow: [0.82, 1.00], luzGlow: [0.24, 0.34],
                  luzCore: [0.80, 0.90], giroGlow: -6 },
      /* multiplica a `brillo`, así que el mando del panel lo apaga también.
         Por encima de 1 y no es contradictorio con «sutil»: el leviatán
         vive en el plano del fondo, a un tercio de resolución y al 58 %
         de alfa, así que a 1,1 el punto se disuelve en el borrón. A 2,0
         es un alfiler rojo y sigue sin alumbrar nada. */
      brilloOjo: 2.0,
      /* ── Y EL LOMO ───────────────────────────────────────────────
         Le dan color al canto de arriba, que sólo tenía la sierra oscura
         de los campos. Los dos van CORTOS a propósito —el leviatán es un
         hueco, no un dibujo— y los dos multiplican a `brillo`:

           `brilloLomo`    velo ancho de `glow` siguiendo el diente de
                           sierra, en un trazo de 0,30 U. No es un filo:
                           lo que se lee es que por encima del lomo el
                           agua tiene un color que no es el suyo.
           `brilloEspinas` la punta de cada diente encendida, con halo de
                           0,17 U contra los 0,24 de un fotóforo. Late
                           desacompasada del coletazo.

         AJUSTADOS POR AMPLITUD Y NO POR LUZ TOTAL: el velo del lomo suma
         un tercio de lo que emite la bestia y casi no se ve, porque lo
         reparte por veinte mil píxeles. Lo que dice si un detalle se lee
         es cuánto sube el píxel más alto. Contra el hilo de la panza, que
         sube 347 de 765, el lomo va a una trigésima parte y las espinas a
         una docena de veces menos. */
      brilloLomo: 0.35, brilloEspinas: 1.4 },

    /* ── LA CARROÑA ─────────────────────────────────────────────────
       Algo muerto que se hunde, y NO EMITE NADA: se ve sólo mientras pasa
       por la luz de alguien. Va en el plano de en medio —al fondo, a un
       tercio de resolución, un esqueleto es una mancha, y delante taparía
       demasiado cuadro durante el minuto que tarda en bajar.

       `vel` baja porque lo que tiene que dar es el tiempo largo de la
       pieza: a 0,55 U/s tarda unos 50 s en cruzar de arriba abajo. `giro`
       es el volteo, en centésimas: una vuelta cada minuto. `caida` y
       `ganancia` altas son «hay que ponerse cerca, pero entonces se ve
       bien»; `base` es lo que se intuye sin nada, y va mínimo. */
    { evento: 'carrona', plano: 1,
      cada: [130, 280], primero: [35, 95],
      vel: [0.55, 0.95], largo: [0.15, 0.26],
      giro: [-0.10, 0.10], deriva: 0.25,
      /* ── SIEMPRE HUESO ───────────────────────────────────────────
         Marfil mate, y fijo: un esqueleto que coge el color del foco que
         lo alumbra no se lee como esqueleto sino como otro bicho
         encendido. Lo que cambia con la luz que le llega es cuánto se ve
         y por dónde, y eso ya lo hace vértebra a vértebra.

         `sat` muy baja y `luz` alta es hueso y no ámbar; `tramos` a 4
         porque del rango sólo se pide que una carroña salga marfil y la
         siguiente algo más gris. */
      espectro: { tono: [30, 48], tramos: 4,
                  sat: [0.10, 0.20], luz: [0.80, 0.90],
                  satGlow: [0.14, 0.26], luzGlow: [0.26, 0.36],
                  luzCore: [0.93, 0.98], giroGlow: 4 },
      /* ── LA ANATOMÍA, Y NO HAY DOS IGUALES ───────────────────────
         `vertebras`, `costillas` y `chevrones` son cuántas piezas tiene;
         `caja` lo abombado del pecho, que entra en el perfil del cuerpo y
         por tanto manda también sobre lo que TAPA y sobre el largo de las
         costillas; `falta`, la probabilidad de que una costilla suelta no
         esté, por lados —una jaula completa y simétrica se lee como un
         dibujo—; `craneo`, la de que le quede cabeza. */
      vertebras: [11, 16], costillas: [6, 9], chevrones: [3, 6],
      caja: [0.30, 0.90], falta: 0.18, craneo: 0.86,
      /* `alcance` agranda el radio con el que un foco la revela, y es la
         única licencia de este evento: los radios de `alcanceCuerpo` están
         puestos para un pez oscuro y un esqueleto es pálido y mate, así
         que se le ve desde más lejos. Sin esto no se enciende nunca.

         Ajustado por COBERTURA —qué fracción del lienzo tiene luz
         bastante para revelarla— y no por travesías, que dependen de por
         dónde caiga. A 3,2 sale ~10 %: casi siempre hay algún hueso
         iluminado y casi nunca todos. */
      alcance: 3.2,
      caida: 2.2, ganancia: 1.9, techo: 1.5, base: 0.025,
      /* Tapa, y también a oscuras: es lo que la convierte en un cuerpo.
         `filo` mucho más bajo que el del rape (28) porque un esqueleto no
         es macizo: se le cuela luz entre las costillas. */
      tapa: 0.85, tapaFilo: 6,
      /* la descomposición va prendiendo la nieve marina a su paso */
      enciende: 0.55 },

    /* ── EL VISITANTE ───────────────────────────────────────────────
       El poliqueto que cruza el fondo cada tanto, tan tenue que casi no
       está. `patas`, `antenas` y `cola` son el detalle: a 0 vuelve a ser
       la cadena de cuentas pelada.

       Es el evento que más se repite —cae cada minuto o dos— y por eso lo
       que se sortea por travesía son las PROPORCIONES y no sólo el
       tamaño:

         `grosor`  el grueso del cuerpo, casi al doble de un extremo a otro.
         `merma`   cuánto adelgaza hacia la cola: 0,18 es un tubo, 0,70 un
                   cono.
         `panza`   dónde tiene lo más gordo. A 0, en la cabeza; a 0,42, un
                   bulto a un tercio del morro, que es un huso y no un
                   gusano.
         `cuentas` con el largo ya sorteado, lo que cambia es la SEPARACIÓN,
                   o sea lo gruesa que se lee la segmentación: dieciocho
                   dan segmentos marcados, cuarenta un cuerpo casi liso. No
                   llega a collar en ningún caso —el halo de una cuenta
                   mide 93-177 px y la separación 11-43.

       `variedad` abre además los tres apéndices, cada uno por su lado.
       Va alto (0,8) y asimétrico, así que de vez en cuando uno sale a 0 y
       cruza un bicho sin parapodios o sin antenas. A 0, todos los
       visitantes son exactamente el mismo. */
    { evento: 'visitante', plano: 0,
      cada: [50, 120], primero: [15, 42],
      cruce: [28, 46], cuentas: [18, 40],
      largo: [0.40, 0.72], onda: [0.03, 0.10],
      grosor: [0.42, 0.80], merma: [0.18, 0.70], panza: [0, 0.42],
      variedad: 0.8, brillo: 0.26,
      patas: 0.95, antenas: 1.5, cola: 1.7 },

    /* ── EL CUERPO ──────────────────────────────────────────────────
       No dibuja NADA: la silueta es de campos `apaga`, así que lo que baja
       es el hueco de un cuerpo humano. `alto` va en fracción del alto del
       cuadro, y grande —un tercio— porque lo que hace el evento es que se
       RECONOZCA; más pequeño es una mancha con forma rara.

       El más lento y el más raro de la pecera. A 0,3-0,55 U/s cada cuerpo
       tarda entre 55 y 115 segundos en bajar, que es el rato que hace
       falta para dudar de lo que se está viendo; con `cada` de seis a doce
       minutos no se convierte en decorado. `giro` en centésimas: una
       vuelta cada dos minutos. Caen de uno a tres, escalonados. */
    { evento: 'cuerpo', plano: 1,
      /* `cada` sube con los cuerpos de dos en dos y de tres en tres: con
         el desfase, una tirada de tres dura casi el doble que una sola, y
         a reloj igual el evento se comía más cuadro del que le toca.
         Medido sobre seis horas de reloj de escena, [360,720] deja al
         cuerpo en el 15,2 % de los fotogramas y a todos los exclusivos en
         el 43 %. */
      cada: [360, 720], primero: [110, 250],
      alto: [0.28, 0.40], vel: [0.30, 0.55],
      giro: [-0.055, 0.055], deriva: 0.22,
      /* `cuantos` es cuántos caen en una tirada y `retraso` los segundos
         que tarda cada uno en asomar detrás del anterior. El retraso es
         LARGO —10-30 s, y el cuerpo tarda 55-115 en bajar— porque no son
         tres cuerpos a la vez sino una formación: cuando el segundo entra
         por arriba el primero va ya por la mitad del cuadro. Cada uno
         lleva su sitio, tamaño, velocidad, volteo, postura y flexión. */
      cuantos: [1, 3], retraso: [10, 30],
      /* La del ahogado es la postura de reposo; esto es cuánto se aparta
         de ella cada cuerpo. `abre` multiplica el ángulo del hombro y de
         la cadera, `dobla` el del codo y de la rodilla. En los brazos,
         `abre` a 0,70 los deja en cruz y a 1,22 casi verticales sobre la
         cabeza. */
      abre: [0.70, 1.22], dobla: [0.3, 1.8],
      /* ── Y LO QUE LO HACE BLANDO ─────────────────────────────────
           `arqueo`  cuánto se arquea el espinazo, constante y con el signo
                     sorteado: uno baja recogido hacia delante y el
                     siguiente arqueado hacia atrás.
           `onda` ·  y cuánto le RECORRE, con su largo y su velocidad.
           `ondas`   Media onda por cuerpo y muy despacio: en un cuerpo de
           `velOnda` trescientos píxeles, 0,04 de onda son unos doce, y se
                     recorren en medio minuto. No se pide que nade, sino
                     que se le note que el agua lo mueve.
           `vaiven`  cuánto se va cada MIEMBRO de su postura. Cada eslabón
                     cuelga de su hueco y lleva su propia fase, así que
                     0,30 rad se leen como un brazo suelto en el agua.

         La flexión pesa por la distancia al ombligo, así que el tronco
         aguanta y lo que se dobla son la cabeza y los pies, arrastrando
         con ellos los miembros que cuelgan de ahí. */
      arqueo: [0.04, 0.13], onda: [0.02, 0.055],
      ondas: [0.35, 0.8], velOnda: [0.10, 0.26], vaiven: 0.30,
      /* `hondura` casi a 1 y `penumbra` como en el leviatán: el máximo de
         cada elipse cae en su centro, así que sin agrandarlas la silueta
         cae donde el apagado ya se desvanece y no hay masa oscura. `filo`
         más bajo que el del leviatán (2,2) porque aquí los trozos son
         finos —un brazo— y con canto duro se despegan. */
      hondura: [0.92, 1.0], filo: 1.8, penumbra: 1.25,
      /* ── EL CANTO, CUANDO ALGO LO ALUMBRA ────────────────────────
         El agua de la mitad de abajo del cuadro ya es casi negra —[0,1,3]
         contra [4,13,21] del techo—, así que ahí un hueco negro sobre
         negro no se lee y el cuerpo se perdería justo mientras baja.

         NO SE LE PONE LUZ DESDE LA ESCENA: un filo fijo por el canto de
         arriba es lo que la regla de la casa prohíbe. Lo que se enciende
         es lo que un foco de verdad alcanza —la luz se acumula COMO
         VECTOR y sólo se pinta el lado del canto que mira a ella, así que
         el de sombra se queda negro.

           `borde`      la ganancia, multiplicador sobre la luz que le
                        llega y no un brillo suyo: a 0 el evento vuelve a
                        no dibujar nada.
           `bordeAlcance` agranda el radio con el que un foco lo revela, y
                        va alto por lo mismo que en la carroña: los radios
                        de la casa revelan un pez, y un cuerpo mide medio
                        cuadro. Medido: en una travesía entera lo más
                        cerca que le pasó algo fueron 320 px, contra
                        radios de 16 a 125.
           `bordeCaida` alta es alcance corto. La curva es la de
                        `luzRecibida` —pow(1/(1+d²/r²), caida)— y no la de
                        la carroña, que se corta en el radio: con corte el
                        canto sale todo o nada.
           `bordeTecho` el tope, con rodilla blanda. La luz que le llega va
                        de 0,02 a más de 1 según lo que pase cerca, y sin
                        techo el canto se clava en alfa 1 cada vez que se
                        le acerca una medusa: deja de ser un hueco y pasa
                        a ser una figura recortada en blanco.
           `bordeTono`  GRIS casi neutro: no es un esqueleto pálido ni un
                        bicho que emite, es carne mojada.
           `bordeTinte` lo poco que coge del color de quien lo alumbra. A 0
                        se despega de la escena; a 1 parece otro bicho
                        encendido.
           `bordeTapado` a partir de qué campo `apaga` se considera que un
                        trozo de canto está ENTERRADO en otra parte del
                        cuerpo —el brazo por donde cruza el hombro— y no
                        se pinta. Sin esto salen rayas por dentro de la
                        masa oscura y el cuerpo se lee como un despiece.

         Con estos valores, y medido sobre tres travesías enteras: de los
         82 trozos de canto se encienden unos 30, 41 quedan de espaldas a
         la luz y 11 enterrados. Que la mitad esté siempre negra es lo que
         mantiene al cuerpo siendo un hueco; el alfa del trazo va de 0,04
         a 0,20, o sea que se ve siempre un poco y mucho más cuando algo
         lo encuentra. */
      borde: 2.2, bordeAlcance: 4.2, bordeCaida: 2.0, bordeTecho: 0.09,
      bordeGrosor: 0.05, bordeTono: [182, 196, 204],
      bordeTinte: 0.22, bordeTapado: 0.25 },

    /* ── EL GLITCH ──────────────────────────────────────────────────
       No es un fallo de la pantalla, es un fallo del DIBUJANTE: una o dos
       medusas se quedan pintadas en bandas escalonadas mientras las otras
       están perfectas. Lo aplica el motor con el campo `tajo` (ver
       `pintaBicho`); la medusa no se entera. No dibuja nada.

       VA A PASITOS. El foco se sortea una vez al nacer y después cada
       tirón AVANZA lo que ya había: `avance` es cuánto cambia la rotura
       por paso y `giro` cuánto se recoloca cada banda. Sorteando el foco
       entero en cada tirón se ven SALTOS —la rotura desaparece y aparece
       otra en otro sitio—; avanzando se ve una sola avería dando pasos.
       Y dura: 22-40 pasos repartidos por 14-24 segundos.

       A QUIÉN LE TOCA no lo decide el evento: lo declara la especie con
       `rompible` (ver el REGISTRO DE ESPECIES), y el evento reparte
       campos sin saber a quién le caen. Hoy sólo la medusa, que es el
       sprite más grande y el más lento: en una mota de tres píxeles la
       escalera no cabe.

       De ahí sale el reglaje. `radio` decide CUÁL de las cuatro medusas
       le toca, así que va a media pantalla: más grande les toca a todas y
       más chico a ninguna. `parte` a 1 rompe a todas las que caen dentro
       —con cuatro candidatos, bajarlo dejaba el evento en que no pasara
       nada; el «sólo algunos» ya lo da el foco—. En una pecera con más
       cosas rompibles hay que bajarlo.

       `bandas` y `paso` son los pasitos DENTRO del bicho: 8-14 bandas de
       6-13 píxeles de escena, una pila de unos cien píxeles que le cruza
       la campana entera. Los tentáculos caen en la última banda y se van
       en bloque: campana en escalera y cortina desalineada por debajo.

       `sep` y `estira` son el tope a plena rotura, y los dos salen del
       mismo `k`, así que la rotura crece y decrece como una sola cosa.

       CUIDADO AL SUBIR `bandas` O `radio`: cada banda es un dibujo entero
       del bicho. Cronometrado, una medusa cuesta 0,069 ms normal y 0,050
       por banda; el peor caso —las cuatro medusas con catorce bandas—
       serían 2,6 ms sobre un fotograma de 8,3. Con el `radio` de la
       escena le toca a una o dos: 0,7-1,3 ms y sólo durante los tirones. */
    { evento: 'glitch',
      cada: [240, 540], primero: [70, 200],
      dura: [14, 24], saltos: [22, 40], salto: [0.22, 0.50],
      focos: [1, 2], radio: [0.30, 0.52],
      bandas: [8, 14], paso: [6, 13],
      sep: 34, estira: 0.85,
      avance: 0.14, giro: [0.20, 0.70],
      parte: 1,
      /* `filo` alto: el foco queda casi plano dentro de su radio, así que
         el que le toca se rompe ENTERO. Con `filo` bajo, los del borde
         salen medio rotos y eso se lee como que la imagen tiembla. */
      filo: 3 },

    /* ── EL SUPERPEZ ────────────────────────────────────────────────
       Parte del banco se encuentra un rato con forma de pez enorme —o de
       dos—, avanza, describe una curva y se deshace. No caza nada y no va
       a ningún sitio. No dibuja nada: manda un rato, y flojo, sobre una
       población que ya estaba, y ni siquiera sobre toda.

       Va en el plano de DELANTE porque es donde vive el 42 % del banco y
       porque una silueta hecha de puntos necesita los puntos nítidos: al
       fondo, a un tercio de resolución, no se lee la forma.

       QUE PAREZCA CASUALIDAD es todo el evento, y aquí no hay ni un
       número que empuje. El centro y el rumbo salen del propio banco
       —centro de masa y rumbo medio—, así que nadie se desplaza a una
       cita: la silueta aparece encima de ellos. Lo que hace que cuaje no
       es la fuerza, es el TIEMPO: `entra` de ocho a catorce segundos.

       `minimo` es cuántos peces hacen falta POR SILUETA una vez aplicado
       el cupo; con menos no hay evento, o hay una sola.

       `vel` es lento —unos diez segundos para cruzar un tercio del
       cuadro— y `giro` es la velocidad ANGULAR, que camina dentro de
       `±giroMax`: a 0,10 rad/s son hasta 70° en doce segundos, una curva
       abierta. Con un giro fijo describe un arco de compás y con un rumbo
       objetivo sorteado da tirones; caminando, la curva se abre y se
       cierra sola.

       `sale` LARGO: la silueta se deshila descolgándose pez a pez —cada
       uno tiene su umbral, ver `formaDesorden` en el banco— y eso
       necesita rampa. No hay ningún empujón al final: un banco que
       estalla no se deshace casualmente. */
    { evento: 'superpez', plano: 2,
      cada: [200, 440], primero: [70, 190],
      /* `largo` y `largoMin` van juntos: el segundo es el suelo por debajo
         del cual una silueta se descarta, así que si no baja con el
         primero, `escQueCabe` se queda sin sitio donde encoger. A un
         tercio de pantalla cabe; a media no —`escQueCabe` la coloca con
         el 87 % dentro AL NACER, pero después nada de 160 a 640 px y no
         hay borde que la contenga. */
      largo: [0.28, 0.38], largoMin: 0.18,
      /* ── CUÁNTOS Y CUÁNTAS ─────────────────────────────────────
         `reparto` es la fracción del banco que entra en la silueta, y no
         es 1 a propósito: los que quedan fuera siguen nadando a lo suyo
         por encima de la forma, y eso es la mitad de lo que la hace
         parecer una casualidad en vez de una coreografía. Se sortea por
         travesía, así que unas salen casi completas y otras a medias.

         `reparto` y `largo` TIENEN QUE MOVERSE JUNTOS: lo que cierra el
         canto es la densidad por PERÍMETRO —que vale 3,9·`esc`—, así que
         bajar los peces sin bajar el tamaño deja la silueta hecha de
         guiones sueltos. Con estos valores quedan unos 47 px entre peces
         del canto con una silueta y 66 con dos; un pez de este plano mide
         52, así que con DOS el canto nunca cierra del todo.

         `superpeces` es cuántas siluetas: una o dos. Dos sólo si hay
         peces para las dos —`minimo` por cabeza— y partiendo el banco por
         donde se partiría solo, por el costado de su propio rumbo. Cada
         una mide menos: el largo se divide por la raíz del número, que es
         lo que mantiene la densidad por perímetro.

         `redondez` es lo gorda que sale CADA silueta, sorteado por ella:
         a 0,70 un pez fusiforme y a 1,55 uno de cuerpo alto, casi un
         disco. Con dos en pantalla, que no se parezcan es lo que dice que
         son dos bichos y no un efecto duplicado. */
      superpeces: [1, 2], reparto: [0.40, 0.68], redondez: [0.70, 1.55],
      minimo: 10,
      entra: [8, 14], nada: [7, 13], sale: [4, 7],
      /* `vira` es con cuánta gana se tuerce hacia dentro cuando el MORRO
         de la silueta se acerca al canto (se mide en el morro y no en el
         centro: ver el evento). Tiene que poder más que su propio
         `giroMax`, que es lo único que se le impone a este evento. */
      vel: [0.25, 0.55], giroMax: 0.10, giroPaso: 0.035, vira: 2.8,
      /* alcance del campo, ancho y plano: ver el `filo` del banco. Los que
         quedan fuera no se apuntan, y eso está bien. */
      alcance: 2.2, filo: 6.0 },
  ],

  /* ── BICHOS ───────────────────────────────────────────────────────
     Cada entrada: {especie, plano?, ...parámetros}. En aditivo sumar es
     conmutativo, así que el orden de la lista no cambia un píxel. Un
     `paleta` o un `espectro` le dan colores propios a esa especie. */
  bichos: [

    /* nieve marina: mucha, lenta y casi apagada. Sólo existe de verdad
       cuando una esca pasa cerca. */
    { especie: 'plancton',
      total: {cada:1150, min:340, max:1150},
      reparto: [0.50, 0.32, 0.18],
      /* Dos arcos de tono: el frío ancho y un segundo cálido con peso
         bajo, unas pocas motas ámbar entre cientos de azules. Las ascuas
         de `raro` son otra cosa y van aparte. La saturación sube poco: una
         nieve marina de colores saturados es confeti. */
      espectro: [
        { tono: [166, 262], tramos: 16,
          sat: [0.16, 0.62], luz: [0.72, 0.90],
          satGlow: [0.25, 0.55], luzGlow: [0.15, 0.27] },
        { tono: [24, 66], tramos: 6, peso: 0.14,
          sat: [0.20, 0.58], luz: [0.70, 0.86],
          satGlow: [0.26, 0.50], luzGlow: [0.14, 0.24] },
      ],
      /* variedad de tamaño y de brillo: es lo que evita que tanta mota se
         lea como una textura regular */
      radio: [0.28,1.50], alfa: [0.025,0.14], alfaAlto: [0.16,0.42],
      destacadas: 0.07, raro: 0.02,
      apaga: 0.78,                // el rastro dura lo suyo
      enciende: 3.8, enciendeDedo: 3.6,
      huida: [0.25,1.2], lag: [2,11], frena: [0.05,0.40], fuerzaDedo: 4,
      caida: 0.16,                // la nieve marina cae
    },

    /* LAS MEDUSAS. El otro foco que se mueve: grandes, encendidas en todo
       su volumen, y lo que hacen es ALUMBRAR DE PASO. Pocas y lentas. */
    { especie: 'medusa',
      por: [ {cada:480000, min:1, max:3},
             {cada:600000, min:1, max:2},
             {cada:900000, min:0, max:1} ],
      /* Frío y tirando a violeta, para no competir con el moteado del
         banco. `luzCore` por debajo del 0,95 de la casa: la campana son
         nueve capas aditivas de `core`, y con 0,95 esas nueve suman
         blanco. */
      espectro: { tono: [184, 272], tramos: 12,
                  sat: [0.52, 0.90], luz: [0.62, 0.80],
                  satGlow: [0.45, 0.75], luzGlow: [0.14, 0.24],
                  luzCore: [0.84, 0.90] },
      radio: [0.55, 1.35],
      nTent: [12, 26], canales: [7, 11], brazos: [3, 5],
      periodo: [2.6, 4.8], empuje: 2.4, arrastre: 0.28,
      flota: [0.55, 1.45], patrulla: [0.06, 0.42],
      vigor: [0.45, 1.0], brillo: 0.9,
      tilt: [0.05, 0.26], tiltVel: [0.15, 0.55],
      perfil: [0.50, 0.84], ancho: [0.82, 1.20], alto: [0.80, 1.22],
      faldon: [0.22, 0.48], mEnv: [0.7, 1.3], mBase: [0.45, 0.80],
      lobulos: [5, 9], ensancha: [0.10, 0.26], achata: [0.10, 0.26],
      cuelga: 2.6, alcanceLuz: 3.4, alcanceCuerpo: 2.2, emision: 0.55,
      huida: [0.4, 1.1], lag: [2, 8], fuerzaDedo: 3, borde: 0.8,
    },

    { especie: 'copepodo',
      total: {cada:70000, min:4, max:12},
      reparto: [0.30, 0.40, 0.30],
      /* un trazo de medio milímetro: pálido y frío, no un organismo de color */
      espectro: { tono: [176, 232], tramos: 8,
                  sat: [0.28, 0.62], luz: [0.70, 0.86],
                  satGlow: [0.30, 0.52], luzGlow: [0.15, 0.25] },
      espera: [0.9, 3.4], tiron: [1.8, 4.4], frena: 0.02, borde: 0.5,
    },

    { especie: 'rape',
      /* Uno, y dos en pantalla grande. Ninguno al fondo: un rape lejano es
         una mancha sin dientes, barbilla ni ojo. Números sueltos porque
         por área esto no se puede decir. */
      por: [ 0,
             {cada:1400000, min:0, max:1},
             1 ],
      /* GRANDE: es lo que sostiene el detalle —miómeros, cristalino,
         dientes y barbilla no existen por debajo de cierto tamaño—. En el
         plano de delante, un quinto del ancho del cuadro. */
      largo: [5.4, 7.4],
      brillo: 1.15,               // el del señuelo: éste sí quema
      /* El cuerpo casi no se ve, y aquí se decide: `cuerpo` escala la luz
         recibida y `techo` la recorta ANTES de escalarla. */
      cuerpo: 0.62, techo: 1.25,  // el del animal: un susurro
      /* `proa` reparte la piel entre un suelo uniforme y un término que cae
         hacia la cola: alto, del fogonazo se ve sobre todo la boca. No
         llega a 1 para dejar suelo —sin él el cuarto de atrás es un
         agujero. */
      proa: 0.90,
      /* ── EL COLOR DEL RAPE ─────────────────────────────────────
         Un arco, un color por bicho y ninguna excepción: morado →
         magenta → rojo → vino. Corta en 364 (4°) porque de ahí para
         arriba el rojo se va al salmón —el tramo de 12° sale (251,86,45)
         y en pantalla lee cobre, no sangre. Se sortea al nacer y lo usan
         la esca, el cuerpo, la barbilla y la pupila: no hay un color por
         componente, y la posición de la luz decide por dónde se enciende,
         no de qué color es.

         La diferencia entre EL FOCO y EL SUSURRO la sostienen sólo el
         alfa —`brillo` 1,15 contra `cuerpo` 0,62— y el núcleo blanco de
         la esca, así que `luz` y `luzGlow` van a media altura: sirven
         para los dos usos. `giroGlow` NEGATIVO, contra el +5 de la casa:
         con el halo tirando al azul un rape rojo sale magenta y deja de
         ser sangre. */
      espectro: { tono: [268, 364], tramos: 18,
                  sat: [0.66, 0.96], luz: [0.44, 0.58],
                  satGlow: [0.66, 0.92], luzGlow: [0.22, 0.32],
                  luzCore: [0.80, 0.90], giroGlow: -5 },
      /* punto pequeño y quemado, no mancha grande y suave */
      esca: 0.050,                // radio del señuelo, en largos
      difusion: 2.9,              // cuánto se derrama alrededor
      /* En largos, así que el radio crece con el bicho. Chica e intensa: a
         1,05 el halo se come un tercio del cuadro y eso no es una lámpara
         con corona, es el agua teñida. */
      halo: 0.45,                 // corona de la lámpara, en largos
      nucleo: 0.34,               // el corazón blanco: deja ver el tono
      /* Nunca se apaga del todo: la esca es el único punto de referencia
         que hay aquí abajo. El techo pasa de 1 porque es lo ÚNICO que
         tiene que quemar. */
      intensidad: [0.42, 1.00],

      /* Delante del morro, no encima del lomo: es para lo que sirve, y es
         lo que mantiene al pez a oscuras —cuanto más separada está la luz
         de la boca, más grande es lo que no se ve. En LARGOS. */
      delante: 0.46, encima: 0.26,
      muelle: 34, freno: 7.0,     // baja el muelle y se retrasa más al girar

      /* ── LO QUE TAPA ───────────────────────────────────────────
         Todo se pinta sumando, así que por defecto ningún cuerpo puede
         taparle a otro. `tapa` es la oclusión por el único camino que un
         aditivo permite: no se añade negro, se le quita la luz al que
         estaba detrás. Es contra los DEMÁS bichos —que el rape se vea a
         través de sí mismo es el diseño, explicado en bichos.js.

         Tapa SIEMPRE, también negro sobre negro: aunque no se dibuje un
         píxel de él, se le encuentra por la AUSENCIA de motas.

         `tapaFilo` es lo que lo hace leer macizo: entra como
         pow(1 - d/r, 1/filo), así que a `filo` bajo el apagado se
         desvanece antes del canto y se cuela luz por dentro de la silueta
         —29,6 % con filo 5, 4,8 % con filo 28. */
      tapa: 1, tapaFilo: 28,

      /* `vigila` son los largos en los que algo le llama la atención;
         `velMira` lo que tarda el ojo en llegar; `pupila`, cuánto se
         desplaza dentro del ojo. `destelloOjo` es el tapetum, y sólo se ve
         en la penumbra. */
      vigila: 1.9, velMira: 2.4, pupila: 0.40, destelloOjo: 2.6,
      /* La pupila NUNCA se apaga: emite por su cuenta, así que al rape se
         le encuentra siempre si se le busca. Es la única excepción
         declarada a la regla de la casa, y va baja —a 0,45 deja de ser un
         pez a oscuras con los ojos encendidos y pasa a ser dos ojos
         flotando. */
      ojoBrillo: 0.20,

      /* Radianes que abre la quijada al bombear las branquias. El ritmo va
         por bicho, o los rapes respirarían a la vez. */
      respira: 0.055, ritmoRespira: [1.7, 2.7],

      /* Se congela al ser alumbrado: 0 lo deja como estaba, 1 lo clava. A
         0,85 lo único que se mueve cuando algo lo descubre es la pupila. */
      congela: 0.85,

      /* Quién ve a quién: `alcanceLuz` es a qué distancia enciende plancton
         —el aspecto— y `alcanceCuerpo` a qué distancia una esca REVELA a
         otro pez —el mecanismo. */
      alcanceLuz: 0.62,           // largos en los que enciende plancton
      /* El rape vive a oscuras y estos cuatro lo sostienen. Deciden cuándo
         se ENCIENDE, no cuándo está: apagado tapa igual. */
      alcanceCuerpo: 0.88,        // largos en los que alumbra a otro pez
      caida: 3.2,                 // exponente: alto = alcance corto
      ganancia: 2.0,              // pero mucha luz dentro de ese alcance
      autoLuz: 0.08,              // su propia esca apunta al frente, no a él
      base: 0.002,                // lo que se intuye sin que nada lo alumbre

      parpadeo: [1.6, 9],
      cola: 0.055, velCola: [0.8, 1.8],
      /* LA CARA. Dientes largos y desiguales en dos filas, la boca nunca
         cerrada del todo y una barbilla ramificada (Linophryne). La
         barbilla pone una SEGUNDA luz separada de la esca, y entre las dos
         no se dibuja nada: el tamaño de la cabeza lo declara su
         distancia. */
      dientes: [10, 15],
      paladar: true,              // la fila interior, la del paladar
      entreabierta: 0.13,         // la quijada nunca acaba de cerrar
      bocaLargo: 0.47,            // casi media cabeza es boca
      bocaHondo: 0.26,            // y la quijada se descuelga
      /* reparto de la abertura: 0,30 la quijada de arriba y el resto la de
         abajo, que es como abre un rape. A 0,5 la de arriba le pasa por
         encima al ojo en pleno bocado. */
      quijadaArriba: 0.30,
      barba: 0.50, barbas: [3, 5], barbaBrillo: 0.42,
      /* y el detalle del cuerpo, que sólo existe a este tamaño */
      miomeros: [7, 10], radios: [5, 7],
      /* Se arrima al canto y mira hacia dentro: `querencia` es el empuje
         hacia fuera y `aro` dónde se planta, medido por ejes. El `borde`
         de la casa empuja al revés, así que va bajo. Las escas quedan por
         el perímetro apuntando al centro y el centro del cuadro se vacía. */
      querencia: 0.55, aro: 0.84, miraAlCentro: true,
      borde: 0.30,
      /* ACECHO: crucero mínimo y ratos largos clavado entre embestidas. Un
         rape que patrulla es un pez que pasa; uno quieto veinte segundos
         con la esca colgando es una trampa esperando. */
      crucero: 0.055,             // empuje constante, en U/s
      acecho: [7, 22],            // quieto entre embestidas
      embestida: [0.5, 1.7],
      arrastre: 0.26,             // más alto = frena menos = planea más
      /* la inclinación del cuerpo, que es por donde empuja. Positiva es
         hacia abajo, mire el pez donde mire. */
      inclina: [-0.34, 0.34],     // unos 20° arriba o abajo
      cadaInclina: [9, 24],
      velInclina: 0.4,            // vira despacio, como un submarino
      topeInclina: 0.55,          // sólo al huir puede pasar de ahí
      giro: [14, 38], velGiro: 5, // el giro pasa por el perfil, no salta
      /* LA CAZA. No persigue: espera a que algo llegue a la esca. */
      alcanceBoca: 0.16,          // a qué distancia de la esca muerde
      /* cuánto tarda en volver a tirar: es lo que separa un cazador al
         acecho de una trituradora. Tras acertar, más: está tragando. */
      reposo: [10, 24], reposoFallo: [3, 7],
      bocado: 0.55,               // lo que dura el ¡ÑACA!, en segundos
      abertura: 0.52,             // cuánto se abre la quijada, en radianes
      acometida: [5, 8],          // el tirón del bocado
      acierto: 0.72,              // falla una de cada cuatro
      trasComer: [7, 16],         // la esca se apaga DESPUÉS de tragar
      /* ── LA RÁFAGA, Y UNA SOLA ─────────────────────────────────
         No es una luz aparte: la esca emite once veces más durante un
         instante y a la vez se recoge hacia la boca, así que el cuerpo se
         enciende por el modelo de siempre. El tope está en `techo`.

         `fogonazoCaida` es lo que la convierte en RÁFAGA: la luz sale de
         elevar la fase a este exponente, así que por encima de 1 el
         ataque es instantáneo y la caída violenta —a 1,8 queda en el 60 %
         al primer quinto y en el 8 % a tres cuartos. Con exponente 1 baja
         a ritmo constante y se lee como un foco que se enciende.

         `fogonazoDura` cubre el bocado MÁS la masticación (0,75-0,93 s):
         es la única luz que hay, y tiene que llegar viva —de cola— hasta
         que acaba de tragar. */
      fogonazo: 11, fogonazoDura: 0.9, fogonazoCaida: 1.8, retrae: 0.95,

      /* ── MASTICAR ──────────────────────────────────────────────
         El bocado dura medio segundo y tiene que seguir durándolo: un
         cazador de emboscada es un tirón. Lo que se alarga es lo de
         después —con la presa dentro trabaja la quijada y lleva el ilicio
         recogido junto a la boca—, y no pone luz: pone movimiento, que se
         ve con la cola de la ráfaga. Por encima del segundo deja de ser un
         vistazo y se convierte en un rape al que da tiempo a mirarse. */
      mastica: [0.20, 0.38],      // segundos con la presa dentro
      masticaRitmo: 4.6,          // dentelladas por segundo, en rad/s
      masticaAbre: 0.13,          // cuánto trabaja la quijada, en rad
      masticaRetrae: 0.82,        // lo recogido que se queda el ilicio

      /* ── Y EL BANCO SE ENTERA ──────────────────────────────────
         Un campo `asusta` en la boca al morder. `espanta` es el radio en
         LARGOS del rape, así que espanta más lejos cuanto más grande es el
         animal y la escala se mantiene en cualquier pantalla.

         NO puede ir generoso: a 4,2 —el 61 % del ancho— entraban en
         pánico los 68 peces a la vez y el susto dejaba de ser local. A
         2,0 el radio es el 29 % del ancho y se asustan 34 de 68: huye el
         que está cerca.

         `espantaDura` es más largo que la ráfaga a propósito: si el susto
         se apagara con la luz, cuando el ojo vuelve a ver al banco ya
         está rehecho y el pánico no se ha visto. `espantaFilo` por debajo
         de 1 entra como pow(u, 1,25), así que el peso cae rápido en el
         canto y los del borde no llegan al umbral: el miedo no tiene
         borde duro. */
      espanta: 2.0, espantaDura: 2.2, espantaFilo: 0.8,

      /* la onda del dedo le hace dar media vuelta y salir de ahí */
      umbralHuida: 0.25, estampida: [3, 6],
      huida: [0.4, 1.2], lag: [0.7, 2.2], fuerzaDedo: 2.2,
    },

    /* LA PRESA, y a la vez el foco que se mueve. En cardumen son las dos
       cosas: de lejos, la única cosa viva y de colores que cruza el
       cuadro; de cerca, lo que ALUMBRA. */
    { especie: 'pezlinterna',
      /* Muchos: el banco es el espectáculo, y con nueve peces no hay
         banco, hay nueve peces. El tope alto es para pantallas grandes;
         `escalaCalidad` los recorta si la máquina no da.

         OJO A CUÁL DE LOS TRES MANDA: a 1024×768 son 786.000 píxeles, o
         sea 71 peces por área, así que el que corta es `max` y no `cada`.
         Para que el cambio se note en una pantalla chica, donde manda
         `cada`, hay que mover los dos. */
      total: {cada:11000, min:24, max:60},
      /* cargado hacia delante: el banco que se tiene que leer como banco
         es el de cerca; el del fondo son motas */
      reparto: [0.24, 0.34, 0.42],
      /* `roce` (en el cardumen) va en U y no en largos, así que al crecer
         el bicho hay que subirlo CON ÉL o el banco se solapa. */
      largo: [0.86, 1.44],
      /* El círculo entero de tono, porque fotóforos verdes, ámbar y
         rosados los hay de verdad, y bastantes tramos porque el banco
         tiene que leerse moteado de color. `luzGlow` abajo: el bicho tiene
         color, el agua no.

         PLATEADO PERO NO GRIS, y el mando de eso es `luz` y NO `sat`: en
         HSL las dos se pelean —a `luz` 0,85 un `sat` de 0,9 da
         (182,251,182), un pastel con un 27 % de saturación real—. El
         plateado sale subiendo `luz` un poco y bajando `sat` un poco; al
         revés (`luz` 0,88 con `sat` al máximo) el banco sale blanco. Con
         estos valores la saturación real del `mid` queda en 0,33-0,67.

         `satGlow` va aparte y algo más bajo, porque de un pez a distancia
         lo que se ve es el HALO del fotóforo: el punto es `core` y sale
         casi blanco pase lo que pase. */
      espectro: { tono: [0, 352], tramos: 32,
                  sat: [0.78, 1.00], luz: [0.64, 0.80],
                  satGlow: [0.56, 0.82], luzGlow: [0.20, 0.30],
                  giroGlow: 6 },
      /* ── Y EL ORDEN EN EL SORTEO ──────────────────────────────
         Uno o dos tonos mandan en toda la pecera y `tendencia` es qué
         parte del banco se apunta; el resto sigue saliendo de la paleta
         entera. Es una TENDENCIA: con 0,74, uno de cada cuatro peces va a
         lo suyo, así que el banco tiene un color —o dos— y además
         moteado, en vez de tener los treinta y dos. Lo que quitó el
         confeti fue este sorteo, no el color de cada pez.

         Se sortean al poblar y no aquí: escritos a mano serían los mismos
         en todas las sesiones. Lo hace `siembra()` de la especie. */
      dominantes: [1, 2], tendencia: 0.74,
      /* la hilera del vientre es lo único que se ve de lejos, así que es
         donde va el brillo: puntos quemados, no un cuerpo iluminado */
      fotoforos: [6, 10],
      foto: 1.15,                 // brillo de los fotóforos
      emision: 0.32,              // lo que alumbra alrededor
      alcanceLuz: 1.5,            // largos en los que enciende plancton
      /* `alcanceCuerpo` corto a propósito: su propia trampa le trae las
         presas por delante, y con 1,15 el rape que le tocaba sitio de paso
         del banco se quedaba visible el 75 % del tiempo —lo delataban las
         presas que él había atraído. */
      alcanceCuerpo: 0.80,        // largos en los que revela un cuerpo
      /* ── LO NEGROS QUE SE VEN ────────────────────────────────────
           `base`   lo que se intuye sin nada que lo alumbre.
           `cuerpo` cuánto tinte propio coge el relleno —el degradado de
                    `mid` a `glow` que va del morro a la cola.
           `blanco` cuánto `core` se le suma encima, plano. Es lo que de
                    verdad saca al cuerpo del negro: el tinte propio de un
                    pez azul oscuro sobre agua negra sigue siendo oscuro.
           `canto`  lo marcada que va la línea del contorno, en `core`. No
                    subirlo: a 0,48 el filo se come al bicho, y la forma
                    tiene que leerse por el relleno y no por una raya
                    brillante alrededor de un hueco negro.

         `base`, `cuerpo` y `canto` multiplican a la luz que le LLEGA, así
         que a oscuras del todo apenas hacen nada. `blanco` va con la luz
         que el pez EMITE —la de sus propios fotóforos—, y por eso es el
         único que sirve para que se le vea la forma a oscuras: atado a la
         luz recibida se quedaba por debajo del ruido del dither. No rompe
         la regla de la casa: no es la escena la que lo ilumina, es él.

         Medido sobre un pez apagado del todo y sin nada a menos de 97 px,
         contra un suelo de dither de 2,4 de media: `blanco` 0,10 le sube
         11 de luminancia media, o sea un gris oscuro con su forma; a 0,18
         los peces salen lechosos y pierden el «apenas están». */
      base: 0.10,
      cuerpo: 1.22, blanco: 0.06, canto: 0.34,
      brillo: 1.15, revelado: 1.6,// a cuántas U del cebo ya se le ve
      /* Desde cuántas U ve una esca. Generoso a propósito: con un solo
         rape, un alcance corto deja la trampa sin clientes y el bocado
         —lo único que enciende al bicho— no llega a ocurrir en una
         sesión. Si se suben los rapes, éste es el primer número que hay
         que bajar. */
      atraccion: 4.5,

      /* ── EL BANCO ────────────────────────────────────────────────
         `vista` es a cuántas U se mira a los vecinos y `roce` a cuántas
         empiezan a estorbarse; los tres pesos son no chocar / ir a la par
         / no quedarse solo, y `propio` cuánto de su idea conserva.
         `aparta` tiene que mandar sobre `junta`: al revés el banco se
         anuda.

         `vista` corta (4,2 y no 5,5) es lo que evita que el banco entero
         llegue a UN acuerdo: con 5,5 cada pez veía a 12 de sus 15-27
         vecinos y la alineación del grupo subía de 0,51 a 0,70. Por
         debajo de 3,2 deja de leerse como banco.

         ── Y LAS DOS QUE HACEN QUE NINGUNO LO CONSIGA ────────────
         `reacciona` (cada cuánto vuelve a mirar, en segundos) y `ciego`
         (el cono que no ve a su espalda, en radianes: 1,9 ≈ 109°). El
         mecanismo está explicado en `cardumen()`, en bichos.js. Lo que
         hay que saber para tocarlos: `reacciona` es el que hace el
         trabajo —por sí solo baja la alineación del grupo de 0,84 a
         0,51—; `ciego` a solas no hace nada, pero encima del primero
         llega a 0,42. Ninguno toca la FORMA del banco: la elongación se
         queda en 1,84 y el grupo mayor en 19-21 peces.

         AL MEDIR: comprobar primero que `M.cardumen().length` es el que
         toca. Una tanda tomada con la población recortada por
         `degradar()` da un banco más denso, más apretado y más redondo, y
         lleva a conclusiones falsas. */
      cardumen: { vista: 4.2, roce: 2.25, propio: 0.40,
                  aparta: 1.8, alinea: 1.6, junta: 0.9,
                  ciego: 1.9, reacciona: [0.18, 0.68] },
      /* Segundos de pánico cuando algo muerde al lado, a peso pleno del
         campo. Entra en el mismo `susto` que usan el dedo y el fallo de un
         rape: triplica el viraje, sube el nado a `velSusto` y suelta las
         reglas de alinear y juntar —no la de no chocar—, así que el banco
         se abre y se rehace solo. */
      panico: 1.8,
      /* ── SI ALGUIEN LOS FORMA ──────────────────────────────────
         `formaPega` es la fuerza del tirón a su sitio, en 1/s, y va FLOJA:
         a 4,0 la silueta cuaja en un segundo y lo que se ve es un pelotón
         cuadrándose. Con 1,3 y un `entra` largo, cada pez llega cuando
         llega y parece que se han encontrado. `formaCerca` es a cuántos
         largos de su sitio deja de apuntar a él y se alinea con el
         contorno. `formaBrillo` es cuánto emite de más el banco formado
         —más color, no otro tono, que daría un salto.

         ── Y QUE NO VAYAN COMO REMACHES ───────────────────────────
         Los tres siguientes a 0 dan una plantilla: los sesenta y ocho
         tirando a su casilla con la misma fuerza, el morro clavado en la
         tangente y todos cuadrándose y deshaciéndose en el mismo
         instante.

         `formaError` es cuánto se equivoca cada pez de puesto, en fracción
         del largo de la silueta, y va pequeño: a 0,055 son unos treinta
         píxeles de una silueta de quinientos —bastante para que ninguno
         esté donde «debería» y poco para que el contorno siga cerrando—.
         El error transversal va a la mitad del longitudinal, porque
         desdibuja el canto mucho más.

         `formaDesorden` abre pez a pez lo demás: la gana con la que tira a
         su sitio (±80 %, así que unos llegan en un tercio del tiempo que
         otros), el desvío del morro (±0,35 rad) y el umbral al que se
         apunta y se suelta (0 a 0,77 de campo). Ese último es el que quita
         los dos momentos más forzados: el banco formándose en bloque y la
         silueta desapareciendo de golpe.

         `formaCalma` es cuánto se le baja el nervio en formación. A 0,70
         queda un 30 % de tirón y de desvío y la silueta tiembla; apagado
         del todo, los peces quedan clavados. */
      formaPega: 1.3, formaCerca: 0.20, formaBrillo: 1.1,
      formaError: 0.055, formaDesorden: 0.7, formaCalma: 0.70,

      /* DESORDEN POR CIZALLA: abre la velocidad de crucero y los pesos de
         grupo pez a pez, así que unos adelantan a otros. Sin esto todos
         nadan a la misma velocidad exacta, el banco se traslada como un
         sólido y la forma que tiene se queda congelada. El susto no se
         escala: el pánico es igual para todos. */
      desorden: 0.28,

      /* ÁGILES: viran rápido, cambian de idea a menudo y el tirón del
         nervio pesa. Un banco de peces lentos es una procesión. */
      vel: 0.66, velCebada: 0.92, velSusto: 3.4,
      vira: [2.0, 3.8],           // rad/s: vira rápido y corrige a menudo
      rumbo: [0.6, 2.0],          // cambia de idea cada poco
      /* NERVIO: tirones cortos por encima del crucero, con un desvío de
         rumbo en el mismo instante. No va más lejos, va a sacudidas. */
      nervio: [0.5, 1.6],         // U/s de tirón, se suma al nado
      cadaNervio: [0.18, 0.75],   // cada cuánto le da
      desvio: 0.5,                // radianes que tuerce al dárselo
      aleteo: 17,
      trago: 0.42,                // lo que tarda en entrar por la boca
      huida: [0.6, 1.6], lag: [4, 12], fuerzaDedo: 6, borde: 1.0,
    },

  ],
};

/* ── REGISTRO DE ESPECIES ───────────────────────────────────────────
   Acuario.especie(nombre, def) donde def es:

     conteo(area, plano, p)    → cuántos en ese plano (0..2)
     siembra(M, p)             → opcional. Una vez por pecera, antes de
                   crear a nadie y para los tres planos a la vez: es donde
                   va lo que toda la población COMPARTE y `crear` no puede
                   decidir por su cuenta. Escribe en `p`, que es la
                   entrada de la escena.
     crear(M, L, p)            → el objeto; debe tener x, y
     actualiza(o, M, L, p, dt) → void
     dibuja(o, M, L, p, g)     → void, en el contexto del plano
     luz         → ilumina al plancton; necesita x, y, c y rLuz
     presa       → es comestible: entra en L.presas
     rompible    → se le puede romper el DIBUJO: un campo `tajo` encima y
                   el motor lo pinta cortado en bandas (ver pintaBicho).
                   Sin la bandera, ni se le consulta.
     cardumen    → se agrupa: entra en L.cardumen y los suyos se miran
                   entre ellos sin saber de qué especie son; necesita
                   x, y y ang. Dos especies que lo pidan hacen banco mixto.
     escalaCalidad → su población se puede recortar al degradar
     aligera(o)  → simplificar un objeto al degradar. Se aplica también a
                   los que nazcan después (ver puebla).
     campos(o, M, L, p) → opcional. Empujar campos a M.campos, como un
                   evento. Se llama para los tres planos ANTES de que se
                   actualice nadie, que es la única forma de que un campo
                   puesto por un bicho de delante lo lea uno del fondo.
                   Aquí no se dibuja ni se mueve nada.

   Un objeto puede ponerse `o.alFrente = true` en su actualiza(): ese
   fotograma se pinta el último y en el plano de delante.

   M es la escena viva: M.W M.H M.U M.t M.paleta M.raro y los métodos
   M.color() M.empuje(x,y,banda) M.borde(x,y) M.flujoX(y,t) M.flujoY(x,t)
   M.envuelve(o,inset) M.salto(x,y,inset) M.campo(tipo,x,y,plano)
   M.halo(color) M.punto(color), más las utilidades M.rgba M.clamp M.rnd
   M.rango M.rangoE M.elige M.mezcla M.suave M.opt M.TAU.
   L es el plano. p son los parámetros de la escena para esa especie. */
const ESPECIES = {};
function especie(nombre, def){ ESPECIES[nombre] = def; }

/* Los parámetros de una entrada de escena, sea de bicho o de evento:
   van en la propia entrada, o en un `params: {...}`. */
const paramsDe = conf => conf.params || conf;

/* ── REGISTRO DE EVENTOS ────────────────────────────────────────────
   Acuario.evento(nombre, def). Un evento no es una población: es algo
   que le pasa a la escena entera cada tanto. def es:

     exclusivo     → no admite otro exclusivo a la vez
     cada, primero → [a,b] segundos. La escena los puede pisar.
     arranca(M, p, x, y)    → el estado. x,y sólo si lo disparó un contacto.
     prueba        → valores por defecto para lanzarlo desde el panel
                     aunque la escena no lo configure.
     actualiza(e, M, p, dt) → false cuando ha terminado. Aquí es donde
                     empuja campos y modulación.
     dibuja(e, M, p, g)     → opcional. Muchos de los buenos NO dibujan.

   Actúa por dos vías, y ninguna obliga a las especies a saber que existe:
     · CAMPOS → M.campos.push({tipo, x, y, r, ri?, ky?, rot?, plano?,
                fuerza, filo?, c?, d?}) y el bicho pregunta M.campo(...).
                Un bicho también puede empujarlos —el rape tapa y asusta
                con ellos—, pero entonces tiene que actualizarse ANTES que
                quien lo lea: los campos se vacían al empezar cada
                fotograma.
     · MODULACIÓN → M.mod.agua / .ritmo, que el motor aplica al pintar.

   Para LEER la escena un evento no recibe `L`: tiene M.luces(plano) y
   M.cardumen(plano) —ésta, sin argumento, da los tres planos juntos—.
   Con la primera puede existir un evento que no emita nada y se vea sólo
   cuando algo lo alumbra, como la carroña; con la segunda, uno que se
   forme donde el banco ya estaba, sin preguntar de qué especie es. */
const EVENTOS = {};
function evento(nombre, def){ def.nombre = nombre; EVENTOS[nombre] = def; }

/* ══════════════════════════════════════════════════════════════════
   ESTADO
   ══════════════════════════════════════════════════════════════════ */
let cv, ctx;
let W=0, H=0, dpr=1, U=1, tiempo=0;
let agua=null, ruido=null;
let KY=0, KX=0, AMP=0;
/* Arrancan desde ABISMO y sólo los baja degradar(): recortar sin tocar la
   configuración, que es la que dice qué se pedía. */
let calidad=1, degradado=false;
let conDither = ABISMO.dither !== false, topeOndas = ABISMO.dedo.tope;
let topeNiveles=99;
let calentando=0, lento=0, ema=16.7, ultimo=0;
let anchoPrev=0, altoPrev=0, tempRedim=null, corriendo=false;
/* los grupos son el reloj de cada evento; evVivos, los que están en
   marcha. `campos` y `MOD` se rehacen enteros cada fotograma, así que un
   evento que termina no deja rastro que limpiar. */
let evGrupos = [], evVivos = [];
const campos = [];
const MOD = {agua:1, ritmo:1};
function reiniciaMod(){ MOD.agua = 1; MOD.ritmo = 1; }
/* los que piden frente este fotograma, cada uno con su grupo y su plano */
const frente = [];

/* LOS PLANOS VIVOS. `ABISMO.planos` es lo que la escena PIDE; esto es lo
   que el plano ES mientras corre. Los objetos se reutilizan entre setup()
   y setup(): recalcular sin repoblar no tira población. */
const PLANOS = [];

const flujoX = (y,t) => Math.sin(y*KY + t*ABISMO.corriente.vel) * AMP;
const flujoY = (x,t) => Math.cos(x*KX - t*ABISMO.corriente.vel*0.8) * AMP*0.5;

/* ── RECURSOS CACHEADOS ─────────────────────────────────────────────
   El degradado del agua vive en una tira de 4 px de ancho a la altura
   real del lienzo: no se interpola en vertical y pintarlo es un
   drawImage. Se construye en setup() y no cambia. */
function buildAgua(){
  const A = ABISMO.agua;
  const h = Math.min(2048, Math.max(2, Math.round(H*dpr)));
  agua = agua || document.createElement('canvas');
  agua.width = 4; agua.height = h;
  const g = agua.getContext('2d');
  const gr = g.createLinearGradient(0,0,0,h);
  for (let s=0;s<A.pos.length;s++){
    const c = A.tono[s];
    gr.addColorStop(A.pos[s], 'rgb('+c[0]+','+c[1]+','+c[2]+')');
  }
  g.fillStyle = gr; g.fillRect(0,0,4,h);
}

/* Un degradado tan oscuro bandea. Ruido de 0-4 niveles, a resolución
   nativa y en 'lighter', lo rompe sin verse. La baldosa es UNA pero se
   coloca en otro sitio cada fotograma: clavada se lee como suciedad. */
const RUIDO = 128;                  // lado de la baldosa de ruido
function buildRuido(){
  const s = RUIDO, c = document.createElement('canvas');
  c.width = s; c.height = s;
  const g = c.getContext('2d');
  const img = g.createImageData(s,s), d = img.data;
  for (let i=0;i<d.length;i+=4){
    d[i] = d[i+1] = d[i+2] = 255;
    d[i+3] = (Math.random()*5)|0;
  }
  g.putImageData(img,0,0);
  ruido = ctx.createPattern(c,'repeat');
}

/* ── LA ONDULACIÓN DEL AGUA ─────────────────────────────────────────
   Las manchas se guardan en fracciones de pantalla, así que sobreviven a
   un redimensionado sin volver a sortearse: re-sortearlas haría que la
   escena cambiara de color al esconderse la barra de URL del móvil. */
const MANCHAS = [];
let ondCv = null, ondG = null;

/* Aquí se decide si el lienzo PUEDE existir —cuántas manchas y de qué
   tamaño— y no si se va a usar: eso lo dice `fuerza`, que se lee cada
   fotograma en pintaOndulacion(). Mirarla aquí también hacía que bajarla a
   0 y recalcular tirase el lienzo para siempre. */
function buildOndulacion(){
  const O = ABISMO.agua.ondulacion;
  if (!O || !(O.manchas > 0)){ ondCv = null; return; }
  if (!MANCHAS.length)
    for (let i=0;i<O.manchas;i++)
      MANCHAS.push({
        c: O.tonos[i % O.tonos.length],
        /* cada mancha con su recorrido: dos senos lentos y desfasados */
        cx: rnd(0.15,0.85), cy: rnd(0.12,0.88),
        ax: rnd(0.16,0.40), ay: rnd(0.10,0.32),
        fx: rnd(0.55,1.35),  fy: rnd(0.45,1.20),
        px: Math.random()*TAU, py: Math.random()*TAU,
        r:  rango(O.radio), a: rnd(0.62, 1.0),
      });
  const w = Math.max(2, Math.round(W*dpr/Math.max(1, O.div)));
  const h = Math.max(2, Math.round(H*dpr/Math.max(1, O.div)));
  ondCv = ondCv || document.createElement('canvas');
  ondCv.width = w; ondCv.height = h;
  ondG = ondCv.getContext('2d');
  ondG.imageSmoothingEnabled = true;
}

function pintaOndulacion(){
  if (!ondCv) return;
  const O = ABISMO.agua.ondulacion;
  /* a 0 no se pinta nada: dibujar las manchas para componerlas con alfa
     0 son cuatro degradados radiales por fotograma tirados */
  if (!(O.fuerza > 0)) return;
  const w = ondCv.width, h = ondCv.height;
  const diag = Math.hypot(w, h), t = tiempo*O.vel;
  ondG.setTransform(1,0,0,1,0,0);
  ondG.globalCompositeOperation = 'source-over';
  ondG.clearRect(0,0,w,h);
  ondG.globalCompositeOperation = 'lighter';
  for (const m of MANCHAS){
    const x = (m.cx + Math.sin(t*m.fx + m.px)*m.ax) * w;
    const y = (m.cy + Math.cos(t*m.fy + m.py)*m.ay) * h;
    const R = m.r*diag;
    const gr = ondG.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0.00, rgba(m.c, 0.55*m.a));
    gr.addColorStop(0.45, rgba(m.c, 0.16*m.a));
    gr.addColorStop(1.00, rgba(m.c, 0));
    ondG.fillStyle = gr;
    ondG.fillRect(x-R, y-R, R*2, R*2);
  }
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.min(1, O.fuerza);
  ctx.drawImage(ondCv, 0, 0, W, H);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/* ── LA DISPERSIÓN ──────────────────────────────────────────────────
   La pirámide de lienzos, del más grande al más pequeño. Son búferes:
   se rehacen al redimensionar, no por fotograma.                    */
const NIVELES = [];

/* El TAMAÑO de la pirámide, no si se usa: ver la nota de
   buildOndulacion(), que tenía el mismo enganche con `fuerza`. */
function buildDispersion(){
  NIVELES.length = 0;
  const D = ABISMO.dispersion;
  if (!D) return;
  const n = Math.min(D.niveles|0, topeNiveles);
  if (n < 2) return;
  let w = Math.round(W*dpr/Math.max(1, D.div));
  let h = Math.round(H*dpr/Math.max(1, D.div));
  for (let i=0;i<n;i++){
    if (w < 2 || h < 2) break;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = true;    // es el desenfoque: sin esto no hay nada
    NIVELES.push({cv:c, g, w, h});
    w = w >> 1; h = h >> 1;
  }
  /* Hacen falta dos como mínimo: el primero es la fuente y se vacía, así
     que con uno solo no queda velo que devolver. */
  if (NIVELES.length < 2) NIVELES.length = 0;
}

/* Un halo pre-dibujado por color, cacheado en la propia entrada de
   paleta: un degradado radial por mota y fotograma sería el coste
   dominante. A demanda, para que una paleta que aparezca después —de un
   evento, del panel— también tenga halo. */
const LHALO = 64;
function halo(c){
  if (c.halo) return c.halo;
  const lienzo = document.createElement('canvas');
  lienzo.width = LHALO; lienzo.height = LHALO;
  const g = lienzo.getContext('2d');
  const r = LHALO/2;
  const gr = g.createRadialGradient(r,r,0, r,r,r);
  gr.addColorStop(0.00, rgba(c.mid, 1));
  gr.addColorStop(0.22, rgba(c.mid, 0.40));
  gr.addColorStop(0.55, rgba(c.mid, 0.09));
  gr.addColorStop(1.00, rgba(c.mid, 0));
  g.fillStyle = gr; g.fillRect(0,0,LHALO,LHALO);
  return (c.halo = lienzo);
}

/* EL PUNTO DE LUZ, hermano del halo y con el mismo cacheo. Un `arc()`
   con relleno plano es un disco de canto duro, y sumado al halo y al velo
   lo que sale es BOKEH. El perfil va de `mid` en el centro a `glow` en el
   canto: la misma atenuación que hace el agua, a escala de un píxel.

   Y NO LLEVA `core`: nada iluminado sale más blanco que lo que lo
   ilumina. El núcleo se lo pone quien brille por su cuenta. */
const LPUNTO = 48;
function punto(c){
  if (c.punto) return c.punto;
  const lienzo = document.createElement('canvas');
  lienzo.width = LPUNTO; lienzo.height = LPUNTO;
  const g = lienzo.getContext('2d');
  const r = LPUNTO/2;
  const gr = g.createRadialGradient(r,r,0, r,r,r);
  gr.addColorStop(0.00, rgba(c.mid, 1));
  gr.addColorStop(0.20, rgba(c.mid, 0.70));
  gr.addColorStop(0.46, rgba(c.glow, 0.30));
  gr.addColorStop(1.00, rgba(c.glow, 0));
  g.fillStyle = gr; g.fillRect(0,0,LPUNTO,LPUNTO);
  return (c.punto = lienzo);
}

/* ══════════════════════════════════════════════════════════════════
   EL DEDO
   Sólo contacto, nunca hover. Cada contacto suelta una onda que se
   expande y se frena, con el color del agua y no el de un organismo. Lo
   que la onda alcanza se enciende y se aparta, así que la reacción va
   detrás del gesto en vez de pegada al dedo.
   ══════════════════════════════════════════════════════════════════ */
const contactos = [];
/* por pointerId: con dos dedos, una sola variable hace que cada uno lea
   la posición del otro */
const ultimos = new Map();
const CRESTAS = [1, 0.38, 0.14];
const NSTOP = 40;

const ondaR = k => k.rmax * (1 - Math.pow(1 - Math.min(1, k.t/k.vida), k.cre));
const ondaA = k => { const u = Math.min(1, k.t/k.vida);
                     return Math.pow(1-u, k.apa) * Math.min(1, u*14) * k.amp; };

function impulso(x, y){
  /* al desbordar se tira la onda menos visible, no la más vieja: en un
     barrido rápido todas son jóvenes y quitar la primera se ve */
  if (contactos.length >= topeOndas){
    let peor = 0, va = Infinity;
    for (let i=0;i<contactos.length;i++){
      const v = ondaA(contactos[i]);
      if (v < va){ va = v; peor = i; }
    }
    contactos.splice(peor, 1);
  }
  const D = ABISMO.dedo, p = M.color();
  contactos.push({
    x, y, t: 0,
    c:    mezcla(D.color, p.mid, rango(D.tinte)),
    rmax: U*D.alcance * rnd(0.80, 1.22),
    vida: D.vida      * rnd(0.82, 1.22),
    lam:  U*D.alcance*0.26 * rnd(0.84, 1.20),
    cre:  rnd(1.70, 2.20),            // cómo crece: cuánto frena
    apa:  rnd(1.45, 1.95),            // cómo se apaga
    amp:  rnd(0.80, 1.18),
    cola: rnd(0.60, 1.25),            // peso de las crestas traseras
    ovalo:rnd(0.84, 1.16),
    giro: Math.random()*TAU,
  });
  contactoEventos(x, y);
}

function dibujaOndas(g){
  const br = ABISMO.dedo.brillo;
  for (const k of contactos){
    const r = ondaR(k), a = ondaA(k);
    if (a < 0.005 || r < 2) continue;
    const R = k.rmax, sig = k.lam*0.36;
    /* los stops se concentran en la banda donde hay onda: repartidos por
       todo el radio, cada cresta queda descrita por cuatro puntos y la
       recta entre ellos se ve facetada */
    const lo = Math.max(0, r - 2*k.lam - 3*sig), hi = Math.min(R, r + 3*sig);
    const gr = g.createRadialGradient(k.x, k.y, 0, k.x, k.y, R);
    gr.addColorStop(0, rgba(k.c, 0));
    for (let i=0;i<=NSTOP;i++){
      const rs = lo + (hi-lo)*i/NSTOP;      // radio de este stop
      let v = 0;
      for (let q=0;q<CRESTAS.length;q++){
        const rq = r - q*k.lam;
        if (rq <= 0) break;
        const d = (rs - rq)/sig;
        v += Math.exp(-d*d) * (q ? CRESTAS[q]*k.cola : 1);
      }
      gr.addColorStop(clamp(rs/R, 0.0001, 0.9999),
                      rgba(k.c, +Math.min(1, v*a*br).toFixed(4)));
    }
    gr.addColorStop(1, rgba(k.c, 0));
    /* una pizca de elipse girada: el círculo exacto delata la plantilla
       por muy suave que sea el degradado */
    g.save();
    g.translate(k.x, k.y); g.rotate(k.giro); g.scale(1, k.ovalo);
    g.translate(-k.x, -k.y);
    g.fillStyle = gr;
    g.fillRect(k.x-R, k.y-R, R*2, R*2);
    g.restore();
  }
}

/* ── BORDES ─────────────────────────────────────────────────────────
   Empuje hacia dentro cerca del canto. Fuera del lienzo se satura en vez
   de crecer sin fin, o un bicho que se escapara por un empujón del dedo
   volvería disparado. Array compartido: consúmelo ya. */
const _bor = [0,0,0];
function borde(x, y){
  const m = ABISMO.borde.margen * Math.min(W, H), k = ABISMO.borde.fuerza * U;
  let fx = 0, fy = 0;
  if (x < m)        fx =  1 - x/m;
  else if (x > W-m) fx = -(1 - (W-x)/m);
  if (y < m)        fy =  1 - y/m;
  else if (y > H-m) fy = -(1 - (H-y)/m);
  fx = clamp(fx, -1.8, 1.8); fy = clamp(fy, -1.8, 1.8);
  _bor[0] = fx*k; _bor[1] = fy*k;
  /* el tercero es la intensidad sin escalar y saturada a 1: sirve para
     decidir cuánto caso hacerle sin conocer la fuerza de la escena */
  _bor[2] = Math.min(1, Math.hypot(fx, fy));
  return _bor;
}

/* Cuánto empuja el frente de las ondas a un punto: [ox, oy, peso], la
   suma de las direcciones unitarias de cada onda que lo alcanza,
   ponderada por lo cerca que está del frente. NO viene normalizado.
   `banda` es el grosor del frente; omitido, cada onda usa el suyo. */
const _emp = [0,0,0];
function empuje(x, y, banda){
  let ox=0, oy=0, w=0;
  for (let i=0;i<contactos.length;i++){
    const k = contactos[i], rr = ondaR(k);
    const b = banda > 0 ? banda : k.lam*0.9;
    const dx = x-k.x, dy = y-k.y, d2 = dx*dx+dy*dy;
    const hi = rr+b, lo = rr-b;
    if (d2 > hi*hi || (lo > 0 && d2 < lo*lo)) continue;
    const dist = Math.sqrt(d2) || 1;
    const peso = 1 - Math.abs(dist - rr)/b;
    ox += dx/dist*peso; oy += dy/dist*peso; w += peso;
  }
  _emp[0]=ox; _emp[1]=oy; _emp[2]=w;
  return _emp;
}

function puntoCanvas(e){
  const b = cv.getBoundingClientRect();
  return [e.clientX - b.left, e.clientY - b.top];
}
function cableaTacto(){
  cv.addEventListener('pointerdown', e => {
    const [x,y] = puntoCanvas(e);
    ultimos.set(e.pointerId, [x,y]);
    impulso(x,y);
  }, {passive:true});
  cv.addEventListener('pointermove', e => {
    const u = ultimos.get(e.pointerId);
    if (!u) return;                   // pasar por encima no cuenta
    const [x,y] = puntoCanvas(e);
    /* por distancia recorrida, no por tiempo: un barrido rápido deja ondas
       espaciadas, no cientos amontonadas */
    if (Math.hypot(x-u[0], y-u[1]) < U*ABISMO.dedo.paso) return;
    u[0] = x; u[1] = y;
    impulso(x,y);
  }, {passive:true});
  for (const ev of ['pointerup','pointercancel','pointerleave'])
    cv.addEventListener(ev, e => ultimos.delete(e.pointerId), {passive:true});
}

/* ══════════════════════════════════════════════════════════════════
   API PÚBLICA
   ══════════════════════════════════════════════════════════════════ */

/* ── CONTENCIÓN ─────────────────────────────────────────────────────
   La pecera es una caja con cristal: nada sale por los cantos. Deja el
   SALTO [dx,dy] que hay que darle a (x,y) para meterlo dentro, y el
   sentido hacia dentro [cx,cy] de la pared tocada. Va aparte de
   envuelve() porque hay bichos hechos de varios puntos —el rape arrastra
   su esca, la medusa su nube— y todos tienen que saltar igual.

   `inset` es a qué distancia del canto está el cristal. */
const _sal = [0,0,0,0];
function salto(x, y, inset){
  _sal[0] = _sal[1] = _sal[2] = _sal[3] = 0;
  const d = inset > 0 ? inset : U*0.5;
  if      (x < d)   { _sal[0] = d - x;     _sal[2] =  1; }
  else if (x > W-d) { _sal[0] = W - d - x; _sal[2] = -1; }
  if      (y < d)   { _sal[1] = d - y;     _sal[3] =  1; }
  else if (y > H-d) { _sal[1] = H - d - y; _sal[3] = -1; }
  return _sal;
}
/* pared tocada por envuelve(), compartido igual que _bor y _emp */
const _enc = [0,0];
/* campo que más pesa en un punto. Compartido: consúmelo en el acto. */
const _cam = {peso:0, c:null, d:null, x:0, y:0};
/* para M.luces de un plano que no existe: devolver null obligaría a cada
   consumidor a comprobarlo antes de recorrerlo */
const VACIO = [];

const M = {
  get W(){ return W; }, get H(){ return H; },
  get U(){ return U; }, get t(){ return tiempo; },
  get paleta(){ return ABISMO.paleta; },
  get raro(){ return ABISMO.raro; },
  empuje, borde, flujoX, flujoY, halo, punto,
  /* Un color respetando pesos. Úsalo en vez de elige(M.paleta) o los
     pesos no cuentan. La suma se cachea en el propio array. */
  color(pal){
    const p = pal || ABISMO.paleta;
    if (p.suma === undefined) p.suma = sumaPesos(p);
    return eligeColor(p, p.suma);
  },
  rgba, clamp, rnd, rango, rangoE, elige, mezcla, suave, opt, TAU,
  /* ── LOS FOCOS DE UN PLANO ────────────────────────────────────────
     La MISMA lista que las especies reciben en `L.luces`, no una copia:
     se lee y no se toca. Está aquí porque un evento no recibe `L`, y sin
     ella no puede existir un evento que se vea SÓLO cuando algo lo
     alumbra.

     En un `dibuja` de evento la lista es la de este fotograma, porque los
     eventos se pintan después de los bichos; en un `actualiza` es la del
     anterior, que a la velocidad a la que se mueve esto da igual. */
  luces(plano){ const L = PLANOS[plano|0]; return L ? L.luces : VACIO; },
  /* y quién hace banco, por lo mismo: el superpez necesita saber dónde
     está el banco y hacia dónde iba para formarse ahí.

     SIN `plano`, los tres planos juntos, y ésa es la forma de usarlo casi
     siempre: el banco vive repartido en los tres y un campo puesto en el
     plano de delante lo leen también los de atrás —la guarda sólo excluye
     a quien pregunta desde más cerca—, así que quien quiera saber «dónde
     está el banco» tiene que mirarlo entero. Contando sólo el plano de
     delante, el superpez veía 29 candidatos de los 68 que se le apuntaban
     y nunca llegaba a partirse en dos.

     Devuelve un array NUEVO en ese caso: pídelo al arrancar un evento, no
     por fotograma. */
  cardumen(plano){
    if (plano === undefined){
      const t = [];
      for (const L of PLANOS) for (const o of L.cardumen) t.push(o);
      return t;
    }
    const L = PLANOS[plano|0];
    return L ? L.cardumen : VACIO;
  },
  /* lo que los eventos empujan y los bichos consultan */
  campos, get mod(){ return MOD; }, get ritmo(){ return MOD.ritmo; },
  /* El campo de ese `tipo` que más pesa sobre (x,y), con el peso en .peso y
     su color en .c, o null. El bicho no sabe qué lo puso.

     `ri` convierte el disco en anillo, `ky` lo achata, `rot` lo gira y
     `filo` define el canto. `plano` es la guarda de profundidad: con él,
     sólo actúa sobre quien pregunta desde ese plano o desde uno más
     lejano; sin él, sobre todos —un evento sin cuerpo no tiene
     profundidad. `c` y `d` viajan sin que el motor los mire: el color, y
     un dato cualquiera del que lo puso. */
  campo(tipo, x, y, plano){
    let vm = 0, mejor = null;
    for (let i=0;i<campos.length;i++){
      const c = campos[i];
      if (c.tipo !== tipo) continue;
      if (plano !== undefined && c.plano !== undefined && c.plano < plano)
        continue;
      let dx = x - c.x, dy = y - c.y;
      /* ── EL DESCARTE BARATO, Y ES LA MITAD DEL MOTOR ────────────
         Este bucle se recorre una vez por bicho, por tipo consultado y
         por campo vivo: con el evento `cuerpo` en marcha son unas 315.000
         pasadas por fotograma. Con el seno, el coseno y la raíz dentro
         costaba 4,9 ms de un fotograma de 16,7; con el descarte, 1,6.

         Es EXACTO y no una aproximación: la elipse cabe siempre dentro
         del círculo de radio r·max(1,ky), girarla no la mueve de ahí, y
         u ≤ 0 equivale a d ≥ r. Lo que el descarte tira es lo mismo que
         tiraría el `continue` de abajo. */
      const ky = c.ky || 1;
      const rmax = ky > 1 ? c.r*ky : c.r;
      if (dx*dx + dy*dy > rmax*rmax) continue;
      if (c.rot){
        const cr = Math.cos(c.rot), sr = Math.sin(c.rot);
        const t = dx*cr + dy*sr;
        dy = dy*cr - dx*sr; dx = t;
      }
      dy /= ky;
      const d = Math.sqrt(dx*dx + dy*dy);
      let u;
      if (c.ri > 0){
        const m = (c.r + c.ri)/2, w = (c.r - c.ri)/2 || 1;
        u = 1 - Math.abs(d - m)/w;
      } else u = 1 - d/c.r;
      if (u <= 0) continue;
      const v = c.fuerza * Math.pow(u, 1/(c.filo || 1));
      if (v > vm){ vm = v; mejor = c; }
    }
    if (!mejor) return null;
    _cam.peso = vm > 1 ? 1 : vm; _cam.c = mejor.c || null;
    /* `d` es un dato libre del campo y el motor lo pasa tal cual: lo que
       quien lo pone necesite contar y no quepa en un peso y un centro,
       como el tamaño y el ángulo de una forma. */
    _cam.d = mejor.d || null;
    /* el centro, que un campo de empuje necesita para dar dirección */
    _cam.x = mejor.x; _cam.y = mejor.y;
    return _cam;
  },
  /* Mete al bicho dentro del cristal y le invierte la velocidad contra esa
     pared —invertida y no a cero, o se queda pegado mientras la corriente
     lo aprieta—. Devuelve [cx, cy] con el sentido HACIA DENTRO, o 0: las
     especies que lo leen aprovechan para cambiar de rumbo, y así parece
     una decisión y no un rebote de billar. */
  envuelve(o, inset){
    const s = salto(o.x, o.y, inset);
    o.x += s[0]; o.y += s[1];
    const cx = s[2], cy = s[3];
    if (cx && o.vx !== undefined && cx*o.vx < 0) o.vx = -o.vx*0.45;
    if (cy && o.vy !== undefined && cy*o.vy < 0) o.vy = -o.vy*0.45;
    _enc[0] = cx; _enc[1] = cy;
    return _enc;
  },
  /* el mismo cálculo sin mover nada, para los bichos hechos de varias
     piezas: rape y medusa lo reparten ellos */
  salto,
};

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
  const area = W*H;

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
      const q = Math.round(n * (def.escalaCalidad ? calidad : 1));
      const gr = { def, p, items: [] };
      /* `calidad` recorta CUÁNTOS y `aligera` simplifica cada uno; las dos
         cosas hay que rehacerlas aquí, o repoblar después de degradar
         —redimensionado grande, botón del panel— le devuelve el detalle
         completo a la máquina que ya demostró que no podía con él. */
      const flojea = degradado && def.aligera;
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
  const px = W*H*d*d;
  if (px > ABISMO.maxPx) d = Math.max(0.7, d*Math.sqrt(ABISMO.maxPx/px));
  return d;
}

/* Un solo escalón, y no se vuelve atrás: subir y bajar la calidad según
   el tiempo de fotograma oscila y se ve peor que ir lento. Se recorta la
   población viva en vez de repoblar, que daría un salto visible. El velo
   se queda —es lo que hace que esto sea agua—: se le recortan niveles. */
function degradar(){
  degradado = true;
  calidad = 0.55;
  conDither = false;
  topeOndas = Math.max(1, Math.round(topeOndas*0.5));
  if (topeNiveles > 2){ topeNiveles = 2; buildDispersion(); }
  for (const L of PLANOS)
    for (const gr of L.grupos){
      if (gr.def.escalaCalidad) gr.items.length = Math.round(gr.items.length*calidad);
      if (gr.def.aligera) for (const o of gr.items) gr.def.aligera(o);
    }
}

/* ══════════════════════════════════════════════════════════════════
   SETUP Y BUCLE
   ══════════════════════════════════════════════════════════════════ */
function setup(repoblar){
  W = Math.max(1, cv.clientWidth);
  H = Math.max(1, cv.clientHeight);
  anchoPrev = W; altoPrev = H;
  dpr = calcDpr();
  cv.width  = Math.round(W*dpr);
  cv.height = Math.round(H*dpr);
  U = Math.sqrt(W*H)/ABISMO.escala;

  const C = ABISMO.corriente;
  KY  = Math.PI/H * C.ondaY;
  KX  = Math.PI/W * C.ondaX;
  AMP = U*C.amplitud;

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
    const r = dpr/L.resDiv;
    L.cv.width  = Math.max(1, Math.round(W*r));
    L.cv.height = Math.max(1, Math.round(H*r));
    L.g = L.cv.getContext('2d');
    L.r = r;
  }

  buildAgua();
  if (!ruido) buildRuido();
  buildOndulacion();
  buildDispersion();

  if (repoblar) puebla();
}

/* ── VIGILANCIA DEL FOTOGRAMA ───────────────────────────────────────
   La media móvil del tiempo de fotograma decide si degradar. Los primeros
   son lentos por el JIT y el primer pintado, y uno de más de 200 ms es
   una pausa del navegador: ni unos ni otros entran. */
function vigila(ms){
  if (calentando < 60){ calentando++; return; }
  if (degradado || ms >= 200) return;
  ema += (ms - ema)*0.05;
  lento = ema > 20 ? lento+1 : Math.max(0, lento-2);
  if (lento > 90) degradar();
}

function envejeceOndas(dt){
  for (let i=contactos.length-1;i>=0;i--){
    const k = contactos[i];
    k.t += dt;
    if (k.t > k.vida) contactos.splice(i,1);
  }
}

/* ── LAS SOMBRAS EN EL AGUA ─────────────────────────────────────────
   Un campo `apaga` calla a los bichos; esto es la otra mitad, y le quita
   al AGUA su luz. Hace falta porque en aditivo un cuerpo oscuro no se
   puede pintar encima de los planos —sumar nunca oscurece— y el ÚNICO
   sitio de la tubería donde sí se puede quitar luz es aquí: sobre el
   agua, antes de que se sumen los planos. Sin esto, un cuerpo enorme al
   fondo se lee sólo por las motas que faltan en el plano 0, que es el más
   tenue de los tres, mientras los otros dos siguen brillando sobre el
   hueco.

   El agua es lo más lejano que hay, así que aquí NO se mira la guarda de
   `plano`: todo campo `apaga` la tapa. La elipse es la misma que resuelve
   M.campo —semieje `r` en x y `r*ky` en y, girada `rot`—, así que la
   sombra y el silencio son la misma forma. */
function pintaSombras(){
  const S = ABISMO.agua.sombra;
  if (!S || !(S.fuerza > 0) || !campos.length) return;
  for (let i=0;i<campos.length;i++){
    const c = campos[i];
    if (c.tipo !== 'apaga') continue;
    const a = Math.min(1, c.fuerza * S.fuerza);
    if (a < 0.01 || !(c.r > 0)) continue;
    const R = c.r;
    ctx.save();
    ctx.translate(c.x, c.y);
    if (c.rot) ctx.rotate(c.rot);
    ctx.scale(1, c.ky || 1);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    gr.addColorStop(0, 'rgba(0,0,0,'+a.toFixed(3)+')');
    gr.addColorStop(S.nucleo, 'rgba(0,0,0,'+(a*0.82).toFixed(3)+')');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(-R, -R, R*2, R*2);
    ctx.restore();
  }
}

function pintaAgua(){
  ctx.drawImage(agua, 0, 0, W, H);
  /* la ondulación va DENTRO del agua: antes de la modulación, así que un
     evento que oscurezca el agua también se la lleva */
  pintaOndulacion();
  /* y las sombras, encima de la ondulación: lo que tapa un cuerpo es el
     agua Y su color, no sólo la tira de base */
  pintaSombras();
  if (MOD.agua < 0.999){
    ctx.fillStyle = 'rgba(0,0,0,'+(1-MOD.agua).toFixed(3)+')';
    ctx.fillRect(0, 0, W, H);
  } else if (MOD.agua > 1.001){
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, MOD.agua - 1);
    ctx.drawImage(agua, 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

/* Cada plano en su propio lienzo y en aditivo: primero la población,
   después los eventos que dibujen, y las ondas del dedo al final. */
/* ── EL TAJO: PINTAR UN BICHO MAL ───────────────────────────────────
   Todo dibujo de bicho pasa por aquí. Un campo `tajo` NO lo lee ninguna
   especie: lo lee el motor justo antes de pintarla y lo que hace es
   pintarla ROTA. Es el mismo principio que `alFrente` —el dibujo de un
   objeto lo coloca el motor, no el objeto— y es el único sitio donde se
   puede corromper un sprite sin que la especie sepa que existe.

   La rotura son BANDAS HORIZONTALES, cada una corrida lo suyo: el bicho
   se dibuja `d.bandas` veces, cada vez con el recorte de una banda y con
   su propio desplazamiento. Las bandas miden `d.paso` píxeles de escena,
   así que a un bicho grande le tocan varias y a una mota una sola —y
   entonces lo que le pasa es que aparece desplazada, que también vale.

   La primera banda y la última se van a infinito, de modo que la escalera
   cubre al bicho entero pase lo que pase: sin eso, lo que quedara por
   encima o por debajo de la pila no se dibujaría.

   NADA DE ESTO SE SORTEA: el signo, la altura de los cortes, el salto de
   cada banda y el selector salen de la POSICIÓN del bicho. Tienen que ser
   estables entre fotogramas —un tajo que salta cada fotograma es ruido y
   no una rotura— y el motor no puede guardar nada en el objeto de una
   especie que no conoce. Con senos de periodo largo los cortes además se
   arrastran despacio mientras el bicho nada.

   Lo único que viene de fuera es `d.giro`, una fase que el que pone el
   campo va avanzando: sumada al seno de la banda recoloca a TODAS un poco
   y cada una lo suyo. Es lo que permite que la rotura dé pasos sin que el
   motor guarde nada y sin sortear el patrón de cero, que sería un salto. */
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
    const a = i === 0     ? -H : y0 + (i-1)*paso;
    const b = i === n-1   ? H*2 : y0 + i*paso;
    g.rect(-W, a, W*3, b - a);
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
   pinta en él —población, los que piden frente, eventos y ondas—, así que
   ninguno hereda el estado en que lo dejó el anterior: el `globalAlpha`
   que se olvide un evento no puede apagarle las ondas al siguiente. */
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
    g.clearRect(0,0,W,H);
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
      for (const o of gr.items)
        if (o.alFrente) frente.push({gr, L, o});   // se pinta luego, delante
        else            pintaBicho(def, o, M, L, p, g);
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

  /* las ondas van en el plano de delante: lo que se toca es la superficie,
     no el fondo. Se le reabre el contexto porque el último que pintó pudo
     ser un evento de otro plano, o de éste dejándose el alfa puesto. */
  dibujaOndas(abrePlano(PLANOS[PLANOS.length-1]));
}

/* ── EL VELO ────────────────────────────────────────────────────────
   La luz de los tres planos, dispersada por el agua. Se pinta con el
   transform del lienzo puesto, así que deja el contexto como estaba. */
function pintaDispersion(){
  if (NIVELES.length < 2) return;
  const D = ABISMO.dispersion;
  /* a 0 no se toca la pirámide: bajarla y volver a subirla son siete
     pasadas a pantalla completa para sumarla luego con alfa 0 */
  if (!(D.fuerza > 0)) return;
  const n0 = NIVELES[0], g0 = n0.g;

  /* 1 · LA LUZ, JUNTA Y YA REDUCIDA. Cada plano con su propia alfa, la
     misma con la que se compone: el fondo dispersa menos porque llega
     menos. El AGUA no entra: es un rectángulo ENTERO, y devolver su
     desenfoque levantaría los negros de toda la pieza. */
  g0.setTransform(1,0,0,1,0,0);
  g0.globalCompositeOperation = 'source-over';
  g0.globalAlpha = 1;
  g0.clearRect(0,0,n0.w,n0.h);
  g0.globalCompositeOperation = 'lighter';
  for (const L of PLANOS){
    g0.globalAlpha = L.alpha;
    g0.drawImage(L.cv, 0, 0, n0.w, n0.h);
  }
  g0.globalAlpha = 1;

  /* 2 · BAJAR. Reducir a la mitad con bilineal es promediar cuatro píxeles
     en uno: cada nivel es el anterior más desenfocado y con el doble de
     alcance, y la pirámide sale casi gratis. */
  for (let i=1;i<NIVELES.length;i++){
    const a = NIVELES[i-1], b = NIVELES[i];
    b.g.setTransform(1,0,0,1,0,0);
    b.g.globalCompositeOperation = 'source-over';
    b.g.globalAlpha = 1;
    b.g.clearRect(0,0,b.w,b.h);
    b.g.drawImage(a.cv, 0, 0, b.w, b.h);
  }

  /* 3 · Y SUBIR SUMANDO, con `caida` por escalón: el velo ancho es más
     tenue que el corto, que es lo que hace la luz en el agua.

     El primer nivel se VACÍA antes de recibir nada, y es la decisión que
     sostiene el efecto: lo que tiene dentro es la imagen nítida, y
     devolverla sería sumar la pieza encima de sí misma desenfocada. */
  g0.clearRect(0,0,n0.w,n0.h);
  for (let i=NIVELES.length-1;i>=1;i--){
    const a = NIVELES[i], b = NIVELES[i-1];
    b.g.setTransform(1,0,0,1,0,0);
    b.g.globalCompositeOperation = 'lighter';
    b.g.globalAlpha = D.caida;
    b.g.drawImage(a.cv, 0, 0, b.w, b.h);
    b.g.globalAlpha = 1;
  }

  /* 4 · encima de la escena. Por encima de 1 se pasa otra vez, en varias
     vueltas, porque `globalAlpha` no sube de 1. El tope de 3 pasadas es
     por si alguien escribe un 40: pasado el 2 ya está todo en blanco. */
  ctx.globalCompositeOperation = 'lighter';
  let resto = Math.min(3, D.fuerza);
  while (resto > 0.002){
    ctx.globalAlpha = Math.min(1, resto);
    ctx.drawImage(n0.cv, 0, 0, W, H);
    resto -= 1;
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/* Los planos sumados sobre el agua, y el remate: el velo y el grano. El
   grano va a resolución nativa —de ahí el transform a identidad— o el
   ruido se interpola y deja de romper el bandeado. */
function componePlanos(){
  ctx.globalCompositeOperation = 'lighter';
  for (const L of PLANOS){
    ctx.globalAlpha = L.alpha;
    ctx.drawImage(L.cv, 0, 0, W, H);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  /* el velo va DENTRO del agua: después de la luz y antes del grano */
  pintaDispersion();

  if (conDither){
    /* la baldosa donde toque este fotograma: el patrón se ancla al origen
       del contexto, así que mover el origen mueve el grano. En enteros y
       dentro de una baldosa —de fracción, el patrón se interpola. */
    const ox = (Math.random()*RUIDO)|0, oy = (Math.random()*RUIDO)|0;
    ctx.setTransform(1,0,0,1,ox,oy);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = ruido;
    ctx.fillRect(-ox, -oy, cv.width, cv.height);
    ctx.globalCompositeOperation = 'source-over';
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
  tiempo += dt;
  vigila(ms);
  envejeceOndas(dt);

  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  /* bilineal, no 'high': es más barato y desenfoca más, que es justo lo
     que se le pide al plano del fondo */
  ctx.imageSmoothingEnabled = true;

  pasoEventos(dt);
  pintaAgua();
  pasoPlanos(dt);
  componePlanos();
}

function alRedimensionar(){
  clearTimeout(tempRedim);
  tempRedim = setTimeout(() => {
    const w = Math.max(1, cv.clientWidth), h = Math.max(1, cv.clientHeight);
    if (w === anchoPrev && h === altoPrev) return;
    /* en móvil, esconder la barra de URL dispara un resize: hay que
       redimensionar igual, pero repoblar por eso sería tirar la escena a
       la vista del usuario */
    const antes = anchoPrev*altoPrev;
    setup(Math.abs(w*h - antes) > antes*0.15);
  }, 180);
}

/* ══════════════════════════════════════════════════════════════════
   ARRANQUE
   ══════════════════════════════════════════════════════════════════ */

/* Los espectros se convierten en paleta antes de poblar: de aquí para
   abajo nadie distingue un color escrito de uno generado. Una paleta a
   mano en la misma entrada gana, para anular un espectro sin borrarlo.

   CUALQUIER clave `espectroX` da su `paletaX`, porque puede haber bichos
   con más de un color. Y el valor puede ser UNA LISTA de espectros, que
   se concatenan con su `peso` cada uno: hay identidades que no caben en
   un solo arco de tono. */
function resuelveEspectros(conf){
  const p = paramsDe(conf);
  for (const k in p){
    if (k.indexOf('espectro') !== 0) continue;
    const destino = 'paleta' + k.slice(8);
    if (p[destino]) continue;
    const e = p[k];
    p[destino] = Array.isArray(e) ? [].concat(...e.map(generaPaleta))
                                  : generaPaleta(e);
  }
}

function arranca(){
  if (corriendo) return;
  corriendo = true;
  ABISMO.bichos.forEach(resuelveEspectros);
  ABISMO.eventos.forEach(resuelveEspectros);
  cv = document.getElementById('acuario') || document.querySelector('canvas');
  if (!cv){
    corriendo = false;
    throw new Error('Acuario: hace falta un <canvas id="acuario"> en la página');
  }
  ctx = cv.getContext('2d', {alpha:false});

  cableaTacto();
  addEventListener('resize', alRedimensionar);
  addEventListener('orientationchange', alRedimensionar);
  /* volver de otra pestaña no es ir lento */
  document.addEventListener('visibilitychange', () => {
    ultimo = performance.now();
    calentando = 0; lento = 0; ema = 16.7;
  });

  preparaEventos();
  setup(true);
  ultimo = performance.now();
  requestAnimationFrame(frame);
}

window.Acuario = { arranca, especie, evento, ESPECIES, EVENTOS, M,
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
})();
