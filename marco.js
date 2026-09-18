/* ══════════════════════════════════════════════════════════════════
   EL MARCO · los dos botones de la franja

   El marco en sí es CSS (marco.css) y no lienzo, y ésa es la decisión:
   lo único que se le pide —que el abismo no pinte por encima— sale
   gratis si el lienzo es más pequeño que la pantalla. Recortando sobre
   el lienzo habría que acordarse en cada pasada a pantalla completa.

   De aquí no sale ninguna llamada al motor que no sea `reinicia()`.
   ══════════════════════════════════════════════════════════════════ */
import { reinicia } from './motor.js';

document.getElementById('reinicia')
  .addEventListener('click', () => reinicia());

/* ── TUMBAR EL CUADRO ───────────────────────────────────────────────
   Con el móvil de pie la pieza sale VERTICAL, que es la forma que tiene
   la pantalla. Este botón la tumba y la endereza: pone y quita `.tumbado`
   en la raíz, y marco.css vuelca el cuadro 90° (ver `--giro` allí).

   Y PIDE PECERA NUEVA, que es la otra mitad del botón. El vuelco cambia
   la FORMA del lienzo —de alto y estrecho a bajo y ancho— y la escena
   está compuesta para la que había: las posiciones van en fracción de
   pantalla y el tamaño de todo sale de sqrt(área). Un `resize` no salta
   —la ventana no ha cambiado, sólo una clase—, así que hay que avisar a
   mano. Es la única llamada al motor que sale de este fichero.

   El botón sólo se pinta donde el vuelco hace algo: táctil, de mano y de
   pie. Con el aparato ya tumbado el cuadro es horizontal por su cuenta y
   la clase es inerte, así que ahí se esconde.

   NO PIDE PANTALLA COMPLETA NI BLOQUEO DE ORIENTACIÓN. Los pedía, para
   girar de verdad, y eso deja dos estados peleándose: con la orientación
   bloqueada en horizontal esta consulta deja de valer, el botón se
   esconde y el que mira se queda dentro de la pantalla completa sin nada
   que pulsar. El vuelco de la hoja no necesita permiso y sale igual en
   iOS, que es donde no había nada. */
const girar = document.getElementById('girar');
const raiz = document.documentElement;
/* la MISMA condición que el vuelco de marco.css: si cambia allí, cambia
   aquí, o el botón aparece donde no hace nada */
const dePie = matchMedia('(orientation:portrait) and (hover:none)'
                         + ' and (pointer:coarse) and (max-width:560px)');

const etiqueta = () => {
  girar.textContent = raiz.classList.contains('tumbado') ? 'enderezar' : 'tumbar';
};
const revisa = () => { girar.hidden = !dePie.matches; etiqueta(); };

girar.addEventListener('click', () => {
  raiz.classList.toggle('tumbado');
  etiqueta();
  /* pecera nueva para la caja nueva. `setup()` lee `clientWidth`, y leerlo
     fuerza el cálculo de estilo, así que el motor ve ya la forma volcada. */
  reinicia();
});
/* girar el aparato de verdad no cambia la clase: sólo deja de aplicarse */
dePie.addEventListener('change', revisa);
revisa();
