# Idea: quitar `aligera` del contrato de especie

**Estado: IMPLEMENTADA** · analizada y ejecutada el 2026-09-18
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 6 de 12**
**Depende de:** [simpl-03](idea-campos-por-tipo-simpl-03.md) conviene ir antes

## Lo que se observó

El subsistema de calidad tiene **nueve piezas de estado** para un escalón único y sin
vuelta atrás:

`vigila()` · `degradar()` · `V.calidad` · `V.degradado` · `V.topeOndas` ·
`V.topeNiveles` · `conDither` · la bandera `escalaCalidad` · el gancho `aligera(o)`

De las nueve, la que menos gana es `aligera`. Tiene **dos implementaciones**:

| especie | qué hace |
|---|---|
| [medusa.js:197](../../../bichos/medusa.js) | `j.nT = max(6, round(j.nT*0.6))` — menos tentáculos |
| [rape.js:27](../../../bichos/rape.js) | `f.dientes = max(4, (f.dientes*0.6)|0)` — menos dientes |

Y a cambio obliga a dos sitios del motor a acordarse de ella:

- [bucle.js:68-71](../../../motor/bucle.js): `puebla()` tiene que reaplicarla a los que
  nazcan **después** de haber degradado, o repoblar (redimensionado grande, botón del
  panel) le devuelve el detalle completo a la máquina que ya demostró que no podía.
- [bucle.js:245](../../../motor/bucle.js): `degradar()` tiene que recorrer la población
  viva aplicándola.

Es decir: un gancho de dos líneas que genera una invariante temporal («esto hay que
rehacerlo aquí también») y tres líneas de comentario avisando de ella.

## Por qué gana poco

`degradar()` **ya recorta el 45 % de la población** de las especies con
`escalaCalidad` (plancton, copépodo, pez linterna), apaga el dither y baja la pirámide
del velo de 4 niveles a 2. El coste de la pieza es relleno a pantalla completa; los
tentáculos de 2-6 medusas y los dientes de 1-2 rapes no están en ese presupuesto.

Ni la medusa ni el rape declaran `escalaCalidad`, así que en una máquina lenta la
pieza conserva **todas** sus medusas y **todos** sus rapes, sólo que con menos
tentáculos y menos dientes. Si de verdad hiciera falta recortar por ahí, lo que hay
que recortar es cuántos hay, no el detalle de cada uno.

## La propuesta

Borrar `aligera` de las dos especies, de `degradar()`, de `puebla()` y del **REGISTRO
DE ESPECIES** en [registro.js:22](../../../motor/registro.js). El resto del subsistema se
queda tal cual: es el que hace el trabajo.

## Lo que se pierde

En una máquina lenta, ~0,02 ms de fotograma que hoy se ahorraban en tentáculos y
dientes. No es medible contra las pasadas a pantalla completa que quedan.

## Lo que NO se toca, y por qué

- **`escalaCalidad`** se queda: recortar población es el 90 % de lo que hace
  `degradar()`.
- **El escalón único y sin vuelta atrás** se queda, y es una buena decisión: subir y
  bajar la calidad según el tiempo de fotograma oscila y se ve peor que ir lento.
- **El velo nunca se quita**, sólo se le recortan niveles. También se queda: es lo que
  hace que esto sea agua.

## Siguiente acción

Es de las de una sentada. Llamar a `degradar()` a mano desde la consola con la pieza
corriendo, antes y después, y comprobar que el fotograma degradado sigue en el mismo
sitio.

Saldo estimado: **−20 líneas** y un gancho menos en el contrato de especie.


## Hecho

**Estado: IMPLEMENTADA** · 2026-09-18

Fuera `aligera` de la medusa, del rape, de `puebla()`, de `degradar()`, del
**REGISTRO DE ESPECIES** y de CLAUDE.md. Cero menciones en el repo.

`puebla()` se queda sin la variable `flojea` y su bucle pasa a una línea; el
comentario que avisaba de «las dos cosas hay que rehacerlas aquí» se queda
sólo con la mitad que sigue siendo verdad —`calidad` sí hay que reaplicarla
al repoblar, o un redimensionado grande le devuelve la población entera a la
máquina que ya demostró que no podía.

### Verificado

Las mismas cinco tiradas sembradas, **bit-idénticas**, incluida la tirada
lenta (40 ms por fotograma) donde `degradar()` entra de verdad: sale con
`calidad=0.55`, `degradado=true`, `topeOndas=10` y `topeNiveles=2`, igual que
antes. Tenía que salir idéntica y la razón es que `nT` y `dientes` sólo
entraban en el DIBUJO: ni uno ni otro tocaban la simulación.

Saldo real: **−5 líneas de código** y un gancho menos en el contrato de
especie.
