# Idea: el bocado del rape como cuatro fases, no nueve relojes

**Estado: DESCARTADA — LA PREMISA ERA FALSA** · analizada el 2026-09-18 ·
comprobada y cerrada el 2026-09-19 · **no se tocó código**
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 8 de 12**
**Hermanas:** [idea-caza](idea-caza.md),
[idea-rape-ajustes](idea-rape-ajustes.md)

## Lo que se observó

El rape tiene **91 claves de escena** y es el 17 % del código de la pieza para 1-2
bichos en pantalla. Buena parte está bien empleada —es el bicho que sostiene el tema—
pero la secuencia del bocado se ha ido montando por capas y hoy son nueve
temporizadores paralelos coordinándose a mano:

`ataque` · `reposo` · `reposoFallo` · `digiere` · `mastica` · `masticaTotal` ·
`masticaPend` · `fogonazo` · `espanta`

La secuencia real es lineal y tiene cuatro estados:

```
acecho  ──(presa en alcanceBoca)──>  bocado  ──>  mastica  ──>  digestión  ──>  acecho
                                        └──(falla)────────────────────────────────┘
```

Y el síntoma de parche está en `masticaPend`: **existe sólo para diferir una
transición**. Se rellena al acertar, espera a que `ataque` llegue a 0, y entonces se
vuelca en `mastica` ([rape-caza.js:70-74](../../../bichos/rape-caza.js)). Es un estado
que codifica «todavía no», que es justo lo que una fase explícita dice sola.

Lo mismo, más suave, con `apagaTrasComer()`: se llama desde dos sitios distintos según
por dónde se salga, y el comentario tiene que explicar cuál es cuál.

## La propuesta

Una fase y su reloj:

```js
f.fase = 'acecho';   // 'acecho' | 'bocado' | 'mastica' | 'digestion'
f.tFase = 0;
```

`caza()` pasa a ser un `switch` de cuatro ramas con la salida de cada una explícita.
Lo que hoy son «nueve relojes que se miran de reojo» pasa a leerse en veinte líneas.

**Lo que NO cambia:** `fogonazo`/`chispa` y `espanta` se quedan como están y fuera de
la máquina, y es correcto que estén fuera —son envolventes que **cruzan** las fases a
propósito (la ráfaga tiene que cubrir bocado + masticación con una sola curva, y el
susto tiene que durar más que la luz o el pánico no se ve). Meterlos dentro sería el
error contrario.

**Y `reposo` tampoco:** es el tiempo entre secuencias, no una fase.

## Lo que se gana

Ninguna línea de dibujo cambia; el bicho tiene que verse **exactamente igual**. Lo que
se gana es poder responder «¿qué está haciendo este rape?» leyendo un campo, que hoy
exige mirar cinco.

Y una cosa práctica: el panel de pruebas podría enseñar la fase de cada rape, que hoy
no es observable.

## El riesgo, y es el de siempre con una reescritura de secuencia

Es el único cambio de los doce que puede **romper el temporizado sin que se note al
mirar**: un bocado que dura 0,55 s y una masticación de 0,20-0,38 no se distinguen a
ojo de 0,50 y 0,45. Hay que medirlo, no mirarlo.

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

1. Instrumentar el rape actual: volcar a consola `(t, fase implícita, ataque,
   mastica, digiere, reposo)` durante 5 minutos de escena con el banco cebado.
2. Reescribir con fases y volcar lo mismo.
3. Comparar **las duraciones medias y la cadencia de bocados**, no capturas.

Saldo MEDIDO: `caza()` y `apagaTrasComer()` son **44 líneas de código**. Un
`switch` de cuatro fases con su reloj no baja de 35, así que el neto real está
entre **−5 y −10**, más el campo `masticaPend`. **No se hace por tamaño**: se
hace para poder responder «¿qué está haciendo este rape?» leyendo un campo en
vez de cinco, y para que el panel pueda enseñarlo. Con eso como único
beneficio y una reescritura de secuencia de por medio —el riesgo es romper el
temporizado sin que se note al mirar—, es la última de la lista.

## Resuelto: `masticaPend` no es un parche

**2026-09-19.** La ficha se apoyaba en una frase concreta: «`masticaPend`
existe SÓLO para diferir una transición». Al ir a quitarlo resulta que no.

`f.mastica > 0` no es un temporizador interno de `caza()`: es un ESTADO que
leen **seis sitios del dibujo**, y en todos significa «está masticando
AHORA MISMO»:

| dónde | qué hace con él |
|---|---|
| [rape.js:151](../../../bichos/rape.js) | la envolvente `mast` |
| rape.js:157 | `masticaAb`, el trabajo de la quijada |
| rape.js:166 | calla la respiración, vía `Math.max(f.ataque, mast)` |
| rape.js:177 | la guarda de `congela` |
| rape.js:288 | lo recogido que va el ilicio, vía `Math.max(f.ataque, mast·masticaRetrae)` |
| rape.js:317 | `alFrente` |

Así que **hacen falta dos ranuras**: «lo que va a masticar» y «lo que está
masticando». Poner `f.mastica` directamente al morder —que es lo que
ahorraría el campo— haría que el rape mastique DURANTE el bocado: la quijada
trabajando, la respiración callada, y el ilicio a 0,82 de recogido en vez de
a 1 justo cuando el bocado se acaba y tiene que empezar a estirarse. Se ve.

Eso es exactamente lo que `masticaPend` evita, y por eso está.

### Y el reescribir entero tampoco compensa

Se llegó a redactar el `switch` de cuatro fases y sale de la misma longitud
(`caza()` son 44 líneas de código; la versión con fases no baja de 35). Peor:
al poner cada rama con su `return` aparece un cambio de comportamiento en una
rama que hoy es inalcanzable —hoy, al acabar de masticar, el código sigue de
largo y podría morder en el mismo fotograma si `reposo` lo permitiera; no lo
permite nunca, porque `reposo` es de 10 a 24 s y masticar de 0,20 a 0,38—.
Arreglarlo o conservarlo son las dos decisiones equivocadas: una cambia algo
que nadie pidió y la otra deja la rama muerta dentro de la estructura nueva.

### Lo que queda escrito

La secuencia del rape es lineal y es legible una vez que se sabe lo único que
no está dicho en el código: **`ataque` y `mastica` no se solapan nunca**, y
los nueve temporizadores no son nueve estados —`reposo` es el enfriamiento,
que corre en paralelo a todo; `fogonazo` y `espanta` son envolventes que
CRUZAN las fases a propósito (la ráfaga tiene que cubrir bocado y
masticación con una sola curva, y el susto durar más que la luz); y
`masticaTotal` y `masticaPend` son la escala y la ranura de espera de
`mastica`.

Eso son cuatro estados y cinco cosas que no lo son. Si algún día se vuelve a
abrir, que sea para escribir ESA frase en un comentario —que es lo que
faltaba— y no para reescribir la secuencia.
