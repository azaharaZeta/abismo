/* ══════════════════════════════════════════════════════════════════
   EL ESTADO VIVO DEL MOTOR
   Lo que cambia mientras corre y comparten casi todos los módulos. Los
   escalares van en `V` y no en variables sueltas porque un `import` no
   se puede reasignar: `setup()` escribe en `V` y los demás leen de ahí.
   Las colecciones son `const` y se mutan en su sitio.
   ══════════════════════════════════════════════════════════════════ */
import { ABISMO } from '../escena.js';

const V = {
  cv: null, ctx: null,              // el lienzo y su contexto
  W: 0, H: 0, dpr: 1,               // tamaño en CSS px y su densidad
  U: 1,                             // la unidad de escena
  t: 0,                             // el reloj de la pieza, en segundos
  KY: 0, KX: 0, AMP: 0,             // la corriente, ya resuelta
};
/* `campos` y `MOD` se rehacen enteros cada fotograma, así que un evento
   que termina no deja rastro que limpiar. */
const campos = [];
/* Y EL ÍNDICE POR TIPO. `M.campo` descarta por tipo el 90 % de lo que
   recorre —con el evento `cuerpo` son ~126 campos vivos y ~2.200 consultas
   por fotograma—, así que el filtro va fuera del bucle: `indexaCampos()` lo
   rehace una vez, cuando ya han empujado los eventos Y los bichos.
   Consúltalo con `camposDe`; `campos` sigue siendo lo que se empuja. */
const camposPorTipo = new Map();
const SINCAMPOS = [];
function vaciaCampos(){ campos.length = 0; camposPorTipo.clear(); }
function indexaCampos(){
  camposPorTipo.clear();
  for (let i=0;i<campos.length;i++){
    const c = campos[i];
    let a = camposPorTipo.get(c.tipo);
    if (!a) camposPorTipo.set(c.tipo, a = []);
    a.push(c);
  }
}
const camposDe = t => camposPorTipo.get(t) || SINCAMPOS;
const MOD = {agua:1, ritmo:1};
function reiniciaMod(){ MOD.agua = 1; MOD.ritmo = 1; }
/* los que piden frente este fotograma, cada uno con su grupo y su plano */
const frente = [];

/* LOS PLANOS VIVOS. `ABISMO.planos` es lo que la escena PIDE; esto es lo
   que el plano ES mientras corre. Los objetos se reutilizan entre setup()
   y setup(): recalcular sin repoblar no tira población. */
const PLANOS = [];

/* ── LA CORRIENTE ───────────────────────────────────────────────────
   Sale de una FUNCIÓN DE CORRIENTE ψ y no de dos senos sueltos, y el
   motivo es la caja: **en una pecera cerrada, un campo con componente
   NORMAL a la pared apila bichos contra el cristal y no los devuelve**.
   `envuelve()` mete al que sale y le invierte la velocidad, pero la mota
   de plancton no tiene velocidad a propósito, así que para ella la pared
   es un `clamp` puro: el primero que llega se para y los demás se apilan
   detrás. Cada visita comprime el reparto y al invertirse la corriente
   salen todos juntos, comprimidos. Es un trinquete. MEDIDO con los dos
   senos de antes: en diez minutos la nieve marina pasaba de cubrir el
   cuadro entero a dejar un tercio vacío, y la dispersión caía un 28 % sin
   recuperarse.

   Con ψ = sin(kx·x)·sin(ky·y) y las k múltiplos exactos de π/W y π/H, ψ
   vale 0 en las cuatro paredes: el cristal ES una línea de corriente, o
   sea que el agua se desliza A LO LARGO de él y nunca contra él. Y al
   salir de un rotacional —vx = ∂ψ/∂y, vy = −∂ψ/∂x— no tiene divergencia,
   así que tampoco se acumula nada por dentro.

   POR ESO `ondaX` Y `ondaY` TIENEN QUE SER ENTEROS: son cuántas medias
   ondas caben en el cuadro, o sea cuántos remolinos hay. Un 0,7 deja el
   seno sin anularse contra el cristal y vuelve el apilamiento.

   DOS MODOS EN CUADRATURA para que el agua no se pare: con uno solo el
   dibujo entero se anula dos veces por vuelta y el cuadro se queda
   congelado antes de invertirse. Con el segundo a `sin` de lo que el
   primero lleva a `cos`, siempre hay uno a pleno y lo que se ve es que
   los remolinos se deshacen y se rehacen.

   El segundo modo pesa `W2` y el conjunto va dividido por `NORM`, que es
   lo que hace que `amplitud` siga queriendo decir LA PUNTA de velocidad
   horizontal: sin ella los dos modos se suman y la desbordan un 41 %. */
const W2 = 0.5, NORM = 1/Math.hypot(1, W2);
const flujoX = (x,y,t) => {
  const w = t*ABISMO.corriente.vel, c = Math.cos(w), s = Math.sin(w);
  return V.AMP*NORM * Math.cos(y*V.KY)
       * (Math.sin(x*V.KX)*c + W2*Math.sin(2*x*V.KX)*s);
};
/* Y EL FACTOR KX/KY NO ES UN ADORNO: es lo que hace incompresible al par.
   De ahí sale que el mismo remolino dé más vertical en una caja alta, y
   que aquí no haya un `0.5` a mano como antes —el reparto entre vx y vy
   lo decide la forma del cuadro, no un gusto. */
const flujoY = (x,y,t) => {
  const w = t*ABISMO.corriente.vel, c = Math.cos(w), s = Math.sin(w);
  return -V.AMP*NORM * (V.KX/V.KY) * Math.sin(y*V.KY)
       * (Math.cos(x*V.KX)*c + 2*W2*Math.cos(2*x*V.KX)*s);
};
export { V, campos, camposDe, vaciaCampos, indexaCampos,
         MOD, reiniciaMod, frente, PLANOS, flujoX, flujoY };
