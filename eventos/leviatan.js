import { M, evento } from '../motor.js';
const {rgba, clamp, rango, opt, TAU} = M;
import { mancha, pintaHalo, reparte } from '../bichos/comun.js';


/* ── EL LEVIATÁN ────────────────────────────────────────────────────
   Enorme y LEJOS, que no es lo mismo que grande en pantalla: el tamaño no
   lo da el encuadre, lo da la distancia —difuso, lento y con más detalle
   del que se llega a resolver.

   NO SE DIBUJA: se calla lo que hay. El cuerpo es una fila de campos
   `apaga` con el perfil de un animal, y un campo `apaga` además oscurece
   el agua (ver pintaSombras en motor.js), que es lo único que hace que una
   masa oscura se pueda leer en una escena aditiva.

   Lo que lo hace amenazante no es el tamaño, son tres cosas:

   1 · ES LARGO Y DELGADO, no una ballena: el alto que ocupa lo llena la
       ONDULACIÓN y no el grosor, y lo que barre esa banda es el latigazo.
   2 · LA ONDA VIAJA. La fase avanza con el tiempo, así que recorre el
       cuerpo de la cabeza a la cola. Fijándola al nacer, el cuerpo es una
       banana rígida deslizándose de lado.
   3 · LA CABEZA MANDA Y NO ONDULA. La onda se amortigua hacia el morro,
       así que el cráneo va estable mientras el cuerpo late detrás, y
       avanza a EMBESTIDAS, con el empuje sincronizado con el coletazo.

   El perfil: morro romo, cráneo ancho, estrangulación de cuello, hombros y
   una cola que se afila hasta casi nada. La cresta dorsal va en campos
   aparte, por encima del lomo, así que sierra el canto de arriba sin tocar
   la panza. Sus medidas están en la escena. */
