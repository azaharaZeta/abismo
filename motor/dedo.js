import { ABISMO } from '../escena.js';
import { rnd } from './util.js';
import { V } from './estado.js';

/* ══════════════════════════════════════════════════════════════════
   EL DEDO
   Sólo contacto, nunca hover. Y NO DIBUJA NADA: la regla de la casa vale
   también para el que toca, así que el dedo pone luz sobre alguien o no
   se ve. Lo que se ve del gesto es el plancton —el fogonazo de las motas
   de debajo, y después el frente que se abre encendiendo lo que cruza—,
   de modo que la onda va por delante de la luz y la reacción queda
   detrás del dedo en vez de pegada a él.
   ══════════════════════════════════════════════════════════════════ */
const contactos = [];
/* por pointerId: con dos dedos, una sola variable hace que cada uno lea
   la posición del otro */
const ultimos = new Map();

const ondaR = k => k.rmax * (1 - Math.pow(1 - Math.min(1, k.t/k.vida), k.cre));
const ondaA = k => { const u = Math.min(1, k.t/k.vida);
                     return Math.pow(1-u, k.apa) * Math.min(1, u*14) * k.amp; };

function impulso(x, y){
  /* al desbordar se tira la onda menos viva, no la más vieja: en un
     barrido rápido todas son jóvenes y quitar la primera se ve */
  if (contactos.length >= V.topeOndas){
    let peor = 0, va = Infinity;
    for (let i=0;i<contactos.length;i++){
      const v = ondaA(contactos[i]);
      if (v < va){ va = v; peor = i; }
    }
    contactos.splice(peor, 1);
  }
  const D = ABISMO.dedo;
  contactos.push({
    x, y, t: 0,
    rmax: V.U*D.alcance * rnd(0.80, 1.22),
    vida: D.vida        * rnd(0.82, 1.22),
    lam:  V.U*D.frente  * rnd(0.84, 1.20),
    /* el fogonazo de debajo del dedo: hasta dónde llega y cuánto dura */
    r0:   V.U*D.radio   * rnd(0.85, 1.20),
    brote: D.brote      * rnd(0.80, 1.25),
    cre:  rnd(1.70, 2.20),            // cómo crece: cuánto frena
    apa:  rnd(1.45, 1.95),            // cómo se apaga
    amp:  rnd(0.80, 1.18),
  });
  alContacto(x, y);
}

/* Cuánto ENCIENDE el dedo en un punto, 0 a 1, y lo que más de las dos
   mitades de la onda: el FOGONAZO, un disco bajo el dedo que se apaga en
   menos de un segundo, y el FRENTE, que se abre y va prendiendo lo que
   cruza. Es lo único que queda del gesto, así que quien no lo consulte no
   se entera de que lo han tocado.

   Se consulta por MOTA, así que el descarte de dentro del bucle es la
   mitad del coste: con el tope lleno son 20 vueltas por mota. */
function luzDedo(x, y){
  let v = 0;
  for (let i=0;i<contactos.length;i++){
    const k = contactos[i];
    const dx = x-k.x, dy = y-k.y, d2 = dx*dx+dy*dy;
    const rr = ondaR(k), b = k.lam;
    const hi = rr+b > k.r0 ? rr+b : k.r0;
    if (d2 > hi*hi) continue;
    const d = Math.sqrt(d2);
    if (k.t < k.brote && d < k.r0){
      const q = (1 - d/k.r0) * (1 - k.t/k.brote);
      if (q > v) v = q;
    }
    const f = 1 - Math.abs(d - rr)/b;
    if (f > 0){
      const q = f * ondaA(k);
      if (q > v) v = q;
    }
  }
  return v > 1 ? 1 : v;
}

/* Cuánto empuja el frente de las ondas a un punto: [ox, oy, peso], la
   suma de las direcciones unitarias de cada una que lo alcanza,
   ponderada por lo cerca que está del frente. NO viene normalizado.
   `banda` es el grosor del frente; omitido, cada onda usa el suyo.

   Lo leen los dos que se mueven con el gesto, el banco y la medusa. El
   plancton NO: la nieve marina está en suspensión y del contacto sólo
   recibe luz (`luzDedo`). */
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
  const b = V.cv.getBoundingClientRect();
  return [e.clientX - b.left, e.clientY - b.top];
}
function cableaTacto(){
  V.cv.addEventListener('pointerdown', e => {
    const [x,y] = puntoCanvas(e);
    ultimos.set(e.pointerId, [x,y]);
    impulso(x,y);
  }, {passive:true});
  V.cv.addEventListener('pointermove', e => {
    const u = ultimos.get(e.pointerId);
    if (!u) return;                   // pasar por encima no cuenta
    const [x,y] = puntoCanvas(e);
    /* por distancia recorrida, no por tiempo: un barrido rápido deja
       ondas espaciadas, no cientos amontonadas */
    if (Math.hypot(x-u[0], y-u[1]) < V.U*ABISMO.dedo.paso) return;
    u[0] = x; u[1] = y;
    impulso(x,y);
  }, {passive:true});
  for (const ev of ['pointerup','pointercancel','pointerleave'])
    V.cv.addEventListener(ev, e => ultimos.delete(e.pointerId), {passive:true});
}

/* las ondas se apagan solas: cada una lleva su propia vida */
function envejeceOndas(dt){
  for (let i=contactos.length-1;i>=0;i--){
    const k = contactos[i];
    k.t += dt;
    if (k.t > k.vida) contactos.splice(i,1);
  }
}

/* El aviso de contacto lo cablea `arranca()` en motor/bucle.js: así el
   dedo no tiene que saber que existen los eventos, ni al revés. */
let alContacto = () => {};
function avisaContactos(fn){ alContacto = fn; }

export { luzDedo, empuje, cableaTacto, envejeceOndas, avisaContactos };
