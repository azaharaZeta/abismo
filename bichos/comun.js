/* ══════════════════════════════════════════════════════════════════
   LO COMPARTIDO
   Las piezas que usan varias criaturas: contar población, la física de
   los que se mueven, dos formas de manchar luz, y el silencio —lo único
   que una especie necesita para que algo pueda apagarla.
   ══════════════════════════════════════════════════════════════════ */
import { M } from '../motor.js';
const {rgba, clamp, opt, TAU} = M;

/* ── CONTEO ─────────────────────────────────────────────────────────
   Cuenta a partir del área: {cada, min, max}. Un número suelto son ESE
   número y punto, que es como se pide «uno, y uno siempre»: un total de 1
   repartido en porcentajes se redondea a cero en los tres planos. */
const cuenta = (area, r) => typeof r === 'number' ? r
                          : Math.round(clamp(area/r.cada, r.min, r.max));
/* un total para toda la escena, repartido por planos en porcentajes */
const porReparto = (area, li, p) => Math.round(cuenta(area, p.total) * p.reparto[li]);
/* un conteo propio por plano: para los pocos y grandes, donde redondear
   un porcentaje deja planos vacíos */
const porPlano   = (area, li, p) => cuenta(area, p.por[li]);

/* ── FÍSICA COMPARTIDA ──────────────────────────────────────────────
   Las tres piezas de los que se mueven: apartarse del frente de la onda,
   resistirse al borde y dejarse llevar por la corriente. Se cogen por
   separado —el copépodo no usa la del dedo.

   Contrato de reaccionDedo: el objeto lleva vx, vy, fx, fy, huida y lag;
   la escena, fuerzaDedo. El `borde` de la escena es opcional. */

/* Empujón del frente de onda, con rampa: el bicho no salta, va cogiendo
   la fuerza según su `lag`. `e` es lo que devolvió M.empuje. */
function reaccionDedo(o, M, p, e, dt){
  const obj = M.U*p.fuerzaDedo*o.huida, k = Math.min(1, o.lag*dt);
  o.fx += (e[0]*obj - o.fx)*k;
  o.fy += (e[1]*obj - o.fy)*k;
}

/* Resistencia al canto, medida en (x,y) —que no siempre es la posición del
   objeto: el rape la mide en el centro del cuerpo. */
function reaccionBorde(o, M, p, x, y, dt){
  const bd = M.borde(x, y), k = opt(p.borde, 1)*dt;
  o.vx += bd[0]*k; o.vy += bd[1]*k;
}

/* El integrador de la casa: mueve un punto con la corriente y la
   atenuación del plano, y lo deja en un array compartido. Va suelto
   porque no todo el mundo vive en x,y: el rape nada con el cuerpo
   (bx,by) mientras x,y son su esca. */
const _av = [0,0];
function paso(M, L, dt, x, y, vx, vy){
  /* M.ritmo lo mueve un evento de modulación: es «todo se ralentiza» sin
     que ninguna especie sepa que hay un evento */
  const t = M.t, d = L.drift * M.ritmo;
  _av[0] = x + (vx + M.flujoX(y, t)) * dt * d;
  _av[1] = y + (vy + M.flujoY(_av[0], t)) * dt * d;
  return _av;
}
/* el caso de siempre: el bicho vive en x,y */
function avanza(o, M, L, dt, ax, ay){
  const q = paso(M, L, dt, o.x, o.y, o.vx + (ax||0), o.vy + (ay||0));
  o.x = q[0]; o.y = q[1];
}

/* Un degradado radial volcado con fillRect: más barato que un path.
   `stops` es [[parada, color, alfa], …] con el alfa ya multiplicado por
   el brillo del bicho. */
function mancha(g, x, y, R, stops, r0){
  const gr = g.createRadialGradient(x, y, r0||0, x, y, R);
  for (const s of stops) gr.addColorStop(s[0], rgba(s[1], s[2]));
  g.fillStyle = gr;
  g.fillRect(x-R, y-R, R*2, R*2);
}

/* El halo cacheado de `c`, de radio `R` y a alfa `a`: el hermano barato de
   `mancha` —un drawImage en vez de un degradado nuevo—, y por eso lo usa
   todo lo que tiene muchos puntos de luz. El alfa se satura aquí. */
function pintaHalo(g, M, c, x, y, R, a){
  if (!(a > 0) || !(R > 0)) return;
  g.globalAlpha = a < 1 ? a : 1;
  g.drawImage(M.halo(c), x-R, y-R, R*2, R*2);
  g.globalAlpha = 1;
}

/* posición de i dentro de una hilera de n, de 0 a 1. Con n=1 cae en el
   centro en vez de dar 0/0 = NaN, que borraba el bicho entero. */
const reparte = (i, n) => n > 1 ? i/(n-1) : 0.5;

/* ── ÁNGULOS ────────────────────────────────────────────────────────
   Las dos cuentas de los que giran, y las dos están aquí por lo mismo:
   escritas a mano se equivocan al cruzar el ±π. `giroCorto` es cuánto hay
   que girar de `desde` a `hasta` por el camino corto, con signo.
   `mezclaAng` promedia dos rumbos COMO VECTORES, que es la única forma
   que funciona —promediando radianes, 179° y −179° dan 0°—; `w` es cuánto
   pesa el segundo. */
const giroCorto = (hasta, desde) =>
  ((hasta - desde + Math.PI*3) % TAU) - Math.PI;
function mezclaAng(a, b, w){
  const x = Math.cos(a)*(1-w) + Math.cos(b)*w;
  const y = Math.sin(a)*(1-w) + Math.sin(b)*w;
  /* opuestos exactos y a medias se anulan: ahí no hay rumbo que devolver */
  return (x || y) ? Math.atan2(y, x) : a;
}

/* Cuánto SILENCIA este punto, 0 a 1. Es la única línea que cada especie
   necesita para que algo pueda apagarla, sin saber qué se lo apaga. Dos
   canales, y la diferencia está en quién los pone:

     · `apaga` son los eventos —el leviatán—. No tienen profundidad.
     · `tapa` son CUERPOS. En aditivo no hay «encima», así que la oclusión
       va por el único camino que queda: no se añade negro, se le QUITA la
       luz al que estaba detrás.

   Los `tapa` sólo se leen si se pasa `L`, y es a propósito: el rape llama
   sin él, así que no se tapa a sí mismo ni apaga su propia esca. Con `L`
   va además la guarda de profundidad. */
function silencio(M, x, y, L){
  const c = M.campo('apaga', x, y);
  let v = c ? c.peso : 0;
  if (L){
    const t = M.campo('tapa', x, y, L.i);
    if (t && t.peso > v) v = t.peso;
  }
  return v;
}
export { cuenta, porReparto, porPlano, reaccionDedo, reaccionBorde,
         paso, avanza, mancha, pintaHalo, reparte, giroCorto, mezclaAng,
         silencio };
