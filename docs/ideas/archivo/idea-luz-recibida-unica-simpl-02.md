# Idea: una sola «luz recibida» para toda la pieza

**Estado: IMPLEMENTADA** · analizada y ejecutada el 2026-09-18
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 2 de 12**
**Hermanas:** [idea-rapes-ocultacion](idea-rapes-ocultacion.md),
[idea-carrona-esqueleto](idea-carrona-esqueleto.md),
[idea-cuerpo-blando](idea-cuerpo-blando.md)

## Lo que se observó

«Nadie está iluminado por la escena» es la regla de la casa, así que «cuánta luz me
llega» es **el cálculo central de la pieza**. Está escrito cuatro veces:

| dónde | curva | corta en `r` | qué devuelve |
|---|---|---|---|
| [rape-caza.js:220](../../../bichos/rape-caza.js) `luzRecibida` | `pow(1/(1+d²/r²), caida)` | no | total + posición del foco dominante |
| [carrona.js:131](../../../eventos/carrona.js) por vértebra | `pow(1 − d/r, caida)` | **sí** | total, por hueso |
| [cuerpo.js:457](../../../eventos/cuerpo.js) `pintaBordeCuerpo` | `pow(1/(1+d²/r²), caida)` | no | **vector** + color dominante, por muestra |
| [pezlinterna.js:426](../../../bichos/pezlinterna.js) `ob` | `1.25/(1+(d/r)²)` | no | sólo el cebo más cercano |

Tres de las cuatro comparten hasta el vocabulario de la escena: `alcance`, `caida`,
`ganancia`, `techo`, `base`. Tres de las cuatro hacen el mismo bucle sobre
`L.luces` / `M.luces(plano)` leyendo el mismo protocolo pato (`o.rCuerpo || o.rLuz`,
`o.luzI`, `o.c`).

**Y dos comentarios largos existen sólo para explicar por qué la de al lado es
distinta** —el de la carroña justificando el corte, el del cuerpo justificando que
no lo usa—. Eso es la firma del parche sobre parche: la diferencia es un booleano y
está contada como si fueran dos diseños.

## La propuesta

Un solo lector en el motor, al lado de `M.luces()` y `M.cardumen()`, que ya son el
vocabulario de lectura de la escena:

```js
M.luzEn(x, y, plano, {alcance, caida, ganancia, techo, base, corta, vector})
  → { total, x, y, c, vx, vy }      // objeto compartido, consúmelo en el acto
```

- `corta: true` → la curva de la carroña (se apaga de verdad al salir del foco).
- `corta: false` → la del rape y el cuerpo (hilo de luz a cualquier distancia).
- `vector: true` → acumula además la dirección, que es lo único que el cuerpo
  necesita de más y hoy le obliga a tener su propio bucle.
- El foco dominante sale gratis del mismo recorrido: hoy lo calculan tres de los
  cuatro por su cuenta.

El pez linterna es el caso raro —sólo mira señuelos (`o.senuelo`) y sólo el más
cercano— y puede quedarse como está o pasar un filtro; no forzarlo.

## Lo que se gana, aparte de las líneas

Hoy, cambiar cómo se revela un cuerpo en esta pieza significa tocar hasta cuatro
sitios y acordarse de los cuatro. Con un lector único, la regla de la casa tiene
**una implementación**, que es lo que la hace una regla.

## Lo que se pierde

Nada visible si se conservan las dos curvas. El riesgo es de refactor puro:
`pintaBordeCuerpo` recorre `N_PIEL` muestras (≈42 por cuerpo, hasta 3 cuerpos) y hoy
tiene el bucle en línea; pasar por una llamada con objeto de opciones tiene que
seguir sin asignar por muestra —de ahí que `luzEn` devuelva un objeto compartido,
como ya hacen `M.campo`, `M.borde` y `M.salto`.

## El protocolo pato, que es el otro cabo

`L.luces` transporta hoy siete campos duck-typed (`x`, `y`, `c`, `rLuz`, `rCuerpo`,
`luzI`, `senuelo`) y **el registro sólo documenta `rLuz`**
([registro.js:13](../../../motor/registro.js)). Al unificar el lector es el momento de
escribir el contrato completo ahí, que es donde alguien lo va a buscar.

## Siguiente acción

1. Escribir `M.luzEn` en `motor/api.js` reproduciendo exactamente la curva del rape.
2. Migrar el rape primero y comparar con el arnés de Node (percentiles de `br`; la
   referencia está en [idea-rapes-volumen](idea-rapes-volumen.md): p50 ≈ 0,081).
3. Después la carroña (con `corta`), después el cuerpo (con `vector`).
4. Completar el contrato de `L.luces` en `motor/registro.js`.

Saldo estimado: **−60 líneas** y cuatro sitios de ajuste convertidos en uno.

## Hecho

**Estado: IMPLEMENTADA (tres de los cuatro)** · 2026-09-18

