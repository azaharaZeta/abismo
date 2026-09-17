# Idea: El abismo, casi negro pero no plano

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-17
**Enunciado original:** «abismo: negro es aburrido, pero lo quiero oscuro. valorar
meter una ondulación de degradados de colores oscuros marinos. casi negro, pero no»

## El problema real: la pantalla sólo variaba en vertical

El agua es una tira de 4 px de ancho a la altura del lienzo, estirada a lo ancho. Eso
quiere decir que **en horizontal la pecera entera era un único valor**: toda fila de
píxeles del fondo tenía exactamente el mismo color. No es que fuera negro, es que era
plano, y un plano no se lee como profundidad, se lee como apagado.

## Cómo

Cuatro manchas de color marino oscuro que se cruzan muy despacio, sumadas al agua.
Dos decisiones que importan:

- **Van a 1/6 de resolución y se amplían.** Reducir y ampliar con bilineal es un
  desenfoque gratis, y lo que se pide es una ondulación, no cuatro círculos. Es el
  mismo truco de la pirámide de dispersión.
- **Se pintan DENTRO de `pintaAgua`, antes de la modulación.** Así una marea que baje
  también se lleva la ondulación por delante, en vez de quedar flotando encima.

Las manchas se guardan en fracciones de pantalla, no en píxeles: sobreviven a un
redimensionado sin re-sortearse. Si no, esconder la barra de URL en el móvil le
cambiaba el color a la escena.

## El ajuste de `fuerza`, medido contra el negro

Luminancia del cuadro completo (muestreo de 160×200 px), con la escena viva:

| `fuerza` | p10 | mediana | p90 | píxel más oscuro |
|---|---|---|---|---|
| 0 (antes) | 2,1 | 6,5 | 13,9 | `0,0,1` |
| 0,22 | 4,6 | 8,4 | 15,7 | `0,1,2` |
| **0,32 (elegido)** | **~5,4** | **~9,3** | **~16,4** | **`0,1,3`** |
| 0,50 | 7,2 | 10,7 | 17,7 | `0,2,4` |
| 0,90 | 10,4 | 14,2 | 23,1 | `0,3,7` |

A 0,9 la mediana se dobla y el negro desaparece: eso ya no es un abismo. A 0,32 sube un
45 %, se ve el color, y el píxel más oscuro sigue siendo prácticamente negro.
Exactamente «casi negro, pero no».

`fuerza: 0` la apaga entera y el agua vuelve a ser la tira de antes. Está en el panel
de pruebas como «ondulación».
