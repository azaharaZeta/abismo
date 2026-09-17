/* ══════════════════════════════════════════════════════════════════
   ABISMO · punto de entrada
   Carga el motor y el catálogo y arranca. El orden lo resuelven los
   imports: el motor se evalúa antes que las criaturas —que se registran
   solas al cargarse— y `arranca()` corre cuando ya están todas.
   ══════════════════════════════════════════════════════════════════ */
import { arranca } from './motor.js';
import './catalogo.js';

arranca();
