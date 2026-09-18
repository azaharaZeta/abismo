import { M, evento } from '../motor.js';
const {rnd, rango, rangoE, opt, TAU} = M;

/* ── EL CUERPO ──────────────────────────────────────────────────────
   Un cuerpo humano bajando, y NO SE DIBUJA NADA: la silueta son campos
   `apaga`, igual que el leviatán, así que lo que cruza la pantalla es
   una región donde la nieve marina se calla y el agua se oscurece. Es la
   única forma de tener algo oscuro aquí —sumar no oscurece— y además es
   la buena: no se ve un cuerpo, se ve el HUECO de un cuerpo.

   LA POSTURA es la del ahogado —brazos arriba y hacia fuera, cabeza
   colgando, piernas juntas y algo dobladas—, que es como flota un cuerpo
   en el agua y lo que hace que se reconozca de perfil, de frente y
   girado: va volteando muy despacio.

   Va MÁS LENTO que la carroña y con menos volteo: tiene que tardar tanto
   en cruzar que dé tiempo a dudar de lo que se está viendo. Cuatro cosas
   lo hacen BLANDO, y sin ellas se reconoce el cuerpo pero no se cree:

     1 · NO HAY UNA ELIPSE POR HUESO. Se recorren dos perfiles —tronco
         (`CUERPO_PERFIL`) y cada miembro— dejando campos solapados con el
         grosor interpolado, y la unión es una manga continua. Con una
         elipse por pieza se ve LA PIEZA: se afila en sus dos puntas, así
         que cada junta deja un pellizco. Lo demás se apoya en esto.
     2 · EL ESPINAZO SE DOBLA (`arqueo`, `onda`), y la flexión se aplica
         CAMPO A CAMPO: así arrastra todo lo que cuelga del eje —miembros
         incluidos— sin partirlo.
     3 · LOS MIEMBROS CUELGAN DE SU HUECO y no giran sobre su centro. Con
         el centro por pivote un brazo es un aspa; con el hombro, un brazo
         suelto en el agua. Y van en cadena: el antebrazo sigue al brazo.
     4 · CADA ESLABÓN FLOTA A LO SUYO, con su fase y su velocidad. Con un
         seno único los cuatro miembros suben y bajan juntos y eso se lee
         como un mecanismo.

   Y CAEN DE UNO A TRES, desfasados (`cuantos`, `retraso`): el segundo
   entra cuando el primero lleva medio cuadro bajado. A la vez serían una
   formación; escalonados, es que hay más de uno. */

/* ── EL PERFIL DEL TRONCO ────────────────────────────────────────────
   El semiancho a cada altura, en fracciones del ALTO del cuerpo y con el
   origen en el ombligo. Puntos de control y no una fórmula: lo que se
   reconoce de un cuerpo es la PROPORCIÓN —la cabeza es un séptimo, los
   hombros dos cabezas, la cintura más estrecha que hombros y caderas—, y
   eso no sale de una curva.

   Se muestrea a pasos cortos con los campos solapados, por el motivo del
   punto 1 de arriba: cinco elipses sueltas dejan la silueta como una pila
   de óvalos con un cinturón oscuro en la cintura.

   Los dos extremos van a casi CERO de ancho a propósito: el campo del
   final de una cadena tiene que sobresalir del rango —si no sobresale, no
   solapa con el anterior—, y a dos milésimas lo que asoma es un pelo. Con
   el ancho de la coronilla de verdad asoma un pico sobre la cabeza. */
const CUERPO_PERFIL = [
  [-0.512, 0.004],
  [-0.502, 0.030],        // la coronilla: sube de golpe, que un cráneo es redondo
  [-0.486, 0.048],        //   y no un cono
  [-0.466, 0.057],
  [-0.438, 0.062],        // la cabeza, por donde es más ancha
  [-0.400, 0.053],
  [-0.366, 0.031],        // el cuello: la estrangulación que dice que hay cabeza
  [-0.334, 0.060],
  [-0.298, 0.097],        // los hombros
  [-0.260, 0.105],
  [-0.208, 0.087],
  [-0.158, 0.074],        // la cintura
  [-0.098, 0.081],
  [-0.040, 0.094],        // las caderas
  [ 0.014, 0.085],
  [ 0.052, 0.040],
  [ 0.072, 0.004],        // y de aquí abajo ya son las piernas
];

/* el semiancho del tronco a una altura cualquiera. Con interpolación
   lineal se le ven los vértices al perfil en el canto de la silueta, así
   que se suaviza: `u²(3−2u)` entra y sale con pendiente cero, y entonces
   el canto no tiene esquinas. */
