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

/* ── GIRAR EL MÓVIL ─────────────────────────────────────────────────
   La pieza ya sale en horizontal con el móvil de pie: marco.css vuelca
   el cuadro 90°. Este botón pide el giro DE VERDAD —pantalla completa y
   orientación bloqueada—, que es lo único que endereza la imagen; en
   cuanto el viewport se gira, el vuelco de la hoja deja de aplicar.

   Automático no se puede: bloquear la orientación exige pantalla
   completa y pedirla exige un gesto. Y donde la API no está —iOS no tiene ni `lock` ni pantalla
   completa de documento— el botón NO SE PINTA: uno que no hace nada es
   peor que no tenerlo.

   También se esconde en escritorio: ahí `lock` existe pero rechaza, y
   quien está en un monitor no quiere que le pongan la pieza en pantalla
   completa por tocar un botón que dice «girar». */
const girar = document.getElementById('girar');
const raiz = document.documentElement;
const puede = !!(raiz.requestFullscreen && screen.orientation &&
                 screen.orientation.lock) &&
              matchMedia('(hover:none) and (pointer:coarse)').matches;

if (puede){
  girar.hidden = false;
  const etiqueta = () => {
    girar.textContent = document.fullscreenElement ? 'salir' : 'girar';
  };
  document.addEventListener('fullscreenchange', etiqueta);
  girar.addEventListener('click', async () => {
    if (document.fullscreenElement){
      /* SALIR PRIMERO y desbloquear después, y cada uno con su guarda: con
         los dos en el mismo `try` y `unlock()` delante, un navegador en el
         que `unlock()` lance deja el `exitFullscreen()` sin ejecutar y el
         botón sin salida —la etiqueta sigue diciendo «salir» y cada
         pulsación repite el mismo fallo. */
      try { await document.exitFullscreen(); } catch { /* ya estaba fuera */ }
      try { screen.orientation.unlock(); }    catch { /* no había bloqueo */ }
    } else {
      try {
        await raiz.requestFullscreen({navigationUI: 'hide'});
        /* el bloqueo puede fallar y la pantalla completa quedarse: no se
           deshace, que es lo que el usuario acaba de pedir a medias */
        await screen.orientation.lock('landscape');
      } catch { /* el navegador ha dicho que no */ }
    }
    etiqueta();
  });
  etiqueta();
}
