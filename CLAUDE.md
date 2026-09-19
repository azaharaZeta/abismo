# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es esto

«Abyss by Zeta»: una pieza de arte generativo en un `<canvas>`, dentro de
un marco de chapa que es CSS. Un abismo bioluminiscente con criaturas que
se iluminan entre sí. Sin build, sin dependencias y sin tests automáticos:
módulos ES planos que `index.html` carga directamente.

**El código, los comentarios y los identificadores están en castellano.**
Mantenlo así.

Los comentarios van **escuetos** y sólo si aportan algo para mantener esto:
el *por qué* de una decisión que no se deduce del código, las unidades y
convenciones de un parámetro, los acoplamientos entre dos valores, y las
trampas —el orden en que tiene que pasar algo, un array compartido que hay
que consumir en el acto—. Un número medido va si acota una decisión futura
(«por encima de X deja de leerse», «esto cuesta Y ms»).

Fuera: narrar lo que la línea ya dice, y el histórico —«antes era», «se
probó», «subido de A a B», tablas de tandas de ajuste—. Si un valor cambia,
se actualiza su comentario; no se añade de dónde venía.

## Ejecutar

```bash
python3 -m http.server 8777
```

Hay un `.claude/launch.json` con la configuración `abismo` en ese mismo
puerto para las herramientas de preview. **Hace falta un servidor**: son
módulos ES y `file://` los bloquea por CORS.

No hay lint ni suite de pruebas. La verificación es visual, con el panel:
`http://localhost:8777/?pruebas` (o tecla `P`) abre `pruebas.js`, que
permite lanzar eventos a mano, mover escalares de la escena en caliente y
repoblar sin recargar.

## Arquitectura

Módulos ES sin build. `index.html` carga tres: `abismo.js`, que tira del
resto por imports, `marco.js` y `pruebas.js`.

```
abismo.js          arranca
escena.js          ABISMO: TODA la configuración de la pecera
catalogo.js        una línea por criatura y por evento
motor.js           la fachada: qué del motor es público
motor/             util · color · registro · estado · agua · dedo · api · bucle
bichos/            comun · medusa · plancton · copepodo ·
                   pezlinterna · rape (+ rape-cuerpo, rape-caza)
eventos/           contagio · visitante · leviatan · carrona · cuerpo ·
                   glitch · floracion · gemacion
marco.css · js     la chapa, el título y los dos botones
pruebas.js         el andamio
```

Cuatro separaciones, y son el punto:

1. **escena ↔ motor.** [escena.js](escena.js) es sólo números: paleta,
   agua, planos, y la lista de bichos y eventos con sus parámetros. Es el
   único fichero que hay que abrir para ajustar cómo se ve la pieza. Un
   valor ajustable va ahí, nunca incrustado en una criatura.

   **Y CUÁL ES AJUSTABLE.** Hay más de mil literales decimales en las
   criaturas y la mayoría están bien donde están: una parada de degradado
   o una proporción de anatomía no es un mando, es el bicho. El corte:

   > Va a la escena si **cambiarlo a solas da otra pieza que sigue en
   > pie**. Se queda en la criatura si **cambiarlo a solas la rompe**,
   > porque lo sostienen sus vecinos.

   La `luz` de un espectro va a la escena; el `0.22` de la parada del
   halo se queda. Y si un concepto ya tiene bloque en la escena, sus
   números van CON él: un bloque partido por la mitad —la mitad en
   `ABISMO.dedo` y la mitad en `motor/dedo.js`— es la forma en que esto
   se deshace.
2. **motor ↔ criaturas.** Una criatura no tiene parámetros propios: los
   recibe de la escena, así que el mismo bicho puede ser pálido y lento o
   nervioso y quemado sin tocar una línea suya. Y el motor no conoce a
   ninguna: las busca por nombre en su registro.

   **UN VALOR POR DEFECTO ES UN NEUTRO, NUNCA UNA COPIA.** `opt(p.x, 0)`
   y `opt(p.x, 1)` dicen «si la escena no lo pide, esto está apagado o es
   la identidad», y eso está bien. `opt(p.x, 0.84)` es otra cosa: es una
   segunda copia del valor de escena que nadie ejercita y que envejece
   sola —había 57, y 33 ya no coincidían con la escena—. Si la escena
   siempre lo da, se lee `p.x` pelado.

   Y el neutro se escribe con **`opt()`, nunca con `p.x || d`**: `||`
   se traga un 0 escrito a mano, que es justo lo que `opt` existe para
   respetar (ver [motor/util.js](motor/util.js)).
3. **la pieza ↔ el andamio.** [pruebas.js](pruebas.js) **no forma parte de
   la pieza**: borrar su `<script>` de `index.html` lo hace desaparecer.
