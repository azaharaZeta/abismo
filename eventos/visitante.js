import { M, evento } from '../motor.js';
const {rgba, rnd, rango, rangoE, opt, TAU} = M;
import { pintaHalo } from '../bichos/comun.js';

/* ── EL VISITANTE ───────────────────────────────────────────────────
   Algo grande cruza el plano del fondo y no vuelve. No emerge de nada, no
   persigue nada y no reacciona a nada: eso es un evento y no un bicho.

   Es un poliqueto: una cadena de cuentas con halo por el lomo —el halo
   tiene que ser bastante más ancho que la separación o se cuentan una a
   una y parece un collar— más lo que lo saca de ser un gusano de bolitas:
   el espinazo que las une, un par de parapodios por segmento que remando
   van una fase por detrás de la ondulación del cuerpo, dos antenas y un
   filamento de cola. Todo son puntos y trazos de luz, que es el único
   vocabulario que tiene esta pieza.

   ── Y NO PASA DOS VECES EL MISMO ────────────────────────────────────
   Lo que se sortea por travesía no es sólo el tamaño, son las
   PROPORCIONES, que es lo que hace que parezca otro animal y no el mismo
   más grande: ver `merma`, `panza`, `cuentas` y `variedad` en la escena. */
/* la gana con la que sale un apéndice en ESTA travesía. Asimétrico a
   propósito, porque lo que hace falta es que con `variedad` alta alguna
   travesía se quede a 0: un poliqueto sin parapodios ya es otro animal. */
const apendice = v => Math.max(0, 1 + rnd(-1.4, 1)*(v || 0));

/* un punto del cuerpo, su normal y las dos puntas de las antenas. Fuera
   del `dibuja` como el resto de los del fichero. */
const _vsP = [0,0], _vsN = [0,0], _ant = [0,0,0,0];

