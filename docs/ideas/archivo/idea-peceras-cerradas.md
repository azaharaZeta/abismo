# Idea: Peceras cerradas

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-15
**Enunciado original:** «General: Hacer todas las peceras cerradas: los animales no
pueden salir por los bordes, tienen que dar media vuelta o algo.»

## El conflicto declarado, y que resultó ser cierto

`mundos/medusas.html` decía, antes de tocar nada:

> «Freno de borde, no tope. Las medusas suben, salen por arriba y vuelven por abajo, y
> ese tránsito es lo que reparte la población. Con contención fuerte se apelmazarían
> contra el canto.»

Se midió. Con un banco de pruebas que llama a `actualiza()` a mano (sin `rAF`), 14
medusas, 5 tiradas de **20 minutos simulados** cada una, midiendo la desviación del
reparto vertical respecto a un 10 % plano por franja, contando **sólo las visibles**:

| | desviación (media de 5) | en pantalla | escapes |
|---|---|---|---|
| Abierta (comportamiento original) | **5,6** | 43 % | — |
| Cerrada, 1er intento: invertir al tocar el canto | **24** | 100 % | 0 |
| Cerrada, versión final: patrulla vertical | **8,9** | 100 % | 0 |

El primer intento era una regresión clara: **81 % del tiempo pegadas al fondo y 14 %
al techo, con el centro vacío.** Dos capas de sedimento. El aviso del mundo era exacto.

## Por qué, y qué lo arregla

La causa está en la escala de tiempo, y también se midió: **una medusa se mueve en
vertical del orden de 0,16–0,67 px/s. Tarda entre 8 y 36 minutos en cruzar el
encuadre.** Con el `borde` blando apartándola del canto y una flotabilidad constante,
en cuanto queda aparcada contra una pared se queda ahí un cuarto de hora.

Hubo un intento intermedio —tomar la decisión en la *banda* del borde en vez de en el
cristal— porque el `borde` blando aparta a la medusa antes de que llegue a tocarlo y
una boyante se quedaba colgada del techo sin invertirse nunca. Mejoró, pero no bastó:
el problema no era *dónde* se decide, era que la vuelta entera dura demasiado.

La versión final cambia el modelo: **cada medusa patrulla entre dos profundidades
propias**, sorteadas al nacer (`zTop` en 0,05–0,45 y `zBot` en 0,55–0,95 de la altura,
parametrizable con `patrulla`). Al llegar a su techo deja de ganar altura y se hunde;
al llegar a su suelo vuelve a subir. Como los puntos de giro están repartidos, la
población no se sincroniza y el reparto se sostiene.

No es un parche: es lo que hace una medusa de verdad —migración vertical— y es la
única «media vuelta» que puede dar un bicho cuya locomoción es el pulso por el eje del
cuerpo más una flotabilidad. Invertir el signo de `hundimiento` habría sido otra cosa:
la deja boyante Y con el pulso hacia arriba, y sale disparada. Lo que se invierte es
`flota`, espejada alrededor de 1, que es su punto de equilibrio.

**Contrapartida honesta:** 8,9 contra 5,6 es algo menos uniforme que el original. Se
compensa con que en pecera cerrada está **el 100 % de la población en pantalla en vez
del 43 %**: se ven catorce medusas donde antes seis.

## Media vuelta, especie por especie

Una sola pieza de motor cubre tres especies: `M.envuelve()` deja de envolver y pasa a
ser el cristal, y **devuelve qué pared se ha tocado** para que cada especie decida.
Quien ignore el valor se queda dentro igualmente.

| especie | qué hace al topar |
|---|---|
| **plancton** | invierte el sentido de su caída: la nieve marina pasa a ser materia en suspensión circulando |
| **copépodo** | gasta el tirón ahí mismo y sale hacia dentro (es el de tempo más rápido: esperar al siguiente se vería como quedarse pegado) |
| **pez linterna** | se le pone el rumbo hacia dentro y su `vira` dibuja la curva, así que la media vuelta se lee como una decisión |
| **medusa** | patrulla vertical (arriba) |
| **rape** | pared vertical → cambia de cara (`dir`); techo o suelo → invierte la diagonal. Se le corta la embestida, o volvería a empujar contra el cristal |
| **visitante** | **exento.** Es `programado` y su razón de ser es cruzar y no volver |

El cristal va a media unidad de escena del canto, y no al margen de envoltura que pide
cada especie: ése mide cuánto puede asomarse *hacia fuera*, y como inset dejaría a un
rape grande nadando a dos cuerpos de la pared.

## Un fallo que sólo apareció midiendo

La primera versión del plancton invertía la caída **en cada contacto**. Parecía lo
mismo y no lo era: la mota queda clavada en el cristal, lo vuelve a tocar al frame
siguiente y se reinvierte. Medido: **2,3 inversiones por segundo y por mota.** Con la
condición de invertir sólo si la caída sigue empujando contra esa pared, baja a
**0,35 por minuto** —un factor de 400— y se lee como lo que es: una mota que llega al
fondo y vuelve a subir despacio.

## Verificación final (6 min simulados, parámetros reales del abismo)

- Cuerpos de rape fuera de la caja: **0** · 154 medias vueltas · ningún valor no finito.
- Peces linterna nadando libres fuera: **0**.
- Plancton: **0** fuera, reparto vertical con desviación **0,9** (casi perfecto, sin
  sedimento), 0,35 inversiones/mota/min.
- Medusas: **0** fuera.

## Límites conocidos (no son fallos)

- **La esca del rape y la presa que está siendo tragada sí se asoman**, hasta 0,57 y
  0,54 largos respectivamente. La esca cuelga del ilicio y la presa va dentro de una
  boca; ambas siguen al cuerpo, que es lo que está contenido. Retenerlas aparte las
  desprendería visualmente de lo que las sujeta, que se vería peor.
- La nube de tentáculos de una medusa también puede asomarse: lo contenido es la
  campana.
- `patrulla` existe pero ninguna pecera lo declara: las dos usan el 0,05–0,45 por
  defecto.