function cuerpoAncho(ly){
  const T = CUERPO_PERFIL, n = T.length;
  if (ly <= T[0][0]) return T[0][1];
  if (ly >= T[n-1][0]) return T[n-1][1];
  let i = 1;
  while (i < n-1 && T[i][0] < ly) i++;
  const a = T[i-1], b = T[i];
  const u = (ly - a[0])/(b[0] - a[0]);
  return a[1] + (b[1] - a[1])*(u*u*(3 - 2*u));
}

/* ── LOS MIEMBROS ───────────────────────────────────────────────────
   Un miembro es un HUECO del que salen dos eslabones en cadena, y se
   describe así y no como dos centros con sus ángulos porque lo que hay
   que poder mover es el ángulo de cada eslabón: con el centro por pivote,
   un brazo que flota es un aspa.

   `anchos` es el semiancho en la RAÍZ, en la junta de en medio y en la
   PUNTA, y es la otra mitad del arreglo de los óvalos: interpolado a lo
   largo del miembro, un brazo va de grueso a fino de un tirón en vez de
   ser dos lentejas pegadas por el codo. La punta va casi a cero por lo
   mismo que la coronilla del perfil, y de paso lo que asoma se lee como
   dedos. Y la raíz va bastante gorda para que el primer campo entre DENTRO
   del tronco: el hueco del hombro cae a 0,062 del eje y ahí el tronco mide
   0,105, así que el brazo nace por debajo del canto y no pegado a él.

   LOS ÁNGULOS SE MIDEN DESDE «HACIA LOS PIES» y abriendo hacia fuera, que
   es como se piensa una postura: 0 es un miembro colgando recto y π uno
   estirado hacia arriba. El del segundo eslabón es RELATIVO al primero, o
   sea que es el codo o la rodilla y no una orientación absoluta, y por eso
   mover el brazo arrastra el antebrazo. `largos` son largos enteros.   */
const CUERPO_MIEMBROS = [
  /* los brazos, ARRIBA y hacia fuera, que es como flota un ahogado */
  { x:-0.062, y:-0.256, lado:-1,
    largos: [0.200, 0.184], angulos: [2.30, -0.42],
    anchos: [0.040, 0.027, 0.012], fuerzas: [0.82, 0.70] },
  { x: 0.062, y:-0.256, lado: 1,
    largos: [0.200, 0.184], angulos: [2.30, -0.42],
    anchos: [0.040, 0.027, 0.012], fuerzas: [0.82, 0.70] },
  /* y las piernas, juntas y algo dobladas. El hueco de la cadera va a
     0,046 del eje y el muslo mide 0,050, o sea que las dos piernas se
     tocan justo en el eje y de ahí para abajo se separan: con el muslo a
     0,058 se cruzaban y las dos piernas salían fundidas en una columna,
     que es lo que se leía como cola. Y la rodilla dobla POCO —0,11— porque
     en una silueta plana no hay más plano que éste: doblarla como se
     dobla de verdad sale de lado, y a 0,34 el cuerpo bajaba haciendo un
     compás. */
  { x:-0.046, y:-0.026, lado:-1,
    largos: [0.244, 0.224], angulos: [0.09, 0.13],
    anchos: [0.050, 0.036, 0.016], fuerzas: [0.92, 0.80] },
  { x: 0.046, y:-0.026, lado: 1,
    largos: [0.244, 0.224], angulos: [0.09, 0.13],
    anchos: [0.050, 0.036, 0.016], fuerzas: [0.92, 0.80] },
];

/* CADA CUÁNTO SE DEJA UN CAMPO, en fracciones del alto, y cuánto mide de
   largo el que se deja —el factor sobre el paso—.

   El factor sale de una cuenta: dos elipses de semieje `a` separadas `s`
   se unen, justo en medio, a `sqrt(1 − (s/2a)²)` de su ancho. Con el
   semieje igual al paso eso es el 87 % y el pellizco se ve; con 1,35 es
   el 93 % y no. Subirlo más sólo hace que asome por las puntas.

   ── Y POR QUÉ EL TRONCO VA MÁS FINO QUE LOS MIEMBROS ────────────────
   El paso es también el DETALLE MÁS PEQUEÑO que se puede resolver: dos
   campos consecutivos se solapan, así que cualquier estrechamiento más
   corto que el paso lo rellenan entre ellos. El tronco tiene uno que no
   se puede perder —el CUELLO, unas tres centésimas del alto—, así que
   por encima de 0,030 la cabeza y los hombros se dan la mano y sale un
   bulto puntiagudo. Los miembros son conos lisos y sólo piden no
   pellizcar en el codo y la rodilla.

   ── LO QUE CUESTA ───────────────────────────────────────────────────
   41 campos por cuerpo: 19 del tronco, 5 por brazo y 6 por pierna. Unos
   0,017 ms cada uno; el peor caso, tres cuerpos, son 127 campos y 4,4 ms
   de fotograma contra 2,4 sin evento.

   Y el gasto NO está en dibujar: apagar `pintaSombras` entera no cambia
   nada (0,02 ms). Está TODO en `M.campo()`, un recorrido lineal al que
   el plancton llama por mota —setecientas motas por dos consultas por
   127 campos son 170.000 comparaciones por fotograma—. Eso es lo que
   pone el tope al paso, y no el número de elipses: para bajarlo más hay
   que arreglar antes la consulta, con una rejilla. */