evento('visitante', {
  exclusivo: false,
  cada: [45, 110], primero: [15, 40],
  prueba: { cruce: [22, 34], cuentas: [18, 40], largo: [0.30, 0.55],
            onda: [0.045, 0.115], grosor: [0.40, 0.78], brillo: 0.30,
            merma: [0.18, 0.70], panza: [0, 0.42], variedad: 0.75, plano: 0,
            patas: 0.9, antenas: 1.5, cola: 1.6 },
  arranca(M, p){
    const v = opt(p.variedad, 0);
    return {
      dir: Math.random() < 0.5 ? 1 : -1,
      dur:   rango(p.cruce),
      y:     rnd(M.H*0.22, M.H*0.80),
      amp:   M.H*rango(p.onda),
      largo: M.W*rango(p.largo),
      nOnda: rnd(2.6, 4.2), vel: rnd(0.45, 0.70),
      /* `n` se sortea aquí y no en la escena a secas porque con el largo ya
         sorteado lo que cambia es la SEPARACIÓN entre cuentas. Tope por
         abajo a 6, que con menos no hay cadena. */
      n:     Math.max(6, rangoE(p.cuentas)|0),
      base:  M.U*rango(p.grosor),
      merma: rango(p.merma || 0.5),
      panza: rango(p.panza || 0),
      kPatas: apendice(v), kAntenas: apendice(v), kCola: apendice(v),
      c: M.color(p.paleta),
    };
  },
  actualiza(e, M, p){ return e.t < e.dur; },
  dibuja(e, M, p, g){
    const u = e.t/e.dur;
    const N = e.n, span = M.W + e.largo*2;
    const headX = e.dir > 0 ? -e.largo + u*span : M.W + e.largo - u*span;
    const fade = Math.sin(u*Math.PI);          // entra y sale con un seno
    const base = e.base;
    const br = p.brillo*fade;
    if (br < 0.004) return;
    /* la gana de cada apéndice EN ESTA TRAVESÍA: la de la escena es el
       tope, y `variedad` es lo que la abre bicho a bicho */
    const gPatas   = p.patas   * e.kPatas;
    const gAntenas = p.antenas * e.kAntenas;
    const gCola    = p.cola    * e.kCola;

    /* el punto `s` del cuerpo, 0 en la cabeza y 1 en la cola. La ondulación
       crece hacia atrás: la cabeza marca el rumbo y la cola lo obedece. */
    const pt = (s) => {
      _vsP[0] = headX - e.dir*s*e.largo;
      _vsP[1] = e.y + Math.sin(s*e.nOnda + e.t*e.vel)*e.amp*(0.35 + s*0.65);
      return _vsP;
    };
    /* la normal del cuerpo en `s`, por diferencias finales: la analítica de
       esta curva es fácil de escribir y fácil de desincronizar del `pt` de
       arriba, y entonces las patas salen del sitio equivocado. */
    const nrm = (s) => {
      const h = 0.01;
      const a = pt(Math.max(0, s-h)), ax = a[0], ay = a[1];
      const b = pt(Math.min(1, s+h)), bx = b[0], by = b[1];
      const dx = bx-ax, dy = by-ay, d = Math.hypot(dx, dy) || 1;
      _vsN[0] = -dy/d; _vsN[1] = dx/d;
      return _vsN;
    };
    /* EL PERFIL, y es lo que de verdad cambia de bicho a bicho. `merma`
       adelgaza hacia la cola —a 0,18 es un tubo, a 0,70 un cono— y `panza`
       le mete un bulto con el máximo a un 37 % del morro, que es donde lo
       tiene un huso. Con `panza` a 0 sale el cono de siempre. De aquí salen
       también el radio de las cuentas y el largo de los parapodios, así que
       el bicho engorda entero y no sólo por el espinazo. */
    const grosor = s => base * (1 - s*e.merma)
                        * (1 + e.panza*Math.sin(Math.PI*Math.pow(s, 0.7)));

    /* EL ESPINAZO, primero y flojo: es lo que hace que la fila de cuentas
       se lea como un cuerpo y no como un collar. */
    g.strokeStyle = rgba(e.c.mid, Math.min(1, 0.22*br));
    g.lineWidth = base*0.9;
    g.beginPath();
    for (let i=0;i<N;i++){
      const q = pt(i/(N-1));
      i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]);
    }
    g.stroke();

    /* LOS PARAPODIOS. Un par por segmento, y van UNA FASE POR DETRÁS de la
       ondulación del cuerpo: es lo que se lee como remar en vez de como
       flecos pegados. Se saltan la cabeza y la punta de la cola, donde un
       poliqueto no los tiene. */
    if (gPatas > 0.01){
      g.strokeStyle = rgba(e.c.mid, Math.min(1, 0.30*br));
      g.lineWidth = Math.max(0.5, base*0.30);
      g.beginPath();
      for (let i=0;i<N;i++){
        const s = i/(N-1);
        if (s < 0.06 || s > 0.94) continue;
        const q = pt(s), qx = q[0], qy = q[1];
        const n = nrm(s), nx = n[0], ny = n[1];
        /* el remo: la fase retrasada da el barrido, y el largo sigue al
           grosor del cuerpo, así que se acortan hacia la cola */
        const rem = Math.sin(s*e.nOnda + e.t*e.vel - 0.9);
        const l = grosor(s)*gPatas*(1.7 + 0.9*rem);
        const sesgo = -e.dir*grosor(s)*0.5*rem;   // se echan hacia atrás
        for (const lado of [1, -1]){
          g.moveTo(qx, qy);
          g.lineTo(qx + nx*l*lado + sesgo, qy + ny*l*lado);
        }
      }
      g.stroke();
    }

    /* LAS CUENTAS, que es lo que de verdad se ve de lejos */
    for (let i=0;i<N;i++){
      const s = i/(N-1);
      const q = pt(s), x = q[0], y = q[1];
      const r = grosor(s);
      /* las impares un poco más chicas: el cuerpo se lee segmentado en vez
         de como un tubo de cuentas iguales */
      const seg = (i & 1) ? 0.72 : 1;
      const R = r*6.5*seg, cola = 1 - s*0.45;
      pintaHalo(g, M, e.c, x, y, R, br*cola*seg);
      g.fillStyle = rgba(e.c.core, Math.min(1, br*0.70*cola*seg));
      g.beginPath(); g.arc(x, y, r*0.42*seg, 0, TAU); g.fill();
    }

    /* LA CABEZA: dos antenas por delante del morro, abiertas en V. Es lo
       único que declara por dónde va, y sin ellas el bicho es reversible. */
    if (gAntenas > 0.01){
      const q = pt(0), hx = q[0], hy = q[1];
      const n = nrm(0), nx = n[0], ny = n[1];
      const l = base*gAntenas*2.2;
      const vai = Math.sin(e.t*e.vel*1.7)*0.30;
      g.strokeStyle = rgba(e.c.mid, Math.min(1, 0.34*br));
      g.lineWidth = Math.max(0.5, base*0.26);
      /* la punta de cada antena se calcula UNA vez y se guarda: la quieren
         el trazo y el punto de luz de abajo, y tener la fórmula escrita
         dos veces es la manera de que un día se despeguen y la luz deje de
         estar en la punta de la antena. */
      g.beginPath();
      for (let k=0;k<2;k++){
        const lado = k ? -1 : 1;
        _ant[k*2]   = hx - e.dir*l*0.85 + nx*l*0.45*lado;
        _ant[k*2+1] = hy + ny*l*0.45*lado + vai*l*0.25*lado;
        g.moveTo(hx, hy);
        g.quadraticCurveTo(hx - e.dir*l*0.5, hy + ny*l*0.18*lado,
                           _ant[k*2], _ant[k*2+1]);
      }
      g.stroke();
      /* y la punta de cada antena enciende, como la barbilla del rape */
      const pr = Math.max(0.6, base*0.34);
      g.fillStyle = rgba(e.c.core, Math.min(1, 0.55*br));
      g.beginPath();
      for (let k=0;k<2;k++){
        const ex = _ant[k*2], ey = _ant[k*2+1];
        g.moveTo(ex + pr, ey);
        g.arc(ex, ey, pr, 0, TAU);
      }
      g.fill();
    }

    /* Y EL FILAMENTO DE LA COLA, que se apaga antes de acabar: un cuerpo
       que termina en seco se lee cortado. */
    if (gCola > 0.01){
      const q = pt(1), tx = q[0], ty = q[1];
      const n = nrm(1), nx = n[0], ny = n[1];
      const l = base*gCola*4;
      const cx = tx + e.dir*l*0.45 + nx*l*0.5;
      const cy = ty + ny*l*0.5;
      const fx = tx + e.dir*l, fy = ty + Math.sin(e.t*e.vel*1.3)*l*0.35;
      const gr = g.createLinearGradient(tx, ty, fx, fy);
      gr.addColorStop(0.00, rgba(e.c.mid, Math.min(1, 0.26*br)));
      gr.addColorStop(1.00, rgba(e.c.mid, 0));
      g.strokeStyle = gr;
      g.lineWidth = Math.max(0.4, base*0.22);
      g.beginPath();
      g.moveTo(tx, ty);
      g.quadraticCurveTo(cx, cy, fx, fy);
      g.stroke();
    }
  },
});
