# Idea: Orden en el color

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-17.

**Enunciado original (del índice):**

> - Colores:
>    - pececitos de cardumen: los colores son todos preciosos. pero: son demasiados
>      colores random a la vez, aparecen todos los colores revueltos. poner un poco de
>      orden en el random. los peces de cardumen tienen que tener un aspecto un pelín
>      más plateado. los cardúmenes deben mostrar tendencia a coincidir en uno o dos
>      colores. Tendencia. pueden mezclarse peces d distintos colores, pero evitemos
>      que todos los colores surjan a la vez en los peces.
>    - rape: Simplificar el algoritmo de colores de los rapes. nada de especificar
>      colores raros. y no asignar colores a componentes (esca, etc). simplemente
>      establecer un rango de colores apropiados para los rapes (siempre tonos
>      "siniestros, algo oscuros", morados, rojos, vino.. colores serios de depredador),
>      y elegir el color random de cada rape al crearlo.

Son dos encargos con el mismo diagnóstico —**el sorteo de color era demasiado libre**—
y direcciones opuestas: al banco había que quitarle variedad sin quitarle el moteado, y
al rape, maquinaria.

## Punto de partida

**El banco.** `espectro: {tono: [0, 352], tramos: 40, sat: [0.88, 1.00]}` y en `crear`
un `M.color(p.paleta)` por pez: 40 tonos por el círculo entero, a saturación máxima,
sorteados uno a uno sin relación ninguna entre vecinos. Medido sobre los 88 peces de
una pecera: **30-31 tonos distintos y el más repetido con el 7-9 %**. O sea que salían
literalmente todos a la vez, que es exactamente lo que decía el enunciado.

**El rape.** Dos paletas atadas por índice: `espectro` (la lámpara, `luz` 0,68-0,88) y
`espectroCuerpo` (el animal, `luz` 0,38-0,52), cada una con dos arcos —morado-rojo y un
verde de peso 0,45—, más `aceptaRaro: true`, que le daba el `ABISMO.raro` rojo a uno de
cada tres. El comentario en la escena avisaba: «si se toca un arco aquí, hay que tocarlo
en los dos».

---

## A · El banco: sembrar uno o dos tonos dominantes

El «orden en el random» no cabía en el espectro: los pesos de un espectro son fijos, así
que un dominante escrito en la escena sería **el mismo en todas las sesiones**. Y lo que
se pedía es una tendencia, no una identidad.

Hacía falta sortear los dominantes **una vez por pecera**, y el motor no tenía dónde:
`crear` se llama por bicho y `conteo` por plano, y el banco vive repartido en los tres
planos —los tres son el mismo banco visto desde tres distancias, así que sortear por
plano habría dado hasta seis dominantes—.

### Lo que se añadió al motor: `siembra(M, p)`

Un gancho nuevo en el contrato de especie, documentado en **REGISTRO DE ESPECIES**.
`puebla()` lo llama **una vez por entrada de escena y antes de crear a nadie**, para los
tres planos a la vez. Es donde se sortea lo que toda la población comparte. Cuatro
líneas en el motor y ninguna especie más lo usa hoy.

```js
for (const conf of ABISMO.bichos){
  const def = ESPECIES[conf.especie];
  if (def && def.siembra) def.siembra(M, paramsDe(conf));
}
```

`pezlinterna.siembra` sortea `p.mandan` (uno o dos colores de su paleta) y su `crear`
decide pez a pez: con probabilidad `tendencia` coge uno de los dominantes, si no sortea
de la paleta entera. Dos escalares nuevos en la escena: `dominantes: [1, 2]` y
`tendencia: 0.74`.

### Medido

24 repoblaciones de 88 peces, contando los colores con los que nacen (no píxeles: se
envolvió `crear` en el panel):

| | tonos distintos | el más repetido | los dos más repetidos |
|---|---|---|---|
| antes (`tendencia` 0) | 30-31 | 0,07-0,09 | 0,13-0,17 |
| con un dominante (10 tiradas) | 18 | **0,73** | 0,76 |
| con dos dominantes (14 tiradas) | 17 | 0,43 | **0,76** |

Que es justo lo pedido: el banco tiene un color —o dos— y **sigue teniendo moteado**,
porque el 26 % que no se apunta reparte otros quince tonos por el cuadro.

Un aviso de método: medir esto sobre los píxeles del lienzo **no sirve**. Se probó con
un histograma de tono de los píxeles brillantes y la concentración pasaba de 0,46-0,60 a
0,52-0,79 —dirección correcta, señal enterrada—, porque el plancton, las medusas y el
velo aportan muchos más píxeles de color que los peces.

## B · El banco, un pelín más plateado

Plateado no es un tono: es poco tono con mucha luz. Pero hay que bajarlo **donde el ojo
lo ve**, y de un pez a distancia lo que se ve es el **halo** del fotóforo: el punto se
dibuja con `core`, que es `hsl(h, 1, 0.94-0.97)` y sale casi blanco pase lo que pase con
`sat`.

Primer intento, `sat: [0.46, 0.82]` y `satGlow: [0.34, 0.58]`: **el banco se quedó
blanco del todo** y perdió el moteado, que era lo bonito. Se subió a:

```
sat: 0.88-1.00 → 0.60-0.88      luz: 0.66-0.84 → 0.72-0.88
satGlow: 0.58-0.82 → 0.44-0.70  luzGlow: igual
tramos: 40 → 32
```

## C · El rape: un arco, un color, sin excepciones

- `espectro` y `espectroCuerpo` fundidos en **un solo `espectro`**, sin arco verde:
  `tono: [268, 364]`, o sea morado → magenta → rojo → vino.
- `crear` sortea **un** `f.c` y lo usan la esca, el cuerpo, la barbilla y la pupila.
  Fuera `f.cCuerpo`, fuera el apaño de leer la lámpara por el índice del cuerpo.
- `raro: false` en la entrada de la escena: con todos los rapes en el arco siniestro, un
  «rape rojo excepcional» no es excepción de nada.

**Dónde corta el rojo.** El arco viejo llegaba a 382 (22°). Se probó 372 (12°) y el
tramo extremo sale `(251, 86, 45)`, que en pantalla lee **cobre**, no sangre. A 364 (4°)
el extremo es `(251, 45, 45)`: rojo limpio. Ahí se quedó.

**El riesgo que había, y en qué quedó.** Las dos paletas no existían por capricho: la
lámpara tenía `luz`/`luzGlow` altos —quema— y el animal bajos —se intuye—. Con una sola
paleta eso lo sostienen ahora **sólo el alfa** (`brillo` 1,15 contra `cuerpo` 0,62) y el
núcleo blanco de la esca, y basta: mirado con `base` subido a 0,30 para poder verlos, el
cuerpo lee vino oscuro y la esca sigue quemando. Los números del espectro son el
compromiso entre los dos usos —`luz` 0,44-0,58 y `luzGlow` 0,22-0,32, a media altura
entre la lámpara vieja y el animal viejo—. `giroGlow` va **negativo** (−5) contra el +5
de la casa: el halo de un rape rojo tirando al azul sale magenta y deja de ser sangre.

## Lo que deja pendiente

El reparto del color excepcional de `puebla()` —«uno y sólo uno en toda la pecera»— se
ha quedado **sin candidatos** en el abismo: la medusa ya declaraba `raro: false` y el
rape acaba de hacerlo. El mecanismo sigue en el motor, y `ABISMO.raro` sigue en uso por
otra vía distinta (las ascuas del plancton, sorteadas por mota). Queda por decidir si se
le da a alguien o si sobra. Está anotado en el índice.
