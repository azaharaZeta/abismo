/* ══════════════════════════════════════════════════════════════════
   EL MARCO · el botón de la franja

   El marco en sí es CSS (marco.css) y no lienzo, y ésa es la decisión:
   lo único que se le pide —que el abismo no pinte por encima— sale
   gratis si el lienzo es más pequeño que la pantalla. Recortando sobre
   el lienzo habría que acordarse en cada pasada a pantalla completa.

   De aquí no sale ninguna llamada al motor que no sea `reinicia()`.
   ══════════════════════════════════════════════════════════════════ */
import { reinicia } from './motor.js';

document.getElementById('reinicia')
  .addEventListener('click', () => reinicia());