### La forma que se le ha dado

`M.luzEn(x, y, luces, op)` en [motor/api.js](../../../motor/api.js), al lado de
`M.luces()` y `M.cardumen()`, que ya eran el vocabulario de lectura de la
escena. Devuelve un objeto compartido —como `M.campo`, `M.borde` y `M.salto`—
con `total`, `x`, `y` y `c` de la que más pesa, y `vx, vy` de la suma de
direcciones.

`luces` se pasa entera y no por número de plano: una especie le da su
`L.luces` sin buscar nada y un evento le da `M.luces(plano)`. Cinco opciones,
y cada una está porque alguno de los tres la necesitaba distinta:

| opción | rape | carroña | cuerpo |
|---|---|---|---|
| `corta` | — | **sí** | — |
| `alcance` | 1 | 3,2 | 4,2 |
| `caida` | 3,2 | 2,2 | 2,0 |
| `ganancia` | **2,0 dentro** | 1 (la aplica fuera, con `techo`) | 1 |
| `umbral` | 0,004 | 0,004 | **0,002** |
| `propio`/`autoLuz` | **sí** | — | — |
| qué se lleva | `total` + posición | `total` | **vector** + color |

`techo` y `base` se quedan FUERA a propósito: son de quien pregunta, que es
quien sabe con qué los compone —la carroña hace `min(techo, tot*gan) + base`
y el rape lo aplica en su `dibuja`.

### El pez linterna se queda fuera, y es lo correcto

Su `ob` no es «la suma de los focos que me alcanzan»: es la caída sobre **un
solo cebo ya elegido** por otro bucle —el más cercano con la bandera
`senuelo`—, con exponente fijo y ganancia 1,25. Meterlo obligaría a añadir
«filtra por bandera» y «quédate sólo con el más cercano» al lector común,
que son dos opciones más para un caso que no las comparte con nadie.

### Verificado, y esta vez de dos maneras

**1 · Bit-identidad.** Las cinco tiradas del arnés sembrado dan una firma de
estado **idéntica** a la de antes del cambio. Para conseguirlo hubo que
respetar tres detalles que parecían cosméticos:

- `ganancia` va DENTRO y antes del descarte, porque el rape descartaba sobre
  la `w` ya multiplicada. Sacándola fuera había que mover el umbral a 0,002
  y, además, `Σ(wᵢ·g)` no es `(Σwᵢ)·g` en coma flotante.
- la rama con corte usa `Math.hypot` y la otra `Math.sqrt(d²)`, como estaban:
  no dan el mismo último bit.
- el umbral del cuerpo era 0,002 y el de los otros dos 0,004. Era una
  diferencia real, no un descuido, y ahora es un parámetro.

**2 · Contra el cálculo viejo, punto por punto.** En el navegador, con las
tres implementaciones antiguas copiadas tal cual al lado de la nueva y
4.000 puntos al azar sobre el lienzo:

| | Δ máximo |
|---|---|
| rape (`total` y posición del foco dominante) | **0** |
| carroña (`total`, rama con corte, 600 muestras con luz) | **0** |
| cuerpo (`vx`, `vy` y color dominante) | **0** |

### Una inconsistencia que salió al juntarlos

El rape leía `opt(o.luzI, 1)` y los otros dos `(o.luzI || 1)`. No es lo mismo:
con `luzI` a 0 el primero da 0 —«no emito»— y el segundo da 1. Se ha unificado
en `opt`, que es lo que dice el registro. Hoy no cambia nada porque ninguna
luz vale 0 cuando alguien la lee —la medusa nace con `luzI: 0` y su
`actualiza` lo sube antes que el rape—, pero era una trampa esperando.

También se ha tirado el tercer respaldo del radio del rape (`|| Lg`): con
`rLuz` declarado por las tres especies que alumbran, nunca se ejecutaba.

### Y el contrato de `L.luces`, por fin escrito

Era el otro cabo de esta ficha. El **REGISTRO DE ESPECIES** documentaba sólo
`rLuz`; ahora están los siete campos (`x`, `y`, `c`, `rLuz`, `rCuerpo`,
`luzI`, `senuelo`) con para qué sirve cada uno. Y CLAUDE.md dice que la regla
de la casa tiene una sola implementación y cuál es.

### Saldo real

**+4 líneas de código y +55 en total**, no las −60 estimadas. Los tres sitios
pierden 27 líneas de código y el lector común cuesta 31: una función general
—dos curvas, cinco opciones, tres salidas— es más larga que cualquiera de los
tres casos particulares que sustituye, y encima la casa pide que venga
explicada. Las 55 de total son casi todas documentación que antes no existía.

Lo que se ha ganado no son líneas: es que la regla que sostiene la pieza
—«nadie está iluminado por la escena»— **se ajusta en un sitio** en vez de en
cuatro, y que dos de los comentarios largos que existían sólo para explicar
por qué el de al lado era distinto ya no hacen falta.
