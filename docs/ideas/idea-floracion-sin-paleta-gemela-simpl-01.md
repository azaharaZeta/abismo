# Idea: la floración sin paleta gemela

**Estado: PROPUESTA** · analizada el 2026-09-18 · sin tocar código
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 1 de 12**
**Hermanas:** [idea-super-colores](archivo/idea-super-colores.md) (la implementó),
[idea-espectro-color](archivo/idea-espectro-color.md) (puso el cacheo que la obliga)

## Lo que se observó

El sistema de color es barato y está bien hasta su octava consecuencia: **como el halo
se cachea DENTRO de la entrada de paleta (`M.halo(c)`), un bicho no puede teñir su
propio color**. De ahí sale toda la maquinaria de la floración, que es la parte más
enredada del color de la pieza:

| pieza | dónde | qué cuesta |
|---|---|---|
| `espectroVivo` | [escena.js:891](../../escena.js) | 6 líneas de código, ~20 de comentario, y **duplica `tono` y `tramos`** del espectro base |
| `paletaVivo` | generada por `resuelveEspectros` | 32 entradas más de paleta, con sus 32 halos y 32 puntos |
| `iC` | [pezlinterna.js:179](../../bichos/pezlinterna.js) | un `indexOf` por pez al nacer y un campo de estado |
| la invariante | sólo un comentario | los dos espectros TIENEN que declarar el mismo `tono` y los mismos `tramos` o el pez se enciende en el color de otro. Nada lo comprueba |
| `mezcla()` a mano | [pezlinterna.js:446-448](../../bichos/pezlinterna.js) | los tres canales interpolados en el `dibuja` |
| doble halo | [pezlinterna.js:548-549](../../bichos/pezlinterna.js) | **dos `pintaHalo` por fotóforo** mientras dura el tinte, para cruzar el fundido |

Y todo ello para un efecto que la propia ficha que lo implementó resume en un número:
«**`luzCore` ES EL NÚMERO QUE HACE EL EVENTO**». De un pez en agua abierta el cuerpo no
se ve; lo que se ve es la hilera del vientre, y esos puntos se pintan con `core`.

## La propuesta

El tinte se calcula **desde el propio color del pez**, sin segunda paleta:

```js
const cCore = mezcla(z.c.core, z.c.mid, z.tinte*K);   // K ≈ 0.7
```

`rl` (el `tinteBrillo` que ya existe, 1,2) sigue subiendo lo que emite.

### Por qué K ≈ 0,7, con los números de la ficha vieja

`idea-super-colores` midió el `core` vivo que hace el evento. Interpolando el `core`
normal hacia el `mid` del mismo tramo se llega casi al mismo sitio:

| tramo | `core` normal | `core` vivo medido (`luzCore` 0,60-0,70) | `mezcla(core, mid, 0.7)` |
|---|---|---|---|
| 0 (rojo) | 255,226,226 | 255,83,83 | ≈ 237,87,87 |

O sea: el gemelo saturado, para lo que de verdad se ve, **es el `mid` del propio pez**.

## Lo que se pierde, y es real

`espectroVivo` no sólo baja `luzCore`: también sube `satGlow` (0,92-1,00 contra
0,70-0,92) y `luzGlow` (0,30-0,42 contra 0,20-0,30), o sea que el HALO del fotóforo
también se enciende. Con la propuesta eso desaparece y lo tiene que cubrir
`tinteBrillo`, que sube brillo pero no saturación.

Traducido: la onda seguirá leyéndose —la hilera pasa de blanca al color del pez, que
es el 90 % del efecto— pero el halo quedará algo menos encendido. Si al verlo falta,
la vía intermedia está abajo.

## Alternativa si el halo hace falta

Generar el gemelo **como cuarto campo de la propia entrada de paleta** (`c.vivo =
{core, mid, glow, halo, punto}`), calculado en `generaPaleta` a partir del mismo `h`.
Eso mata igualmente `espectroVivo`, `paletaVivo`, `iC` y la invariante de índices —que
es lo peligroso— y conserva el halo saturado y su cacheo. Cuesta ~8 líneas en
`motor/color.js` y deja el `mezcla` a mano y el doble halo como están.

## La trampa de la verificación, heredada

De `idea-super-colores`, palabra por palabra: la primera comparación A/B se hizo con
`ilum` 1,1 —un pez pegado a una esca— y ahí el cambio se veía perfectamente; a `ilum`
0,06, que es lo normal, no se veía nada. **Cualquier prueba de color de esta pieza hay
que hacerla a oscuras.**

## Siguiente acción

1. Lanzar la floración desde el panel y capturar el banco a `ilum` bajo, antes.
2. Aplicar la mezcla `core→mid` y comparar la misma escena.
3. Si el halo falta, pasar a la alternativa `c.vivo` en vez de volver atrás.

Saldo estimado: **−45 líneas** entre escena y código, y una invariante no comprobable
menos.
