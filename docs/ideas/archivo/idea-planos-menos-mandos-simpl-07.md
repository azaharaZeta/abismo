# Idea: un plano son menos de seis números

**Estado: IMPLEMENTADA A MEDIAS** · analizada el 2026-09-18 · ejecutada el 2026-09-19
**Resumen:** `tScale` se va del plano; `sharp` se queda, y se queda con prueba
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 7 de 12**
**Hermana:** [idea-plancton-al-fondo](idea-plancton-al-fondo.md)

## Lo que se observó

```js
planos: [
  {resDiv:3, alpha:0.58, scale:0.40, sharp:0.35, tScale:0.62, drift:0.44},
  {resDiv:2, alpha:0.86, scale:0.74, sharp:0.78, tScale:0.85, drift:0.72},
  {resDiv:1, alpha:1.00, scale:1.32, sharp:1.00, tScale:1.00, drift:1.00},
]
```

**Dieciocho números ajustados a mano para expresar una sola variable: la distancia.**
Las seis secuencias son monótonas y nadie puede tocar una sin revisar las otras cinco.
La escena lo declara como virtud —«la distancia se lee por cuatro avisos a la vez»— y
lo es como diseño; el problema es el mantenimiento, no la idea.

Dos de los seis no se ganan el sitio:

### `tScale` — un mando de escena para una especie

| consumidores | dónde |
|---|---|
| medusa, largo de tentáculo | [medusa.js:260](../../../bichos/medusa.js) |
| medusa, largo de brazo oral | [medusa.js:412](../../../bichos/medusa.js) |

**Y sus valores son `alpha` con otro nombre:**

| plano | `tScale` | `alpha` |
|---|---|---|
| 0 | 0,62 | 0,58 |
| 1 | 0,85 | 0,86 |
| 2 | 1,00 | 1,00 |

Propuesta: borrarlo y usar `L.alpha` en los dos sitios, o —mejor— moverlo a la entrada
de la medusa como `tentFondo`, que es de quien es.

### `sharp` — atenuación encima de una atenuación

`sharp` atenúa los núcleos casi blancos (`c.core`) en tres funciones de dibujo: medusa,
rape y pez linterna. Pero el plano del fondo **ya** se compone al 58 % de alfa y se
pinta a un tercio de resolución, o sea con el bilineal desenfocándolo. `sharp` es una
tercera capa de «esto está lejos» sobre las dos que ya actúan.

No digo que sobre: digo que **no está comprobado que haga falta**, y es barato
comprobarlo.

## La propuesta

**Tramo corto (el que haría):**
1. Borrar `tScale` → 3 números y un mando de escena menos.
2. Poner `sharp: 1` en los tres planos desde el panel o a mano, mirar la pieza, y si
   no se nota, borrarlo → 3 números y 3 sitios de dibujo menos.

18 números → 12.

**Tramo largo (a decidir):** un plano es `{z}` y los seis salen de curvas globales.

```js
planos: [{z:0.42}, {z:0.75}, {z:1.0}],
profundidad: { escala: 1.32, alfa: 1.4, deriva: 1.0, res: 3 },
```

con `scale = z^a·k`, `alpha = z^b`, `drift = z^c`, `resDiv = round(1/z)`. Eso deja
**3 números por escena más 4 exponentes** en vez de 18, y añadir un cuarto plano pasa
a ser una línea.

## Lo que se pierde en el tramo largo, y por eso está sin decidir

El ajuste a mano puede llevar información que la curva no: `drift` (0,44 / 0,72 /
1,00) y `scale` (0,40 / 0,74 / 1,32) van casi a la par en los dos planos de atrás
—que es lo físicamente correcto, un cuerpo lejano subtiende menos movimiento en la
misma proporción en que subtiende menos tamaño— pero el plano de delante rompe la
relación: `scale` se empujó a 1,32 y `drift` se quedó en 1,00. Eso es una decisión de
composición («que el de delante sea grande sin ir más rápido»), no ruido, y una curva
la borraría.

Conclusión honesta: **el tramo corto es gratis, el largo cambia cómo se ajusta la
pieza** y sólo compensa si alguna vez hay un cuarto plano.

