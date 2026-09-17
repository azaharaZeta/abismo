# Idea: Espectro de color por animal y por pecera

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-15
**Enunciado original:** «General: Cada animal: En lugar de colores fijos, usar un
random sobre un espectro de color aceptado para ese animal parametrizado en esa
pecera.»

## La decisión que define la idea: cuantizar

Un espectro continuo de verdad —un color distinto por bicho— choca con `buildHalos()`:
el motor pre-dibuja un lienzo de halo de 64×64 **por entrada de paleta**, y el
plancton y los fotóforos lo usan en cada frame. Un color por bicho serían cientos de
halos, construidos justo al poblar.

Solución: el espectro se convierte en paleta **al arrancar**, en `tramos` entradas. Con
12–24 tramos el salto de tono es de 3–15° y en bichos pequeños sobre negro no se
distingue de un espectro continuo. A cambio, **de ahí para abajo nada del motor
cambia**: halos, pesos, color raro y `M.color()` siguen funcionando sin tocarse. El
coste real medido en el abismo: 40 entradas de paleta en total, 40 halos.

## La fórmula no está inventada

Se midieron en HSL las 22 entradas escritas a mano de las dos piezas. El patrón es muy
consistente:

| | tono | saturación | luz |
|---|---|---|---|
| `core` | ≈ el del mid (Δ mediana −2°) | **1,00 siempre** | 0,93–0,98 (mediana 0,95) |
| `mid` | la identidad | 0,44–1,00 | 0,57–0,81 (mediana 0,72) |
| `glow` | mid +4° (hacia el azul) | 0,32–0,82 | **0,21–0,32 abismo · 0,34–0,57 superficie** |

Dos conclusiones que mandan en el diseño:

1. `core` es el mismo tono a **saturación plena** con luz 0,95: casi blanco, pero
   teñido. No es blanco desaturado, y por eso se lee como un núcleo encendido.
2. **Lo que de verdad separa una superficie de un abismo es `luzGlow`.** Es el
   parámetro que hay que mover al portar un espectro de una pecera a otra; el resto
   se puede dejar.

La fórmula HSL→RGB reproduce las entradas escritas a mano con **2/255 de desvío máximo
de canal**, así que las paletas originales estaban construidas así.

## Cambios

`motor.js`:
- `hsl(h,s,l)` y `generaPaleta(esp)` nuevos, más el bloque de valores de partida
  `ESPECTRO`.
- Los espectros se expanden en `arranca()` **antes** de calcular pesos y `MU.todos`,
  que es lo que hace que el resto del motor no distinga un color escrito de uno
  generado.
- Vale a nivel de mundo (`espectro: {...}`) y de especie (en su entrada de `bichos`).
  Si en el mismo sitio hay una `paleta` escrita a mano, gana ella: así se puede anular
  un espectro sin borrarlo.
- `tono[1]` puede pasar de 360 para envolver por el rojo: `[340, 400]`.

`mundos/abismo.html`:
- `pezlinterna`: espectro del círculo entero (24 tramos) **en lugar de once colores
  contados**. Siete constantes borradas. `luzGlow` en 0,20–0,30 para que el bicho
  tenga color y el agua no.
- `plancton`: espectro frío y estrecho, muy poco saturado (0,18–0,55) y claro. La
  nieve marina es materia muerta cayendo, no un organismo, y con la paleta del mundo
  salía con el color de uno.

`mundos/medusas.html`:
- `medusa`: espectro del arco entero del mundo (lima → rosa, tonos 100–344, 18 tramos)
  en vez de ocho escalones. El ámbar sigue escrito a mano en `raro`: es la excepción, y
  una excepción no se sortea.

## Verificación

- Los tres espectros generan lo esperado: 18 / 24 / 10 entradas, tonos repartidos
  uniformemente (14°, 15° y 6° de salto), **todas con halo construido**.
- Saturaciones de la nieve entre 0,22 y 0,49: pálida, como se pedía.
- La paleta del mundo y la de la especie son objetos distintos; la del mundo sigue
  intacta para las especies que no declaran espectro.
- Sin errores de consola, 120 fps en las dos piezas.

## Lo que queda abierto

- El resto de especies (copépodo, visitante) siguen con la paleta del mundo. Darles
  espectro propio es añadir cinco líneas a su entrada; no se ha hecho porque no lo
  necesitaban.
