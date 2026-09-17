/* ══════════════════════════════════════════════════════════════════
   EL AGUA
   Todo lo que pinta agua y nada más: la tira del degradado, el grano, la
   ondulación de color, las sombras que le quitan luz y el velo de
   dispersión. Son las pasadas a pantalla completa de cada fotograma.
   ══════════════════════════════════════════════════════════════════ */
import { ABISMO } from '../escena.js';
import { rgba, rnd, rango, TAU } from './util.js';
import { V, campos, MOD, PLANOS } from './estado.js';

let agua = null, ruido = null;

/* ── RECURSOS CACHEADOS ─────────────────────────────────────────────
   El degradado del agua vive en una tira de 4 px de ancho a la altura
   real del lienzo: no se interpola en vertical y pintarlo es un
   drawImage. Se construye en setup() y no cambia. */
function buildAgua(){
  const A = ABISMO.agua;
  const h = Math.min(2048, Math.max(2, Math.round(V.H*V.dpr)));
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
  ruido = V.ctx.createPattern(c,'repeat');
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
  const w = Math.max(2, Math.round(V.W*V.dpr/Math.max(1, O.div)));
  const h = Math.max(2, Math.round(V.H*V.dpr/Math.max(1, O.div)));
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
  const diag = Math.hypot(w, h), t = V.t*O.vel;
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
  V.ctx.globalCompositeOperation = 'lighter';
  V.ctx.globalAlpha = Math.min(1, O.fuerza);
  V.ctx.drawImage(ondCv, 0, 0, V.W, V.H);
  V.ctx.globalAlpha = 1;
  V.ctx.globalCompositeOperation = 'source-over';
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
  const n = Math.min(D.niveles|0, V.topeNiveles);
  if (n < 2) return;
  let w = Math.round(V.W*V.dpr/Math.max(1, D.div));
  let h = Math.round(V.H*V.dpr/Math.max(1, D.div));
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
    V.ctx.save();
    V.ctx.translate(c.x, c.y);
    if (c.rot) V.ctx.rotate(c.rot);
    V.ctx.scale(1, c.ky || 1);
    const gr = V.ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    gr.addColorStop(0, 'rgba(0,0,0,'+a.toFixed(3)+')');
    gr.addColorStop(S.nucleo, 'rgba(0,0,0,'+(a*0.82).toFixed(3)+')');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    V.ctx.fillStyle = gr;
    V.ctx.fillRect(-R, -R, R*2, R*2);
    V.ctx.restore();
  }
}

function pintaAgua(){
  V.ctx.drawImage(agua, 0, 0, V.W, V.H);
  /* la ondulación va DENTRO del agua: antes de la modulación, así que un
     evento que oscurezca el agua también se la lleva */
  pintaOndulacion();
  /* y las sombras, encima de la ondulación: lo que tapa un cuerpo es el
     agua Y su color, no sólo la tira de base */
  pintaSombras();
  if (MOD.agua < 0.999){
    V.ctx.fillStyle = 'rgba(0,0,0,'+(1-MOD.agua).toFixed(3)+')';
    V.ctx.fillRect(0, 0, V.W, V.H);
  } else if (MOD.agua > 1.001){
    V.ctx.globalCompositeOperation = 'lighter';
    V.ctx.globalAlpha = Math.min(1, MOD.agua - 1);
    V.ctx.drawImage(agua, 0, 0, V.W, V.H);
    V.ctx.globalAlpha = 1;
    V.ctx.globalCompositeOperation = 'source-over';
  }
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
  V.ctx.globalCompositeOperation = 'lighter';
  let resto = Math.min(3, D.fuerza);
  while (resto > 0.002){
    V.ctx.globalAlpha = Math.min(1, resto);
    V.ctx.drawImage(n0.cv, 0, 0, V.W, V.H);
    resto -= 1;
  }
  V.ctx.globalAlpha = 1;
  V.ctx.globalCompositeOperation = 'source-over';
}
export { buildAgua, buildRuido, buildOndulacion, buildDispersion,
         pintaAgua, pintaDispersion, ruido, RUIDO };