4. **el abismo ↔ el marco.** La chapa, el título y el botón son
   DOM ([marco.css](marco.css), [marco.js](marco.js)), no lienzo. De ahí
   sale gratis lo único que se le pide al marco —que el abismo no pinte
   por encima—: el lienzo es MÁS PEQUEÑO que la pantalla, así que no
   puede alcanzarlo, y ninguna de las pasadas a pantalla completa del
   motor tiene que acordarse de recortar. `marco.js` no llama al motor
   más que para `reinicia()`.

   El marco NO gira el cuadro y no hay por dónde pedírselo: la pieza es
   la caja que le dé la pantalla —alta de pie, ancha tumbada— y para
   verla apaisada se gira el móvil. El lienzo no tiene, por tanto,
   ningún marco de coordenadas girado que nadie deba deshacer.

   Lo que sí hay que atender es el GIRO DE VERDAD. Volcar el móvil
   intercambia ancho y alto, así que el ÁREA no cambia: la regla de
   `alRedimensionar()` que decide si repoblar no lo veía y la población
   se quedaba compuesta para la caja anterior. Ahora mira también la
   forma —por qué lado es más largo el cuadro—, que es lo único que
   distingue un giro de la barra de URL del móvil escondiéndose.

Dentro del motor, el estado vivo va en el objeto `V` de
[motor/estado.js](motor/estado.js) y no en variables sueltas: un `import`
no se puede reasignar, así que `setup()` escribe en `V` y los demás módulos
leen de ahí. Los escalares que sólo usa un módulo se quedan en él.

### La regla que sostiene la pieza

> Nadie está iluminado por la escena. Cada cuerpo existe sólo hasta donde
> llega la luz que le dan.

De ahí que el rape viva a oscuras: su señuelo apunta al frente, no a él.
Cualquier cambio que ilumine a un bicho «porque no se ve» va contra el
tema de la obra.

### Composición aditiva, y su consecuencia

Bichos y planos se pintan en `globalCompositeOperation = 'lighter'`.
**Sumar nunca oscurece**, así que no se puede dibujar una sombra, una masa
negra ni una silueta que tape. La oclusión va por el único camino que
queda: **quitarle luz al que estaba detrás**. Dos mecanismos:

- **Campos `apaga` / `tapa`** — el bicho pregunta `silencio(M, x, y, L)` y
  se calla. `apaga` son eventos (sin profundidad); `tapa` son cuerpos (con
  guarda de plano).
- **`pintaSombras()`** — la otra mitad: le quita luz al **agua**. Es el
  único punto de la tubería donde se puede restar, porque va antes de que
  se sumen los planos.

Corolario práctico: el orden de la lista `ABISMO.bichos` no cambia un
píxel. Lo que cambia las cosas es cambiar de **plano**.

### Los tres planos

`ABISMO.planos` son fondo / medio / frente, cada uno en su propio lienzo
fuera de pantalla. La distancia se lee por cuatro avisos simultáneos: más
pequeño (`scale`), más borroso (`resDiv`), más tenue (`alpha`), más lento
(`drift`). Un objeto puede pedir `o.alFrente = true` en su `actualiza()`
para pintarse en el plano delantero ese fotograma sin crecer ni afilarse.

### Orden de un fotograma (`frame()` en [motor/bucle.js](motor/bucle.js))

```
pasoEventos  → vacía `campos`, reinicia MOD, corre relojes y eventos vivos
pintaAgua    → tira de degradado + ondulación + pintaSombras + MOD.agua
pasoPlanos   → def.campos() de TODOS los planos primero, luego por plano:
               rehacer L.luces/L.presas/L.cardumen → actualiza → dibuja
componePlanos→ suma los tres planos + pintaDispersion (el velo) + dither
```

`campos` se vacía **al empezar** el fotograma, de ahí que un bicho que
quiera tapar deba empujar su campo en `def.campos()` y no en
`actualiza()`: en `actualiza()` llegaría tarde para el plancton del fondo.

### Cómo se relacionan los bichos sin conocerse

Cada plano rehace tres listas por fotograma a partir de banderas de la
definición de especie: `L.luces` (quién ilumina), `L.presas` (quién es
comestible) y `L.cardumen` (quién hace banco — dos especies que lo pidan
hacen banco mixto). Ese es todo el vocabulario. Ninguna especie pregunta
por el nombre de otra.

Y «cuánta luz me llega» —que es la regla de la casa hecha cuenta— tiene
**una sola implementación**: `M.luzEn(x, y, luces, op)`. La usan el cuerpo
del rape, cada vértebra de la carroña y cada muestra del canto de un
cuerpo. Su único parámetro de forma es `corta`: sin él la luz no llega
nunca a cero —hace falta para algo grande en agua vacía— y con él el trozo
se apaga de verdad al salir del foco.

