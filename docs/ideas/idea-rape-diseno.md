# Idea: el diseño del rape

**Estado: ELEGIDA «F · TINTA» Y PUESTA EN LA PIEZA** el 2026-09-21. Hubo
un rato con DOS rapes, uno de cada forma, y se descartó: la pieza se
queda con UNO y de la forma nueva. La cabezona de siempre ya no se
dibuja —su anatomía está en git—. Queda el visto bueno visual y decidir
si `_banco/` se borra. La primera tanda se descartó entera; abajo está por
qué, que es lo que había que anotar.
**Empezada:** 2026-09-20

> Lo pedido, literal: «el diseño del anglerfish (el rape) en esta
> simulación es demasiado sencillo. Quiero que siga siendo cartoon, como
> el resto de los bichos de la simulación, pero que tenga más detalle, y
> proporciones más correctas, y que sea más creepy. Puedes buscar en
> internet diseños, y preparar varias alternativas.»

---

## El banco

`http://localhost:8777/_banco/banco.html` — los cuatro EN FILA, animados
y en la misma postura, con la MISMA tubería que la pieza (`piel` por
rebanadas, canto por luz recibida, aditivo). Lo que cambia entre columnas
es sólo la FORMA: mismo color, misma luz, mismos parámetros de escena.
El mando de `boca` los mueve a los cuatro a la vez, que es lo que permite
compararlos.

`_banco/disenos.js` es una copia de `bichos/rape-cuerpo.js` con los
perfiles y la anatomía sacados a un objeto `D`. La fila 0 reproduce el
dibujo de hoy: si deja de hacerlo, es que la copia se ha quedado atrás.

Parámetros de URL, que es como se sacan las capturas sin ratón:

| clave | qué hace |
|---|---|
| `?solo=N` | deja un solo diseño (0 actual, 1 D, 2 E, 3 F) |
| `?cabeza=1` | encuadra la cara en vez del cuerpo entero |
| `?real=1` | la luz de la pieza en vez de la plana |
| `?boca=0..100` | de reposo al fogonazo del bocado |
| `?t=` · `?lg=` | clava el reloj y fija la escala |
| `?pila=1` · `?desnudo=1` | el apilado de antes · sin cabecera |

**La luz PLANA es la de arranque, y no es un capricho:** todos los
degradados del rape son radiales centrados en la esca y con el radio
atado a `dl`, así que con la luz de la pieza no se distingue «esto no se
dibuja» de «esto está a oscuras». Con plana se ve la forma; con `?real=1`
se ve lo que se verá en el abismo, que es muy poco a propósito.

---

## Las medidas de verdad

*Melanocetus johnsonii*, en % del largo estándar. Es el bicho que la
silueta de hoy ya dice ser (lo pone en `rape-cuerpo.js`), sólo que con
otros números:

| | real | hoy |
|---|---|---|
| canto máximo | **87** | 80 |
| cabeza | 44 | — |
| quijada de arriba | **60** | 56 (`bocaLargo`) |
| quijada de abajo | **65** | 56 |
| ilicio | 38 | 46 + 26 (`delante`, `encima`) |

De ese par de quijadas sale lo que más cambia la cara y hoy no está: la
de abajo es MÁS LARGA, o sea que el punto más adelantado del animal es la
barbilla y el morro queda retranqueado. Y la boca «casi vertical»: la
charnela va a la altura del ojo, no por debajo del eje.

Lo demás que se aprovechó, y todo viene de la misma ficha: cuerpo
globular y cabeza grande; ojo pequeño y subcutáneo —el de hoy ya lo es—;
**menos dientes que sus parientes pero más largos**, en tres o cuatro
filas delante que se quedan en una atrás; y la piel sembrada de espínulas
diminutas.

