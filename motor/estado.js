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
  calidad: 1, degradado: false,     // sólo los baja degradar()
  topeOndas: ABISMO.dedo.tope, topeNiveles: 99,
};
/* `campos` y `MOD` se rehacen enteros cada fotograma, así que un evento
   que termina no deja rastro que limpiar. */
const campos = [];
const MOD = {agua:1, ritmo:1};
function reiniciaMod(){ MOD.agua = 1; MOD.ritmo = 1; }
/* los que piden frente este fotograma, cada uno con su grupo y su plano */
const frente = [];

/* LOS PLANOS VIVOS. `ABISMO.planos` es lo que la escena PIDE; esto es lo
   que el plano ES mientras corre. Los objetos se reutilizan entre setup()
   y setup(): recalcular sin repoblar no tira población. */
const PLANOS = [];

const flujoX = (y,t) => Math.sin(y*V.KY + t*ABISMO.corriente.vel) * V.AMP;
const flujoY = (x,t) => Math.cos(x*V.KX - t*ABISMO.corriente.vel*0.8) * V.AMP*0.5;
export { V, campos, MOD, reiniciaMod, frente, PLANOS, flujoX, flujoY };
