# Idea: el glitch a examen — ¿se gana el sitio?

**Estado: PROPUESTA — DECISIÓN DE OBRA, NO DE INGENIERÍA** · analizada el 2026-09-18 ·
sin tocar código
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 10 de 12**

## Lo que se observó

El glitch es, con diferencia, **la funcionalidad con peor relación complejidad /
píxeles** de la pieza. No porque esté mal escrito —está limpio y bien argumentado—
sino por dónde toca y por lo poco que se ve.

| capa | dónde | líneas |
|---|---|---|
| el evento | [eventos/glitch.js](../../eventos/glitch.js) | 114 |
| `pintaBicho` | [bucle.js:330-410](../../motor/bucle.js) | ~81 (51 de código, 30 de comentario) |
| el reglaje | [escena.js:438-474](../../escena.js) | 37 |
| la bandera `rompible` | contrato de especie, [registro.js:15](../../motor/registro.js) + [medusa.js:197](../../bichos/medusa.js) | — |
| el tipo de campo `tajo` | lo empuja el glitch, lo lee **el motor** | — |

≈ **230 líneas y dos conceptos de motor** (`rompible`, `tajo`).

### Y es el único caso especial en el camino de dibujo de TODOS los bichos

`pintaBicho` está entre `pasoPlanos` y cada `def.dibuja`. Sin el glitch, esa función
es una línea. Con él, cada bicho de cada plano y cada fotograma pasa por una
comprobación de bandera, y los que la declaran pasan además por una consulta de campo
y, si les toca, por **`d.bandas` dibujos completos de sí mismos** (8 a 14).

Coste medido y ya anotado en la escena: 0,050 ms por banda contra 0,069 ms de una
medusa normal, o sea que **una medusa rota cuesta de 7 a 12 veces** lo que una entera.
Peor caso documentado: 2,6 ms sobre un fotograma de 8,3.

### Lo que se ve a cambio

`cada: [240, 540]` con `dura: [14, 24]`: el evento está vivo el **4 %** del tiempo, y
dentro de ese 4 % sólo rompe durante los tirones. El `radio` está ajustado para que le
toque **a una o dos medusas** de las cuatro.

## La pregunta, que no es mía

> ¿Una simulación bonita de un abismo necesita que a una medusa se le desalinee la
> campana un par de veces por hora?

El argumento a favor está escrito en el propio evento y es bueno: **es una avería del
DIBUJANTE, no de la señal.** Una franja negra a lo ancho sería un fallo de pantalla;
que a una medusa se le rompa el sprite mientras la de al lado está perfecta dice que
alguien está pintando esto. Eso es una idea, y las ideas valen líneas.

El argumento en contra es que es lo único de la pieza que **no es agua**: todo lo
demás —contagio, floración, gemación, carroña, cuerpo, leviatán— pertenece al abismo.

## Las tres salidas

**A · Se queda.** No hay nada que arreglar: está bien escrito y bien medido.

**B · Se quita entero.** Se borra el evento, su entrada de escena, `pintaBicho` vuelve
a una línea, y se van `rompible` y `tajo` del vocabulario del motor. −230 líneas y −2
conceptos.

**C · Se queda registrado y sale de la escena.** El motor los admite: «un evento o
especie puede estar registrado y NO estar en la escena». Se sigue lanzando desde el
panel y para devolverlo basta volver a listarlo en `ABISMO.eventos`.
**Pero esto NO ahorra nada**: `pintaBicho` y la bandera siguen en el camino de dibujo,
que es donde está el coste estructural. Es una salida para dudar, no para simplificar.

## Recomendación

Si la respuesta a la pregunta es «no me sobra», **A y ya está**: quitarlo por
higiene sería empobrecer la pieza para ganar un número.
Si la respuesta es «no lo echaría de menos», **B y entero**, no C.

## Siguiente acción

Verlo. Lanzar `glitch` desde el panel tres o cuatro veces seguidas, mirarlo, y
decidir. Esta ficha no necesita más análisis.
