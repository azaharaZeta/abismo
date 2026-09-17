# Idea: Rapes — no transparentes, bordes más finos, volumen

**Estado: IMPLEMENTADA** · procesada el 2026-09-15 · archivada el 2026-09-15
**Enunciado original (del índice):** «Rapes: Los rapes no deberían ser transparentes.
Hacer sus bordes menos gruesos. Darles volumen, que no parezcan planos.»

## Diagnóstico

Se reprodujo con un rape fijado en el centro, agrandado y con la iluminación forzada.
Los tres síntomas eran reales y tenían tres causas distintas:

1. **Transparente.** Lo único que rellenaba el cuerpo era el degradado direccional,
   un radial centrado en la luz con radio `max(Lg*0.55, dl*1.30)` que **muere dentro
   del propio cuerpo**. Resultado: la mitad de atrás del pez tenía alfa ≈ 0 y se veía
   el agua —y el plancton— a través de la panza. La cola, literalmente, no existía.
2. **Bordes gruesos.** El grosor real ya era fino (`Lg*0.013`). Lo que se leía como
   grueso eran dos cosas: (a) el canto con `nuc` a `0.95*br` **saturaba a blanco y
   florecía**; (b) la línea de la boca compartía el grosor del canto y, cerrada, las
   dos quijadas coinciden, así que se dibujaba **dos veces en el mismo sitio** — una
   barra casi blanca cruzando la cara de lado a lado.
3. **Plano.** El único modelado era un óvalo aplastado (`scale(1, 0.52)`) a `0.30*br`.
   Un cuerpo no se lee como redondo por un óvalo centrado: hace falta que la alfa
   cambie a lo ANCHO del cuerpo (lomo → costado → panza).

## Medición que decidió el ajuste

Antes de tocar alfas se midió la `br` real de los rapes en 30 s de escena (14 400
muestras). **El primer intento se estaba tuneando fuera del rango real** (`ilum` 1,6,
que no ocurre nunca):

| percentil | p10 | p50 | p90 | p99 | máx |
|---|---|---|---|---|---|
| `br` | 0,064 | **0,081** | 0,101 | 0,569 | 0,895 |

Conclusión: el 90 % del tiempo el rape está a `br` ≈ 0,06–0,10 (sólo su propia esca)
y únicamente en el 1 % superior sube a 0,5–0,9. El `techo: 2.2` del mundo **no se
alcanza jamás** en juego normal. El régimen que hay que tunear es `br` ≈ 0,8, no 1,6.

## El conflicto que apareció (y cómo se resolvió)

Primer reequilibrio: se puso una «piel» plana en coordenadas del pez como término
dominante. Arregló la transparencia, pero **rompió la premisa de la pieza**: con la
piel mandando, el pez se revelaba ENTERO en cuanto se encendía algo, y el mundo
dice explícitamente «el pez existe únicamente hasta donde alcanza su propia luz».

Reparto final, que sostiene las dos cosas:

- **La piel pone un suelo** (0,28–0,44 · `br`, degradado lomo→costado→panza). Nunca
  deja que ninguna parte del cuerpo llegue a alfa 0 → no se transparenta, y el
  degradado transversal es lo que da el cilindro.
- **El direccional sigue mandando** (0,40 → 0,20 → 0,03 · `br`, radio ampliado a
  `max(Lg*0.95, dl*1.45)` para que cubra el cuerpo en vez de morir dentro). Es el
  término que conserva el «hasta donde llega su luz»: costado iluminado lleno, cola
  que se va apagando.
- **Reflejo** a lo largo del costado iluminado (0,16 · `br`, `nuc`), que se corre con
  la luz: sustituye al óvalo centrado.
- **Realce longitudinal** (0,16 · `br`) para que la cabeza pese más que la cola.

Presupuesto resultante: costado iluminado de la cabeza ≈ 0,88 de alfa a `br` 0,76
(macizo), cola en sombra ≈ 0,25 (presente pero apagándose), y a `br` 0,082 el bicho
sigue siendo un resplandor junto al señuelo. Verificado a los tres regímenes.

## Cambios

Todo en `bichos.js`, dentro de `A.especie('rape', …).dibuja`:

- Nuevas pasadas **PIEL** y realce longitudinal, en coordenadas del pez.
- **DIRECCIONAL** con radio ampliado y suelo a 0,03 en vez de 0.
- **REFLEJO** (banda en el costado) en lugar del óvalo aplastado.
- Canto: `0.95/0.40` → `0.62/0.26` de alfa y `Lg*0.013` → `Lg*0.0075` de grosor.
- Boca: trazo propio a `Lg*0.0095`, ya no comparte el del canto.
- Branquia y línea lateral: `0.13` → `0.20` (sobre un cuerpo lleno, `0.13` en
  aditivo no suma nada).
- Aletas: `0.30/0.13` → `0.42/0.19`, para que no se queden atrás.

## Verificación

- Los tres regímenes de `br` (0,082 · 0,31 · 0,76) inspeccionados a 3× tamaño.
- La escena a tamaño y luz naturales sigue leyéndose como un abismo: sólo se ven
  las escas y una insinuación de cuerpos.
- 120 fps y cero errores de consola en `abismo` y en `medusas`.

## Límites conocidos (no son fallos)

- **El cuerpo no puede ocultar lo que tiene detrás.** Los planos y los bichos se
  componen con `lighter`: sumar nunca oscurece. Un plancton brillante detrás de un
  rape se seguirá viendo a través de él. Hacerlo opaco de verdad exigiría dibujar el
  rape en `source-over` dentro de su plano, lo que mete una forma de canto duro en
  una escena aditiva **y además rompería el tragado**, donde ver a la presa dentro
  de la boca es justamente el efecto. Se deja así a propósito.
- A `br` cercano al `techo` (fogonazo del bocado) el cuerpo satura y pierde los
  trazos internos. Es el comportamiento que el mundo pide: «el techo alto es lo que
  le deja quemar en vez de saturar gris».
