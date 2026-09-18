/* ══════════════════════════════════════════════════════════════════
   EL CATÁLOGO
   Una línea por criatura y por evento. Cada fichero se registra solo al
   cargarse —con `especie()` o `evento()`—, así que esta lista es lo
   único que hay que tocar para meter o sacar algo de la pieza.

   El orden no importa: el motor los busca por nombre desde la escena.
   ══════════════════════════════════════════════════════════════════ */
import './bichos/medusa.js';
import './bichos/plancton.js';
import './bichos/copepodo.js';
import './bichos/rape.js';
import './bichos/pezlinterna.js';

import './eventos/contagio.js';
import './eventos/visitante.js';
import './eventos/leviatan.js';
import './eventos/carrona.js';
import './eventos/cuerpo.js';
import './eventos/glitch.js';
import './eventos/floracion.js';
import './eventos/gemacion.js';