const _lvQ = [0,0];
evento('leviatan', {
  exclusivo: true,
  cada: [150, 330], primero: [45, 120],
  prueba: { largo: [0.72, 0.86], grosor: [0.086, 0.108], onda: [0.155, 0.185],
            ondas: [1.6, 2.4], velOnda: [0.45, 0.75], embestida: 0.55,
            vel: [0.5, 0.9], banda: [0.12, 0.88],
            rumbo: [-0.22, 0.22], cadaRumbo: [9, 20], velRumbo: 0.25,
            hondura: [0.94, 1.0], filo: 2.2, penumbra: 1.3, segmentos: 22,
            espinas: 10, cresta: 0.55,
            brillo: 0.32, fotoforos: 11, brilloOjo: 2.0,
            brilloLomo: 0.35, brilloEspinas: 1.4, plano: 0 },
  arranca(M, p){
    const dir = Math.random() < 0.5 ? 1 : -1;
    /* EL RUMBO. `base` es el lado por el que cruza y `ang` el rumbo real,
       que se va apartando de la horizontal muy poco y muy despacio. El
       cuerpo se orienta con él —no sólo el avance—, así que el bicho cruza
       de verdad en diagonal en vez de deslizarse de lado. */
    const base = dir > 0 ? 0 : Math.PI;
    const ang = base + rango(p.rumbo || 0);
    return {
      dir, base, ang, angObj: ang,
      angProx: rango(p.cadaRumbo || [10, 20]),
      largo:  M.W * rango(p.largo),
      /* `grosor` es el SEMIgrosor del cuerpo y `onda` la amplitud de la
         ondulación: entre los dos salen el tercio de alto que ocupa */
      grosor: M.H * rango(p.grosor),
      onda:   M.H * rango(p.onda),
      k:      TAU * rango(p.ondas),
      vOnda:  rango(p.velOnda),
      /* EL MORRO ARRANCA EN EL CANTO: `x` es el morro y el cuerpo va
         DETRÁS, así que arrancarlo a un largo de distancia mete un cuerpo
         entero de espera muerta antes de que asome nada. */
      x:      dir > 0 ? -M.U : M.W + M.U,
      /* la franja por la que nada: la declara la escena y la usan los DOS
         sitios que la necesitan —el sorteo de aquí y el tope de más
         abajo—, así que no se pueden desalinear. */
      y:      rango(p.banda || [0.12, 0.88]) * M.H,
      vel:    rango(p.vel) * M.U,
      hondura: rango(p.hondura),
      fase:   Math.random()*TAU,
      /* UN COLOR POR TRAVESÍA, y lo usa TODO lo que emite: el ojo, el hilo
         de la cresta, los fotóforos y el filo de la caudal. La escena le da
         su propio espectro —rojo o morado—, así que la bestia no comparte
         paleta con el agua: es lo único que no es de aquí. */
      c:      M.color(p.paleta),
    };
  },
  actualiza(e, M, p, dt){
    /* LA ONDA VIAJA: esto es lo que separa un bicho de un recorte */
    e.fase += e.vOnda * dt;
    /* el rumbo se replantea cada tantos segundos alrededor de la
       horizontal, así que a lo largo de la travesía se compensa: una
       diagonal sostenida se saldría del cuadro antes de cruzar. */
    e.angProx -= dt;
    if (e.angProx <= 0){
      e.angObj  = e.base + rango(p.rumbo || 0);
      e.angProx = rango(p.cadaRumbo || [10, 20]);
    }
    e.ang += (e.angObj - e.ang) * Math.min(1, opt(p.velRumbo, 0.25)*dt);
    const ca = Math.cos(e.ang), sa = Math.sin(e.ang);
    /* y empuja: el avance late con el coletazo en vez de ser constante */
    const coletazo = Math.pow(Math.max(0, Math.sin(e.fase)), 2);
    const v = e.vel * (1 + opt(p.embestida, 0)*coletazo);
    e.x += ca * v * dt;
    /* la vertical, contenida a la misma franja: el cuerpo ondula ±`onda`
       alrededor de `y`, así que si `y` se va al canto media bestia se sale
       del cuadro */
    const bd = p.banda || [0.12, 0.88];
    e.y = clamp(e.y + sa*v*dt, M.H*bd[0], M.H*bd[1]);
    /* se va cuando ha salido la COLA, que va a un largo por detrás del
       morro EN EL SENTIDO DEL RUMBO */
    const colaX = e.x - e.largo*ca;
    if (ca > 0 ? colaX > M.W : colaX < 0) return false;

    const n = Math.max(6, p.segmentos|0);
    const plano = opt(p.plano, 0);
    const filo = p.filo || 1;
    /* `penumbra` agranda la elipse: su máximo cae en el espinazo, así que
       sin agrandarla la silueta de verdad queda donde el apagado ya se
       desvanece. */
    const pen = opt(p.penumbra, 1);
    const paso = e.largo/n;

    /* EL CUERPO */
    for (let i=0;i<n;i++){
      const s = (i+0.5)/n;
      const q = levPunto(e, s, _lvQ);
      const semi = e.grosor*levPerfil(s);
      const r = paso*1.25*pen;
      M.campos.push({ tipo:'apaga', plano, x:q[0], y:q[1],
                      r, ky: Math.max(0.05, semi*pen/r), rot: levAngulo(e, s),
                      fuerza: e.hondura, filo });
    }
    /* LA CRESTA. Espinas por encima del lomo, en campos aparte para que
       sierren el canto de arriba y dejen la panza lisa. Desiguales: una
       sierra regular se lee como decoración. Dónde va cada una lo dicen
       `levEspina` y `levAlta`, que comparte con `dibuja`. */
    const ne = p.espinas|0;
    for (let i=0;i<ne;i++){
      const s = levEspina(i, ne);
      const q = levPunto(e, s, _lvQ), ang = levAngulo(e, s);
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      const semi = e.grosor*levPerfil(s);
      const alta = levAlta(i) * opt(p.cresta, 0);
      const h = semi*(1 + alta);
      M.campos.push({ tipo:'apaga', plano,
                      x: q[0] - nx*h*0.55, y: q[1] - ny*h*0.55,
                      r: paso*0.55*pen, ky: Math.max(0.05, h*0.9*pen/(paso*0.55*pen)),
                      rot: ang, fuerza: e.hondura*0.9, filo });
    }
    /* LA QUIJADA, un lóbulo bajo el cráneo: es lo que convierte el morro
       en una cabeza con boca y no en una punta. */
    const qj = levPunto(e, 0.085, _lvQ), aj = levAngulo(e, 0.085);
    const semiJ = e.grosor*levPerfil(0.085);
    M.campos.push({ tipo:'apaga', plano,
                    x: qj[0] + Math.sin(aj)*semiJ*0.75,
                    y: qj[1] - Math.cos(aj)*semiJ*0.75,
                    r: e.largo*0.055*pen, ky: 0.85,
                    rot: aj + e.dir*0.25, fuerza: e.hondura, filo });
    /* Y LA CAUDAL, ahorquillada: dos lóbulos altos al final */
    const qc = levPunto(e, 0.985, _lvQ), ac = levAngulo(e, 0.985);
    const nxc = -Math.sin(ac), nyc = Math.cos(ac);
    for (const lado of [1, -1])
      M.campos.push({ tipo:'apaga', plano,
                      x: qc[0] + nxc*e.onda*0.30*lado,
                      y: qc[1] + nyc*e.onda*0.30*lado,
                      r: e.largo*0.045*pen, ky: 2.6,
                      rot: ac + 0.35*lado, fuerza: e.hondura*0.85, filo });
    return true;
  },
  dibuja(e, M, p, g){
    const br = p.brillo;
    if (!(br > 0.002)) return;
    const N = 40;

    /* ── EL HILO DE LA PANZA ──────────────────────────────────────
       EL CANTO DE ABAJO, y no el de arriba: el hilo va por el lado
       +normal del eje y las espinas del campo por el −normal, o sea que lo
       encendido es la panza y lo serrado y oscuro es el lomo.

       Es el detalle de color que mejor funciona de la bestia —un filo de
       luz por debajo hace que el hueco se lea como un cuerpo con panza y
       no como una mancha— y se apaga en los dos extremos, así que no se ve
       dónde empieza ni acaba. Sin `pico` porque la panza es LISA: serrar
       los dos cantos deja al bicho con forma de hoja de sierra. */
    const bx = [], by = [];
    for (let i=0;i<=N;i++){
      const s = i/N, q = levPunto(e, s, _lvQ), a = levAngulo(e, s);
      const semi = e.grosor*levPerfil(s);
      bx.push(q[0] - Math.sin(a)*semi);
      by.push(q[1] + Math.cos(a)*semi);
    }
    const gr = g.createLinearGradient(bx[0], by[0], bx[N], by[N]);
    gr.addColorStop(0.00, rgba(e.c.mid, 0));
    gr.addColorStop(0.18, rgba(e.c.mid, 0.55*br));
    gr.addColorStop(0.66, rgba(e.c.mid, 0.26*br));
    gr.addColorStop(1.00, rgba(e.c.mid, 0));
    g.strokeStyle = gr;
    g.lineWidth = Math.max(0.8, M.U*0.05);
    g.beginPath();
    for (let i=0;i<=N;i++) i ? g.lineTo(bx[i], by[i]) : g.moveTo(bx[i], by[i]);
    g.stroke();

    /* ── Y EL LOMO, QUE ES EL OTRO CANTO ─────────────────────────
       El de arriba no tenía nada de color: sólo la sierra oscura de los
       campos. Dos cosas, las dos flojas —lo que se pide es que la bestia
       siga siendo un hueco, no que se le dibuje el lomo—:

       1 · UN VELO ANCHO siguiendo el diente de sierra, en `glow`, que es
           el color más hondo de la entrada de paleta. Trazo gordo y alfa a
           la quinta parte del hilo de la panza: no es un filo, es que por
           encima del lomo el agua tiene un color que no es el suyo.
       2 · LA PUNTA DE CADA ESPINA encendida, y en las espinas DE VERDAD
           —las de `levEspina` y `levAlta`, las mismas que ponen los
           campos—. El halo va más chico que el de un fotóforo.

       Los dos multiplican a `brillo`, así que el mando de «leviatán · luz»
       a 0 los apaga con todo lo demás. */
    const ne = p.espinas|0, cre = opt(p.cresta, 0);
    const bl = br * opt(p.brilloLomo, 0);
    if (bl > 0.002){
      const lx = [], ly = [];
      for (let i=0;i<=N;i++){
        const s = i/N, q = levPunto(e, s, _lvQ), a = levAngulo(e, s);
        const semi = e.grosor*levPerfil(s)*levCresta(s, ne, cre);
        lx.push(q[0] + Math.sin(a)*semi);
        ly.push(q[1] - Math.cos(a)*semi);
      }
      const gl = g.createLinearGradient(lx[0], ly[0], lx[N], ly[N]);
      gl.addColorStop(0.00, rgba(e.c.glow, 0));
      gl.addColorStop(0.24, rgba(e.c.glow, 0.30*bl));
      gl.addColorStop(0.70, rgba(e.c.glow, 0.16*bl));
      gl.addColorStop(1.00, rgba(e.c.glow, 0));
      g.strokeStyle = gl;
      g.lineWidth = Math.max(1.2, M.U*0.30);
      g.beginPath();
      for (let i=0;i<=N;i++) i ? g.lineTo(lx[i], ly[i]) : g.moveTo(lx[i], ly[i]);
      g.stroke();
    }
    const be = br * opt(p.brilloEspinas, 0);
    if (be > 0.004)
      for (let i=0;i<ne;i++){
        const s = levEspina(i, ne);
        const q = levPunto(e, s, _lvQ), a = levAngulo(e, s);
        const h = e.grosor*levPerfil(s)*(1 + levAlta(i)*cre);
        const x = q[0] + Math.sin(a)*h, y = q[1] - Math.cos(a)*h;
        /* desacompasadas entre ellas y con el coletazo, como los fotóforos:
           una hilera de puntos a alfa fijo se lee como una costura */
        const pa = be*(0.35 + 0.65*Math.abs(Math.sin(M.t*0.38 + i*2.1 + e.fase)));
        pintaHalo(g, M, e.c, x, y, M.U*0.17, pa*0.26);
      }

    /* DOS HILERAS DE FOTÓFOROS por el costado, no una nube: es lo que
       apunta que hay un cuerpo con lados. El halo va chico —solapados se
       funden en un tubo luminoso, que es lo contrario de una sombra. */
    const nf = p.fotoforos|0;
    for (let i=0;i<nf;i++){
      const s = 0.12 + 0.74*reparte(i, nf);
      const q = levPunto(e, s, _lvQ), a = levAngulo(e, s);
      const semi = e.grosor*levPerfil(s);
      const lado = (i & 1) ? 0.55 : -0.42;
      const x = q[0] - Math.sin(a)*semi*lado, y = q[1] + Math.cos(a)*semi*lado;
      const pa = br*(0.28 + 0.72*Math.abs(Math.sin(M.t*0.5 + i*1.7 + e.fase)));
      pintaHalo(g, M, e.c, x, y, M.U*0.24, pa*0.30);
    }

    /* EL OJO, junto al cráneo. Un punto basta para que el resto del hueco
       se lea como cabeza, y es lo único que dice hacia dónde mira.

       Del mismo color que el resto de lo que emite pero con su propio
       brillo: es el punto que tiene que verse, así que hay que poder
       subirlo sin encender la cresta con él. `brilloOjo` multiplica al
       `brillo` general y no lo sustituye, para que el mando de «leviatán ·
       luz» a 0 lo apague también. */
    const bo = br * opt(p.brilloOjo, 0);
    if (bo > 0.004){
      const qo = levPunto(e, 0.075, _lvQ), ao = levAngulo(e, 0.075);
      const semiO = e.grosor*levPerfil(0.075);
      const ox = qo[0] - Math.sin(ao)*semiO*0.42;
      const oy = qo[1] + Math.cos(ao)*semiO*0.42;
      /* LATE, muy despacio y desacompasado del coletazo: un punto de alfa
         constante se lee como un píxel muerto y no como un ojo. */
      const lat = 0.70 + 0.30*Math.sin(M.t*0.42 + e.fase);
      pintaHalo(g, M, e.c, ox, oy, M.U*0.38, bo*lat);
      /* y el corazón, chico y quemado. Es lo mismo que hace la esca del
         rape: lo que convierte una mancha de color en un punto INTENSO es
         el núcleo, no el radio. */
      mancha(g, ox, oy, M.U*0.11, [
        [0.00, e.c.core, Math.min(1, 0.80*bo*lat)],
        [0.34, e.c.mid,  0.50*bo*lat],
        [1.00, e.c.mid,  0],
      ]);
    }

    const qc = levPunto(e, 0.99, _lvQ), ac = levAngulo(e, 0.99);
    const nxc = -Math.sin(ac), nyc = Math.cos(ac);
    g.strokeStyle = rgba(e.c.mid, Math.min(1, 0.30*br));
    g.lineWidth = Math.max(0.6, M.U*0.04);
    g.beginPath();
    for (const lado of [1, -1]){
      g.moveTo(qc[0] + nxc*e.onda*0.10*lado, qc[1] + nyc*e.onda*0.10*lado);
      g.lineTo(qc[0] + nxc*e.onda*0.52*lado, qc[1] + nyc*e.onda*0.52*lado);
    }
    g.stroke();
  },
});

