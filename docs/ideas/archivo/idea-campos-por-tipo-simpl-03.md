# Idea: agrupar `campos` por tipo antes de consultarlos

**Estado: IMPLEMENTADA** · analizada y ejecutada el 2026-09-18
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 3 de 12**
**Sustituye** al cabo suelto que estaba en el staging del índice («`M.campo()` es un
recorrido lineal…, aquí entra una rejilla»), que se retira de allí por la regla 6.

## Lo que se observó

[`M.campo(tipo, x, y, plano)`](../../../motor/api.js) recorre **todos** los campos vivos
y descarta por tipo **dentro** del bucle. El descarte geométrico barato ya está y está
bien medido (4,9 ms → 1,6 ms), pero el filtro que sobra antes es el de tipo:

Con el evento `cuerpo` en marcha, tres cuerpos ponen ~42 campos `apaga` cada uno:

| quién pregunta | cuántos | consultas por bicho y fotograma |
|---|---|---|
| plancton | ~600-850 | 3 (`enciende` + `silencio`, que son `apaga` y `tapa`) |
| pez linterna | 14 | 4 (`asusta`, `tinta`, `silencio`) |
| medusa | 2-6 | 4 (`gema`, `silencio`, `tajo`) |
| copépodo | 4-12 | 2 |
| rape | 1-2 | 1 |

≈ **2.200 llamadas por fotograma sobre ~126 campos ≈ 280.000 pasadas**, de las que
alrededor del 90 % mueren en la primera línea del bucle (`if (c.tipo !== tipo)
continue`). Un `silencio()` de una mota de plancton recorre los 126 campos `apaga` del
cuerpo **dos veces**: una buscando `apaga` y otra buscando `tapa`, que no existe.

## La propuesta

`campos` sigue siendo el array público que los eventos empujan —el contrato no
cambia—, pero `pasoEventos` lo indexa **una vez por fotograma**, después de que todo
el mundo haya empujado:

```js
// en motor/estado.js, junto a `campos`
const porTipo = new Map();

// al final de pasoEventos(dt), después de la pasada de def.campos()
porTipo.clear();
for (const c of campos){
  let a = porTipo.get(c.tipo);
  if (!a) porTipo.set(c.tipo, a = []);
  a.push(c);
}
```

y `M.campo` recorre `porTipo.get(tipo) || VACIO`.

**Cuidado con el orden**, que es la única trampa: los bichos empujan campos en
`def.campos()`, que corre en `pasoPlanos` y **después** de `pasoEventos`. O el índice
se construye al principio de `pasoPlanos` (después de la pasada de campos de los
cuerpos y antes de que se actualice nadie), o hay que reconstruirlo ahí. El sitio
correcto es justo después del bucle de `def.campos()` en
[bucle.js:433](../../../motor/bucle.js).

## Lo que se gana

Recorrido esperado por consulta: de 126 a los campos de ese tipo —0 para `tapa`
mientras no haya cuerpos sólidos, ~42 para `apaga`, 1 para `gema`—. Más de la mitad
del coste de campos, sin tocar una sola semántica y sin que ninguna especie ni ningún
evento se entere.

## Por qué esto antes que la rejilla

La rejilla espacial es la solución grande y sigue siendo la correcta el día que haya
cientos de campos o cientos de peces (el cardumen la necesita igual). Pero son ~25
líneas con estructura viva entre fotogramas, y esto son 8 sin estado. **Hacer el
bucket primero no estorba a la rejilla**: la rejilla se construiría por tipo de todas
formas.

## Por qué importa para el resto del análisis

Buena parte de la maquinaria de calidad —`vigila`, `degradar`, `V.calidad`,
`V.degradado`, `V.topeOndas`, `V.topeNiveles`, `escalaCalidad`, `aligera`,
`conDither`— existe para compensar el coste de fotograma. Bajar el coste es lo que
permite adelgazar ese subsistema (ver [simpl-06](idea-sin-aligera-simpl-06.md)), y no
al revés.

## Siguiente acción

1. Medir antes: `performance.now()` alrededor de `pasoPlanos` con el `cuerpo` lanzado
   a mano desde el panel y tres cuerpos en pantalla.
2. Meter el índice y volver a medir la misma escena.
3. Comprobar que `M.campo` sigue devolviendo lo mismo con el panel lanzando `glitch`
   (campos sin `plano`) y `cuerpo` (campos con `plano`) a la vez.

Saldo estimado: **+8 líneas**, −50 % del coste de campos.


## Hecho

**Estado: IMPLEMENTADA** · 2026-09-18

`motor/estado.js` gana `camposPorTipo` (un `Map`), `vaciaCampos()`,
`indexaCampos()` y `camposDe(tipo)`. `campos` sigue siendo exactamente lo que
era —el array público que empujan eventos y bichos—; lo que cambia es que
`M.campo` recorre `camposDe(tipo)` en vez de filtrar dentro del bucle.

**El sitio de la llamada era lo único delicado** y quedó donde decía el
análisis: al final de la pasada de `def.campos()` en `pasoPlanos`, que es el
último punto del fotograma en que alguien empuja un campo. `pintaSombras()`
corre antes y NO pasa por el índice —recorre `campos` a pelo—, que es lo
correcto: al agua sólo la tapan los `apaga` de los eventos.

Los dos `campos.length = 0` (en `pasoEventos` y en `para()`) pasan a
`vaciaCampos()`, o el índice sobreviviría a su array.

### Medido

Sonda sobre `M.campo` en el arnés de Node, 6.000 fotogramas con los ocho
eventos lanzados a mano:

| | |
|---|---|
| llamadas a `M.campo` | 11.599.015 (≈1.930 por fotograma) |
| pasadas SIN índice | 654.040.497 |
| pasadas CON índice | 221.938.688 |
| **ahorro** | **66,1 %** |

Mejor que el 50 % estimado. Coste real: **+14 líneas de código** en
`estado.js`, no las +8 previstas.

### Verificado

Cinco tiradas del arnés con `Math.random` sembrado (200 s normales · los ocho
eventos · el dedo arrastrando · una tirada lenta que dispara `degradar()` ·
móvil 375×812): **firma de estado bit-idéntica a la de antes del cambio**, y
cero NaN.

En el navegador, con el `cuerpo` y el `glitch` vivos (43 campos: 41 `apaga` y
2 `tapa`): `M.campo('apaga', …)` en el centro de un campo devuelve 0,705; muy
lejos, null; un tipo inexistente, null y sin reventar; y **la guarda de plano
sigue igual** —un campo de plano 1 lo lee quien pregunta desde el 0 y no
quien pregunta desde el 2—. Sin errores de consola.
