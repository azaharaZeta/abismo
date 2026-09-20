import { M, evento } from '../motor.js';
const {rgba, clamp, rango, opt, TAU} = M;
import { mancha, pintaHalo, reparte } from '../bichos/comun.js';


/* ── EL LEVIATÁN ────────────────────────────────────────────────────
   Enorme y LEJOS, que no es lo mismo que grande en pantalla: el tamaño no
   lo da el encuadre, lo da la distancia —difuso, lento y con más detalle
   del que se llega a resolver.

   NO SE DIBUJA: se calla lo que hay. El cuerpo es una fila de campos
   `apaga` con el perfil de un animal, y un campo `apaga` además oscurece
   el agua (ver pintaSombras en motor/agua.js), que es lo único que hace
   que una masa oscura se pueda leer en una escena aditiva.

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
  arranca(M, p){
    const dir = Math.random() < 0.5 ? 1 : -1;
    /* EL RUMBO. `base` es el lado por el que cruza y `ang` el rumbo real,
       que se va apartando de la horizontal muy poco y muy despacio. El
       cuerpo se orienta con él —no sólo el avance—, así que el bicho cruza
       de verdad en diagonal en vez de deslizarse de lado. */
    const base = dir > 0 ? 0 : Math.PI;
    const ang = base + rango(opt(p.rumbo, 0));
    return {
      dir, base, ang, angObj: ang,
      angProx: rango(p.cadaRumbo),
      largo:  M.U * rango(p.largo),
      /* `grosor` es el SEMIgrosor del cuerpo y `onda` la amplitud de la
         ondulación: entre los dos salen el tercio de alto que ocupa */
      grosor: M.U * rango(p.grosor),
      onda:   M.U * rango(p.onda),
      k:      TAU * rango(p.ondas),
      vOnda:  rango(p.velOnda),
      /* EL MORRO ARRANCA EN EL CANTO: `x` es el morro y el cuerpo va
         DETRÁS, así que arrancarlo a un largo de distancia mete un cuerpo
         entero de espera muerta antes de que asome nada. */
      x:      dir > 0 ? -M.U : M.W + M.U,
      /* la franja por la que nada: la declara la escena y la usan los DOS
         sitios que la necesitan —el sorteo de aquí y el tope de más
         abajo—, así que no se pueden desalinear. */
      y:      rango(p.banda) * M.H,
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
      e.angObj  = e.base + rango(opt(p.rumbo, 0));
      e.angProx = rango(p.cadaRumbo);
    }
    e.ang += (e.angObj - e.ang) * Math.min(1, p.velRumbo*dt);
    const ca = Math.cos(e.ang), sa = Math.sin(e.ang);
    /* y empuja: el avance late con el coletazo en vez de ser constante */
    const coletazo = Math.pow(Math.max(0, Math.sin(e.fase)), 2);
    const v = e.vel * (1 + opt(p.embestida, 0)*coletazo);
    e.x += ca * v * dt;
    /* la vertical, contenida a la misma franja: el cuerpo ondula ±`onda`
       alrededor de `y`, así que si `y` se va al canto media bestia se sale
       del cuadro */
    const bd = p.banda;
    e.y = clamp(e.y + sa*v*dt, M.H*bd[0], M.H*bd[1]);
    /* se va cuando ha salido la COLA, que va a un largo por detrás del
       morro EN EL SENTIDO DEL RUMBO */
    const colaX = e.x - e.largo*ca;
    if (ca > 0 ? colaX > M.W : colaX < 0) return false;

    const n = Math.max(6, p.segmentos|0);
    const plano = p.plano;
    const filo = p.filo;
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
    const ne = p.espinas|0, cre = opt(p.cresta, 0);
    const W = levAncho(ne), Wpx = W*e.largo, lee = levLee(filo);
    for (let i=0;i<ne;i++){
      const t = levDiente(e, i, ne, cre, _lvD);
      if (!(t[2] > 0)) break;
      const q = levPunto(e, t[0], _lvQ), ang = levAngulo(e, t[0]);
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      /* una rebanada por tramo de altura, del ancho que `levPua` le da a
         su BASE: así la rebanada cabe entera bajo la curva */
      for (let j=0;j<LEV_LOB;j++){
        const u0 = j/LEV_LOB, u1 = (j+1)/LEV_LOB;
        const w = Math.max(0.05, levPuaInv(u0))*Wpx/lee;
        const c = t[1] + t[2]*(u0+u1)*0.5;
        const a = t[2]*(u1-u0)*0.5/lee;
        M.campos.push({ tipo:'apaga', plano,
                        x: q[0] - nx*c, y: q[1] - ny*c,
                        r: w, ky: Math.max(0.05, a/w),
                        rot: ang, fuerza: e.hondura*0.9, filo });
      }
    }
    /* ── LA QUIJADA, Y VA ENTREABIERTA ────────────────────────────
       Es lo que convierte el morro en una cabeza con boca. Va por el lado
       de la PANZA —el −normal del eje—, igual que el hilo y el ojo: por el
       otro es un bulto en el cráneo.

       Y ES UNA CADENA de lóbulos achatados (`ky` bajo) del morro a la
       charnela, HONDA EN LA PUNTA y cerrándose hacia atrás, que es una
       mandíbula BAJADA: la bisagra está detrás, así que lo que se separa
       al abrir la boca es el morro. Al revés —creciendo hacia la
       charnela— lo que cuelga es una papada.

       `quijada` de la escena escala lo que baja: a 0 no hay mandíbula y
       el bicho vuelve a acabar en punta. */
    const qd = opt(p.quijada, 0);
    if (qd > 0.004){
      const NQ = 5;
      for (let i=0;i<NQ;i++){
        const u = i/(NQ-1);                       // 0 la punta, 1 la charnela
        const s = levBocaS(u);
        const q = levPunto(e, s, _lvQ), a = levAngulo(e, s);
        /* el canto de ARRIBA de la mandíbula es el paladar más lo que
           abre; el lóbulo cuelga de ahí hacia fuera */
        const alto   = e.grosor*LEV_ALTO*qd;
        const dentro = e.grosor*(levPerfil(s) + levAbre(u)*qd);
        const hondo  = dentro + alto;
        const rq = e.largo*0.026*pen;
        M.campos.push({ tipo:'apaga', plano,
                        x: q[0] - Math.sin(a)*hondo,
                        y: q[1] + Math.cos(a)*hondo,
                        r: rq, ky: Math.max(0.05, alto*pen/rq),
                        rot: a + e.dir*0.10, fuerza: e.hondura, filo });
      }
    }
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
    const bp = br * opt(p.brilloPanza, 0);
    const gr = g.createLinearGradient(bx[0], by[0], bx[N], by[N]);
    gr.addColorStop(0.00, rgba(e.c.mid, 0));
    gr.addColorStop(0.18, rgba(e.c.mid, 0.55*bp));
    gr.addColorStop(0.66, rgba(e.c.mid, 0.26*bp));
    gr.addColorStop(1.00, rgba(e.c.mid, 0));
    if (bp > 0.002){
      g.strokeStyle = gr;
      g.lineWidth = Math.max(0.8, M.U*0.05);
      g.beginPath();
      for (let i=0;i<=N;i++) i ? g.lineTo(bx[i], by[i]) : g.moveTo(bx[i], by[i]);
      g.stroke();
    }

    /* ── LOS DIENTES ──────────────────────────────────────────────
       La boca va entreabierta, y eso NO SE PUEDE DIBUJAR: el hueco entre
       las quijadas es agua, el agua aquí es negra y un hueco negro entre
       dos masas negras no lo ve nadie. Lo que dice que hay una boca son
       los dientes, y por eso son lo único encendido de la cabeza además
       del ojo.

       Cruzados —uno del paladar, el siguiente de la quijada— y menguando
       hacia la charnela, que es donde la boca se cierra. Salen de la
       MISMA `levAbre` que talla el campo: con dos cuentas distintas se
       quedan flotando fuera de la boca. */
    const bd = br * opt(p.brilloDientes, 0);
    const nd = p.dientes|0, qd = opt(p.quijada, 0);
    if (bd > 0.004 && nd > 0 && qd > 0.004){
      for (let i=0;i<nd;i++){
        /* por donde la boca está ABIERTA y no por toda ella: junto a la
           charnela el hueco es de un píxel y el diente no se ve */
        const u = 0.06 + 0.72*(i + 0.5)/nd;
        const s = levBocaS(u);
        const q = levPunto(e, s, _lvQ), a = levAngulo(e, s);
        const nx = -Math.sin(a), ny = Math.cos(a);   // hacia la panza
        const tx =  Math.cos(a), ty = Math.sin(a);   // a lo largo del eje
        const paladar = e.grosor*levPerfil(s);       // el canto del cráneo
        const abre    = e.grosor*levAbre(u)*qd;      // lo que separa ahí
        const arriba  = (i & 1) === 0;
        const base  = arriba ? paladar : paladar + abre;
        const hacia = arriba ? 1 : -1;               // hacia dentro de la boca
        /* el diente mide una parte de lo que abre la boca, así que nunca
           la cruza ni se sale, y mengua solo hacia la charnela */
        const largo = abre*0.62;
        const ancho = Math.max(e.grosor*0.035, largo*0.40);
        const x0 = q[0] + nx*base, y0 = q[1] + ny*base;
        g.fillStyle = rgba(e.c.mid, bd*(0.55 - 0.38*u));
        g.beginPath();
        g.moveTo(x0 - tx*ancho, y0 - ty*ancho);
        g.lineTo(x0 + tx*ancho, y0 + ty*ancho);
        g.lineTo(x0 + nx*hacia*largo, y0 + ny*hacia*largo);
        g.closePath();
        g.fill();
      }
    }

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
    const W = levAncho(ne);          // en `s`, que es como mide levLomo
    if (bl > 0.002){
      /* y no en `s` regular: en las de `levLomoS`, que aprietan las
         muestras en la punta, que es donde el colmillo hace esquina */
      const ss = levLomoS(ne, N), nl = ss.length - 1;
      const lx = [], ly = [];
      for (let i=0;i<=nl;i++){
        const s = ss[i], q = levPunto(e, s, _lvQ), a = levAngulo(e, s);
        const semi = levLomo(e, s, ne, cre, W);
        lx.push(q[0] + Math.sin(a)*semi);
        ly.push(q[1] - Math.cos(a)*semi);
      }
      const gl = g.createLinearGradient(lx[0], ly[0], lx[nl], ly[nl]);
      gl.addColorStop(0.00, rgba(e.c.glow, 0));
      gl.addColorStop(0.24, rgba(e.c.glow, 0.30*bl));
      gl.addColorStop(0.70, rgba(e.c.glow, 0.16*bl));
      gl.addColorStop(1.00, rgba(e.c.glow, 0));
      g.strokeStyle = gl;
      g.lineWidth = Math.max(1.2, M.U*0.30);
      g.beginPath();
      for (let i=0;i<=nl;i++) i ? g.lineTo(lx[i], ly[i]) : g.moveTo(lx[i], ly[i]);
      g.stroke();
    }
    const be = br * opt(p.brilloEspinas, 0);
    if (be > 0.004)
      for (let i=0;i<ne;i++){
        const s = levEspina(i, ne);
        const q = levPunto(e, s, _lvQ), a = levAngulo(e, s);
        /* en el mismo canto que traza el velo y que talla la sombra */
        const h = levLomo(e, s, ne, cre, W);
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
      /* ARRIBA DEL EJE, no debajo: el ojo de un depredador va en el tercio
         alto del cráneo. Colgado al 42 % hacia la panza caía justo encima
         de la quijada, y lo que se leía era un ojo en la barbilla. Ahora
         va por el lado del LOMO —el +normal, al revés que el hilo— y algo
         más adelante, donde el cráneo ya tiene grosor y la cresta todavía
         no ha empezado (la primera espina cae en 0,14). */
      const qo = levPunto(e, 0.068, _lvQ), ao = levAngulo(e, 0.068);
      const semiO = e.grosor*levPerfil(0.068);
      const ox = qo[0] + Math.sin(ao)*semiO*0.30;
      const oy = qo[1] - Math.cos(ao)*semiO*0.30;
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
/* ── LA BOCA, en tres cuentas ───────────────────────────────────────
   `levBocaS` es dónde cae, en `s`, el punto `u` de la boca —0 la punta
   del morro, 1 la charnela—. `levAbre` es CUÁNTO SE SEPARAN las dos
   quijadas ahí, en veces `grosor`: todo en la punta y nada en la
   charnela, que es una mandíbula BAJADA —la bisagra está detrás, así que
   lo que se separa es el morro—. Al revés, creciendo hacia atrás, lo que
   cuelga es una papada.

   Y ES LINEAL porque una bisagra lo es: el hueco entre dos quijadas
   crece con la distancia al eje del giro y no de otra manera. Con una
   potencia por encima de 1 la boca se cierra demasiado pronto y los
   dientes de atrás se quedan en un píxel.

   Y LA MANDÍBULA SE MIDE CONTRA EL PALADAR, o sea contra `levPerfil`, y
   NO contra el eje. El morro se afila, así que cerca de la punta el
   semigrosor del cuerpo es 0,4 y en la charnela 0,85: una quijada medida
   desde el eje se mete DENTRO de la cabeza justo donde la boca tiene que
   abrirse, y lo que sale son dientes flotando por dentro del cráneo.

   Las tres las usan dos sitios —el campo que talla la quijada y los
   dientes que la marcan—, y con cuentas distintas los dientes se quedan
   fuera de la boca. */
const levBocaS = u => 0.012 + 0.105*u;
const levAbre  = u => 0.40*(1 - u);
const LEV_ALTO = 0.30;        // semigrosor de la mandíbula, en `grosor`

/* semigrosor del cuerpo en `s`, con el perfil descrito arriba */
function levPerfil(s){
  /* EL MORRO, y va LARGO y con la potencia por debajo de 1: sube deprisa
     y luego se aplana, que es un hocico —fino en la punta y ya ancho al
     llegar al cráneo—. A 0,45 sobre 0,06 de eslora era un bulbo del mismo
     grosor que el cuerpo: lo que se leía en la silueta era una bala. */
  const morro  = s < 0.11 ? 0.20 + 0.80*Math.pow(s/0.11, 0.62) : 1;
  const cuerpo = Math.pow(1-s, 0.55);
  const cuello = 1 - 0.30*Math.exp(-Math.pow((s-0.19)/0.075, 2));
  const cola   = 1 - 0.55*Math.pow(Math.max(0, (s-0.62)/0.38), 1.6);
  return morro*cuerpo*cuello*cola;
}
/* Dónde va la espina `i` de las `n` y cuánto se levanta sobre el lomo:
   los dos ladrillos con los que se construye la cresta, aquí abajo. */
const levEspina = (i, n) => 0.14 + 0.62*reparte(i, n);
const levAlta = i => 0.55 + 0.45*Math.abs(Math.sin(i*2.3 + 1.1));

/* ── EL COLMILLO, Y SE DEFINE UNA SOLA VEZ ──────────────────────────
   `levPua` ES LA CRESTA: la altura del diente a la distancia `d` de su
   eje, de 0 en el valle a 1 en la punta. De aquí salen las TRES cosas
   que tocan el canto de arriba, y por eso la luz no puede ir a un sitio
   distinto que la sombra:

     · `actualiza` · la cadena de elipses que lo talla
     · `levLomo`   · el canto que traza el velo de color
     · el halo     · la punta encendida de cada diente

   ES EL CUADRADO Y NO OTRA COSA. Con una elipse por diente salían
   cúpulas —alto y ancho parecidos, punta redonda—, que es una ubre. Con
   caída lineal salían palos, cuñas de lados rectos. El cuadrado da lo
   que hace falta: base ancha que arranca del lomo y punta de aguja, con
   los lados metidos hacia dentro. A media altura el diente mide ya el
   29 % de su base.

   `levPuaInv` es su INVERSA —a qué distancia del eje queda la altura
   `u`— y se escribe al lado a propósito: es la que necesita la sombra
   para saber de qué ancho hacer cada rebanada. */
const levPua    = d => { const a = 1 - Math.abs(d); return a > 0 ? a*a : 0; };
const levPuaInv = u => 1 - Math.sqrt(u < 0 ? 0 : u > 1 ? 1 : u);

/* EL SEMIANCHO DE UN DIENTE ES MEDIA SEPARACIÓN, así que los dientes se
   tocan base con base y el canto sale una sierra continua y no una
   hilera de pinchos sueltos con lomo liso entre ellos. */
const levAncho = n => n > 1 ? 0.62/(2*(n-1)) : 0.31;

/* HASTA DÓNDE LLEGA UN CAMPO, en veces su semieje: el apagado entra como
   pow(1 − d/r, 1/filo) y deja de leerse como masa por debajo de 0,45,
   que es el umbral con el que está ajustado el tamaño en la escena. O
   sea `1 − 0,45^filo`, que con `filo` 2,2 son 0,83. Se divide por él al
   armar cada elipse para que el CONTORNO caiga donde dice `levPua` y no
   el radio entero. */
const levLee = filo => 1 - Math.pow(0.45, filo);

/* CUÁNTAS REBANADAS APROXIMAN EL COLMILLO. Una elipse no puede tener los
   lados cóncavos, así que la sombra lo trocea en rebanadas del ancho que
   el colmillo tiene a esa altura. La cadena queda siempre POR DEBAJO de
   la curva —nunca la desborda—, y de ahí sale gratis que el velo pase por
   el canto o por fuera y jamás hundido en la masa.

   Con cuatro el escalón peor entre rebanadas es el 16 % del alto del
   diente: a tamaño de móvil son cinco píxeles y se los traga el
   desvanecido del campo. Subirlo cuesta diez campos por rebanada. */
const LEV_LOB = 4;

const _lvD = [0,0,0];
/* el diente `i`: [su `s`, el semigrosor del lomo ahí, lo que sobresale] */
function levDiente(e, i, ne, cre, o){
  const s = levEspina(i, ne);
  o[0] = s;
  o[1] = e.grosor*levPerfil(s);
  o[2] = o[1]*levAlta(i)*cre;
  return o;
}
/* el canto de arriba en un `s` cualquiera, que es el cuerpo o el diente
   que le pille encima */
function levLomo(e, s, ne, cre, W){
  let borde = e.grosor*levPerfil(s);
  if (!(ne > 0) || !(cre > 0)) return borde;
  for (let i=0;i<ne;i++){
    const d = (s - levEspina(i, ne))/W;
    if (d*d >= 1) continue;
    const t = levDiente(e, i, ne, cre, _lvD);
    const v = t[1] + t[2]*levPua(d);
    if (v > borde) borde = v;
  }
  return borde;
}

/* ── DÓNDE MUESTREAR EL CANTO DE ARRIBA ─────────────────────────────
   Una sierra no se traza con muestras a intervalos regulares: con las
   del cuerpo tocan menos de tres por diente y el trazo coge cada uno en
   una fase distinta. A la base uniforme se le añade cada diente
   muestreado APRETANDO HACIA LA PUNTA, que es donde el colmillo hace
   esquina; la falda no la necesita porque llega al lomo con pendiente
   cero. Los `s` salen de `levEspina` y `levAncho`, los mismos que usa
   `levLomo`: por construcción no se pueden desalinear.

   Se cachea por número de espinas: la lista no depende de la travesía. */
const LEV_FALDA = [0, 0.05, 0.12, 0.24, 0.42, 0.66, 1];
const _lomoS = new Map();
function levLomoS(n, N){
  const clave = n + 'x' + N;
  let ss = _lomoS.get(clave);
  if (ss) return ss;
  ss = [];
  for (let i=0;i<=N;i++) ss.push(i/N);
  const w = levAncho(n);
  for (let i=0;i<n;i++){
    const s = levEspina(i, n);
    for (const u of LEV_FALDA){
      ss.push(clamp(s - u*w, 0, 1));
      if (u) ss.push(clamp(s + u*w, 0, 1));
    }
  }
  ss.sort((a,b) => a-b);
  _lomoS.set(clave, ss);
  return ss;
}

const _lvA = [0,0], _lvB = [0,0];
/* SIEMPRE HACIA LA DERECHA, y no de morro a cola: de este ángulo lo que se
   usa es su NORMAL (−sen, cos), y de ella salen el lado de la panza —el
   hilo encendido, la quijada, el ojo— y el del lomo —la cresta oscura—.
   Atada al morro se da la vuelta al cruzar en el otro sentido y el bicho
   sale boca abajo. Cruzando hacia la derecha el cuerpo va DETRÁS del
   morro, así que ahí la tangente de morro a cola apunta a la izquierda y
   hay que invertirla. */
function levAngulo(e, s){
  const h = 0.004;
  const a = levPunto(e, Math.max(0, s-h), _lvA);
  const b = levPunto(e, Math.min(1, s+h), _lvB);
  return e.dir > 0 ? Math.atan2(a[1]-b[1], a[0]-b[0])
                   : Math.atan2(b[1]-a[1], b[0]-a[0]);
}