Los **eventos** actúan por dos vías que tampoco obligan a nadie a saber
que existen: empujar a `M.campos` (y el bicho consulta `M.campo(tipo, x,
y, plano)`), o modular `M.mod.agua` / `M.mod.ritmo`, que el motor aplica al
pintar. Un campo lleva además dos cosas que el motor no mira y pasa tal
cual: `c`, un color, y `d`, un dato cualquiera del que lo puso —lo usa el
`glitch` para decir cuánto se corre cada banda del sprite roto.

Hay **un tipo de campo que no lee ninguna especie**, `tajo`: lo lee el
motor en `pintaBicho()`, justo antes de dibujar a un bicho, y lo que hace
es dibujarlo MAL —cortado en bandas horizontales escalonadas, cada una
corrida lo suyo—. Es el mismo principio que `alFrente` (el dibujo de un
objeto lo coloca el motor, no el objeto) y es el único sitio donde se puede
corromper un sprite sin que la especie sepa que existe. Lo usa el `glitch`,
y sólo se le aplica a quien declare la bandera `rompible` —hoy, la medusa.

Y para **leer** la escena, un evento no recibe `L`: tiene
`M.luces(plano)` y `M.cardumen(plano)` —ésta, sin argumento, da los tres
planos juntos, que es como se usa casi siempre—. Con la primera puede existir un
evento que no emita nada y se vea sólo cuando algo lo alumbra —la regla de
la casa aplicada a un evento, que es lo que hace la `carrona`—; con la
segunda, uno que le pase algo al banco donde el banco está.

### Color

Una especie puede dar colores a mano o un **espectro** (`espectro: {tono,
sat, luz, …}`), que `resuelveEspectros()` convierte en paleta al arrancar;
de ahí abajo nadie distingue uno de otro. Cualquier clave `espectroX`
produce su `paletaX`. Cada entrada de paleta es `{core, mid, glow, peso}`:
núcleo casi blanco, identidad, halo. Usa **`M.color(pal)`** y no
`elige(pal)`, o los pesos no cuentan.

El color excepcional —la ascua roja de la nieve marina— es de la especie
que lo usa y no del motor: vive en la entrada del plancton (`colorRaro`,
con su `raro: 0.02`). Un color que sólo usa uno no es un concepto de la
pecera.

Los halos y puntos de luz están **pre-dibujados y cacheados en la propia
entrada de paleta** (`M.halo(c)`, `M.punto(c)`): un degradado radial por
mota y fotograma sería el coste dominante. Por eso el espectro se cuantiza
en `tramos` en vez de dar un color por bicho.

### Rendimiento

El coste es **relleno**: varias pasadas a pantalla completa por fotograma.
Lo único que lo mueve de verdad son los píxeles del lienzo, y de eso se
encargan `ABISMO.calidad.dprMax` y `maxPx`, una sola vez en `setup()`.

**AQUÍ HUBO UN `degradar()` Y SE BORRÓ POR MEDIDA, no por gusto.** Entraba
sola a los dos segundos, sin vuelta atrás, y recortaba población de las
especies con `escalaCalidad`, el grano, los niveles del velo y el tope de
ondas del dedo. En un Pixel 7a: **22 fps con la pieza entera y 22 fps con
la pieza recortada.** Cero.

La razón es estructural y conviene no volver a tropezar con ella: **nada
de lo que recortaba escala con los píxeles, y el coste sí**. El `dpr` se
calcula en `setup()` y `degradar()` no lo tocaba nunca, así que recortaba
todo menos lo único que manda. El precio eran catorce peces que salían
siete.

La lección general, que vale para el próximo mecanismo de este tipo: **un
paliativo automático hay que medirlo contra sí mismo en el aparato lento,
no razonarlo.** Y si se vuelve a necesitar uno, el mando es `dprMax` —se
prueba con `?dpr=1.2` sin tocar código.

El panel enseña, en `salud`, el tiempo de fotograma, los píxeles de lienzo
y a dónde se va el fotograma por etapas. Ya no avisa de nada: sirve para
**juzgar un aparato**, que es lo que hacía falta desde el principio. Dos
trampas al usarlo, las dos medidas:

- **el panel no es gratis** — 236 px con `backdrop-filter` encima de un
  lienzo que se repinta entero, unos 7 ms en un móvil. Para eso está el
  botón `medir a solas`, que lo cierra unos segundos y vuelve con el
  número de ese rato.
- **el reparto por etapas mide CPU, no GPU** — un `drawImage` se encola,
  no se ejecuta. Si las etapas suman mucho menos que el fotograma, el
  coste está aguas abajo y el mando son los píxeles.

Y hay un **suelo duro a 20 fps** que no es de gusto: `dt` va topado en
`1/20` en `frame()`, así que por debajo de eso la pieza no va a tirones,
va a cámara lenta y sin decirlo.

