import { M, evento } from '../motor.js';
const {rnd, rango, rangoE, opt, TAU} = M;

/* ── EL CUERPO ──────────────────────────────────────────────────────
   Un cuerpo humano bajando. NO SE DIBUJA NADA: la silueta está hecha de
   campos `apaga`, igual que el leviatán, así que lo que cruza la pantalla
   es una región donde la nieve marina se calla y el agua se oscurece. Es
   la única forma de que aquí haya algo oscuro —sumar no oscurece— y
   además es la buena: no se ve un cuerpo, se ve el hueco de un cuerpo, y
   el que mira lo reconoce sin que se lo dibujen.

   Es E-04 llevado al sitio donde de verdad duele. La carroña es un
   esqueleto de pez y se ilumina; esto no emite ni un fotón y no hace
   falta: lo que lo hace insoportable es que la silueta es humana.

   LA POSTURA es la del ahogado: brazos arriba y hacia fuera, cabeza
   colgando, piernas juntas y algo dobladas. No es licencia —un cuerpo en
   el agua flota así— y es lo que hace que se reconozca de perfil, de
   frente y girado, que es importante porque va volteando muy despacio.

   Va MÁS LENTO que la carroña y con menos volteo: lo que se pide es que
   tarde tanto en cruzar que dé tiempo a dudar de lo que se está viendo.
   Cuatro cosas lo hacen BLANDO y CONTINUO, y sin ellas se reconoce el
   cuerpo pero no se cree:

     1 · NO HAY UNA ELIPSE POR HUESO. Se recorren dos perfiles —el del
         tronco (`CUERPO_PERFIL`) y el de cada miembro— dejando campos
         solapados con el grosor interpolado, y la unión es una manga
         continua. Con una elipse por pieza se ve LA PIEZA: una elipse se
         afila en sus dos puntas, así que cada junta deja un pellizco y el
         cuerpo se lee como óvalos ensartados con los miembros despegados
         del tronco. Esto es lo que lo arregla y lo demás se apoya en ello.
     2 · EL ESPINAZO SE DOBLA (`arqueo`, `onda`). El eje no es recto: se
         arquea lo suyo por cuerpo y encima le recorre una onda muy lenta.
         La flexión se aplica CAMPO A CAMPO, así que arrastra todo lo que
         cuelga del eje —miembros incluidos— sin partirlo.
     3 · LOS MIEMBROS CUELGAN DE SU HUECO y no giran sobre su propio
         centro. Un brazo con el centro por pivote es un aspa; con el
         hombro por pivote es un brazo suelto en el agua. Y son dos
         eslabones en cadena: el antebrazo se mueve con el brazo.
     4 · CADA UNO FLOTA A LO SUYO. Cada eslabón lleva su fase y su
         velocidad, sorteadas al nacer, así que no hay dos acompasados.
         Con un seno único los cuatro miembros suben y bajan juntos y eso
         se lee como un mecanismo.

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

   El factor sale de una cuenta: dos elipses iguales de semieje `a`
   separadas `s` dejan la unión, justo en medio, a `sqrt(1 − (s/2a)²)` de
   su ancho. Con el semieje igual al paso eso es el 87 % y el pellizco se
   ve; con 1,35 es el 93 % y no. Subirlo más no arregla nada y hace que
   asome más por las puntas.

   ── Y POR QUÉ EL TRONCO VA MÁS FINO QUE LOS MIEMBROS ────────────────
   Porque el paso es también el TAMAÑO DEL DETALLE MÁS PEQUEÑO que se
   puede resolver: dos campos consecutivos se solapan a propósito, así que
   cualquier estrechamiento más corto que el paso lo rellenan entre ellos.

   El tronco tiene uno que no se puede perder —el CUELLO, que mide unas
   tres centésimas del alto—, y con el paso a 0,072 los campos de la
   cabeza y de los hombros se daban la mano por encima de él: salía un
   cuerpo sin cabeza, un bulto puntiagudo. A 0,030 el cuello se resuelve y
   hay cabeza. Los miembros no tienen ningún detalle así —son conos
   lisos—, y ahí lo único que hacía falta era que no pellizcaran en el codo
   y la rodilla.

   ── LO QUE CUESTA, Y DÓNDE SE VA ────────────────────────────────────
   41 campos por cuerpo: 19 del tronco, 5 por brazo y 6 por pierna. Eran
   13. Cronometrado en el navegador con la población ENTERA —59 peces, sin
   que haya entrado `degradar()`— y con los cuerpos parados, para que la
   medida no dependa de por dónde vayan:

     | sin evento                    |   4 campos |  2,4 ms |
     | un cuerpo                     |  45 campos |  3,1 ms |
     | tres cuerpos (el peor caso)   | 127 campos |  4,4 ms |

   Unos 0,017 ms por campo, o sea dos milisegundos en el peor caso de
   todos. Y el gasto NO está en dibujar: apagando `pintaSombras` entera
   —`agua.sombra.fuerza` a 0— la diferencia es de 0,02 ms, o sea ninguna.
   Está TODO en `M.campo()`, que es un recorrido lineal del array de
   campos y al que el plancton llama por mota: setecientas motas por dos
   consultas por ciento veintisiete campos son ciento setenta mil
   comparaciones por fotograma.

   Eso es lo que pone el tope al paso, y no el número de elipses. Si algún
   día hace falta bajarlo más, lo que hay que arreglar antes es la
   consulta —una rejilla— y no este evento.                           */
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