Fuentes: [Humpback anglerfish (Wikipedia)](https://en.wikipedia.org/wiki/Humpback_anglerfish)
· [Melanocetus johnsonii, FishBase](https://fishbase.se/summary/2292)
· [tratamiento en Plazi](http://tb.plazi.org/GgServer/html/EF45FB7CC260FFAE3DC04458FB33FEEF)

---

## Dos cosas que están mal hoy, y no son cuestión de gusto

Las arregla el banco en las tres alternativas. Si no se elige ninguna,
siguen mereciendo la pena por separado.

### 1 · La quijada de abajo no es un cuerpo, es una línea

`bocaPath` le RESTA al cuerpo el hueco entre las dos quijadas, y de la de
abajo no se dibuja nada más que la línea de labios y sus dientes. O sea
que al morder no baja una barbilla: **se abre un agujero en el sitio donde
estaba la cara**, y la carne que debería colgar de esa quijada se queda
clavada donde estaba.

Arreglado con `mandibula()`: la quijada de abajo pasa a ser una pieza
—labio arriba, canto abajo— que gira entera sobre la charnela. Su canto
ES la `panza` del cuerpo hasta tres cuartos de quijada y sólo en el
último cuarto se cierra contra la charnela, porque el eje del giro tiene
que caer DENTRO de la pieza o la quijada barre como un remo. Y entra con
la abertura: cerrada no aporta nada —el canto del cuerpo ya traza esa
línea— y lo único que haría es doblarla.

### 2 · El foco se encoge justo en el fotograma del bocado

Los degradados del cuerpo tienen radio `max(Lg*0.6, dl*1.45)`, donde `dl`
es lo lejos que está la esca del centro del cuerpo. Y al morder la esca
**se recoge al morro** (`retrae: 0.95`), así que `dl` se derrumba y con él
el radio. Resultado: la boca abierta de par en par —lo único que el
bocado existe para enseñar— cae fuera del foco y se dibuja negra.

Medido en el banco con la cabeza de A: la punta de la mandíbula queda a
0,85 largos de la esca y el radio se queda en 0,87. Alfa cero.

El mando en el banco es `D.foco`, que multiplica el SUELO del radio y no
el término de `dl` —lo que falta es suelo, no ganancia—. A 1,75 el bocado
se ve entero. En la pieza es una línea en `rape.js` y `rape-cuerpo.js`.

---

## PRIMERA TANDA: DESCARTADA, y por qué

A (Melanocetus), B (Linophryne) y C (Caulophryne) se descartaron enteras
el 2026-09-21 al verlas. El motivo, literal:

> «tienen una mandíbula demasiado grande y dislocada, y justo la
> mandíbula mínima del original es la que refleja más lo que quiero»
> · «apenas tienen frente, y la mandíbula es casi plana» · «lo que son es
> todo boca, ojos que dan miedo, y aspecto creepy»

**Es el resultado que había que anotar, porque yo había ido justo al
revés.** Las medidas reales del *Melanocetus* dan una cabeza ABOMBADA —el
canto al 87 % y el máximo en el primer cuarto— y una boca que se abre
noventa grados. Las dos cosas están bien documentadas y las dos estaban
mal para esta pieza:

- **La cúpula de la frente compite con la boca.** Si el lomo sube sobre
  el ojo, lo que se lee es una cabeza grande con una boca dentro. Lo que
  se pide es lo contrario: que el bicho SEA la boca.
- **La mandíbula articulada, que era mi mejor hallazgo técnico, sobra.**
  Resolvía un defecto real —al morder se abría un agujero donde estaba la
  cara— pero la cura se ve peor que la enfermedad: una quijada que baja
  medio cuerpo se lee como dislocada, no como hambrienta. La boca mínima
  del diseño de hoy es la buena.

Lo que SÍ se aprovecha de esa tanda: los colmillos ganchudos y
desiguales, las espínulas de la piel, la pectoral sobre un muñón y la
caudal redondeada de nueve radios. Y una cosa que no es de gusto y sigue
en pie: **el foco se encoge al morder** (arriba, «2»).

Y las BARBAS no se tocan. Son las del diseño de hoy y están aprobadas.

## SEGUNDA TANDA: sobre las referencias

Dos dibujos, un grabado y una lámina a tinta. Lo que dicen los dos, y es
casi lo contrario de la ficha del Melanocetus:

- **Apenas hay frente.** El lomo no sube en cúpula sobre el ojo: sube
  despacio y su punto más alto cae A MEDIO CUERPO. Quien baja es la
  PANZA, y baja justo debajo de la boca. Entre las dos cosas la cara se
  queda plana.
- **La mandíbula va casi recta**, y larga: dos tercios del cuerpo.
- **Colmillos largos que engranan**, pocos y muy desiguales.
- **El ojo mira**: grande y con un aro claro alrededor de la pupila.
- **Púas en el lomo**, dentro de la silueta.

Tres columnas, y las tres comparten eso:

### D · TODO BOCA — el punto medio de los dos dibujos
Once colmillos, ojo mediano con aro, siete púas a media espalda.

### E · GRABADO — el primer dibujo
Diecisiete AGUJAS finas en vez de cuñas, púas por todo el lomo desde la
nuca, ojo pequeño y duro, cuerpo algo más estirado.

### F · TINTA — el segundo dibujo
Ojo ENORME con la cuenca muy marcada, nueve colmillos gordos que
engranan como una trampa, corona de púas cortas y cuerpo de gota.

### Los dos ajustes de la segunda pasada

- **La mordida iba demasiado recta.** `cY` es el punto de control de en
  medio de la línea de labios, o sea LA COMBA: a 0,090 se hundía 0,021
  largos respecto de la recta morro-charnela, que se lee como una boca
  plana. A 0,155 se hunde 0,054 y vuelve a ser una mordida. La comban las
  dos quijadas a la vez, porque giran sobre la misma línea.
- **Los ojos no eran saltones: estaban FUERA.** El borde de arriba del
  ojo caía por encima del lomo a esa altura —0,038 largos por fuera en D,
  0,051 en F y 0,062 en E—, así que no se leía un bulto, se leía un ojo
  suelto. Bajados hasta asomar 0,013-0,021: se le nota y sigue dentro. La
  cota de abajo la pone la boca, no el gusto: con la quijada de arriba
  abierta a tope su línea barre hacia el ojo, y el margen que queda es de
  0,04-0,06 largos.

### Tres trampas que costaron una vuelta cada una

- **Un ojo grande se convierte en una farola.** El halo de la pupila iba
  a seis radios de ojo, así que al agrandar el ojo el halo crece con él y
  se come media cabeza. Va atado al LARGO del bicho, no al radio del ojo.
- **Un ojo relleno es una bola, no un ojo.** En aditivo no se puede
  pintar oscuro, así que la cuenca se hace al revés: no se rellena el
  globo y se pintan DOS aros —la órbita fina y el iris gordo—.
- **Un diente con largo base + variación es un PEINE.** Para que salgan
  tres o cuatro colmillos largos entre muchos cortos, el largo tiene que
  salir casi entero de la variación ELEVADA (`desigual`), no sumado a una
  base.

## Añadidos sueltos, que no están dibujados

Van con cualquiera de las tres y se pueden dejar para después.

- **La panza llena.** El rape se pasa el 60-71 % del tiempo saciado y eso
  no se ve en ningún sitio. `mastica`, `digiere` y `reposo` ya existen:
  con ellos se puede hinchar la panza al tragar y deshincharla despacio,
  y dejar dentro un resto de luz del color de lo que se comió. Es lo más
  «creepy» por lo que cuesta, y no toca la silueta.
- **El canto del sprite roto.** El rape no declara `rompible`, así que el
  `glitch` no le hace nada. Con la cara nueva quizá lo merezca.

---

## Lo que se hizo al llevarlo a la pieza

- **Una especie, dos formas.** `FORMAS` en rape-cuerpo.js y `forma` en la
  escena. Ver la regla en CLAUDE.md; la alternativa —dos especies con el
  mismo comportamiento— pedía duplicar o parametrizar las 460 líneas de
  `rape.js` para no ganar nada.
- **Una sola copia de lo que comparten.** `const RAPE` en la escena y dos
  entradas que lo esparcen. Se diferencian en cinco cosas y sólo cinco:
  forma, lado, color, boca y cuántos dientes.
- **`@rape` en el panel escribe en las dos.** Resolvía a la primera y los
  tres mandos del rape habrían movido medio bicho sin decirlo.
- **Y `querencia` hubo que subirla de 0,55 a 1,4.** Al darle a cada rape
  un lado PROPIO —antes se recalculaba cada fotograma con `sign(ex)`—, el
  empuje pasa de «apártate del centro», que se cumple solo, a «vete a tu
  lado», que no. A 0,55 los dos acababan encima: a menos de 1,4 largos
  uno de otro el 50-88 % del tiempo. A 1,4, el 4-7 % y nunca en el mismo
  lado. Medido en escena.js.

### Y dos ajustes más, ya con los dos en la pecera

- **El color no era un sorteo.** Cada rape tenía su espectro y el del de
  gota abarcaba 30° en 16 tramos: los dieciséis salían con el rojo
  clavado en 238 y el azul en 32, o sea dieciséis matices del mismo
  naranja. Ahora hay UN arco compartido de 100° —magenta → carmesí →
  sangre → naranja → ámbar— y cada uno saca el suyo. El tope de 40° no
  es de gusto: pasado eso el amarillo y el verde se van a luma 200+
  aunque la `luz` del HSL no cambie, y eso es lo que se lee como claro.
- **El sitio tampoco.** El lado estaba clavado en la escena (−1 y +1)
  para que no se apilaran. Ahora lo reparte un mazo de dos cartas en
  rape.js —lo único que sabe que hay dos— así que salen en cantos
  opuestos pero cuál le toca cambia en cada repoblado; y `banda` (±1)
  más `aroY` les dan los cuatro cuadrantes como SITIO y no sólo como
  punto de partida.

### Y al quedarse en uno solo

Se quitó la anatomía `clasico` de `FORMAS`, su entrada de escena, el
`const RAPE` compartido —con un consumidor ya no era un tronco— y el
mazo que repartía cantos opuestos. Lo que queda SIN EJERCITAR y habría
que decidir si se colapsa también:

- la rama de dientes en cuña de `boca()` (`colmillo` 0), que la forma
  que hay no usa —va a 0,12, el gancho—;
- la del globo del ojo relleno en `ojo()`, que ahora va siempre `hueco`;
- el atajo de muestreo uniforme de `cuerpoPath()` (`sesgo === 1`);
- que `destinos()` en pruebas.js escriba en varias entradas a la vez, que
  hacía falta con dos rapes;
- `FORMAS` con una sola entrada y el `forma` de la escena que la nombra.

Lo último NO es lo mismo que lo demás: la tabla es DÓNDE VIVE la
anatomía, no una rama muerta. Las otras cuatro sí son código que nadie
ejecuta.

## Lo que queda por decidir

1. **Cuál de las tres**, o A más algún trozo de B/C.
2. Si la boca oblicua se va hasta la «casi vertical» del bicho real o se
   queda donde está en el banco. Ojo: subir la charnela tiene el mismo
   tope medido que `quijadaArriba` —el hueco de la boca se traga el ojo—,
   y por eso en el banco la de arriba baja a 0,26 y el ojo sube a −0,245.
3. Qué de todo esto es de la ESCENA y qué del bicho. El corte de
   CLAUDE.md dice que una proporción de anatomía no es un mando; pero
   `foco` sí lo es, y `mandibula` probablemente también (un rape pequeño
   y esquemático al fondo no la necesita).
4. Si `_banco/` se queda mientras dure la decisión o se borra ya.