const PASO_TRONCO = 0.030, PASO_MIEMBRO = 0.075, LARGO_CAMPO = 1.35;

/* CUÁNTAS MUESTRAS SALEN DE ESO, contadas una sola vez y aquí: las usan el
   bucle que pone los campos y el que pinta el borde, y sobre todo el array
   donde el primero le deja al segundo por dónde va el canto. Calculadas de
   los mismos pasos y perfiles, así que no hay forma de que se
   desincronicen de lo que de verdad se dibuja. */
const N_TRONCO = Math.max(4, Math.round(
  (CUERPO_PERFIL[CUERPO_PERFIL.length-1][0] - CUERPO_PERFIL[0][0]) / PASO_TRONCO));
const N_MIEMBRO = CUERPO_MIEMBROS.map(
  Mi => Math.max(3, Math.round((Mi.largos[0] + Mi.largos[1]) / PASO_MIEMBRO)));
const N_PIEL = N_TRONCO + N_MIEMBRO.reduce((a, b) => a + b, 0);

/* LOS TRAMOS DE PIEL, en índices de `piel`: el tronco y cada miembro. Los
   necesita el borde, que une muestras CONSECUTIVAS: la última del tronco y
   la primera del brazo lo son en el array y están a medio cuerpo la una de
   la otra.

   Y CADA MIEMBRO EMPIEZA EN SU SEGUNDA MUESTRA: la primera es la raíz, que
   nace DENTRO del tronco a propósito —es lo que hace que el brazo no salga
   pegado al canto—, así que su «canto» cae en plena masa oscura. Con ella,
   las dos muestras de una raíz se cosen en un trazo y el cuerpo sale con
   una cremallera por el esternón. Va aquí y no en `bordeTapado`: eso es un
   umbral para los cruces de verdad —el brazo por delante del hombro— y
   bajarlo hasta tragarse las raíces se lleva también canto bueno. */
const TRAMOS = (() => {
  const t = [[0, N_TRONCO]];
  let i = N_TRONCO;
  for (const n of N_MIEMBRO){ t.push([i+1, i+n]); i += n; }
  return t;
})();

/* ── LO QUE COMPARTE EL BORDE ───────────────────────────────────────
   La luz que recibe cada muestra y el canto que sale de ella. En arrays de
   módulo: se llenan y se consumen dentro de la misma llamada —un cuerpo
   cada vez—, que es el convenio de la casa para no asignar por fotograma. */
const _luzX = new Float32Array(N_PIEL), _luzY = new Float32Array(N_PIEL);
const _luzC = new Array(N_PIEL).fill(null);
const _cx = new Float32Array(N_PIEL), _cy = new Float32Array(N_PIEL);
const _ca = new Float32Array(N_PIEL), _cc = new Array(N_PIEL).fill('');

function cuerpoFlexion(b, ly, t){
  const peso = Math.min(1, Math.abs(ly)/0.40);
  return peso * (b.arqueo + b.onda*Math.sin(ly*b.k + b.fase + t*b.vOnda));
}

/* un cuerpo nuevo: su tamaño, su rumbo, su postura y su flotación. `espera`
   son los segundos que tarda en asomar, que es lo que los desacompasa. */
