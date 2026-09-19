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
- evento visitante: el visitante a veces es demasiado grande y demasiado brillante, ajustalo a la baja.
- cuando paso el dedo, los peces apenas reaccionan. deberían salir nadando fuera de mi dedo.
- evento cuerpos: los cuerpos son demasiado grandes, hacerlos algo más pequeños, y meterles un random de tamaño ligero. y caen dmasiado lentos, ponerlos que caigan un pelín (solo un poco) más rápido.
- como de viable es hacer que, salvo las medusas y los peces, todos los demás bichos y objetos tapen el placton? estudiarlo bien porque podría tener impacto o ser engorroso d hacer.
- evento: leviatan: el brillo en las aletas no está siguiendo el contorno de las aletas, parece una catenaria colgada entre los picos.
- el placton tiende a concentrarse lejos del techo. valorar cambiar la lógica actual, y simplemente permitir que el placton fluya en un espacio toroidal, así evitamos que se apegote en los bordes, sin necesidad de alterarle el rumbo. solo aplicaría al placton.
## Ideas propuestas por Claude (staging — el humano las sube arriba si las acepta)
> Cabos sueltos de las ideas procesadas el 2026-09-17, el 2026-09-18 y el 2026-09-19.

- El rape mira hacia FUERA el 25-40 % del tiempo, que es lo contrario de lo que promete `miraAlCentro`: `f.dir` sólo se replantea cada `giro: [14, 38]` s y además exige estar casi parado, así que cruzar la vertical del centro le cuesta hasta medio minuto de espaldas.
- El banco va suelto: cada pez tiene 1,1 vecinos dentro de `vista` y pasa el 29 % del tiempo sin ver a ninguno. Los mandos son `vista` (4,2 U) y `total` (14). Decidir si eso es un banco deshilachado o es lo que impide que parezca un enjambre.
- Unidades del pez linterna: `alcanceLuz`, `alcanceCuerpo` y `revelado` van en LARGOS y escalan solos con el bicho, pero `atraccion`, `roce` y `vista` van en U y no. Ya está medido lo que cuesta: `vista` 4,2 U son 1,8 largos para el pez de delante y 3,2 para el de en medio, o sea que el mismo banco tiene dos alcances según el plano. Decidir un convenio.
- Evento `E-06 La estampida`: ya sólo le falta el registro, el campo `asusta` está hecho.
- Evento `E-02 El apagón`: sigue siendo el de más efecto por línea de código.
- Onda de proa: un campo `empuja` que el leviatán y el cuerpo pongan al pasar, para que el plancton se aparte y no sólo se apague. OJO: choca con que el plancton ya no se aparta del dedo —habría que decidir si un cuerpo enorme es otra cosa que un dedo—, y la mota se quedó sin velocidad, así que habría que devolvérsela.
- `contagio` conserva `porContacto: 0.3`, o sea que tocar todavía puede lanzarlo: ahora se pisa con la onda de plancton del propio dedo.
- Un `manifest.json` con `orientation: portrait` y `display: standalone` dejaría la pieza instalable en la pantalla de inicio.
- El leviatán vive en el plano del fondo —un tercio de resolución y 58 % de alfa—: si aun con la luz subida se ve poco, el único mando que queda es el plano, y eso le quita el «enorme y lejos», que es su tema.
- `M.cardumen()` está documentado como una de las dos formas que tiene un evento de leer la escena y no lo usa nadie; su forma sin argumento además reparte un array nuevo. Decidir si se queda como punto de extensión o se va.
- `contagio` y `floracion` son el mismo anillo que se abre con otro tipo de campo: comparten unas quince líneas escritas dos veces. Decidir si eso es duplicación o son dos eventos que se parecen.
- La cola del rape va a reloj fijo (`velCola`) y no al avance, como ya hace el banco: a su crucero son unos 24 coletazos por largo de cuerpo. Puede estar bien —cimbrea sin ir a ninguna parte—, pero está sin decidir.
