# Idea: un plano son menos de seis números

**Estado: PROPUESTA** · analizada el 2026-09-18 · sin tocar código
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 7 de 12**
**Hermana:** [idea-plancton-al-fondo](archivo/idea-plancton-al-fondo.md)

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
| medusa, largo de tentáculo | [medusa.js:260](../../bichos/medusa.js) |
| medusa, largo de brazo oral | [medusa.js:412](../../bichos/medusa.js) |

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

## Siguiente acción

1. `tScale` → `L.alpha` en los dos sitios de la medusa. Mirar.
2. `sharp: 1` en los tres, mirar el banco y las medusas del fondo a oscuras
   (la trampa de [idea-super-colores](archivo/idea-super-colores.md): cualquier prueba
   de color se hace a oscuras, no con un pez pegado a una esca).
3. El tramo largo, aparcado hasta que haga falta un plano más.

Saldo estimado: **−6 números de escena** y, si `sharp` cae, **−3 sitios de dibujo**.
