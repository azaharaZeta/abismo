/* ══════════════════════════════════════════════════════════════════
   LO COMPARTIDO
   Las piezas que usan varias criaturas: contar población, la física de
   los que se mueven, dos formas de manchar luz, y el silencio —lo único
   que una especie necesita para que algo pueda apagarla.
   ══════════════════════════════════════════════════════════════════ */
import { M } from '../motor.js';
const {rgba, clamp, opt, TAU} = M;

/* ── CONTEO ─────────────────────────────────────────────────────────
   CUÁNTOS HAY, Y SON NÚMEROS ABSOLUTOS. No se cuenta por área de pantalla:
   el cuadro enseña siempre `escala`×`escala` U de mundo —el mismo trozo de
   mar en un móvil que en un monitor—, así que la población tiene que ser la
   misma. Contando por píxeles, la misma pecera salía con el doble de motas
   en una pantalla que en otra. Del tamaño se encarga U, y del coste en
   pantalla grande, `maxPx`. */
/* un total para toda la escena, repartido por planos en porcentajes */
const porReparto = (li, p) => Math.round(p.total * p.reparto[li]);
/* un conteo propio por plano: para los pocos y grandes, donde redondear
   un porcentaje deja planos vacíos */
const porPlano   = (li, p) => p.por[li];

/* ── FÍSICA COMPARTIDA ──────────────────────────────────────────────
   Las tres piezas de los que se mueven: apartarse del dedo, resistirse al
   borde y dejarse llevar por la corriente. Se cogen por separado —el
   copépodo no usa ninguna de las dos primeras—. El `borde` de la escena es
   opcional. */

/* ── APARTARSE DEL DEDO ─────────────────────────────────────────────
   Y NO ES HUIR: el bicho se desplaza de lado mientras le pasa el frente
   de la onda, sin que nadie le toque el rumbo. Deja esa velocidad en
   `o.dx, o.dy`, y quien la use la SUMA a su movimiento en vez de
   integrarla, porque lo que sale de aquí ya ES una velocidad.

   QUE SEA VELOCIDAD Y NO FUERZA es la decisión: con una fuerza hay que
   integrar dos veces y el desvío tarda segundos en verse —medido, 0,04 U
   al segundo del toque, o sea que para cuando se nota el dedo ya no está.

   Y LA RAMPA ES ASIMÉTRICA, que es el resto del efecto: SUBE con `lag`
   —deprisa, mientras el frente está encima, o no se ve— y BAJA con
   `apartaVuelve` —despacio, así el bicho sigue deslizándose un rato—. Al
   revés no se lee ninguna de las dos cosas.

   Y EL MÓDULO DE `e` VA CON TOPE: `M.empuje` suma una onda por contacto
   vivo y no normaliza, así que arrastrando el dedo se apilan y el peso
   llega a 2,5 —el desvío se iría a 2,8 U/s, el doble de lo que se mueve
   una medusa—. El tope conserva la DIRECCIÓN de la suma y quita el
   exceso, de modo que `apartaDedo` es de verdad la velocidad máxima.

   `e` es lo que devolvió `M.empuje`. El objeto lleva dx, dy, `aparta` y
   `lag`; la escena, `apartaDedo` y `apartaVuelve`.

   El plancton no lo usa: está en suspensión y del gesto sólo recibe luz. */
function seAparta(o, M, p, e, dt){
  const w = Math.hypot(e[0], e[1]);
  const obj = M.U*p.apartaDedo*o.aparta * (w > 1 ? 1/w : 1);
  const ox = e[0]*obj, oy = e[1]*obj;
  if (Math.hypot(ox, oy) > Math.hypot(o.dx, o.dy)){
    const k = Math.min(1, o.lag*dt);
    o.dx += (ox - o.dx)*k;
    o.dy += (oy - o.dy)*k;
  } else {
    const fr = Math.pow(p.apartaVuelve, dt);
    o.dx *= fr; o.dy *= fr;
  }
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

/* ── DOS CUENTAS QUE SE ESCRIBÍAN A MANO EN TODAS PARTES ────────────
   `hacia` es la rampa exponencial hacia un objetivo, y el clamp a 1 es lo
   que impide que un fotograma largo la pase de largo y oscile: sin él, un
   `k*dt` de 1,4 deja el valor al otro lado del objetivo. Estaba copiada en
   diez sitios y olvidarse del clamp no se ve hasta que la pestaña vuelve
   de segundo plano.

   `gxSano` es el suelo del espejo: `gx` es el lado al que mira un bicho y
   pasa por 0 al voltear, pero de perfil puro el pez no existe y el trazado
   no puede degenerar. El suelo lo pone cada especie —el rape es grande y
   aguanta menos que un pez linterna. */
const hacia = (v, obj, k, dt) => v + (obj - v)*Math.min(1, k*dt);
const gxSano = (gx, suelo) => Math.abs(gx) < suelo ? (gx < 0 ? -suelo : suelo) : gx;

/* posición de i dentro de una hilera de n, de 0 a 1. Con n=1 cae en el
   centro en vez de dar 0/0 = NaN, que borraba el bicho entero. */
const reparte = (i, n) => n > 1 ? i/(n-1) : 0.5;

/* ── ÁNGULOS ────────────────────────────────────────────────────────
   Las dos cuentas de los que giran, y las dos están aquí por lo mismo:
   escritas a mano se equivocan al cruzar el ±π. `giroCorto` es cuánto hay
   que girar de `desde` a `hasta` por el camino corto, con signo.
   `mezclaAng` promedia dos rumbos COMO VECTORES, que es la única forma
   que funciona —promediando radianes, 179° y −179° dan 0°—; `w` es cuánto
   pesa el segundo.

   En `giroCorto` la vuelta se da a LOS DOS LADOS, y hace falta: el resto
   de `%` se queda con el signo del dividendo, y `desde` es un rumbo que
   se ACUMULA sumando y que nadie devuelve al rango —el de un pez linterna
   anda por los −100 rad a los cinco minutos—. Corrigiendo por un lado
   solo, pasado cierto `desde` lo que sale es el camino LARGO y el bicho
   gira al revés. */
const giroCorto = (hasta, desde) => {
  const d = (hasta - desde) % TAU;
  return d > Math.PI ? d - TAU : d < -Math.PI ? d + TAU : d;
};
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
export { porReparto, porPlano, seAparta, reaccionBorde,
         paso, avanza, mancha, pintaHalo, reparte, giroCorto, mezclaAng,
         hacia, gxSano, silencio };