function cuerpoNuevo(M, p, x, y, espera){
  const h = M.U * rango(p.alto);
  const b = {
    x: opt(x, rnd(0.16, 0.84)*M.W),
    /* entra por arriba y desde fuera, por su altura entera: el cuerpo
       cuelga del punto (x,y), así que si arranca en el canto asoman los
       pies antes que la cabeza */
    y: opt(y, -h*0.75),
    h, espera,
    vel:   rango(p.vel) * M.U,
    ang:   rnd(-0.25, 0.25),
    vGiro: rango(p.giro || 0),
    fase:  Math.random()*TAU,
    hondura: rango(p.hondura),
    deriva: Math.random()*TAU,
    /* LA POSTURA: no otra anatomía, los mismos huesos con los ángulos
       abiertos de otra manera. `abre` multiplica el del HOMBRO y la CADERA,
       `dobla` el del CODO y la RODILLA. */
    abre:  rango(p.abre || 1),
    dobla: rango(p.dobla || 1),
    /* `arqueo` con signo sorteado: uno baja recogido hacia delante y el
       siguiente arqueado hacia atrás. */
    arqueo: rango(p.arqueo || 0) * (Math.random() < 0.5 ? 1 : -1),
    onda:   rango(p.onda || 0),
    k:      TAU * rango(p.ondas || 0.5),
    vOnda:  rango(p.velOnda || 0.2),
    /* UNA FASE Y UNA VELOCIDAD POR ESLABÓN. Ocho números por cuerpo y
       sorteados una vez: es lo que impide que los cuatro miembros suban y
       bajen a la par, que es lo que más delataba el maniquí. */
    fasesM: new Float32Array(CUERPO_MIEMBROS.length*2),
    velesM: new Float32Array(CUERPO_MIEMBROS.length*2),
    /* ── POR DÓNDE VA SU CANTO ────────────────────────────────────
       Cinco números por muestra —x, y, el ángulo del eje ahí, el semiancho
       y el semieje a lo largo—, en coordenadas del MUNDO y rellenados por
       el mismo bucle que pone los campos. El semieje a lo largo va porque
       de él sale cuánto mide el trazo del borde: el paso del tronco y el de
       un miembro no son el mismo.

       Se guarda en vez de recalcularlo en `dibuja` porque los campos se
       ponen en `actualiza` y el dibujo va en otra fase del fotograma: dos
       recorridos separados se despegan, y despegados el borde se pinta
       donde el cuerpo no está. */
    piel: new Float32Array(N_PIEL*5),
    hecho: false,
  };
  for (let i=0;i<b.fasesM.length;i++){
    b.fasesM[i] = Math.random()*TAU;
    b.velesM[i] = rnd(0.45, 1.15);
  }
  return b;
}

evento('cuerpo', {
  exclusivo: true,
  cada: [320, 660], primero: [80, 200],
  prueba: { alto: [5.85, 8.2], vel: [0.30, 0.55], giro: [-0.055, 0.055],
            deriva: 0.22, vaiven: 0.30, hondura: [0.92, 1.0],
            cuantos: [1, 3], retraso: [10, 30],
            abre: [0.70, 1.22], dobla: [0.3, 1.8],
            arqueo: [0.04, 0.13], onda: [0.02, 0.055],
            ondas: [0.35, 0.8], velOnda: [0.10, 0.26],
            filo: 1.8, penumbra: 1.25, plano: 1,
            borde: 2.2, bordeAlcance: 4.2, bordeCaida: 2.0, bordeTecho: 0.09,
            bordeGrosor: 0.05, bordeTono: [182, 196, 204],
            bordeTinte: 0.22, bordeTapado: 0.25 },
  arranca(M, p){
    /* el primero entra ya; los demás esperan lo suyo. El contacto no le
       pasa un sitio a ninguno: un cuerpo que sale del dedo se lee como
       que el dedo lo ha hecho, y este evento va de encontrárselo. */
    const n = Math.max(1, rangoE(p.cuantos || 1)|0);
    const cuerpos = [];
    let espera = 0;
    for (let i=0;i<n;i++){
      cuerpos.push(cuerpoNuevo(M, p, undefined, undefined, espera));
      espera += rango(p.retraso || 0);
    }
    return { cuerpos };
  },
  actualiza(e, M, p, dt){
    const plano = opt(p.plano, 1);
    const filo = opt(p.filo, 1.8);
    /* `penumbra` agranda cada elipse por encima del cuerpo, igual que en el
       leviatán: el máximo de un campo cae en su centro, así que sin esto la
       silueta de verdad cae donde el apagado ya se está desvaneciendo y no
       hay masa oscura, sólo un degradado. */
    const pen = opt(p.penumbra, 1);
    const vai = opt(p.vaiven, 0);
    let quedan = 0;

    for (const b of e.cuerpos){
      if (b.hecho) continue;
      quedan++;
      if (b.espera > 0){ b.espera -= dt; continue; }
      b.y += b.vel * dt;
      b.ang += b.vGiro * dt;
      b.x += Math.sin(M.t*0.11 + b.deriva) * opt(p.deriva, 0) * M.U * dt;
      if (b.y - b.h*0.6 > M.H){ b.hecho = true; quedan--; continue; }
      cuerpoCampos(b, M, plano, pen, filo, vai);
    }
    return quedan > 0;
  },
  /* Y SÍ DIBUJA, aunque poco: el canto encendido por lo que le pasa cerca.
     Ver `pintaBordeCuerpo`. El cuerpo sigue siendo un hueco —no emite
     nada—; lo que se pinta es la luz de otro rebotando en él. */
  dibuja(e, M, p, g){
    const plano = opt(p.plano, 1);
    for (const b of e.cuerpos)
      if (!b.hecho && b.espera <= 0) pintaBordeCuerpo(b, M, p, g, plano);
  },
});

