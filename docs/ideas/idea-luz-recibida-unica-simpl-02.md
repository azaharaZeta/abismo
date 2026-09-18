# Idea: una sola «luz recibida» para toda la pieza

**Estado: PROPUESTA** · analizada el 2026-09-18 · sin tocar código
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 2 de 12**
**Hermanas:** [idea-rapes-ocultacion](archivo/idea-rapes-ocultacion.md),
[idea-carrona-esqueleto](archivo/idea-carrona-esqueleto.md),
[idea-cuerpo-blando](archivo/idea-cuerpo-blando.md)

## Lo que se observó

«Nadie está iluminado por la escena» es la regla de la casa, así que «cuánta luz me
llega» es **el cálculo central de la pieza**. Está escrito cuatro veces:

| dónde | curva | corta en `r` | qué devuelve |
|---|---|---|---|
| [rape-caza.js:220](../../bichos/rape-caza.js) `luzRecibida` | `pow(1/(1+d²/r²), caida)` | no | total + posición del foco dominante |
| [carrona.js:131](../../eventos/carrona.js) por vértebra | `pow(1 − d/r, caida)` | **sí** | total, por hueso |
| [cuerpo.js:457](../../eventos/cuerpo.js) `pintaBordeCuerpo` | `pow(1/(1+d²/r²), caida)` | no | **vector** + color dominante, por muestra |
| [pezlinterna.js:426](../../bichos/pezlinterna.js) `ob` | `1.25/(1+(d/r)²)` | no | sólo el cebo más cercano |

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
([registro.js:13](../../motor/registro.js)). Al unificar el lector es el momento de
escribir el contrato completo ahí, que es donde alguien lo va a buscar.

## Siguiente acción

1. Escribir `M.luzEn` en `motor/api.js` reproduciendo exactamente la curva del rape.
2. Migrar el rape primero y comparar con el arnés de Node (percentiles de `br`; la
   referencia está en [idea-rapes-volumen](archivo/idea-rapes-volumen.md): p50 ≈ 0,081).
3. Después la carroña (con `corta`), después el cuerpo (con `vector`).
4. Completar el contrato de `L.luces` en `motor/registro.js`.

Saldo estimado: **−60 líneas** y cuatro sitios de ajuste convertidos en uno.
