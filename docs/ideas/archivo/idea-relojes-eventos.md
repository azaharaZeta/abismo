# Idea: revisar los relojes de los siete eventos

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-17

**Enunciado original:** «La pecera ha pasado de tres eventos a siete, cuatro de ellos
exclusivos: revisar los `cada` y `primero` a ver si se pisan o si dejan huecos muertos.»

Primero, el dato del enunciado: son **tres** exclusivos, no cuatro —leviatán, cuerpo y
superpez—. El glitch lleva `exclusivo: false` con su motivo escrito («que rompa el dibujo
mientras pasa un leviatán es mejor que peor»).

## Cómo se midió

Simulación del reloj de `pasoEventos()` —la misma lógica, paso a paso— con la duración de
cada evento sacada de su propia condición de fin (el leviatán hasta que le sale la cola,
la carroña y el cuerpo hasta que bajan su largo más el alto del cuadro, el contagio hasta
que el anillo pasa de `rmax`, y `cruce`/`dura`/`entra+nada+sale` para los demás). Seis
horas simuladas, pantalla de 1024×768.

## Sí se pisan, y hay un fallo detrás

**El 37 % de las travesías de un exclusivo arrancaba a menos de un segundo de que
terminara la anterior.** No es mala suerte del reloj: al exclusivo bloqueado se le seguía
descontando `prox`, se quedaba en negativo y arrancaba **en el mismo fotograma** en que
moría el que lo tapaba. Cincuenta y nueve bloqueos en seis horas, y cada uno acababa en
una pareja.

Un leviatán seguido de un cuerpo sin un segundo de agua entre medias es lo contrario de
lo que hace grandes a esos dos eventos.

**Arreglo** (`ABISMO.relevo: [25, 70]`): al bloqueado se le vuelve a armar el reloj en vez
de dejarlo correr en negativo. No pierde el turno —se replantea dentro de un rato— pero
tampoco entra pisando al que sale.

| | sin relevo | con relevo |
|---|---|---|
| encadenados (< 1 s del anterior) | 30-37 % | **1 %** |
| hueco entre exclusivos, p10 | 0 s | **13 s** |
| travesías de exclusivo en 6 h | 165 | 161 |
| cobertura de los exclusivos | 42,5 % | 41,2 % |

Cuatro travesías menos en seis horas: no le cuesta frecuencia a nadie.

## Huecos muertos: no hay

| | |
|---|---|
| pantalla sin ningún evento | 27,5 % del tiempo |
| racha vacía más larga | **102 s** |
| tres o más eventos a la vez | 4,6 % |
| cuatro o más | 0,3 % |

Poco menos de dos minutos es la espera más larga que se puede llegar a tener, y el 27 %
sin eventos no es un hueco: es el estado de reposo de la pieza, que tiene plancton,
medusas, rapes y el banco todo el rato. No hace falta tocar ningún `cada` ni ningún
`primero` por este motivo.

## Travesías y cobertura por evento (6 h, valores finales)

| evento | travesías | cobertura | |
|---|---|---|---|
| visitante | 179 | 30,7 % | |
| contagio | 199 | 7,3 % | |
| carroña | 88 | 17,8 % | |
| leviatán | 67 | 21,7 % | exclusivo |
| glitch | 52 | 4,6 % | |
| superpez | 58 | 6,9 % | exclusivo |
| cuerpo | 34 | 16,7 % | exclusivo |

## Siguiente acción

Nada pendiente. El único `cada` que se tocó fue el del cuerpo, y por otro motivo: ver
[idea-cuerpo-blando.md](idea-cuerpo-blando.md).
