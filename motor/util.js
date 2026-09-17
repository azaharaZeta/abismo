/* ══════════════════════════════════════════════════════════════════
   UTILIDADES
   Funciones puras, sin estado y sin escena. Las usa todo el motor y,
   a través de `M`, todas las criaturas.
   ══════════════════════════════════════════════════════════════════ */

const TAU = Math.PI*2;
const rgba  = (c,a) => 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';
const clamp = (v,a,b) => v<a?a:v>b?b:v;
/* compara con `undefined`: un 0 escrito a mano es una decisión */
const opt   = (v,d) => v === undefined ? d : v;
const rnd   = (a,b) => a + Math.random()*(b-a);
const suave = t => t*t*(3-2*t);
const elige = a => a[(Math.random()*a.length)|0];

/* Sorteo con peso: una entrada de paleta puede llevar `peso` (1 por
   defecto) en vez de repetirse en el array. */
function sumaPesos(pal){
  let t = 0;
  for (const p of pal) t += opt(p.peso, 1);
  return t;
}
function eligeColor(pal, total){
  let r = Math.random()*total;
  for (const p of pal){
    r -= opt(p.peso, 1);
    if (r <= 0) return p;
  }
  return pal[pal.length-1];
}
const mezcla = (a,b,t) => [Math.round(a[0]+(b[0]-a[0])*t),
                           Math.round(a[1]+(b[1]-a[1])*t),
                           Math.round(a[2]+(b[2]-a[2])*t)];
/* acepta un número o un par [min,max]; rangoE da enteros */
const rango = v => Array.isArray(v) ? rnd(v[0], v[1]) : v;
const rangoE = v => Array.isArray(v) ? (v[0] + ((Math.random()*(v[1]-v[0]+1))|0)) : v;

/* Fusión por clave, recursiva. Los objetos que sólo están en `base` se
   copian, así que el resultado no comparte subobjetos con ella. */
const llano = v => v && typeof v === 'object' && !Array.isArray(v);
function fusiona(base, extra){
  const r = {};
  for (const k in base) r[k] = llano(base[k]) ? fusiona(base[k], {}) : base[k];
  for (const k in extra){
    const a = base[k], b = extra[k];
    r[k] = (llano(a) && llano(b)) ? fusiona(a,b) : b;
  }
  return r;
}
export { TAU, rgba, clamp, opt, rnd, suave, elige, sumaPesos, eligeColor,
         mezcla, rango, rangoE, fusiona };
