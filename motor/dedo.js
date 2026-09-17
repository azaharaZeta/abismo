import { ABISMO } from '../escena.js';
import { TAU, rgba, clamp, rnd, rango, mezcla } from './util.js';
import { V } from './estado.js';
import { eligeDePaleta } from './color.js';

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
  if (contactos.length >= V.topeOndas){
    let peor = 0, va = Infinity;
    for (let i=0;i<contactos.length;i++){
      const v = ondaA(contactos[i]);
      if (v < va){ va = v; peor = i; }
    }
    contactos.splice(peor, 1);
  }
  const D = ABISMO.dedo, p = eligeDePaleta(ABISMO.paleta);
  contactos.push({
    x, y, t: 0,
    c:    mezcla(D.color, p.mid, rango(D.tinte)),
    rmax: V.U*D.alcance * rnd(0.80, 1.22),
    vida: D.vida      * rnd(0.82, 1.22),
    lam:  V.U*D.alcance*0.26 * rnd(0.84, 1.20),
    cre:  rnd(1.70, 2.20),            // cómo crece: cuánto frena
    apa:  rnd(1.45, 1.95),            // cómo se apaga
    amp:  rnd(0.80, 1.18),
    cola: rnd(0.60, 1.25),            // peso de las crestas traseras
    ovalo:rnd(0.84, 1.16),
    giro: Math.random()*TAU,
  });
  alContacto(x, y);
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
    /* por distancia recorrida, no por tiempo: un barrido rápido deja ondas
       espaciadas, no cientos amontonadas */
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

export { dibujaOndas, empuje, cableaTacto, envejeceOndas,
         avisaContactos };
