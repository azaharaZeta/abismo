/* ══════════════════════════════════════════════════════════════════
   LA SILUETA DE PEZ
   La geometría de la forma que el banco adopta cuando algo lo ordena.
   Vive aparte porque la comparten los dos lados: el superpez la define
   y cada pez linterna lee en ella el puesto que le toca.
   ══════════════════════════════════════════════════════════════════ */
import { M } from '../motor.js';
const {clamp} = M;

/* ── LA SILUETA ─────────────────────────────────────────────────────
   Un pez, en coordenadas propias: el morro en x = −0,5, la base de la cola
   en x = +0,5 y la horquilla por detrás. `anchoPez` es el semiancho, y el
   exponente 0,62 pone el máximo a un tercio del morro —que es donde un pez
   es más ancho—: con `sin(π·s)` pelado cae en el centro y sale un puro. */
/* `gordo` es lo redonda que sale ESTA silueta, y lo sortea cada superpez.
   Multiplica al semiancho y nada más, así que el morro, la cintura y la
   cola siguen donde estaban. */
const anchoPez = (s, gordo) =>
  0.30*(gordo || 1)*Math.pow(Math.sin(Math.PI*Math.pow(clamp(s,0,1),0.62)), 0.85);

/* El contorno recorrido: `u` de 0 a 1 da la vuelta entera. Los tramos son
   canto de arriba (42 %), horquilla de la cola (16 %) y canto de abajo
   (42 %) —el reparto es el que hace que la cola tenga peces suficientes
   para leerse: a menos del 15 % la horquilla se queda en dos puntos. */
function contornoPez(u, o, gordo){
  if (u < 0.42){
    const s = u/0.42;
    o[0] = -0.5 + s; o[1] = -anchoPez(s, gordo);
  } else if (u < 0.58){
    /* la horquilla, en tres tramos rectos: punta de arriba, muesca del
       centro y punta de abajo */
    /* la horquilla crece con el cuerpo: una cola de pez plano es ancha */
    const h = 0.27*(0.55 + 0.45*(gordo || 1));
    const v = (u - 0.42)/0.16;
    if (v < 0.34){ const k = v/0.34;
      o[0] = 0.5 + 0.20*k; o[1] = -h*k; }
    else if (v < 0.66){ const k = (v-0.34)/0.32;
      /* pasa por la muesca, que es lo que la hace horquilla y no abanico */
      const mx = 0.56, my = 0;
      o[0] = k < 0.5 ? 0.70 + (mx-0.70)*(k/0.5) : mx + (0.70-mx)*((k-0.5)/0.5);
      o[1] = k < 0.5 ? -h + (my+h)*(k/0.5) : my + h*((k-0.5)/0.5); }
    else { const k = (v-0.66)/0.34;
      o[0] = 0.70 - 0.20*k; o[1] = h*(1-k); }
  } else {
    const s = 1 - (u - 0.58)/0.42;
    o[0] = -0.5 + s; o[1] = anchoPez(s, gordo);
  }
  return o;
}

/* El sitio de ESTE pez dentro de la silueta, en mundo. Sale de su `orden`,
   que no cambia nunca, así que el reparto es estable y la forma no hierve.

   El 88 % va al CONTORNO y el resto al relleno: un contorno pelado de
   sesenta peces se lee como un alambre, y relleno del todo se lee como una
   mancha. El relleno usa el `oy` del bicho para el lado, así que tampoco
   se alinean en fila.                                                */
const _cp = [0,0], _cq = [0,0];
const CONTORNO = 0.88;          // qué parte del banco va al canto
function formaObjetivo(d, z, o){
  const t = z.orden;
  let lx, ly, tg;
  if (t < CONTORNO){
    const u = t/CONTORNO;
    contornoPez(u, _cp, d.gordo);
    lx = _cp[0]; ly = _cp[1];
    /* LA TANGENTE DEL CANTO, por diferencias. Es lo que de verdad hace que
       la silueta se lea: con todos los peces paralelos al rumbo, un canto
       hecho de rayitas de 40 px se lee como una fila de guiones y no como
       una línea. Puestos A LO LARGO del canto, el contorno se cierra. */
    contornoPez((u + 0.012) % 1, _cq, d.gordo);
    tg = Math.atan2(_cq[1] - _cp[1], -(_cq[0] - _cp[0]));
  } else {
    /* el relleno: un punto estable dentro del cuerpo, y de morro al rumbo
       como el resto del banco */
    const s = 0.10 + 0.74*((t - CONTORNO)/(1 - CONTORNO));
    lx = -0.5 + s; ly = z.oy*anchoPez(s, d.gordo)*0.80;
    tg = 0;
  }
  /* EL MORRO VA DELANTE. `contornoPez` está escrito con el morro en el
     local −0,5 porque es como se lee una silueta de izquierda a derecha,
     pero el eje +x del bicho es su rumbo: sin este signo el pez nadaba de
     espaldas, con la cola por delante y el morro arrastrando. */
  lx = -lx;
  const ca = Math.cos(d.ang), sa = Math.sin(d.ang);
  o[0] = d.cx + (lx*ca - ly*sa)*d.esc;
  o[1] = d.cy + (lx*sa + ly*ca)*d.esc;
  o[2] = d.ang + tg;
  return o;
}

/* EL LARGO QUE CABE. Se prueban escalas de mayor a menor y se devuelve la
   primera en la que al menos el 87 % de una muestra del contorno cae dentro
   del cuadro. El resto que se admite fuera es a propósito: un pez al que no
   se le ve la punta de la cola sigue siendo un pez, y exigir el 100 % lo
   dejaba siempre en el mínimo.

   Se mide por muestreo y no con geometría porque el contorno no es una
   elipse y el ángulo es cualquiera: probar 24 puntos es más corto de
   escribir, más corto de leer y no se equivoca. */
function escQueCabe(M, cx, cy, ang, quiere, gordo){
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (let k=0;k<7;k++){
    const esc = quiere*(1 - k*0.09);
    let dentro = 0;
    for (let i=0;i<24;i++){
      contornoPez(i/24, _cp, gordo);
      const lx = -_cp[0], ly = _cp[1];
      const x = cx + (lx*ca - ly*sa)*esc, y = cy + (lx*sa + ly*ca)*esc;
      if (x > 0 && x < M.W && y > 0 && y < M.H) dentro++;
    }
    if (dentro >= 21) return esc;       // 21 de 24 es el 87 %
  }
  return quiere*0.46;
}

export { formaObjetivo, escQueCabe };
