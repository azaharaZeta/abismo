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

const flujoX = (y,t) => Math.sin(y*V.KY + t*ABISMO.corriente.vel) * V.AMP;
const flujoY = (x,t) => Math.cos(x*V.KX - t*ABISMO.corriente.vel*0.8) * V.AMP*0.5;
export { V, campos, camposDe, vaciaCampos, indexaCampos,
         MOD, reiniciaMod, frente, PLANOS, flujoX, flujoY };
