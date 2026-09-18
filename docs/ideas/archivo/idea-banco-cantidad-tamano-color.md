# Idea: menos peces, más grandes y más coloridos

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-18
**Enunciado original:** «peces: ajustar cantidad, tamaño y color: Menos peces, más
grandes, y más coloridos»

## Tres mandos y un cuarto que arrastran

Los tres están en la entrada `pezlinterna` de la escena, pero el tamaño **no viaja
solo**: `cardumen.roce` —a cuántas U empiezan a estorbarse— va en U y no en largos,
así que subir el bicho sin subir el roce mete al banco dentro de sí mismo. Lo avisa
el propio comentario de `largo`, y es el único acoplamiento del cambio.

| | antes | ahora |
|---|---|---|
| `total` | `{cada:11000, min:24, max:60}` | `{cada:16000, min:15, max:38}` |
| `largo` | `[0.86, 1.44]` | `[1.15, 1.92]` |
| `cardumen.roce` | `2.25` | `3.0` |
| `espectro.sat` | `[0.78, 1.00]` | `[0.88, 1.00]` |
| `espectro.luz` | `[0.64, 0.80]` | `[0.54, 0.70]` |
| `espectro.satGlow` | `[0.56, 0.82]` | `[0.70, 0.92]` |

De la cuenta hay que mover **los dos números**: a 1024×768 el que corta es `max`
(el área da 49 peces con el `cada` nuevo), pero en una pantalla de móvil manda
`cada`. Con uno solo, el cambio no se nota donde no manda.

## El color: bajando `luz`, no subiendo `sat`

En HSL las dos se pelean, y el `sat` alto con `luz` alta no da color sino pastel: el
tono puro está en `luz` 0,5 y de ahí hacia arriba todo se va a blanco. El banco
estaba plateado **a propósito** —un mictófido lo es—, así que lo que pedía el
encargo era justo deshacer eso: `luz` baja a 0,54-0,70 y `sat` sube un poco.

Medido sobre la paleta ya resuelta (32 tramos), la saturación real —`(max−min)/max`
sobre el RGB del `mid`— pasa de **0,33-0,67 a 0,56-0,91**. El halo va aparte y algo
más bajo de parámetro, pero su `luz` de 0,20-0,30 lo deja en 0,82-0,96 de saturación
real: de lejos, lo que se ve de un pez es el halo del fotóforo, y ahí está el color.

El núcleo (`core`) sigue saliendo casi blanco pase lo que pase, y debe: es el punto
quemado del fotóforo.

## Lo medido

Arnés de Node a 1024×768 (U = 34,1), pecera sin eventos, 40 fotogramas de asiento:

| | antes | ahora |
|---|---|---|
| peces en los tres planos | 59 | **38** |
| largo medio (U, ya con la escala de cada plano) | 1,05 | **1,36** |
| distancia al vecino más cercano (U) | 1,97 | **2,48** |
| vecinos dentro de `vista` | 4,1 | **2,8** |
| alineación del grupo | 0,21 | 0,14 |

O sea: un 36 % menos de peces, un 30 % más grandes y con la separación subida en la
misma proporción que el cuerpo, que es lo que evita el solape.

## Lo que se probó y se descartó: escalar `vista` con el bicho

Con menos peces repartidos por la misma área, cada uno ve a menos vecinos (4,1 →
2,8). La tentación es subir `vista` en la misma proporción que el cuerpo (4,2 → 5,6)
para devolverle la densidad de información al banco. Medido:

| `vista` | vecinos a la vista | alineación |
|---|---|---|
| 4,2 | 2,8 | 0,14 |
| 5,6 | 5,2 | **0,09** |

No arregla nada y **empeora lo que `vista` está ahí para sostener**: es el número que
impide que el banco entero llegue a un acuerdo, y la escena lo tiene medido para eso
(su comentario documenta cómo mueve la alineación). Subirlo para compensar la
densidad es usar un mando de carácter para tapar una consecuencia buscada —hay menos
peces porque se pidieron menos peces—. Se queda en 4,2.

## Verificación

- En el navegador a 1024×768: el banco se lee como banco, con los cuerpos ya
  distinguibles uno a uno y el moteado de color visible sin confeti (el sorteo de
  `dominantes`/`tendencia` no se ha tocado, así que sigue mandando uno o dos tonos).
- Arnés de Node: sin NaN en el contexto, con la travesía entera del leviatán y el
  gesto del dedo.

## Lo que deja pendiente

El banco es menos denso, y eso es el encargo. Si en algún momento se quiere que
**parezca** más denso sin devolver peces, el mando no es `vista` sino el reparto por
planos (`reparto`, hoy cargado hacia delante) o `roce`, que es el que fija el hueco
entre cuerpos. Queda dicho aquí para no volver a probar `vista`.
