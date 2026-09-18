/* ══════════════════════════════════════════════════════════════════
   EL COLOR
   De un espectro a una paleta, y los dos dibujos cacheados por entrada
   de paleta: el halo y el punto de luz. De aquí para abajo nadie
   distingue un color escrito a mano de uno generado.
   ══════════════════════════════════════════════════════════════════ */
import { rgba, rango, fusiona, sumaPesos, eligeColor } from './util.js';
import { paramsDe } from './registro.js';

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

/* Los espectros se convierten en paleta antes de poblar: de aquí para
   abajo nadie distingue un color escrito de uno generado. Una paleta a
   mano en la misma entrada gana, para anular un espectro sin borrarlo.

   CUALQUIER clave `espectroX` da su `paletaX`, porque puede haber bichos
   con más de un color. Y el valor puede ser UNA LISTA de espectros, que
   se concatenan con su `peso` cada uno: hay identidades que no caben en
   un solo arco de tono. */
/* EL CONVENIO, y vive aquí solo: `espectroX` produce `paletaX`. Devuelve
   null si la clave no es un espectro, así que quien recorra un objeto de
   parámetros no tiene que saber cómo se forma el nombre. */
const paletaDe = k => k.indexOf('espectro') === 0 ? 'paleta' + k.slice(8) : null;

function resuelveEspectros(conf){
  const p = paramsDe(conf);
  for (const k in p){
    const destino = paletaDe(k);
    if (!destino) continue;
    if (p[destino]) continue;
    const e = p[k];
    const pal = Array.isArray(e) ? [].concat(...e.map(generaPaleta))
                                 : generaPaleta(e);
    /* Marcada porque `reinicia()` tiene que poder tirarla y volver a
       sortearla, y una paleta ESCRITA A MANO no: ésa es una decisión y
       sobrevive a la pecera nueva. */
    pal.deEspectro = true;
    p[destino] = pal;
  }
}


/* Tira las paletas GENERADAS de una entrada y las vuelve a sortear, que es
   lo que hace falta para otra pecera: se cachean en la propia entrada de
   escena —y los halos, dentro de cada color—, así que sin esto la pecera
   nueva sale con los colores de la vieja.

   Sólo las generadas: una paleta ESCRITA A MANO en la escena es una
   decisión y se queda. De ahí la marca `deEspectro`, que se pone y se lee
   aquí y no sale del fichero. */
function resiembraPaletas(conf){
  const p = paramsDe(conf);
  for (const k in p){
    const destino = paletaDe(k);
    if (destino && p[destino] && p[destino].deEspectro) delete p[destino];
  }
  resuelveEspectros(conf);
}

/* Un color de `pal` respetando pesos: úsalo en vez de elige(pal) o los
   pesos no cuentan. La suma se cachea en el propio array. */
function eligeDePaleta(pal){
  if (pal.suma === undefined) pal.suma = sumaPesos(pal);
  return eligeColor(pal, pal.suma);
}

export { resuelveEspectros, resiembraPaletas, paletaDe, eligeDePaleta,
         halo, punto };