## Añadir cosas

**Un bicho nuevo**: un fichero en `bichos/` que llame a
`especie('nombre', def)`, una línea en [catalogo.js](catalogo.js) y una
entrada `{especie: 'nombre', …}` en `ABISMO.bichos`. El contrato completo de `def` (`conteo`, `siembra`,
`crear`, `actualiza`, `dibuja`, `campos`, y las banderas `luz`, `presa`,
`cardumen`, `rompible`) está documentado en
**REGISTRO DE ESPECIES**, en [motor/registro.js](motor/registro.js).
`siembra(M, p)` es el único que corre una vez por pecera en vez de por
bicho: es donde va lo que toda la población comparte —los tonos que
mandan en el banco salen de ahí.

**Un evento nuevo**: igual, en `eventos/` y con `evento('nombre', def)`
(`exclusivo`, `arranca`, `actualiza`, `dibuja`). El contrato está en
**REGISTRO DE EVENTOS**, en el mismo fichero. Los mejores eventos **no
dibujan nada** — apagan.

**NO LE PONGAS VALORES, NI SIQUIERA SU RELOJ.** Todos sus parámetros salen
de su entrada en `ABISMO.eventos`, `cada` y `primero` incluidos. Los
eventos llevaban además un `def.prueba` para poder lanzarlos desde el panel
sin que la escena los configurase, y eran 102 claves que la pieza cargaba
sólo para el andamio: nadie las ejercitaba, así que envejecían solas —23 ya
no coincidían con la escena—. Con `cada`/`primero` en la def pasó lo mismo
en pequeño: dieciséis claves que la escena pisaba siempre, y diez habían
dejado de coincidir. **El panel es temporal y la pieza no depende de él.**

Para probar uno sin instalarlo, se le pone **`cada: null`** en la escena y
queda DORMIDO: configurado, lanzable a mano, y no sale nunca por su cuenta
—ni se instala por haberlo lanzado—. Un evento registrado y sin entrada en
la escena no se puede lanzar, y el panel lo enseña apagado diciendo por
qué.

**Un mando nuevo en el panel**: añade una fila a `MANDOS` en
[pruebas.js](pruebas.js) con la ruta dentro de `ABISMO`. Los tramos
`@nombre` buscan por `especie`/`evento` en vez de por índice. `aplica`
dice qué hace falta después: `null` (se lee cada fotograma), `'calc'`
(recalcular) o `'nueva'` (repoblar).

Una fila mueve un escalar, o un ARRAY entero si lleva `escala`: entonces
el deslizador es un multiplicador sobre lo que la escena traía, así que a
1 la reproduce exacta y al moverlo conserva el reparto entre los
extremos. Es lo que permite gobernar un `[min, max]` con un mando:
«peces · tamaño ×» escala los dos extremos del largo del banco. Los
rangos de los eventos se siguen editando como JSON en el panel, o
directamente en `ABISMO`.

**UNA FILA NO TRAE NINGÚN VALOR DE LA ESCENA**, sólo la ruta hasta él y
el recorrido del deslizador. El valor y su porqué son de la pieza; hasta
dónde llega un deslizador es del andamio. Un número de la escena tecleado
en `MANDOS` —los factores de un par, por ejemplo— deja de reproducirla en
cuanto alguien toca el otro, y nada lo avisa: los factores se leen de la
escena al armar el panel.

Y el enlace se comprueba: `revisa()` pinta la fila en ROJO y con su ruta
a la vista si no resuelve, si el valor cae fuera de `[min, max]` o si
`paso` no lo divide contando desde `min` —un `range` redondea el valor
inicial al múltiplo más cercano, así que sin eso el deslizador arranca en
un sitio y la escena está en otro—. Antes se descartaba en silencio: la
fila del plancton llevaba rota desde que el conteo pasó a ser absoluto y
el panel enseñaba un mando menos sin decirlo.

## El backlog de ideas

[docs/ideas/indice-ideas.md](docs/ideas/indice-ideas.md) tiene un ciclo de
vida **estricto** documentado en su cabecera. Léelo antes de editar nada
ahí. En resumen:

- El índice es **sólo** backlog sin procesar, una línea por idea, texto
  breve. Nada de análisis, estado ni histórico.
- La sección «Ideas de usuario» **la edita sólo un humano**. Claude sugiere
  en «Ideas propuestas por Claude» (staging).
- Al **empezar** una idea se quita del índice. Si es compleja, se le crea
  `docs/ideas/idea-<nombre>.md`, y ahí va todo el análisis y el histórico.
- Al **terminarla o descartarla** se actualiza su fichero con el estado
  final y se mueve a `docs/ideas/archivo/`.
- Una idea que ya tiene fichero nunca aparece en el índice.
