# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es esto

«Abismo»: una pieza de arte generativo en un único `<canvas>`. Un abismo
bioluminiscente con criaturas que se iluminan entre sí. Sin build, sin
dependencias, sin tests automáticos: tres ficheros JS cargados por
`index.html` con `<script>` planos.

**El código, los comentarios y los identificadores están en castellano.**
Mantenlo así. El estilo de comentario de la casa no describe *qué* hace una
línea, sino *por qué* está y qué se probó antes (con números medidos cuando
los hay). Al tocar un valor ajustado a mano, actualiza su comentario.

## Ejecutar

```bash
python3 -m http.server 8777
```

Hay un `.claude/launch.json` con la configuración `abismo` en ese mismo
puerto para las herramientas de preview. No abras `index.html` con
`file://`: el motor lee píxeles de lienzos y necesita un servidor.

No hay lint ni suite de pruebas. La verificación es visual, con el panel:
`http://localhost:8777/?pruebas` (o tecla `P`) abre `pruebas.js`, que
permite lanzar eventos a mano, mover escalares de la escena en caliente y
repoblar sin recargar.

## Arquitectura

Tres capas, en este orden de carga:

1. **[motor.js](motor.js)** — el motor y **la escena**. Un IIFE que expone
   `window.Acuario`. Contiene la constante `ABISMO`: *toda* la
   configuración de la pecera (paleta, agua, planos, lista de bichos,
   lista de eventos). Aquí no hay ninguna criatura.
2. **[bichos.js](bichos.js)** — el catálogo de criaturas y eventos, cada
   uno registrado con `Acuario.especie(nombre, def)` /
   `Acuario.evento(nombre, def)`. Aquí no hay parámetros: los recibe de la
   escena, así que el mismo bicho puede ser pálido y lento o nervioso y
   quemado sin tocar una línea.
3. **[pruebas.js](pruebas.js)** — andamio. **No forma parte de la pieza**:
   borrar su `<script>` de `index.html` lo hace desaparecer sin más.

La separación es el punto: **motor/escena ↔ criaturas**. Un valor ajustable
va en `ABISMO`, nunca incrustado en `bichos.js`.

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

### Orden de un fotograma (`frame()` en [motor.js](motor.js))

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

Los **eventos** actúan por dos vías que tampoco obligan a nadie a saber
que existen: empujar a `M.campos` (y el bicho consulta `M.campo(tipo, x,
y, plano)`), o modular `M.mod.agua` / `M.mod.ritmo`, que el motor aplica al
pintar. Un campo lleva además dos cosas que el motor no mira y pasa tal
cual: `c`, un color, y `d`, un dato cualquiera del que lo puso —lo usa el
`superpez` para decir dónde y de qué tamaño es la silueta.

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
segunda, uno que se forme donde el banco ya estaba y hacia donde ya iba,
que es lo que hace el `superpez`.

### Color

Una especie puede dar colores a mano o un **espectro** (`espectro: {tono,
sat, luz, …}`), que `resuelveEspectros()` convierte en paleta al arrancar;
de ahí abajo nadie distingue uno de otro. Cualquier clave `espectroX`
produce su `paletaX`. Cada entrada de paleta es `{core, mid, glow, peso}`:
núcleo casi blanco, identidad, halo. Usa **`M.color(pal)`** y no
`elige(pal)`, o los pesos no cuentan.

`ABISMO.raro` es el color excepcional: el motor sólo lo **ofrece** en
`M.raro` y quien lo quiera se lo coge. Hoy sólo lo usa el plancton, por
mota y con su propia probabilidad (`raro: 0.02` en su entrada de escena).
No hay ningún reparto automático.

Los halos y puntos de luz están **pre-dibujados y cacheados en la propia
entrada de paleta** (`M.halo(c)`, `M.punto(c)`): un degradado radial por
mota y fotograma sería el coste dominante. Por eso el espectro se cuantiza
en `tramos` en vez de dar un color por bicho.

### Rendimiento

El coste es relleno: varias pasadas a pantalla completa por fotograma.
`vigila()` lleva una media móvil del tiempo de fotograma y llama a
`degradar()` **una sola vez y sin vuelta atrás** (subir y bajar la calidad
oscila y se ve peor que ir lento): recorta población viva de las especies
con `escalaCalidad`, llama a su `aligera(o)`, apaga el dither y baja
niveles del velo. El velo nunca se quita: es lo que hace que esto sea agua.

## Añadir cosas

**Un bicho nuevo**: `Acuario.especie('nombre', def)` en
[bichos.js](bichos.js) + una entrada `{especie: 'nombre', …}` en
`ABISMO.bichos`. El contrato completo de `def` (`conteo`, `siembra`,
`crear`, `actualiza`, `dibuja`, `campos`, y las banderas `luz`, `presa`,
`cardumen`, `rompible`, `escalaCalidad`, `aligera`) está documentado en
el comentario de **REGISTRO DE ESPECIES** en [motor.js](motor.js).
`siembra(M, p)` es el único que corre una vez por pecera en vez de por
bicho: es donde va lo que toda la población comparte —los tonos que
mandan en el banco salen de ahí.

**Un evento nuevo**: `Acuario.evento('nombre', def)` (`exclusivo`, `cada`,
`primero`, `arranca`, `actualiza`, `dibuja`) + entrada en
`ABISMO.eventos`. El contrato está en **REGISTRO DE EVENTOS**. Dale un
`def.prueba` con valores por defecto: es lo que permite lanzarlo desde el
panel aunque la escena no lo configure. Los mejores eventos **no dibujan
nada** — apagan.

Un evento o especie puede estar registrado y **no** estar en la escena
(hoy no hay ninguno). Se siguen lanzando desde el panel; para devolverlos
basta volver a listarlos en `ABISMO.eventos`.

**Un mando nuevo en el panel**: añade una fila a `MANDOS` en
[pruebas.js](pruebas.js) con la ruta dentro de `ABISMO`. Los tramos
`@nombre` buscan por `especie`/`evento` en vez de por índice. `aplica`
dice qué hace falta después: `null` (se lee cada fotograma), `'calc'`
(recalcular) o `'nueva'` (repoblar). Sólo escalares: los rangos
`[min, max]` se editan como JSON en el evento o directamente en `ABISMO`.

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
