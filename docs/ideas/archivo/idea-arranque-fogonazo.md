# Idea: Fogonazo al arrancar la pecera de los rapes

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-15
**Enunciado original:** «Al arrancar la pecera de los rapes, aparecen todos iluminados
un momento, hasta que los señuelos se posicionan o algo, y ya quedan a oscuras. esto
no debería ocurrir.»

## Causa

La intuición del enunciado era exacta: **era la esca**. En `rape.crear` nacía encima
del cuerpo (`x: bx, y: by, lx: bx, ly: by`), y el modelo de luz propia la veía a
distancia cero. Con `q = 0` la penalización de `autoLuz` se disuelve entera —el
término es `autoLuz + (1-autoLuz)*exp(-3q)`, que en q=0 vale 1— así que el peso de luz
salía de casi 1,6 en vez de los 0,05 de régimen. El cuerpo se encendía por el modelo
de siempre hasta que el muelle del ilicio colocaba el señuelo.

## Un diagnóstico equivocado por el camino

El primer arreglo **no funcionó y la medición lo dijo**: el pico seguía igual. Resultó
que el parche era **código inalcanzable** — el `crear` del rape hacía `return { … };`
directamente, así que las líneas añadidas después del literal nunca se ejecutaban.
`node --check` pasa (es sintácticamente válido) y la función incluso contiene el
código, así que la comprobación de «¿está cargado el parche?» daba `true`. Lo que lo
delató fue medir la distancia esca–cuerpo: **0,45 largos al nacer en vez de 1,12**.

Arreglado ligando el literal a una variable (`const f = { … }`) y devolviéndola al
final, después de colocar la esca.

## Verificación A/B (10 tiradas por modo, un rape aislado)

| | esca al nacer | curva de `br` en los 2 primeros segundos | pico medio |
|---|---|---|---|
| Antes | 0 largos | 0,074 → **0,255** → 0,142 → 0,075 → 0,05 | **0,35** |
| Ahora | 0,71 largos | 0,018 → 0,054 → 0,063 → 0,066 → **0,067** | **0,073** |

La curva pasa de tener una joroba a ser una rampa monótona hasta su valor de régimen.
El pico baja 4,8 veces y coincide con el régimen, o sea: ya no hay transitorio.

Para aislarlo hizo falta bajar a **un solo rape**: con seis en un plano se iluminan
entre ellos y el efecto queda tapado (el primer banco daba una mediana de 0,62 cuando
la real de la escena es 0,081).
