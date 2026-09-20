/* ══════════════════════════════════════════════════════════════════
   EL MARCO · los botones de la franja

   El marco en sí es CSS (marco.css) y no lienzo, y ésa es la decisión:
   lo único que se le pide —que el abismo no pinte por encima— sale
   gratis si el lienzo es más pequeño que la pantalla. Recortando sobre
   el lienzo habría que acordarse en cada pasada a pantalla completa.

   De aquí no sale ninguna llamada al motor que no sea `reinicia()`.
   ══════════════════════════════════════════════════════════════════ */
import { reinicia } from './motor.js';

document.getElementById('reinicia')
  .addEventListener('click', () => reinicia());

/* LA FICHA. El <dialog> modal pone el ESC, el fondo y el foco; lo único
   que hay que escribir es cerrar al tocar fuera, y eso sale de que el
   diálogo no tenga relleno: todo lo de dentro es el <article>, así que
   un clic con `target` en el diálogo llegó por el fondo.

   Y la pieza NO se para mientras está abierta: sigue viva detrás, con lo
   que de aquí tampoco sale una llamada al motor por abrir la ficha. */
const ficha = document.getElementById('acercade');
document.getElementById('acerca')
  .addEventListener('click', () => ficha.showModal());
document.getElementById('cierra')
  .addEventListener('click', () => ficha.close());
ficha.addEventListener('click', e => { if (e.target === ficha) ficha.close(); });
