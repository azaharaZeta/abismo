# Idea: el bocado del rape como cuatro fases, no nueve relojes

**Estado: PROPUESTA** · analizada el 2026-09-18 · sin tocar código
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 8 de 12**
**Hermanas:** [idea-caza](archivo/idea-caza.md),
[idea-rape-ajustes](archivo/idea-rape-ajustes.md)

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
vuelca en `mastica` ([rape-caza.js:70-74](../../bichos/rape-caza.js)). Es un estado
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

## Siguiente acción

1. Instrumentar el rape actual: volcar a consola `(t, fase implícita, ataque,
   mastica, digiere, reposo)` durante 5 minutos de escena con el banco cebado.
2. Reescribir con fases y volcar lo mismo.
3. Comparar **las duraciones medias y la cadencia de bocados**, no capturas.

Saldo estimado: **−30 líneas** y un estado (`masticaPend`) que desaparece.