/* ── DEL CUERPO AL MUNDO ────────────────────────────────────────────
   Empuja los campos de un cuerpo. Va fuera del evento porque lo que hace
   es geometría y no reloj, y porque así el bucle de arriba se lee: mover
   los cuerpos es una cosa y armar la silueta es otra.

   Se recorren los DOS perfiles —el del tronco a lo alto y el de cada
   miembro de la raíz a la punta— dejando campos solapados con el grosor
   interpolado. La unión de todos es una manga continua, y eso es lo que
   quita de en medio los dos defectos que tenía la silueta: el óvalo por
   hueso y el pellizco en cada junta.

   Y LA FLEXIÓN SE APLICA CAMPO A CAMPO, no pieza a pieza. Es lo que hace
   que el cuerpo se DOBLE en vez de partirse: desplazando cada elipse en
   bloque por la flexión de su centro, el muslo y la espinilla —con los
   centros a un tercio de altura de diferencia— se van a un lado distinto y
   la rodilla abre un hueco de veinte píxeles. Con un campo cada 0,072 el
   desplazamiento cambia poco de uno al siguiente y sale una curva. */
function cuerpoCampos(b, M, plano, pen, filo, vai){
  const t = M.t;
  const ca = Math.cos(b.ang), sa = Math.sin(b.ang);
  /* deja un campo en el punto (lx, ly) del cuerpo. `r` es el semieje a lo
     largo y `ancho` el semiancho ya en píxeles; `f` es la flexión a esa
     altura, que la calcula quien llama porque el tronco además la
     necesita para el giro. */
  let k = 0;
  const pon = (lx, ly, f, r, ancho, rot, fuerza) => {
    const gx = (lx + f)*b.h, gy = ly*b.h;
    const x = b.x + gx*ca - gy*sa, y = b.y + gx*sa + gy*ca;
    const rt = b.ang + rot;
    M.campos.push({ tipo:'apaga', plano, x, y,
                    r, ky: Math.max(0.04, ancho/r),
                    rot: rt, fuerza: b.hondura*fuerza, filo });
    /* y de paso, por dónde va el canto aquí: lo consume `dibuja` para el
       borde. Se apunta en el mismo sitio en que se pone el campo, que es la
       única forma de que el borde caiga donde el cuerpo está. */
    const j = k++*5;
    b.piel[j] = x; b.piel[j+1] = y; b.piel[j+2] = rt;
    b.piel[j+3] = ancho; b.piel[j+4] = r;
  };
  /* el semieje a lo largo NO lleva `pen` y el ancho SÍ. La penumbra está
     para que la silueta de verdad caiga dentro de la zona llena del campo,
     y eso es un problema del lado FINO: a lo largo ya solapan entre ellos.
     Agrandándolo también a lo largo, lo único que crecía era el pelo que
     asoma por la coronilla y por los dedos. */

  /* EL TRONCO, de la coronilla a donde arrancan las piernas. `+π/2` porque
     el perfil está escrito a lo ALTO y el semieje `r` de un campo es el
     horizontal. */
  const P = CUERPO_PERFIL;
  const y0 = P[0][0], y1 = P[P.length-1][0];
  const nT = N_TRONCO;
  const pasoT = (y1-y0)/nT, rT = pasoT*LARGO_CAMPO*b.h;
  let fAnt = null;
  for (let i=0;i<nT;i++){
    const ly = y0 + (i+0.5)*pasoT;
    const f = cuerpoFlexion(b, ly, t);
    /* el canto sigue el arco: el giro de cada campo sale de cuánto se ha
       apartado respecto del ANTERIOR. Así no hay que derivar la flexión ni
       hay dos fórmulas que se puedan desincronizar —el problema de siempre
       en esta casa—, y el tronco arqueado sale como una curva y no como
       una escalera de elipses verticales. */
    const tg = fAnt === null ? 0 : Math.atan((f - fAnt)/pasoT);
    fAnt = f;
    pon(0, ly, f, rT, cuerpoAncho(ly)*b.h*pen, Math.PI*0.5 + tg, 1);
  }

  /* LOS MIEMBROS, de la raíz a la punta */
  for (let m=0;m<CUERPO_MIEMBROS.length;m++){
    const Mi = CUERPO_MIEMBROS[m];
    const L1 = Mi.largos[0], L2 = Mi.largos[1], total = L1 + L2;
    /* la postura dice dónde reposa cada junta —`abre` el hombro y la
       cadera, `dobla` el codo y la rodilla— y `vaiven` cuánto se va de
       ahí, con la fase y la velocidad propias de ese eslabón: por eso no
       hay dos miembros acompasados. */
    const a1 = Mi.angulos[0]*b.abre
             + vai*Math.sin(t*b.velesM[m*2] + b.fasesM[m*2]);
    const a2 = a1 + Mi.angulos[1]*b.dobla
             + vai*Math.sin(t*b.velesM[m*2+1] + b.fasesM[m*2+1]);
    const d1x = Math.sin(a1)*Mi.lado, d1y = Math.cos(a1);
    const d2x = Math.sin(a2)*Mi.lado, d2y = Math.cos(a2);
    const rot1 = Math.atan2(d1y, d1x), rot2 = Math.atan2(d2y, d2x);
    /* el codo o la rodilla */
    const jx = Mi.x + d1x*L1, jy = Mi.y + d1y*L1;
    const n = N_MIEMBRO[m];
    const paso = total/n, r = paso*LARGO_CAMPO*b.h;
    const A = Mi.anchos, F = Mi.fuerzas;
    for (let i=0;i<n;i++){
      const s = (i+0.5)*paso;
      const dentro = s <= L1;
      const u = dentro ? s/L1 : (s-L1)/L2;
      const ancho = dentro ? A[0] + (A[1]-A[0])*u : A[1] + (A[2]-A[1])*u;
      const fz    = dentro ? F[0] + (F[1]-F[0])*u : F[1];
      const lx = dentro ? Mi.x + d1x*s : jx + d2x*(s-L1);
      const ly = dentro ? Mi.y + d1y*s : jy + d2y*(s-L1);
      pon(lx, ly, cuerpoFlexion(b, ly, t), r, ancho*b.h*pen,
          dentro ? rot1 : rot2, fz);
    }
  }
}

