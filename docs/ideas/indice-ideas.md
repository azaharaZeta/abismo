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
4. **Cuando una idea se TERMINA (implementada) o se DESCARTA**: se resume en **una entrada corta en
   [`archivo/historico.md`](archivo/historico.md)** —qué se pidió, qué se decidió, y sólo el dato que costó
   averiguar y no esté ya en el código— y **se BORRA su fichero**. La ficha entera se queda en git, que es
   donde vive el detalle; el archivo es para no repetir trabajo, no para guardarlo todo.
   Un resultado NEGATIVO («se probó X y no funciona») es lo más valioso que puede dejar una idea: ése no se
   resume, se escribe entero.
5. **Al archivar, los temas pendientes que deja la idea** (su "siguiente acción"):
   - si son **simples / sin analizar** → se añaden como idea(s) BREVE(s) en este índice (para procesar luego);
   - si ya están **analizados / son complejos** → van directamente a su propio fichero `<idea>.md` (NO al índice).
6. **Corolario:** una idea que YA tiene fichero en esta carpeta, o una entrada en el histórico, **NO aparece
   en este índice**. Si la ves listada aquí y ya está en marcha o cerrada, es un error de mantenimiento → quítala.

---

## Ideas de usuario (pendientes de procesar)
> Solo un humano edita esta sección. Texto breve; el detalle se desarrolla al crear la ficha.
- Claude dijo: "- Unidades del pez linterna: `alcanceLuz`, `alcanceCuerpo` y `revelado` van en LARGOS y escalan solos con el bicho, pero `atraccion`, `roce` y `vista` van en U y no. Ya está medido lo que cuesta: `vista` 4,2 U son 1,8 largos para el pez de delante y 3,2 para el de en medio, o sea que el mismo banco tiene dos alcances según el plano. Decidir un convenio. " . Respuesta de usuaria: sí, decide un convenio adecuado y simplifica esa lógica.

- Claude dijo: "- Un `manifest.json` con `orientation: portrait` y `display: standalone` dejaría la pieza instalable en la pantalla de inicio. " . Respuesta de usuaria:  vale.

- como de viable es hacer que, salvo las medusas y los peces, todos los demás bichos y objetos tapen el placton? estudiarlo bien porque podría tener impacto o ser engorroso d hacer.
- sigo viendo peces intentando comerse el señuelo del rape cuando está apagado. los peces solo tienen que ir al señuelo cuando está encendido.
- rape: un pelín más pequeño. y quiero mejorar su dibujo, algo más detallado. más intimidante, y revisar su forma y su ojo, manteniendo el estilo de la simulación. quizá es buena idea presentarme varios dibujos de prueba para ir decidiendo los cambios.
- Leviatan: el morro está poco definido, hacerle una mandíbula más intimidante. posicionarle mejor el ojo, está demasiado bajo.
-solo un evento a la vez.
## Ideas propuestas por Claude (staging — el humano las sube arriba si las acepta)
> Cabos sueltos de las ideas procesadas el 2026-09-17, el 2026-09-18 y el 2026-09-19.





