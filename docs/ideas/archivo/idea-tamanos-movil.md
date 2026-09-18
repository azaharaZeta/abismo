# Idea: los sprites se ven pequeñísimos en móvil

**Estado: DESCARTADA** · analizada y archivada el 2026-09-18 · **no se tocó código**

**Enunciado original:** «revisar si están correctos los tamaños de los sprites en
movil: se ven los sprites pequeñísimos, pero lo mismo es un problema de resolución?
revisar el motivo, y si es resolución, ver si se puede hacer que los tamaños sean
independientes y se vean igual en resoluciones altas.»

Hermana de [idea-tamanos-vista](idea-tamanos-vista.md), que arregló los siete
parámetros que medían contra `M.W` o `M.H` sueltos. Esta va del otro problema: los
que SÍ miden en U.

## NO es resolución, y eso cierra la mitad del enunciado

`calcDpr()` corta el dpr en 2 (`Math.min(window.devicePixelRatio || 1, 2)`), así que
una pantalla de 3× se pinta a 2 y el navegador la estira. Y el tope de píxeles no
llega a morder: el lienzo del móvil se queda en **1,08 M** contra un `maxPx` de
**4,6 M**.

| lienzo CSS | dpr pedido | dpr usado | px del lienzo |
|---|---|---|---|
| 1000×698 (escritorio) | 2 ó 3 | 2,00 | 2,79 M |
| 359×750 (iPhone de pie) | 2 ó 3 | 2,00 | 1,08 M |
| 796×325 (iPhone tumbado) | 2 ó 3 | 2,00 | 1,03 M |

O sea que el recorte de dpr afecta a la **nitidez** —los sprites salen estirados— y
no al tamaño. Nada de lo que se ve pequeño se ve pequeño por resolución.

## El motivo de verdad: `escala` es una constante

`V.U = sqrt(W·H)/escala` con `escala = 26`. De ahí salen dos efectos distintos que
conviene no mezclar:

**1 · El tamaño absoluto.** La media geométrica del lienzo del móvil es 519 px contra
los 835 del escritorio, así que U baja de 32,1 a 20,0 px. Y encima un px CSS en un
móvil mide físicamente menos (~0,16 mm contra ~0,265 en un monitor).

**2 · La parte del cuadro que ocupa**, que no depende del tamaño sino de la FORMA:

```
pez/W = 1,92·sqrt(H/W)/26
```

En un cuadro muy apaisado la media geométrica queda muy por debajo del ancho, así
que el mismo bicho ocupa menos parte del eje largo.

## La medida, y lo que ya arregló la vertical por defecto

Pez linterna en su talla máxima (1,92 U), a 30 cm de un móvil y 60 de un monitor:

| caso | lienzo | U px | pez px | % del ancho | pez mm | ángulo |
|---|---|---|---|---|---|---|
| escritorio | 1000×698 | 32,1 | 62 | 6,2 % | 16,3 | 1,56° |
| **iPhone de pie (hoy)** | 359×750 | 20,0 | 38 | **10,7 %** | 6,1 | 1,17° |
| iPhone tumbado (botón) | 796×325 | 19,6 | 38 | 4,7 % | 6,0 | 1,15° |
| iPhone tumbado (como ERA) | 828×340 | 20,4 | 39 | **4,7 %** | 6,3 | 1,20° |

La queja se escribió cuando el móvil se volcaba solo, o sea con la pieza metida en
una tira de 828×340: ahí el pez ocupaba el **4,7 %** del ancho. Con la vertical por
defecto —ver [idea-movil-vertical](idea-movil-vertical.md)— pasa al **10,7 %**, más
del doble, y eso cierra el efecto 2 sin tocar nada de tamaños.

Queda el efecto 1: **1,17° contra 1,56°**, un 25 % menos de tamaño aparente.

## Lo que se consideró para ese 25 %, y por qué no se hace

- **Suelo para U** (que no baje de los 32 px del escritorio): el móvil mostraría sólo
  11 U de mundo a lo ancho contra las 31 del escritorio. Es otra composición, no la
  misma más grande.
- **U con la raíz del área** en vez de lineal: cierra la mitad (U ≈ 25,6 px).
- **Subir el tope de dpr a 3** en lienzos pequeños: 2,42 M de píxeles, aún lejos del
  tope. Da nitidez, no tamaño.

**Decisión del usuario (2026-09-18): ninguna de las tres.** El tamaño se queda como
está y el tope de dpr se queda en 2. El coste de la pieza es relleno —varias pasadas
a pantalla completa por fotograma— y el móvil es justo donde menos GPU hay.

## El cabo que deja, y está analizado

**La población se cuenta en px² y no en U²**, y es la única medida de la escena que
se salta la unidad de mundo (`total: {cada, min, max}` en `comun.js`, vía
`cuenta(area, r)` con `area = W·H` en px CSS). Consecuencia hoy:

| | área CSS | plancton | densidad por 1000 px² |
|---|---|---|---|
| escritorio 1000×698 | 698 k | 607 | 0,87 |
| iPhone de pie 359×750 | 269 k | 340 (tope `min`) | **1,26** |

El móvil ya va un 45 % más denso, y lo sostiene el `min: 340` y no el reparto por
área. Esto es lo que hay que arreglar ANTES de tocar `escala`: subir U sin pasar el
conteo a U² multiplica el área de cada bicho sin quitar bichos, y el cuadro se llena.
Va aquí y no al índice porque ya está analizado y porque no es un problema mientras
`escala` no se toque.