/* ── EL BORDE ───────────────────────────────────────────────────────
   Lo ÚNICO que dibuja este evento: el canto que un foco de verdad
   alcanza. Sin él, en la mitad de abajo del cuadro —agua casi negra— un
   hueco negro sobre negro no se lee y el cuerpo se pierde.

   Y NO SE ILUMINA DESDE LA ESCENA, que es la regla de la casa. Se
   recorre el canto que dejó apuntado `cuerpoCampos`, se mira qué llega
   de `M.luces(plano)` y se enciende SÓLO el lado que mira a esa luz. Lo
   mismo que la carroña con dos diferencias:

     · Aquí la luz tiene DIRECCIÓN: se acumula como VECTOR y el canto se
       enciende por `dot(normal, luz)`. Sin eso se enciende el contorno
       entero y el cuerpo pasa de hueco a muñeco recortado; que el lado
       de sombra se quede negro es la mitad del efecto.
     · Es GRIS y no del color del foco —carne mojada—, con un poco de
       `tinte` de quien lo alumbra y nada más.

   Se salta los trozos que caen DENTRO de otra parte del cuerpo —el brazo
   cruzando el hombro— preguntando por el campo `apaga`: en el canto, el
   de esa misma muestra vale cero, así que lo que devuelva viene de otra
   parte. Sin esto el cuerpo se lee como un despiece.

   ── Y SE COSE, NO SE PUNTEA ─────────────────────────────────────────
   Dos muestras seguidas encendidas se unen con un TROZO DE CURVA cuyas
   tangentes son el EJE del cuerpo en cada punta, que `cuerpoCampos` deja
   en `piel`: el canto sale con la curvatura que el cuerpo tiene ahí, sin
   cuerdas ni huecos. Hace falta sobre todo en los miembros, cuyo paso es
   0,075 del alto contra los 0,030 del tronco. El alfa y el tinte van en
   un degradado de una muestra a la otra, así que tampoco hay escalones.

   Lo que NO se toca es cuántas muestras hay: el paso lo fija el coste de
   `M.campo()` —ver arriba—. Suavizar es gratis; muestrear más, no. */