function cuerpoFlexion(b, ly, t){
  const peso = Math.min(1, Math.abs(ly)/0.40);
  return peso * (b.arqueo + b.onda*Math.sin(ly*b.k + b.fase + t*b.vOnda));
}

/* un cuerpo nuevo: su tamaño, su rumbo, su postura y su flotación. `espera`
   son los segundos que tarda en asomar, que es lo que los desacompasa. */
function cuerpoNuevo(M, p, x, y, espera){
  const h = M.H * rango(p.alto);
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
  prueba: { alto: [0.30, 0.42], vel: [0.30, 0.55], giro: [-0.055, 0.055],
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
   Lo ÚNICO que dibuja este evento. Sin él, en la mitad de abajo del
   cuadro —donde el agua ya es casi negra, [0,1,3] contra [4,13,21] del
   techo— un hueco negro sobre agua negra no se lee y el cuerpo se pierde
   justo cuando más cerca está de pasar por delante de algo.

   Y NO SE ILUMINA DESDE LA ESCENA. Un borde fijo por el canto de arriba
   —como si cayera luz de la superficie— va contra la regla de la casa, y
   además aquí no llega el sol. Lo que se enciende es lo que un foco de
   verdad alcanza: se recorre el canto que ya dejó apuntado
   `cuerpoCampos`, se mira qué luz le llega de `M.luces(plano)` y se
   enciende SÓLO el lado que mira a esa luz. Es lo mismo que hace la
   carroña, con dos diferencias:

     · Aquí la luz tiene DIRECCIÓN. La carroña se pregunta cuánta luz le
       llega a cada vértebra; un borde necesita además de dónde viene, o se
       enciende el contorno entero y el cuerpo pasa de hueco a muñeco
       recortado. Se acumula como VECTOR y el canto se enciende por
       `dot(normal, luz)`: el lado de sombra se queda negro, que es la
       mitad del efecto.
     · Es GRIS y no del color del foco: lo que se quiere leer es carne
       mojada, y para eso el tono tiene que ser casi neutro. Coge un poco
       del color de quien lo alumbra —`tinte`— y nada más.

   Se salta los trozos de canto que caen DENTRO de otra parte del cuerpo
   —el brazo por donde cruza el hombro— preguntándole al motor por su
   propio campo `apaga`: en el canto, el campo de esa misma muestra vale
   cero, así que lo que devuelva viene de otra parte. Sin esto salen rayas
   por dentro de la masa oscura y el cuerpo se lee como un despiece. */
function pintaBordeCuerpo(b, M, p, g, plano){
  const gan = opt(p.borde, 0);
  if (!(gan > 0)) return;
  const luces = M.luces(plano);
  if (!luces.length) return;
  const alc = opt(p.bordeAlcance, 1), caida = opt(p.bordeCaida, 2);
  const techo = opt(p.bordeTecho, 1);
  const T = p.bordeTono || [180, 196, 206], tinte = opt(p.bordeTinte, 0);
  const grosor = Math.max(0.5, M.U*opt(p.bordeGrosor, 0.05));
  g.lineCap = 'round';
  g.lineWidth = grosor;
  for (let i=0;i<N_PIEL;i++){
    const j = i*5;
    const x = b.piel[j], y = b.piel[j+1], rot = b.piel[j+2];
    const anc = b.piel[j+3], rl = b.piel[j+4];
    if (!(anc > 0)) continue;
    /* LA CURVA es la de `luzRecibida` —pow(1/(1+d²/r²), caida)— y NO la de
       la carroña, que se corta en `r`: los radios de esta escena van de 16
       px a 125 y un cuerpo baja por agua vacía, así que con corte el canto
       sale todo o nada (medido: `alcance` 9 daba el 0 % de los fotogramas
       con algo encendido y 13 el 100 %). Sin corte hay un hilo de luz a
       cualquier distancia y sube cuando algo se acerca. */
    let lx = 0, ly = 0, mejor = 0, cm = null;
    for (const o of luces){
      const r = (o.rCuerpo || o.rLuz) * alc;
      if (!r) continue;
      const dx = o.x - x, dy = o.y - y, d2 = dx*dx + dy*dy;
      const q = d2/(r*r);
      const w = (o.luzI || 1) * Math.pow(1/(1 + q), caida);
      if (w < 0.002) continue;
      const d = Math.sqrt(d2) || 1e-4;
      lx += dx/d*w; ly += dy/d*w;
      if (w > mejor){ mejor = w; cm = o.c; }
    }
    if (Math.hypot(lx, ly) < 0.004) continue;
    /* UN PUNTO DEL COLOR DE QUIEN LO ALUMBRA, y poco: con el gris a secas
       el cuerpo se despega de la escena —sería lo único que no comparte
       tono con nada— y teñido del todo vuelve a parecer otro bicho que
       brilla. El tinte es del foco que más pesa EN ESTA MUESTRA, así que
       un cuerpo entre dos medusas de colores distintos se tiñe distinto
       de cada lado. */
    let R = T[0], G = T[1], B = T[2];
    if (tinte > 0 && cm && cm.mid){
      R += (cm.mid[0] - R)*tinte;
      G += (cm.mid[1] - G)*tinte;
      B += (cm.mid[2] - B)*tinte;
    }
    const col = (R|0)+','+(G|0)+','+(B|0)+',';
    /* el eje de la muestra y su normal: el canto está a `anc` de ahí, a un
       lado y al otro */
    const ex = Math.cos(rot), ey = Math.sin(rot);
    const nx = -ey, ny = ex;
    /* EL TRAZO MIDE EL PASO, no el ancho del cuerpo. Con el ancho, en el
       tronco sobra —26 px de trazo para 7 de paso— y en los miembros falta
       —7 para 18—: el canto de un brazo sale a rayitas. El paso es
       `paso·LARGO_CAMPO`, y se estira un 30 % para que dos trazos seguidos
       se pisen con la punta redonda. */
    const largo = rl/LARGO_CAMPO*1.3;
    for (let lado=-1;lado<=1;lado+=2){
      /* ¿mira este lado a la luz? `cara` sale ya con la intensidad dentro.
         La única puerta aquí es el signo —de espaldas no se enciende—; lo
         flojo lo corta el alfa más abajo. Con una puerta en 0,01 se pierde
         el caso normal: por agua vacía la luz que le llega vale unas cinco
         milésimas, así que las dos caras la fallan y el cuerpo se queda
         negro entero. */
      const cara = nx*lado*lx + ny*lado*ly;
      if (cara <= 0) continue;
      /* JUSTO POR FUERA de la masa y no en el canto exacto. Un cuerpo
         mojado tiene el reflejo en el borde, no dentro, y además es lo que
         descuenta los falsos positivos de la prueba de abajo: en el canto
         exacto, el trozo donde un brazo sale del hombro está medio
         enterrado en el tronco y se descarta. Medido: de 82 trozos, 43 dan
         la espalda a la luz —eso es lo que se quiere— y 15 salen
         enterrados; un pelo por fuera, la mayoría de esos 15 son canto de
         verdad. */
      const fuera = anc + grosor*0.7;
      const bx = x + nx*lado*fuera, by = y + ny*lado*fuera;
      /* y si este trozo sigue enterrado en otra parte del cuerpo, no es
         canto: es una raya por dentro de la masa oscura, y con ellas el
         cuerpo se lee como un despiece */
      const dentro = M.campo('apaga', bx, by, plano);
      if (dentro && dentro.peso > opt(p.bordeTapado, 0.25)) continue;
      /* EL TECHO, con rodilla blanda en vez de recorte. La luz que le llega
         tiene un rango enorme —de 0,02 sin nada cerca a más de 1 con una
         medusa al costado—, así que sin esto el canto se clava en alfa 1 y
         el cuerpo pasa de hueco a figura recortada en blanco.
         `cara/(1 + cara/techo)` sube recto al principio y se acerca al
         techo sin llegar, así que siempre queda margen para ponerse más
         vivo. */
      const a = gan*cara/(1 + cara/techo);
      if (a < 0.004) continue;
      g.strokeStyle = 'rgba('+col+a.toFixed(3)+')';
      g.beginPath();
      g.moveTo(bx - ex*largo*0.5, by - ey*largo*0.5);
      g.lineTo(bx + ex*largo*0.5, by + ey*largo*0.5);
      g.stroke();
    }
  }
}
