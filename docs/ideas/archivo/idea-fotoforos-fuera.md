# Idea: Los puntos de los peces salen dibujados fuera del pez

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-17
**Enunciado original:** «peces: revisar los puntos de colores de los peces, salen
dibujados fuera del pez»

## Era exacto, y era todos

La hilera de fotóforos del pez linterna se trazaba con una fórmula propia
—`fy = 0.15 + 0.03·sin(4u)`, o sea entre 0,127 y 0,180 largos bajo el eje— mientras
que el canto de la panza lo dibuja una curva cuadrática distinta que **no pasa de
0,121 largos** en su punto más hondo, y que en la cabeza está a 0,066.

| | x (largos) | canto de la panza | fotóforo |
|---|---|---|---|
| morro | +0,340 | 0,066 | **0,150** |
| medio | +0,057 | 0,121 | **0,180** |
| cola | −0,320 | 0,055 | **0,127** |

No era «alguno se sale»: **ninguno estaba dentro**, y los peores eran los de los dos
extremos, que es donde el cuerpo es fino. A 1–2 px de cuerpo, una hilera 3 px por
debajo del canto se lee como una ristra de puntos suelta al lado del pez.

## Arreglo

La causa de fondo es la de siempre: **dos sitios describían la misma curva**. Ahora la
panza son tres puntos de control (`PANZA`) y una función `panzaPez(t, Lg, cola)` que
evalúa la cuadrática; la usan el trazado del cuerpo y la hilera, así que no pueden
despegarse al tocar un número.

Dos detalles que hacían falta además de ponerla sobre la curva:

1. **`DENTRO = 0.72`** — sobre el canto exacto, el punto queda centrado en la línea y
   la mitad se sale igual. Se mete al 72 % de la profundidad de la panza.
2. **el radio se recorta al hueco que queda** (`min(Lg*0.035, panza − fy)`). Sin esto
   seguía asomando 0,023 largos en los extremos, donde el cuerpo casi no tiene grosor.
   El efecto secundario es bueno: la hilera se afina hacia el morro y hacia la cola,
   que es como la lleva un mictófido de verdad.

## Verificación

Asomo máximo del punto por fuera del canto, medido sobre 10 posiciones de la hilera:

| | asomo |
|---|---|
| antes | **+0,084 largos** |
| sobre la curva, sin recortar el radio | +0,023 largos |
| **ahora** | **0,000** |

El halo sí sigue saliéndose del cuerpo, y debe: es luz en el agua, no el punto.
