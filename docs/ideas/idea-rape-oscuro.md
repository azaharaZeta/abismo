# Idea: el rape oscuro, en vez de transparente

**Estado: HECHA Y ESPERANDO EL VISTO BUENO** — está en la pieza, encendida
a `oscuro: 0.7`, y se puede apagar cambiando un número. Falta la decisión,
que es visual y es de la usuaria.
**Empezada:** 2026-09-20

> Lo pedido, literal: «probar a que el rape cuando está sin iluminar, en
> lugar de transparente, sea oscuro, un poco como la oscuridad del
> leviatan. pero esto quiero comprobarlo visualmente primero antes de
> aprobarlo».

---

## Qué se ha hecho

`ABISMO.bichos.@rape.oscuro`, de 0 a 1. Es **cuánta luz le quita al AGUA**
un rape al que no alumbra nadie, y se disuelve según sube su `ilum`: es un
agujero con forma de pez mientras nadie lo mira y desaparece en cuanto algo
lo alumbra y hay cuerpo que enseñar. El umbral es medio `techo`, el mismo
que ya usaba `congela`, para que «ya lo han encontrado» se conteste en un
solo sitio.

- **`oscuro: 0`** deja la pieza exactamente como estaba.
- **`oscuro: 0.7`** es lo que hay puesto.
- **`oscuro: 1`** es tan negro como el leviatán.

## Cómo está resuelto, y las dos cosas que hubo que arreglar antes

### 1 · El agua no veía a los cuerpos. Nunca.

`pintaSombras()` —lo único de la tubería que puede RESTAR— corre dentro de
`pintaAgua`, y la pasada `def.campos()` de los bichos estaba dentro de
`pasoPlanos`, que va después. O sea que el agua sólo llegaba a ver los
campos de los EVENTOS: **un cuerpo podía callar a los de detrás pero no
oscurecer el agua, hiciera lo que hiciera**. No era una limitación
declarada; era el orden del fotograma.

Arreglado sacando la pasada a `camposBichos()`, entre `pasoEventos` y
`pintaAgua`. No cambia la simulación —nadie empuja un campo entre los dos
sitios—, comprobado con firma numérica idéntica en seis tiradas sembradas.

### 2 · No vale ponerle un `apaga`, y el motivo importa

Lo obvio era que el rape empujara un campo `apaga`, que es lo que usa el
leviatán. **Se apagaría a sí mismo.** `silencio()` lee los `apaga` SIN
guarda de plano y sin `L`, y el rape se consulta a sí mismo en `bx,by`
—justo dentro de su propia elipse—, así que lo primero que se apagaría es
**su propia esca**, que es lo único que se le ve a oscuras.

La salida es que **quién oscurece el agua lo diga el campo y no su tipo**:
`agua` es qué parte de su `fuerza` se lleva de ahí, 1 en un `apaga` y 0 en
los demás. El rape lo pide en el `tapa` que ya empujaba, así que no hay un
campo más, no hay un tipo nuevo, y la sombra y el silencio son la MISMA
elipse y no se pueden desalinear.

## Lo que hay que mirar para decidir, y una pega de verdad

**La sombra sale BLANDA, y no es de este parámetro.** `pintaSombras` pinta
un degradado radial con la parada en `ABISMO.agua.sombra.nucleo` (0,55) y
**no mira el `filo` del campo**. O sea que la elipse que decide a quién se
calla tiene canto duro (`tapaFilo: 28`, y ése es el ajuste que hace que el
rape lea macizo) pero la que oscurece el agua se desvanece siempre igual.

Resultado: lo que se ve no es una silueta de pez recortada, es que **el
agua se ahonda alrededor del bicho**. Puede que sea justo lo que se quiere
—«un poco como la oscuridad del leviatán», y la del leviatán también es
blanda—, pero conviene saberlo antes de juzgar el número.

Y hay un segundo término que lo apaga y que tampoco es de aquí: **el rape
vive en `bandaY: [0.30, 0.70]`**, o sea a media altura, y el agua ahí ya es
casi negra —la tira va de `[4,13,21]` arriba a `[0,0,1]` abajo—. Una sombra
sólo puede quitar la luz que hay. Arriba se leería mucho más.

## Si se aprueba, lo que queda

- Elegir el número. Está en `oscuro`, en la entrada del rape.
- Decidir si vale la pena que `pintaSombras` respete el `filo` del campo.
  **Ojo: eso NO es sólo del rape.** El leviatán (`filo: 2.2`) y el `cuerpo`
  (`filo: 3`) usan la misma función, y con `pow(1 − d/r, 1/filo)` los dos
  saldrían bastante más llenos de lo que están hoy. Es otra idea, no un
  remate de ésta.

## Si se descarta

`oscuro: 0` y la pieza vuelve a ser la de antes. Lo demás **se queda**, y a
propósito: el `agua` del campo y el movimiento de `camposBichos` son dos
arreglos que valen por su cuenta —el segundo era un fallo de orden que
nadie había visto—, y el primero es lo que deja que cualquier cuerpo pueda
oscurecer el agua el día que se quiera.