## Revisión de saldo · 2026-09-18, después de ejecutar 01, 02, 03, 06, 11 y 12

Las estimaciones de líneas de este análisis salieron **sistemáticamente
optimistas**: prometían −130 líneas de código entre las seis primeras y el
saldo real fue **+10**. El motivo es siempre el mismo y conviene tenerlo
delante al leer lo que sigue:

- **Extraer** un helper no ahorra. La versión general necesita más
  parámetros que cualquiera de los casos que sustituye, y la casa pide que
  venga explicada: `M.luzEn` quitó 27 líneas de tres sitios y costó 31.
- **Sustituir** un mecanismo por otro más simple ahorra poco: la floración
  sin paleta gemela salió en −7.
- **Borrar** es lo único que ahorra de verdad.

Lo que sí se cumplió fue lo otro —conceptos fuera del vocabulario, una sola
implementación de la regla de la casa, 66 % menos de pasadas de campo—, así
que el criterio para decidir estas seis **no debería ser el tamaño**.

## Siguiente acción

1. `tScale` → `L.alpha` en los dos sitios de la medusa. Mirar.
2. `sharp: 1` en los tres, mirar el banco y las medusas del fondo a oscuras
   (la trampa de [idea-super-colores](idea-super-colores.md): cualquier prueba
   de color se hace a oscuras, no con un pez pegado a una esca).
3. El tramo largo, aparcado hasta que haga falta un plano más.

Saldo MEDIDO: **0 líneas de código.** `tScale` y `sharp` son números dentro
de tres objetos de una línea y factores dentro de expresiones que ya existen,
así que quitarlos no borra ninguna línea: borra **2 conceptos y 6 números**
que hoy hay que mantener coherentes a mano. Es la más barata de ejecutar de
las que quedan y la de menos riesgo.

## Hecho

**2026-09-19.** De los dos, uno sí y otro no.

### `tScale` → `tent`, en la entrada de la medusa · HECHO

`ABISMO.planos` pierde una columna: de seis mandos por plano a cinco. Los
tres números no desaparecen —siguen siendo 0,62 / 0,85 / 1,00— pero pasan a
`tent: [0.62, 0.85, 1.00]` en la medusa, que es la única que los lee. El
plano deja de declarar algo que sólo le sirve a una especie.

**Se descartó usar `L.alpha` en su lugar** aunque los valores casi coincidan
(0,58 / 0,86 / 1,00): habría acortado un 6 % los tentáculos del plano del
fondo para ahorrar tres números, y tres números bien puestos no valen un
cambio visible.

Una trampa por el camino, cazada por el arnés de Node en el primer intento:
el helper se llamó `tent` y **dentro de `dibuja` ya hay un `const tent`**,
las paradas del degradado del tentáculo. La constante local tapaba a la
función y el `dibuja` reventaba a mitad de fotograma. Se llama `escNube`.

### `sharp` → SE QUEDA, y hay prueba

La hipótesis del análisis era que `sharp` podía ser redundante: el plano del
fondo ya se compone al 58 % de alfa y a un tercio de resolución, así que
atenuar además los núcleos casi blancos podía no aportar nada.

Comprobado en caliente, poniendo `sharp: 1` en los tres planos y recalculando
sin repoblar, con dos capturas seguidas de la misma escena: **sí aporta.** Los
bichos del plano del fondo salen con el canto y los fotóforos marcados y
dejan de leerse como lejanos. No es una tercera capa redundante sobre
`resDiv` y `alpha`: es la que impide que un núcleo casi blanco sobreviva a
las otras dos.

Se queda tal cual y el comentario de la escena ahora lo dice, para que no se
vuelva a proponer.

### El tramo largo (un plano es `{z}` y lo demás sale de curvas) sigue aparcado

Sin cambios respecto al análisis: sólo compensa el día que haga falta un
cuarto plano, y la relación entre `scale` y `drift` del plano de delante es
una decisión de composición que una curva borraría.

### Saldo

**0 líneas**, −1 columna en la definición de plano, y una hipótesis cerrada
con prueba en vez de con opinión. Verificado bit-idéntico en las cinco
tiradas del arnés.
