# Input de Ideas de usuario 

## Cómo funciona este backlog (CICLO DE VIDA de una idea) — LEER ANTES DE EDITAR
Este fichero es **solo el backlog de ideas SIN PROCESAR**. Reglas estrictas para no ensuciarlo:

1. **El índice solo lista ideas sin procesar, en TEXTO BREVE** — una línea por idea, el enunciado y nada más:
   sin análisis, sin estado, sin histórico, sin detalle. (Todo eso vive en la ficha de la idea, no aquí.)
2. **Solo un HUMANO añade ideas en la sección "Ideas de usuario".** Claude puede sugerir en la sección de
   "Ideas propuestas por Claude" (zona de staging para que el humano las suba; no es el backlog real).
3. **Cuando una idea EMPIEZA a procesarse**: 
      - Se **QUITA de este índice** 
      - Si es una idea sencilla y rápida de ejecutar, queda implementada, y ya no necesita estar documentada como idea.
      - Si es una idea compleja que requiere análisis: Crea su fichero propio `idea-<nombre-idea>.md` en **esta misma carpeta** (`docs/ideas/`). El análisis, el estado y el histórico van en ESE fichero, nunca aquí.
4. **Cuando una idea se TERMINA (implementada) o se DESCARTA**: se actualiza su fichero con el estado final y se **MUEVE a `archivo/`** (subcarpeta de esta misma ruta).
5. **Al archivar, los temas pendientes que deja la idea** (su "siguiente acción"):
   - si son **simples / sin analizar** → se añaden como idea(s) BREVE(s) en este índice (para procesar luego);
   - si ya están **analizados / son complejos** → van directamente a su propio fichero `<idea>.md` (NO al índice).
6. **Corolario:** una idea que YA tiene fichero (en esta carpeta o en `archivo/`) **NO aparece en este índice**.
   Si la ves listada aquí y ya tiene fichero, es un error de mantenimiento → quítala.

---

## Ideas de usuario (pendientes de procesar)
> Solo un humano edita esta sección. Texto breve; el detalle se desarrolla al crear la ficha.

- revisa el menú de pruebas y quita los controles que no aporten nada o poco valor. quiero un control del nivel de luz de fondo además.
- los tamaños relativos de distintos sprites y eventos son distintos en mobile (vertical) que en pc. Veo por ejemplo que los leviatanes son estrechos, y que los cuerpos cayendo son enormes. revisalo, debe de haber código por ahí de tamaños de los sprites que es dependiente del tamaño de la pantalla, lo que no es correcto. los elementos del mundo tienen que ser independientes del tamaño de la vista del navegador.

- incluir un pequeñito marco inferior con un título Abyss by Zeta. añadir en ese marco un boton de reiniciar, que reinicie la simulación con nuevo seed. 
- en mobile, meter que la pantalla se ajuste a horizontal al girar el movil, automáticamente si se puede hacer de forma limpia, o con un botón.

- tocar con el dedo: que no genere ondas (borrar ese código). pero hacer que el placton cercano crezca y se ilumine momentaneamente, lanzando ondas de iluminación de placton 

## Ideas propuestas por Claude (staging — el humano las sube arriba si las acepta)
> Cabos sueltos que dejaron las ideas procesadas el 2026-09-17.

- Evento `E-06 La estampida`: ya sólo le falta el registro, el campo `asusta` está hecho.
- Evento `E-02 El apagón`: sigue siendo el de más efecto por línea de código.
- Onda de proa: un campo `empuja` que el leviatán y el cuerpo pongan al pasar, para que el plancton se aparte y no sólo se apague. El plancton tenía el consumidor escrito y nadie ponía nunca el campo; se ha quitado como código muerto, así que la mitad que falta es la del que empuja.
- `M.campo()` es un recorrido lineal de `campos` y el plancton lo consulta por mota: con los tres cuerpos del evento del cuerpo son 39 campos y cuesta medio milisegundo de fotograma. Si algún día hay más cosas que tapen, aquí entra una rejilla —la misma que le hará falta al cardumen.