/* La geometría del leviatán, fuera del evento porque la usan su `actualiza`
   —que coloca los campos— y su `dibuja` —que traza la cresta—, y escritas
   por separado se despegan. `s` va de 0 en el morro a 1 en la punta de la
   cola.

   `levPunto` escribe en el array que se le pasa y NO en uno compartido, que
   es el convenio de las quijadas del rape: `levAngulo` llama a `levPunto`
   dos veces, así que con un array común se pisaba el punto que acababa de
   pedir quien llamaba.

   LA ONDA VIAJA HACIA ATRÁS: el término es `s*k - fase` con `fase`
   creciendo, así que la cresta recorre el cuerpo del morro a la cola. Y se
   amortigua hacia la cabeza —el factor `(0.12 + 0.88*s²)`— porque un
   depredador lleva el cráneo estable y late con el cuerpo.

   EL CUERPO VA ORIENTADO CON EL RUMBO: el eje corre hacia atrás en el
   sentido contrario a `ang` y la ondulación es perpendicular a él. Con el
   eje clavado en la horizontal —como estaba— el bicho podía subir mientras
   cruzaba, pero seguía apuntando de lado. */
function levPunto(e, s, o){
  const ca = Math.cos(e.ang), sa = Math.sin(e.ang);
  const a = -s*e.largo;                    // hacia la cola
  const b = Math.sin(s*e.k - e.fase) * e.onda * (0.12 + 0.88*s*s);
  o[0] = e.x + a*ca - b*sa;
  o[1] = e.y + a*sa + b*ca;
  return o;
}
/* semigrosor del cuerpo en `s`, con el perfil descrito arriba */
function levPerfil(s){
  const morro  = s < 0.06 ? 0.45 + 0.55*(s/0.06) : 1;
  const cuerpo = Math.pow(1-s, 0.55);
  const cuello = 1 - 0.30*Math.exp(-Math.pow((s-0.19)/0.075, 2));
  const cola   = 1 - 0.55*Math.pow(Math.max(0, (s-0.62)/0.38), 1.6);
  return morro*cuerpo*cuello*cola;
}
/* ── LA CRESTA, EN UN SOLO SITIO ────────────────────────────────────
   Dónde va la espina `i` de las `n` y cuánto se levanta sobre el lomo. Lo
   comparten su `actualiza` —que pone los campos oscuros que sierran el
   canto— y su `dibuja` —que le enciende la punta a cada diente—, y por eso
   están aquí: escritas por separado se despegan y no coinciden ni en el
   número de dientes.

   `levCresta` es lo mismo pero muestreado en un `s` cualquiera, que es lo
   que hace falta para trazar el canto de arriba: el diente más cercano y
   su caída lineal hasta el valle. Cuesta `n` cuentas por muestra, o sea
   unas cuatrocientas por fotograma y sólo mientras hay un leviatán. */
const levEspina = (i, n) => 0.14 + 0.62*reparte(i, n);
const levAlta = i => 0.55 + 0.45*Math.abs(Math.sin(i*2.3 + 1.1));
function levCresta(s, n, cresta){
  if (!(n > 0) || !(cresta > 0)) return 1;
  const media = 0.62/n;
  let pico = 0;
  for (let i=0;i<n;i++){
    const d = Math.abs(s - levEspina(i, n))/media;
    if (d < 1) pico = Math.max(pico, levAlta(i)*(1 - d));
  }
  return 1 + cresta*pico;
}

const _lvA = [0,0], _lvB = [0,0];
function levAngulo(e, s){
  const h = 0.004;
  const a = levPunto(e, Math.max(0, s-h), _lvA);
  const b = levPunto(e, Math.min(1, s+h), _lvB);
  return Math.atan2(b[1]-a[1], b[0]-a[0]);
}