function pintaBordeCuerpo(b, M, p, g, plano){
  const gan = opt(p.borde, 0);
  if (!(gan > 0)) return;
  const luces = M.luces(plano);
  if (!luces.length) return;
  const alc = opt(p.bordeAlcance, 1), caida = opt(p.bordeCaida, 2);
  const techo = opt(p.bordeTecho, 1);
  const T = p.bordeTono || [180, 196, 206], tinte = opt(p.bordeTinte, 0);
  const grosor = Math.max(0.5, M.U*opt(p.bordeGrosor, 0.05));
  const tapado = opt(p.bordeTapado, 0.25);
  g.lineCap = 'round';
  g.lineWidth = grosor;

  /* ── 1 · LA LUZ QUE LE LLEGA A CADA MUESTRA ──────────────────────
     Una vez por muestra y no una por lado: es la parte que cuesta —recorre
     los focos— y de ella salen los dos lados.

     LA CURVA es la de `luzRecibida` —pow(1/(1+d²/r²), caida)— y NO la de
     la carroña, que se corta en `r`: los radios de esta escena van de 16
     px a 125 y un cuerpo baja por agua vacía, así que con corte el canto
     sale todo o nada (medido: `alcance` 9 daba el 0 % de los fotogramas
     con algo encendido y 13 el 100 %). Sin corte hay un hilo de luz a
     cualquier distancia y sube cuando algo se acerca. */
  for (let i=0;i<N_PIEL;i++){
    const j = i*5;
    _luzX[i] = _luzY[i] = 0; _luzC[i] = null;
    if (!(b.piel[j+3] > 0)) continue;
    const x = b.piel[j], y = b.piel[j+1];
    let lx = 0, ly = 0, mejor = 0, cm = null;
    for (const o of luces){
      const r = (o.rCuerpo || o.rLuz) * alc;
      if (!r) continue;
      const dx = o.x - x, dy = o.y - y, d2 = dx*dx + dy*dy;
      const w = (o.luzI || 1) * Math.pow(1/(1 + d2/(r*r)), caida);
      if (w < 0.002) continue;
      const d = Math.sqrt(d2) || 1e-4;
      lx += dx/d*w; ly += dy/d*w;
      if (w > mejor){ mejor = w; cm = o.c; }
    }
    _luzX[i] = lx; _luzY[i] = ly; _luzC[i] = cm;
  }

  /* ── 2 · EL CANTO, TRAMO A TRAMO Y LADO A LADO ──────────────────
     Primero qué muestras de este lado miran a la luz y por dónde les cae
     el canto, y después la costura: dos seguidas se unen con curva. El
     tramo es lo que impide coser el tronco con un brazo. */
  for (let t=0;t<TRAMOS.length;t++){
    const ini = TRAMOS[t][0], fin = TRAMOS[t][1];
    for (let lado=-1;lado<=1;lado+=2){
      let vivos = 0;
      for (let i=ini;i<fin;i++){
        _ca[i] = 0;
        const j = i*5, anc = b.piel[j+3];
        if (!(anc > 0)) continue;
        const lx = _luzX[i], ly = _luzY[i];
        if (lx*lx + ly*ly < 1.6e-5) continue;       // 0,004 de módulo
        /* el eje de la muestra y su normal hacia este lado: el canto está
           a `anc` de ahí */
        const rot = b.piel[j+2];
        const nx = -Math.sin(rot)*lado, ny = Math.cos(rot)*lado;
        /* ¿mira este lado a la luz? `cara` sale ya con la intensidad
           dentro. La única puerta aquí es el signo —de espaldas no se
           enciende—; lo flojo lo corta el alfa. Con una puerta en 0,01 se
           pierde el caso normal: por agua vacía la luz que le llega vale
           unas cinco milésimas, así que las dos caras la fallan y el
           cuerpo se queda negro entero. */
        const cara = nx*lx + ny*ly;
        if (cara <= 0) continue;
        /* EL TECHO, con rodilla blanda en vez de recorte. La luz que le
           llega tiene un rango enorme —de 0,02 sin nada cerca a más de 1
           con una medusa al costado—, así que sin esto el canto se clava
           en alfa 1 y el cuerpo pasa de hueco a figura recortada en
           blanco. `cara/(1 + cara/techo)` sube recto al principio y se
           acerca al techo sin llegar, así que siempre queda margen para
           ponerse más vivo. */
        const a = gan*cara/(1 + cara/techo);
        if (a < 0.004) continue;
        /* JUSTO POR FUERA de la masa y no en el canto exacto. Un cuerpo
           mojado tiene el reflejo en el borde, no dentro, y además es lo
           que descuenta los falsos positivos de la prueba de abajo: en el
           canto exacto, el trozo donde un brazo sale del hombro está medio
           enterrado en el tronco y se descarta. Medido: de 82 trozos, 43
           dan la espalda a la luz —eso es lo que se quiere— y 15 salen
           enterrados; un pelo por fuera, la mayoría de esos 15 son canto
           de verdad. */
        const fuera = anc + grosor*0.7;
        const cx = b.piel[j] + nx*fuera, cy = b.piel[j+1] + ny*fuera;
        /* y si este trozo sigue enterrado en otra parte del cuerpo, no es
           canto: es una raya por dentro de la masa oscura, y con ellas el
           cuerpo se lee como un despiece */
        const dentro = M.campo('apaga', cx, cy, plano);
        if (dentro && dentro.peso > tapado) continue;
        /* UN PUNTO DEL COLOR DE QUIEN LO ALUMBRA, y poco: con el gris a
           secas el cuerpo se despega de la escena —sería lo único que no
           comparte tono con nada— y teñido del todo vuelve a parecer otro
           bicho que brilla. El tinte es del foco que más pesa EN ESTA
           MUESTRA, así que un cuerpo entre dos medusas de colores
           distintos se tiñe distinto de cada lado. */
        let R = T[0], G = T[1], B = T[2];
        const cm = _luzC[i];
        if (tinte > 0 && cm && cm.mid){
          R += (cm.mid[0] - R)*tinte;
          G += (cm.mid[1] - G)*tinte;
          B += (cm.mid[2] - B)*tinte;
        }
        _cx[i] = cx; _cy[i] = cy; _ca[i] = a;
        _cc[i] = (R|0)+','+(G|0)+','+(B|0)+',';
        vivos++;
      }
      if (!vivos) continue;
      for (let i=ini;i<fin;i++){
        if (!(_ca[i] > 0)) continue;
        if (i+1 < fin && _ca[i+1] > 0)            cose(g, b, i, i+1);
        else if (!(i > ini && _ca[i-1] > 0))      hilacha(g, b, i);
      }
    }
  }
}

