import { M, evento } from '../motor.js';
import { ondaArranca, ondaAnillo } from './comun.js';

/* ══════════════════════════════════════════════════════════════════
   EL CONTAGIO
   No un fogonazo simultáneo: una reacción en cadena. No dibuja NADA
   —empuja un anillo de encendido y la luz que se ve es el propio plancton
   prendiéndose—, así que la onda va por donde hay plancton y su frente se
   lee cruzando el agua. Es el evento más corto de la pieza y el que mejor
   explica por qué los buenos no dibujan.

   El anillo en sí está en eventos/comun.js: lo comparte con la floración,
   y de este fichero es sólo lo que lo hace un contagio —que el campo sea
   `enciende` y que la onda lleve un color.
   ══════════════════════════════════════════════════════════════════ */
evento('contagio', {
  arranca(M, p, x, y){
    const e = ondaArranca(M, p, x, y);
    /* un color para toda la onda: sin espectro propio, el de la pecera */
    e.c = M.color(p.paleta);
    return e;
  },
  actualiza(e, M, p, dt){ return ondaAnillo(e, M, p, dt, 'enciende', e.c); },
});
