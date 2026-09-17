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
- evento visitante: aleatorizarlo un poco. distintas formas y tamaños.
- evento leviatan: me encanta el detalle de color en la panza, añadele algún detalle sutil más de color, en espinas y lomo. pero poco. está casi perfecto.
- evento carroña: está muy bien, dale forma más clara de esqueleto, y métele algún random. Siempre color hueso.
- evento cuerpo: es demasiado rígido, haz que tenga ciertas físicas ligeras, sus miembros flotando, su cuerpo doblándose, random. haz que tengan melena o no, random. y que pueda haber entre 1 y 3 cuerpos distintos cayendo en el evento, pero no exactamente a la vez, sin sincronizarse.
- peces - cardumen: tiende a formarse siempre en círculo, y todavía con demasiada sincronia. mejoralo para que la formación sea más natural y erratica y erronea, y cada pez haga lo que pueda para seguir al grupo, sin éxito siempre. 
- Claude comentó: " La carroña no entra en `L.presas`, que era la mitad de su diseño: los rapes tendrían que dejar de emboscar y converger cuando cae comida. Un objeto de evento no puede apuntarse a las listas por plano; decidir si pasa a ser especie o si el motor lo admite." Mi respuesta: la carroña no es presa, no es necesario que los rapes la cancen. los rapes solo se centran en los pececitos.
- La pecera ha pasado de tres eventos a siete, cuatro de ellos exclusivos: revisar los `cada` y `primero` a ver si se pisan o si dejan huecos muertos.

## Ideas propuestas por Claude (staging — el humano las sube arriba si las acepta)
> Cabos sueltos que dejaron las ideas procesadas el 2026-09-17.

- Evento `E-06 La estampida`: ya sólo le falta el registro, el campo `asusta` está hecho.
- Evento `E-02 El apagón`: sigue siendo el de más efecto por línea de código.
- Onda de proa: un campo `empuja` que el leviatán y el cuerpo pongan al pasar, para que el plancton se aparte y no sólo se apague. El plancton tenía el consumidor escrito y nadie ponía nunca el campo; se ha quitado como código muerto, así que la mitad que falta es la del que empuja.