/* Un trozo de canto entre dos muestras seguidas. Cúbica de Hermite: las
   tangentes son el eje del cuerpo en cada punta y el control va a un tercio
   de la cuerda, que para los ángulos de aquí —el codo es el peor, 0,4
   rad— no se distingue de un arco. */
function cose(g, b, i, k){
  const x0 = _cx[i], y0 = _cy[i], x1 = _cx[k], y1 = _cy[k];
  const dx = x1 - x0, dy = y1 - y0, d2 = dx*dx + dy*dy;
  if (d2 < 0.01) return;
  const m = Math.sqrt(d2)/3;
  let e0x = Math.cos(b.piel[i*5+2]), e0y = Math.sin(b.piel[i*5+2]);
  let e1x = Math.cos(b.piel[k*5+2]), e1y = Math.sin(b.piel[k*5+2]);
  /* el eje viene apuntando a lo suyo y no al recorrido —el tronco va de la
     coronilla a los pies y un lado del canto se recorre al revés—, y con el
     control hacia atrás el trozo hace un rizo */
  if (e0x*dx + e0y*dy < 0){ e0x = -e0x; e0y = -e0y; }
  if (e1x*dx + e1y*dy < 0){ e1x = -e1x; e1y = -e1y; }
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, 'rgba(' + _cc[i] + _ca[i].toFixed(3) + ')');
  gr.addColorStop(1, 'rgba(' + _cc[k] + _ca[k].toFixed(3) + ')');
  g.strokeStyle = gr;
  g.beginPath();
  g.moveTo(x0, y0);
  g.bezierCurveTo(x0 + e0x*m, y0 + e0y*m, x1 - e1x*m, y1 - e1y*m, x1, y1);
  g.stroke();
}

/* Una muestra sola —la de al lado da la espalda a la luz o está
   enterrada—: un trazo del largo del paso que se apaga por los dos cabos.
   A alfa plano vuelve a ser la raya suelta de antes. El largo sale del
   semieje del campo y no del ancho del cuerpo: con el ancho, en el tronco
   sobra el triple y en los miembros falta la mitad. */
function hilacha(g, b, i){
  const j = i*5, rot = b.piel[j+2];
  const largo = b.piel[j+4]/LARGO_CAMPO*0.9;
  const ex = Math.cos(rot)*largo*0.5, ey = Math.sin(rot)*largo*0.5;
  const x0 = _cx[i] - ex, y0 = _cy[i] - ey, x1 = _cx[i] + ex, y1 = _cy[i] + ey;
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0.00, 'rgba(' + _cc[i] + '0)');
  gr.addColorStop(0.50, 'rgba(' + _cc[i] + _ca[i].toFixed(3) + ')');
  gr.addColorStop(1.00, 'rgba(' + _cc[i] + '0)');
  g.strokeStyle = gr;
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.stroke();
}
