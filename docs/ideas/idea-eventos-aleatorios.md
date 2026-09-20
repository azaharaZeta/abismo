# Idea: Eventos aleatorios

**Estado: EN CURSO** — arquitectura hecha. La pieza tiene hoy ocho eventos, cinco de
ellos de este catálogo; el resto del catálogo sigue vivo aquí y este fichero registra
el estado de cada uno.
**Empezada:** 2026-09-15 · **primera tanda:** 2026-09-15 · **última revisión:** 2026-09-20

> **2026-09-20.** «Solo un evento a la vez.» La decisión 1 de abajo —un exclusivo a
> la vez y los ligeros en paralelo— **queda derogada**, y con ella la bandera
> `exclusivo`, que ya no distinguía nada y se borró de las ocho defs, del motor, del
> contrato y del panel. Ahora es una propiedad de la PIEZA: `pasoEventos` mira si hay
> alguno vivo, y el que llega tarde espera con `ABISMO.relevo` como esperaban antes
> los exclusivos. Lo de abajo se queda escrito porque explica el mecanismo de espera,
> que es el que ha sobrevivido; lo que ya no vale es el reparto en dos clases.

> **2026-09-17 (mañana).** El usuario quitó `mira`, `marea` y `vacio` de la escena del
> abismo, pidió más detalle en el `visitante` y encargó un leviatán (E-16, abajo). Los
> tres quitados siguieron implementados y registrados: lo que cambió fue que la pecera
> no los pedía.
>
> **2026-09-17 (tarde). Los tres están BORRADOS**, no sólo fuera de la escena: «`mira`,
> `marea` y `vacio` ya no los quiero. Borrarlos del todo». Con ellos se fueron E-01,
> E-03, E-07 y E-15 —E-07 y E-15 eran el mismo `marea` con el signo de `hondura`
> cambiado—. El diseño de los cuatro sigue escrito abajo y su mecanismo sigue en el
> motor: si alguna vez se quieren de vuelta, hay que volver a escribir el registro,
> no el motor. El leviatán (E-16) hace hoy lo que hacía el vacío, y mejor.
>
> **2026-09-17 (segunda tarde).** El usuario pidió cuatro eventos más: «meter carroña»
> (que era E-04, pendiente), «meter un cuerpo humano descendiendo» (E-17, nuevo), el
> banco formando un pez gigante (E-18, nuevo) y un «glitch» (E-19, nuevo). **Los cuatro
> se hicieron**; el pez gigante se retiró después (ver la nota del 20). Estrenan tres
> cosas en el motor, y las tres
> estaban pedidas por el catálogo: `M.luces(plano)` —para un evento que se ve sólo cuando
> lo alumbran—, el dato libre `d` en un campo, y `M.cardumen(plano)`, para un evento que
> se forme donde el banco ya estaba.
>
> El `glitch` se hizo **tres veces**: la primera como error de pantalla (franjas negras y
> líneas corridas), rechazada —«no lo quiero como un error de pantalla, sino como errores
> de dibujo en algunos sprites»—; la segunda partiendo cada bicho en dos mitades,
> rechazada por corta y tímida —«hazlo más lento, y más visible, con más pasitos, y solo
> en algunos bichos»—; la tercera con bandas escalonadas, rechazada por rápida —«sigue
> siendo demasiado rápido, haz que las bandas den pasos más cortos, y dure más en el
> tiempo»—; y la cuarta con la avería avanzando a pasos cortos durante veinte segundos.
> Estrena la cuarta cosa del motor y la más rara: el campo **`tajo`**, que no lo lee
> ninguna especie sino el motor, justo antes de pintarla, para pintarla mal.

> **2026-09-20.** «no quiero ni el superpez ni la estampida, quita del todo esos
> eventos». **E-18 y E-06 salen del catálogo.** El superpez ya estaba fuera del código
> desde el 18 —con él se fueron `bichos/forma.js`, el campo `forma`, el campo `devora`,
> el estado de «me están comiendo» de la medusa y la cuarta lista por plano
> (`L.devorables`)—; lo que quedaba era esta ficha dándolo por vivo. La estampida nunca
> llegó a escribirse. El resumen, en `archivo/historico.md`; el texto de los dos, en
> git.

**Enunciado original (del índice):** «General: Eventos aleatorios: Crear varios,
distintos, parametrizables y usables o no en cada pecera.»

**Encargo ampliado (del usuario, 2026-09-15):** algunos tienen que ser **muy
siniestros** —son los que irán sobre todo en el abismo—, del estilo «un cuerpo
cayendo hacia el fondo» o «un ser monstruoso gigante apareciendo sutilmente por el
fondo». Otros irán en peceras más alegres: «una manta nadando plácidamente», «una
explosión de color del plancton». Pide originalidad.

---

## El principio del que sale todo el catálogo

Dos hechos del motor mandan sobre cualquier idea que se le ocurra a uno:

1. **Las cosas existen hasta donde llega su luz.** No es un efecto, es el tema de
   la pieza: el rape está a oscuras porque su esca apunta al frente.
2. **La escena se compone en aditivo** (`lighter`, en los bichos y en los planos).
   **Sumar nunca oscurece.** No se puede dibujar una sombra, ni una masa negra, ni
   una silueta que tape.

De (2) se suele concluir que no puede haber monstruos oscuros. Es al revés: lo que
sale de ahí es la mejor familia de eventos siniestros de la lista. **No se dibuja la
cosa: se apaga lo que hay.** Un cuerpo enorme no es una forma negra encima del agua,
es una región donde el plancton se calla. Se lee el volumen por el hueco. Y como el
plancton ya reacciona a la luz ajena por diseño, el mecanismo es el mismo de
siempre, con el signo cambiado.

Todo el catálogo sale de decidir, para cada evento, **qué hace con la visibilidad**:
añade luz, la quita, la mueve, o cambia las reglas de quién puede verse.

## Lo que el motor ya regala

Conviene no reinventarlo:

- `programado: {cada, primero}` ya existe y es exactamente el reloj de un evento:
  el `visitante` lo usa. Un evento «objeto que cruza» casi no necesita motor nuevo.
- Los **tres planos** dan profundidad de campo gratis (`resDiv 3` desenfoca, `sharp`,
  `scale`, `drift`, `tScale`). Un evento en el plano 0 ya sale borroso y lento.
- `L.luces` — cualquier cosa con `x, y, c, rLuz` enciende el plancton. Un evento
  luminoso se integra en una línea.
- `L.presas` + `senuelo` — la caza y la atracción ya están escritas. Un evento puede
  **secuestrar** esas listas: carroña que entra en `L.presas`, escas falsas que
  entran en `L.luces` con `senuelo: true`, y los bichos hacen el resto sin tocarlos.
- `M.luzDedo(x, y)` — cuánto enciende el dedo en un punto. Un evento que quiera
  prender plancton no necesita el dedo: empuja un campo `enciende`, que es el mismo
  canal (ver el contagio).
- `M.empuje / M.borde / M.flujoX / M.flujoY`, el `susto` de cada especie y su
  `aparta` (el desvío del dedo, que `seAparta` deja en `dx, dy`).

## Los cinco mecanismos (y por qué importan)

El catálogo entero se cubre con cinco piezas de motor. Elegir eventos que **comparten
mecanismo** es lo que hace que esto no sea quince implementaciones distintas.

| | Mecanismo | Qué hace falta | Coste |
|---|---|---|---|
| **A** | Objeto programado | Nada: ya existe (`programado`) | ninguno |
| **B** | Modulación global | Multiplicadores con rampa sobre el tono del agua y el ritmo | bajo |
| **C** | Campos | Una lista `M.campos` que las especies consultan igual que `L.luces`: `{x, y, r, fuerza, tipo}` con `tipo` ∈ `apaga` · `empuja` · `enciende`. Un `apaga` calla a los bichos Y oscurece el agua (ver «la sombra en el agua») | medio |
| **D** | Disparo sobre la población | Recorrer los bichos vivos una vez y tocarles el estado | bajo |
| **E** | Reutilizar el dedo | Llamar a `impulso()` desde el planificador | ninguno |

**C es la llave maestra.** Un solo mecanismo da el monstruo por ausencia y la estela
de la manta. Si solo se implementa una cosa nueva, que sea ésta.

---

# CATÁLOGO

## Siniestros

### E-01 · El vacío  ·  mec. C  ·  **borrado** (2026-09-17)
Lo hizo E-16, que es esto mismo con anatomía. Descripción original:
No se dibuja nada. Una región enorme y lenta cruza un plano y, dentro de ella, el
plancton **se apaga** y los bichos pierden brillo. Se lee un cuerpo inmenso por la
forma del silencio. Nunca cabe entero en pantalla, así que no se ve *qué* es: se ve
que es más grande que el encuadre.

El truco es que su perfil no tiene que ser un círculo. El campo puede llevar una
función de silueta —lomo, aleta, cola— y entonces lo que recorre la pantalla es una
forma reconocible hecha de plancton callado.

*Parámetros:* `ancho` (en anchos de pantalla, >1 a propósito) · `vel` · `filo`
(qué tan definido es el canto del silencio) · `hondura` (cuánto apaga, 0–1) ·
`silencia` (si además mata las escas y los pulsos de las medusas) · `plano`.

### E-02 · El apagón  ·  mec. D  ·  ⭐ máximo efecto por línea de código
**Todas las escas de la pecera se apagan a la vez.** Ocho segundos de negro casi
absoluto: solo queda el brillo base del plancton. Y cuando vuelven a encenderse,
**están en otro sitio**, porque los peces siguieron nadando mientras no se les podía
ver.

Es el evento que mejor entiende la pieza: no añade nada, solo retira la única cosa
que hacía existir a los rapes, y deja que el espectador se dé cuenta a posteriori de
que ahí abajo nunca dejó de pasar nada.

*Parámetros:* `dura` · `escalonado` (si mueren juntas o en cascada) · `vuelta`
(rampa de reencendido) · `residuo` (si el plancton conserva algo de brillo).

### E-03 · El que mira  ·  mec. A  ·  **borrado** (2026-09-17)
Descripción original:
Dos luces aparecen cerca del canto del encuadre, **muy separadas entre sí**. No se
mueven. Al cabo de un rato pestañean una vez, desacompasadas. Se apagan.

El horror no está en lo que se dibuja —dos puntos— sino en la distancia entre ellos:
es lo que declara el tamaño de lo que no está dibujado. Cuesta cuatro líneas.

*Parámetros:* `separacion` (en U — es el parámetro que ES el evento) · `plano` ·
`espera` antes del pestañeo · `dura` · `color` · `deriva` (si acompañan muy despacio
el movimiento del agua, que es peor que si están clavadas).

### E-04 · La caída  ·  mec. A  ·  **hecha** (2026-09-17), como `carrona`
Carroña que se hunde desde arriba, lenta, volteando. **No es luminosa:** solo se ve
cuando pasa por la luz de alguien, así que aparece y desaparece a trozos durante todo
el descenso. El plancton se enciende a su paso —descomposición— y le deja un rastro
vertical que tarda en borrarse.

Lo que lo convierte en un evento de verdad y no en un adorno: **entra en `L.presas`**.
Los rapes dejan de emboscar y convergen. Durante un par de minutos la pecera cambia
de comportamiento porque ha llegado comida, que es lo que pasa en un abismo real.

#### Cómo quedó (2026-09-17)
Es el primer evento de la pieza que **no emite nada**, y para eso hizo falta abrirle una
puerta en el motor: un evento no recibe `L`, así que no podía saber si le daba la luz.
Ahora tiene **`M.luces(plano)`**, la misma lista que reciben las especies.

**La luz va HUESO A HUESO**, un número por vértebra, y no era un lujo: los radios con
los que un bicho *revela* a otro son de decenas de píxeles —21 px un pez linterna del
plano de en medio— y la carroña mide cientos de largo, así que **medida desde su centro
no se encendía jamás**. Medido: `ilum` clavada en `base`, 0,025, todo el descenso. Con
un número por vértebra se enciende el trozo por el que pasa la luz, que además es lo que
se pedía: aparece y desaparece a trozos.

**`alcance` es la única licencia**: agranda el radio con el que un foco la revela,
porque los radios de la casa están puestos para un pez oscuro y un esqueleto es pálido y
mate. Se ajustó **por cobertura y no por travesías**, porque una travesía suelta no mide
nada —tres seguidas dieron 21 %, 0 % y 69 % de fotogramas con algún hueso encendido,
según por dónde cayera—. Lo que se mide es qué fracción del lienzo tiene luz bastante
para revelarla:

| `alcance` | 1,0 | 2,2 | 2,6 | 3,2 | 3,6 | 5,5 |
|---|---|---|---|---|---|---|
| cobertura del lienzo | 1,1 % | 5,2 % | 7,3 % | ~10 % | 12,8 % | 24,3 % |

Con 3,2 y doce vértebras repartidas por cuatrocientos píxeles casi siempre hay algún
hueso en zona iluminada y casi nunca todos. Cuando le cae encima el banco se enciende
entera, y ése es el momento del evento.

Lleva además `tapa` —es un cuerpo, y a oscuras se le encuentra por el hueco, con `filo`
6 contra el 28 del rape porque un esqueleto no es macizo— y un `enciende` ancho y flojo:
la descomposición prendiendo la nieve marina.

**Un fallo que tardó en salir.** `vertebras` se sorteaba **dos veces**, una para el
contador y otra para el largo del `Float32Array` de la luz. Con un rango de [11, 16] eso
significa que casi nunca coincidían, y cuando el contador salía mayor que el array
`e.luz[n-1]` era `undefined`: el alfa del jirón de la cola salía NaN y el navegador tiraba
una excepción **a mitad de fotograma**, con lo que la mitad del cuadro se quedaba sin
pintar. No se veía a ojo: pasaba en una travesía de cada tantas y el fotograma siguiente
era correcto.

Se cazó con una trampa en `CanvasGradient.addColorStop` que guarda la pila cuando el color
lleva un NaN, más un **banco de pruebas que avanza y dibuja la escena a mano** —`actualiza`
y `dibuja` de las cinco especies y de los siete eventos, con `M.campos` vaciado cada paso—,
porque con el panel del navegador oculto el bucle del motor baja a 1 Hz y así no se llega
nunca. Apareció al fotograma 1414; después del arreglo, **7500 fotogramas (125 s de
escena) con 34 relanzamientos y 70 bocados forzados, y ni uno**.

**Lo que NO se hizo:** entrar en `L.presas`. Las listas por plano se rehacen cada
fotograma a partir de los grupos de especies, así que un objeto de evento no puede
apuntarse a ellas. Queda como cabo suelto: o la carroña pasa a ser especie, o el motor
admite que un evento se apunte.

*Parámetros:* `tamaño` · `caida` (U/s) · `giro` · `atrae` (a cuántas U lo notan los
depredadores) · `rastro` (cuánto enciende al plancton) · `dura`.
*Versión ambiciosa:* que **se hunda entre planos** —nítida al principio y desenfocada
al final— interpolando `sharp`/`scale`/`drift`. Nadie lo ha hecho en este motor
todavía y sería la primera cosa que atraviesa la profundidad en vez de vivir en una.

### E-05 · El engaño  ·  mec. A (+ `L.luces` con `senuelo`)
Seis u ocho **escas falsas** se encienden a la vez, repartidas, indistinguibles de
una real. Los peces linterna se dispersan hacia todas. No hay nada detrás de ninguna.
Se apagan una por una.

Integración de una línea: basta que entren en `L.luces` con `senuelo: true` y el
código de atracción que ya existe hace todo el trabajo.

*Parámetros:* `cuantas` · `vida` · `escalonado` · `parpadeo` · `dispersion`.

### E-07 · El descenso  ·  mec. B  ·  **borrado** (2026-09-17)
Descripción original:
Sin objeto. Los tonos del agua derivan hacia la entrada más oscura, la viñeta se
cierra, los haces mueren y todo se ralentiza (`drift` a la baja). Se sostiene. Vuelve.
Como si la pecera bajara doscientos metros y regresara.

*Parámetros:* `hondura` (0–1) · `entra` / `sostiene` / `sale` en segundos.

### E-08 · Nevada  ·  mec. B
La nieve marina se multiplica: `caida` y alfa del plancton suben mucho durante un par
de minutos. La visibilidad se hunde. Una ventisca a oscuras.

*Parámetros:* `factor` · `entra` · `dura` · `desvia` (si además mete deriva lateral).

### E-16 · El leviatán  ·  mec. C  ·  **hecho** (2026-09-17)
Enorme y **lejos**, que no es lo mismo que grande en pantalla: ocupa ~0,45 del ancho y
un tercio del alto. **No se dibuja**: el cuerpo son doce campos `apaga` con el perfil de
un animal —máximo en el primer tercio y una cola larga— más aleta dorsal, dos
pectorales y una caudal ahorquillada, todos girados con la tangente del espinazo. Lo
que cruza la pantalla es una región donde la nieve marina deja de encenderse.

Es E-01 llevado hasta el final: donde el vacío era una elipse, esto tiene anatomía.

#### Lo que lo hace amenazante (2026-09-17, tercera pasada)

El encargo fue «no da nada de miedo; prueba a darle una forma y un movimiento,
ondulación o algo, que amedrente». Tres cosas, y ninguna es el tamaño:

1. **LA ONDA VIAJA.** Y aquí había un defecto, no un ajuste: `e.fase` se sorteaba al
   nacer y **no se tocaba nunca**, así que el cuerpo era una banana rígida deslizándose
   de lado. Nada de lo demás importa si el bicho no está vivo. Ahora la fase avanza con
   el tiempo y el término es `s*k − fase`, o sea que la cresta recorre el cuerpo del
   morro a la cola, que es como nada algo grande.
2. **ES LARGO Y DELGADO, no una ballena.** El tercio de alto que ocupa lo llena la
   ONDULACIÓN, no el grosor. Se separaron los dos: `grosor` es el semigrosor del cuerpo
   y `onda` la amplitud del latigazo. A 0,030 de grosor salía a 8:1 y leía como
   anguila; a 0,058 va a **5,3:1** —sigue siendo serpentino pero tiene masa.
3. **LA CABEZA MANDA Y NO ONDULA.** La onda se amortigua hacia el morro con
   `(0,12 + 0,88·s²)`, así que el cráneo va estable mientras el cuerpo late detrás: es
   la diferencia entre algo que flota y algo que se dirige a un sitio. Y avanza a
   **embestidas**, con el empuje sincronizado con el coletazo (`embestida`), no a
   velocidad constante.

El perfil dejó de ser la curva suave de ballena y pasó a ser morro romo → cráneo ancho
→ estrangulación de cuello → hombros → cola que se afila hasta casi nada. Más una
**cresta dorsal de espinas desiguales** en campos aparte, que sierra el canto de arriba
y deja la panza lisa: una sierra regular se lee como decoración, no como amenaza.

El ajuste se hizo contra el alto que ocupa la MASA (donde el apagado pasa de 0,45), no
la penumbra: con `onda` 0,125 y `grosor` 0,058 la masa ocupaba **0,34 del alto** y
cubría un 5,2 % del cuadro.

#### El tamaño, y dónde y cómo cruza (2026-09-17)

Se probó a **x2** de la primera versión que funcionó y pasaba de enorme a aparatoso, así
que quedó en **x1,7**. `onda` no escala igual que el cuerpo: se queda por debajo, porque
el latigazo de una bestia así barre demasiado alto y deja de caber en el cuadro.

| | primera versión buena | x2 (descartado) | **ahora (x1,7)** |
|---|---|---|---|
| ancho | 0,46 del cuadro | 0,88 | **0,74** |
| grosor | 89 px | 157 px | **141 px** |
| esbeltez | 5,0:1 | 5,8:1 | **5,4:1** |
| campos | 29 | 35 | 35 |

**Dónde cruza: por cualquier parte.** `banda` es la franja por la que puede caer su eje,
y de ella sale TAMBIÉN el tope de la vertical, así que los dos sitios que la necesitan
no se pueden desalinear. Con `[0,12 · 0,88]`, sobre 60 tiradas el eje cae 34 veces en la
mitad superior y 26 en la inferior, de 0,13 a 0,86. El margen sólo está para que nunca
acabe con el cuerpo entero fuera del cuadro.

*(Pasó por una versión sesgada a la mitad inferior —`banda [0,46 · 0,84]`, 33 de 40
tiradas abajo— y el usuario se desdijo: la quería por cualquier parte.)*

**Cómo cruza: no en horizontal.** `rumbo` (±0,22 rad ≈ 13°) se replantea cada
`cadaRumbo` segundos y `velRumbo` lo hace virar en unos cuatro, no de golpe. Y el
CUERPO se orienta con el rumbo, no sólo el avance: `levPunto` corre el eje en el sentido
contrario a `ang` y pone la ondulación perpendicular a él. Con el eje clavado en la
horizontal —como estaba— el bicho podía subir mientras cruzaba pero seguía apuntando de
lado. Verificado: con el rumbo forzado a −25,8°, el ángulo del eje morro-cola mide
−25,8°.

El rumbo **oscila alrededor de la horizontal en vez de mantenerse**, y es a propósito:
medido sobre una travesía de 66 s se replantea tres veces (6°, −9°, 7,8°) y recorre
13,6°, pero el desplazamiento vertical neto es de sólo 0,04 del alto. Una diagonal
sostenida se saldría del cuadro antes de acabar de cruzar —con `largo` de casi una
pantalla, mantener 0,22 rad son más de 300 px de subida—. Y se ve: con un cuerpo de
600 px, 13° de inclinación ponen la cola 80 px por encima del morro.

Coste con los 35 campos: **8,3 ms de mediana, igual que sin el bicho.**

**Un fallo que metí por el camino.** La primera versión de esto era una `deriva`
vertical aparte del rumbo, y la puse a 0,35 U/s: ±700 px en una travesía de un minuto,
más que el alto del cuadro, así que el bicho se salía por arriba a media pasada. Lo vi
en una captura, no en los números. Al pasar a rumbo con el cuerpo orientado, la deriva
suelta desapareció —una sola cosa decide hacia dónde va— y queda el tope de `banda`
como red.

**La premisa de tamaño cambió el 2026-09-17.** Nació con `largo` de 1,4-2,4 pantallas,
siguiendo la idea de E-01 de que «nunca cabe entero, así que no se ve *qué* es». El
usuario pidió lo contrario y tenía razón para este bicho: que quepa, pero que se lea
como algo que está en el horizonte. La sensación de tamaño la da ahora la distancia
—difuso, tenue, lento y con más detalle del que se llega a resolver— y no el encuadre.

Lo único que emite es un hilo por el lomo —que se apaga en los dos extremos, así que no
se ve dónde empieza ni dónde acaba— y siete fotóforos muy tenues por el costado. Sin
ellos el bicho pasa sin que nadie lo note; con más deja de ser algo que no se llega a
ver.

**Los campos llevan `plano`**, y ahí está la gracia: sólo apagan a quien pregunta desde
ese plano o desde uno más lejano. Medido con el bicho parado en mitad del cuadro:

| plano | motas dentro de la silueta | silencio dentro | silencio fuera |
|---|---|---|---|
| 0 (el suyo) | **80 de 210** | **0,72** | 0,17 |
| 1 | 0 | — | — |
| 2 | 0 | — | — |

O sea: se lo lleva por delante el fondo y lo de delante no se entera.

Coste: **ninguno medible.** Con los 17 campos del bicho vivo, la mediana del fotograma
es 8,3 ms y el p90 9,5; sin él, 8,3 y 9,7.

**Pero esto por sí solo no bastaba para verlo.** El plano 0 es el más tenue de los tres
y los otros dos brillan por encima del hueco: hizo falta que el campo `apaga` oscurezca
además el AGUA. Ver «la sombra en el agua» más abajo.

#### Sombra y no silueta: hacen falta `filo` y `penumbra`

Aquí está lo único que no es obvio del evento. **El máximo de cada elipse cae en el
espinazo**, así que el grosor del cuerpo se apaga en degradado y con `filo` a solas no
hay manera de pedir núcleo oscuro Y canto blando: o sale un cuerpo lleno de borde duro,
o un degradado sin masa. El primer intento usó `filo` 0,7 buscando difusión y salió
esto —medido en rejilla, con el cuerpo ocupando un 7,2 % del cuadro:

| | núcleo (>0,7) | masa (>0,45) | huella (>0,10) | pico |
|---|---|---|---|---|
| `filo` 0,7 · sin penumbra | **1,6 %** | 5,3 % | 11,6 % | 0,92 |
| `filo` 5 · `penumbra` 1,7 | 16,0 % | 20,8 % | 21,5 % | 0,99 |
| **`filo` 2,2 · `penumbra` 1,3** | **6,1–7,0 %** | **12,3–12,6 %** | **15,6 %** | 0,97 |

`penumbra` agranda la elipse por encima del cuerpo, de modo que la silueta de verdad
cae dentro de la zona llena y el desvanecido ocurre FUERA de ella. Los valores
elegidos dan un núcleo del tamaño exacto del bicho y una penumbra que dobla su huella.

Con `filo` 0,7 el mapa era una raya horizontal; con los valores buenos se le reconocen
el tronco, el bulto dorsal, las pectorales y la horquilla de la cola.

#### Lo que emite, y el error de haber subido `brillo`

Un hilo por el lomo que se apaga en los dos extremos —así no se ve dónde empieza ni
dónde acaba—, **dos hileras** de fotóforos por el costado (no una nube: es lo que
apunta que hay un cuerpo con lados), un destello de ojo junto al morro, que basta para
que el resto del hueco se lea como cabeza, y el filo de la caudal.

Al pasar de 7 fotóforos a 11 y subir `brillo` a 0,26 **se rompió el evento sin que la
cobertura del campo lo delatara**: con el halo de cada punto a `U*0,55` —19 px de
radio— los de la hilera se solapaban y, sumados en aditivo, formaban un tubo luminoso
continuo. Medido, el punto más brillante del bicho llegaba a **208 de luminancia sobre
un fondo de mediana 10**: la sombra pasaba a traer un collar de luces encima, que es
exactamente lo contrario del evento. Corregido bajando el halo a `U*0,24`, la alfa del
punto a 0,30 y `brillo` a 0,16.

**Aviso de método:** medir la luminancia de un rectángulo NO sirve para juzgar esto. La
escena tiene medusas y peces brillantes por todas partes, así que cualquier recorte da
máximos de 230-255 que no son del leviatán —lo comprobé al medir una zona «limpia» y
salir 232. Para lo emitido hay que razonar sobre las alfas del código o aislar el
bicho; para el hueco, el mapa del campo.

*Parámetros:* `largo` (fracción del ancho) · `grosor` (SEMIgrosor del cuerpo) · `onda`
(amplitud de la ondulación) · `ondas` (cuántas a lo largo del cuerpo) · `velOnda` ·
`embestida` · `vel` · `banda` (franja de alturas por la que nada) · `rumbo` ·
`cadaRumbo` · `velRumbo` · `hondura` · `filo` · `penumbra` · `segmentos` · `espinas` ·
`cresta` · `brillo` (sólo lo que emite) · `fotoforos`.

#### Corrección del 2026-09-17: nacía invisible


Tal como se entregó **no se veía, ni lanzándolo desde el panel**, y el motivo era un
error de bulto: `e.x` es el **morro** y el cuerpo va DETRÁS, pero arrancaba en
`x = ±largo`, o sea a un cuerpo entero de distancia del canto. Eso mete un cuerpo de
espera muerta antes de que asome nada:

| | seg hasta que asoma algo | seg en cruzar entero |
|---|---|---|
| como se entregó | **33–113** | 89–272 |
| **ahora** (`x = ±U`, `vel` 0,5-1,0 → 1,5-2,6 U/s) | **0,4–0,7** | **22–53** |

Se subió también `brillo` de 0,10 a 0,22: el plano del fondo se compone a alfa 0,58, así
que 0,10 llegaba al cuadro como 0,03 y no había hilo del lomo que ver —sólo el hueco.

Y un fallo de array compartido del mismo tipo que los que ya avisa el motor:
`levAngulo` llama a `levPunto` dos veces, así que **pisaba el punto que acababa de
pedir quien llamaba**, y las aletas, el lomo y los fotóforos se colocaban todos desde
un punto ya machacado. `levPunto` escribe ahora en el array que se le pasa, que es el
convenio de las quijadas del rape.

**Aviso de método:** medir esto con el panel del navegador en segundo plano no vale.
`requestAnimationFrame` se estrangula —medido, la pieza corría al 4 % de velocidad— y
los sondeos por reloj de pared dan resultados sin sentido. Los tiempos de la tabla
salen de aritmética sobre los parámetros, no de cronometrar.

## Luminosos

### E-09 · El contagio  ·  mec. D  ·  (la «explosión de plancton», mejor)
No un fogonazo simultáneo: **una reacción en cadena**. Una mota se enciende, el
encendido salta a sus vecinas con retardo, y lo que cruza la pecera es una **onda de
luz** con frente visible. Se puede disparar por reloj o **desde el dedo**, y entonces
deja de ser un evento y es un juguete.

*Parámetros:* `vel` (propagación, U/s) · `salto` (radio de vecindad) · `desde`
(punto al azar o último contacto) · `color` (una entrada de paleta para toda la onda,
o que cada mota conserve la suya) · `rebote` (si al llegar al borde vuelve).

### E-10 · La manta  ·  mec. A + C
Una manta grande cruzando un plano, con aleteo de verdad. Lo que la hace pesar no es
su tamaño: es **la estela**. Un campo de empuje suave detrás de ella que desplaza al
plancton, como una versión mansa de la onda del dedo. Sin estela es un recorte
grande; con estela es un animal que mueve agua.

*Parámetros:* `envergadura` · `vel` · `aleteo` · `estela` (fuerza y ancho) ·
`plano` · `pasa` (si cruza o si da una vuelta y se va).

### E-11 · El banco  ·  mec. A
Un cardumen de decenas de peces diminutos. **El evento no es el paso, es el viraje:**
giran todos a la vez y el banco pasa de ser una pared brillante a casi nada, porque
un pez solo brilla por una cara. Dos o tres virajes durante el cruce.

*Parámetros:* `cuantos` · `apiña` (cohesión) · `giros` · `retardo` (cuánto tarda el
viraje en recorrer el banco, que es lo que lo hace parecer un solo cuerpo) · `plano`.

### E-12 · La ascensión  ·  mec. A
Una columna de luces pequeñas subiendo despacio desde el canto de abajo, repartidas a
lo largo de un minuto. Desove. Vertical, tranquilo, ceremonioso. Es el contrapunto
exacto de E-04: lo mismo, hacia arriba y vivo.

*Parámetros:* `cuantos` · `vel` · `ancho` de la columna · `dura` · `dispersa` (si se
abren al llegar arriba).

### E-13 · El velo  ·  mec. A
*(Sin relación con el `visitante`, que ya existe: ver la nota de abajo.)*
Un sifonóforo de treinta metros: una cinta de luz larguísima y tenue que cruza
ondulando, como una aurora. No es un bicho con cuerpo, es una **cinta**. Debería
poder ser más largo que la pantalla.

*Parámetros:* `largo` (en anchos de pantalla) · `ondas` · `vel` · `brillo` ·
`grosor` · `plano`.

### El visitante  ·  mec. A  ·  **hecho**, y ampliado el 2026-09-17
No estaba en el catálogo original —se implementó antes—, y era una cadena de cuentas
con halo. El encargo fue «está genial, pero el gusano es demasiado básico; hazlo más
detallado manteniendo el estilo», así que se le añadió anatomía de poliqueto sin salir
del único vocabulario que tiene la pieza, que son puntos y trazos de luz:

- **el espinazo** que une las cuentas: es lo que separa un cuerpo de un collar;
- **parapodios**, un par por segmento, con la fase retrasada respecto a la ondulación
  del cuerpo —eso es lo que se lee como remar y no como flecos pegados—;
- **segmentación**, alternando el tamaño de las cuentas;
- **dos antenas** en V con la punta encendida, que es lo único que declara por dónde
  va: sin ellas el bicho es reversible;
- **un filamento de cola** que se apaga antes de acabar, porque un cuerpo que termina
  en seco se lee cortado.

La normal del cuerpo sale por diferencias finitas del mismo `pt` que coloca las
cuentas, no de la derivada escrita a mano: escribirla aparte es la forma segura de que
las patas acaben saliendo del sitio equivocado en cuanto alguien toque la ondulación.

`patas`, `antenas` y `cola` a 0 lo devuelven a la cadena pelada.

## Atmosféricos (para las peceras de superficie)

### E-14 · Lluvia  ·  mec. E  ·  prácticamente gratis
Impactos en la superficie: llamadas a `impulso()` repartidas al azar por la franja de
arriba. Reutiliza **entero** el sistema del dedo, incluida la reacción del plancton.
Lluvia sobre el agua, sin una línea de dibujo nueva.

*Parámetros:* `intensidad` (impactos/s) · `franja` (hasta dónde caen) · `dura` ·
`arrecia` (si sube y baja).

### E-15 · Nubes / El amanecer  ·  mec. B  ·  **borrado** (2026-09-17, con `marea`)
Descripción original:
El alfa de los haces baja y sube, despacio y desigual: la pecera respira. Con los
parámetros al revés —tonos hacia la entrada más clara y haces reforzados— **es el
amanecer**, y sale del mismo mecanismo que E-07. Dos registros opuestos por una sola
implementación.

*Parámetros:* `cierra` (cuánto) · `periodo` · `irregular` · `tonoDestino`.


### E-17 · El cuerpo  ·  mec. C  ·  **hecho** (2026-09-17)
Un cuerpo humano bajando, muy despacio. **No se dibuja nada:** la silueta son trece
campos `apaga` —cabeza, cuello, tres tramos de tronco, dos por brazo, dos por pierna—,
así que lo que cruza la pantalla es el HUECO de un cuerpo, y como un `apaga` además
oscurece el agua (ver `pintaSombras`), se lee como masa.

Es E-01 llevado al sitio donde de verdad duele. La carroña es un esqueleto de pez y se
ilumina; esto no emite ni un fotón y no le hace falta: lo que lo hace insoportable es
que la silueta sea humana.

**La postura es la del ahogado** —brazos arriba y hacia fuera, cabeza colgando, piernas
juntas y algo dobladas—. No es licencia, un cuerpo en el agua flota así, y es lo que
hace que se reconozca de perfil, de frente y girado, que importa porque voltea.

La anatomía está escrita a mano por partes y en fracciones del alto, no sacada de una
curva: lo que se reconoce de un cuerpo es la PROPORCIÓN —la cabeza es un séptimo, los
hombros son dos cabezas—, y eso no sale de una fórmula. Los miembros llevan un `vaiven`
de centésimas de radián, una fase por detrás del cuerpo: sin él baja rígido y es un
maniquí.

Es el evento **más lento y más raro** de la pecera, las dos cosas a propósito: 0,3-0,55
U/s son entre 40 y 80 segundos de bajada —el rato que hace falta para dudar de lo que se
está viendo— y con `cada` de cinco a diez minutos no pasa a ser decorado.

*Parámetros:* `alto` (fracción del alto del cuadro) · `vel` · `giro` · `deriva` ·
`vaiven` · `hondura` · `filo` · `penumbra` · `plano`.

### E-19 · El glitch  ·  mec. nuevo  ·  **hecho** (2026-09-17, en cuatro pasadas)
Se rompe el **dibujo de una medusa**, no la pantalla. Uno o dos focos aparecen en sitios
cualesquiera y a las medusas que caen dentro se les pinta el cuerpo cortado en **bandas
horizontales escalonadas**, cada una corrida lo suyo, mientras las otras están perfectas.
**No dibuja nada** —es el único evento de la pieza que ni pinta ni apaga: sólo hace que
otro se pinte mal.

#### Cuatro pasadas, y las tres primeras las corrigió el usuario. La cuarta es la buena.
1. **Error de pantalla.** Franjas `apaga` muy achatadas que dejaban la imagen a rayas
   negras, dos trazos quemados y corridos en los cantos de cada banda, y un salto de
   `M.mod.agua`. Rechazado: «no lo quiero como un error de pantalla, sino como errores de
   dibujo en algunos sprites». Y tiene razón: eso es un fallo de la SEÑAL. La versión
   buena es más difícil de ver y bastante peor, porque que a un pez se le desalinee el
   cuerpo mientras el de al lado está perfecto es un fallo de **quien lo está pintando**.
2. **Un corte, dos mitades.** Ya era corrupción de sprite, pero corta y tímida.
   Rechazado: «hazlo más lento, y más visible, con más pasitos, y solo en algunos
   bichos».
3. **Bandas escalonadas**, foco ancho y `parte` bajo. Seguía siendo un tirón.
   Rechazado: «sigue siendo demasiado rápido, haz que las bandas den pasos más cortos,
   y dure más en el tiempo».
4. **Una avería que AVANZA**, catorce a veinticuatro segundos, y **sólo en las medusas**:
   «haz que el glitch solo pueda aparecer en las medusas». Lo que hay, y aceptado.

#### El mecanismo: el motor pinta mal
Un campo **`tajo`** no lo lee ninguna especie: lo lee el motor justo antes de pintarla,
en `pintaBicho()`. Es el mismo principio que `alFrente` —el dibujo de un objeto lo coloca
el motor, no el objeto— y es el único sitio donde se puede corromper un sprite sin que la
especie sepa que existe: un bicho no puede dibujarse mal a sí mismo sin llenarse de ramas
que no son suyas.

El bicho se dibuja `bandas` veces, cada vez con el recorte de una banda y con su propio
desplazamiento. La primera y la última se van a infinito, así que la escalera cubre al
bicho entero pase lo que pase: sin eso, lo que quedara por encima o por debajo de la pila
no se dibujaría en absoluto.

#### Los cuatro números que lo hacen legible
- **Bandas, no mitades.** Con dos trozos se lee «esto está movido»; con siete a doce,
  «esto está mal dibujado».
- **El salto de cada banda al cuadrado con signo** (`sep·q·|q|`): la mayoría se quedan
  cerca de su sitio y unas pocas se van lejos. Repartido por igual la escalera sale
  regular, y una escalera regular se lee como un efecto y no como una avería.
- **Nada se sortea.** El signo, la altura de los cortes, el salto de cada banda y el
  selector salen de la **posición** del bicho. Tienen que ser estables entre fotogramas
  —un tajo que salta cada fotograma es ruido, no una rotura— y el motor no puede guardar
  nada en el objeto de una especie que no conoce. Con senos de periodo largo los cortes
  además se arrastran despacio mientras el bicho nada.
- **Sólo a las medusas** (cuarta pasada, a petición del usuario), y no lo decide el
  evento: lo declara la especie con la bandera **`rompible`**. Antes rompía a todo lo que
  cayera dentro y lo que más se veía era plancton desplazado, que es ruido: en una mota de
  tres píxeles la escalera no cabe. La medusa es el sprite más grande de la pieza y el que
  se mueve más despacio, o sea el único en el que una rotura se ve y da tiempo a mirarla.
  De paso el atajo sale casi gratis: sin la bandera se preguntaba por el campo unas
  setecientas veces por fotograma; con ella, cuatro.
- **`radio` a media pantalla y `parte` a 1.** `radio` es lo que decide CUÁL de las cuatro
  medusas le toca —más grande les toca a todas, más chico a ninguna— y `parte` sube a 1
  porque con cuatro candidatos un 0,16 dejaba el evento en que no pasara nada. El «sólo
  algunos» ya lo da el foco. En una pecera con más cosas rompibles hay que bajarlo.

**La pila de bandas está medida contra la medusa:** de ocho a catorce bandas de seis a
trece píxeles de escena son unos cien píxeles, y le cruza la campana entera. Los tentáculos
caen en la última banda y se van en bloque, que es justo lo que se quiere —la campana en
escalera y la cortina desalineada por debajo.

#### Y va a pasitos: la avería AVANZA, no se sortea
Éste es el cambio de la cuarta pasada, y es el que hace que el evento se lea. Las tres
primeras versiones **sorteaban el foco entero en cada tirón**, y eso no son pasos: la
rotura desaparece y aparece otra distinta en otro sitio. Ahora el foco se sortea **una
vez, al nacer**, y cada tirón sólo AVANZA lo que ya había. Dos cosas avanzan, las dos en
incrementos cortos:

- **`k`**, cuánto está roto ahora mismo, que camina al azar entre 0,10 y 1 en pasos de
  `avance` (0,14). De él salen el desplazamiento de las bandas y la deformación, así que
  la rotura es UNA cosa que crece y decrece en vez de dos números que se pelean. Medido en
  una tirada de 14 s: 27 pasos, con `k` entre 0,39 y 0,69 y el desplazamiento entre 13 y
  23 px.
- **`giro`**, una fase que viaja en el `d` del campo y que el motor suma al seno de cada
  banda. Avanzándola 0,20-0,70 rad por paso, las bandas se recolocan **todas un poco y
  cada una lo suyo**, sin que el motor guarde nada por bicho y sin sortear el patrón de
  cero.

El silencio entre tirones se queda, porque es lo que hace que los pasos se lean como
pasos y no como una animación, pero corto (0,05-0,25 s) para que el evento no se pase la
mitad del rato en nada. **De veintidós a cuarenta pasos repartidos por catorce a
veinticuatro segundos**: las tres versiones anteriores duraban entre uno y ocho segundos
y pasaban antes de que el ojo llegara.

No es `exclusivo`: no toca la escena entera, y que rompa el dibujo mientras pasa un
leviatán es mejor que peor.

**Coste: pequeño y acotado.** Cada banda es un dibujo entero del bicho, así que aquí sí
hay coste y conviene tenerlo escrito. Cronometrado directamente sobre el `dibuja` de una
medusa (300 pasadas, no por `requestAnimationFrame`, que en una pestaña oculta baja a
1 Hz y da medidas falsas): **0,069 ms un dibujo normal y 0,050 ms uno con banda** —menos,
porque el recorte reduce el relleno—. El peor caso imaginable, un foco que coja a las
cuatro medusas con catorce bandas, son 4·13·0,050 = **2,6 ms** encima de un fotograma de
8,3. Con el `radio` de la escena le toca a una o dos: **0,7-1,3 ms**, y sólo durante los
tirones. Subir `bandas` o el radio sí se notaría. Son varias pasadas de dibujo para una fracción de los
bichos durante décimas de segundo, y `pintaBicho` pregunta por el campo sólo si hay algún
`tajo` vivo —la bandera se calcula una vez por fotograma y no una por bicho: son unas
setecientas llamadas que se ahorran.

*Parámetros:* `dura` · `saltos` / `salto` · `focos` · `radio` · `bandas` / `paso` ·
`sep` / `estira` (los topes, a plena rotura) · `avance` / `giro` (el tamaño del paso) ·
`parte` · `filo`.

---

## Reparto sugerido por pecera

- **Abismo (hoy):** E-09 `contagio`, el `visitante`, E-16 `leviatan`, E-04 `carrona`,
  E-17 `cuerpo` y E-19 `glitch`, más `floracion` y `gemacion`, que no salieron de este
  catálogo. Son los ocho eventos que existen hoy y los ocho están en la escena: el
  resto de la tabla está por escribir o borrado. Ya no hay que vigilar que se pisen:
  desde el 2026-09-20 pasa uno a la vez y punto.
- **Abismo (propuesto):** sumarle E-02 · y E-08 de fondo.
- **Medusas:** E-09, E-13, E-14 · y E-10 si se quiere algo grande.
- **Una pecera alegre futura:** E-09, E-10, E-11, E-12, E-15.
- **En ninguna por defecto:** todas. `eventos: []` y la pecera se queda como está hoy.

## Primera tanda propuesta

En este orden, porque cada paso paga el siguiente y el primero no necesita motor nuevo:

1. **E-03 El que mira** — mec. A. Cuesta nada y ya da un evento siniestro entero.
2. **E-09 El contagio** — mec. D. Es la idea que pediste, mejorada, y estrena el
   disparo sobre la población.
3. **E-07 + E-15 El descenso y el amanecer** — mec. B. Dos eventos de registros
   opuestos por una implementación.
4. **E-01 El vacío** — mec. C. La joya, y al abrir los campos deja hecha la estela
   de E-10.

## ESTADO POR EVENTO

| | evento | mec. | estado |
|---|---|---|---|
| E-01 | El vacío | C | **borrado** el 2026-09-17 · lo hace E-16, con anatomía |
| E-02 | El apagón | D | pendiente |
| E-03 | El que mira | A | **borrado** el 2026-09-17 |
| E-04 | La caída | A | **hecho** · `carrona`, en `abismo`, plano 1 |
| E-05 | El engaño | A | pendiente |
| E-07 | El descenso | B | **borrado** el 2026-09-17 con `marea` |
| E-08 | Nevada | B | pendiente |
| E-09 | El contagio | D | **hecho** · en las dos piezas, y con el dedo |
| E-10 | La manta | A+C | pendiente |
| E-11 | El banco | A | pendiente |
| E-12 | La ascensión | A | pendiente |
| E-13 | El velo | A | pendiente |
| E-14 | Lluvia | E | pendiente |
| E-15 | El amanecer | B | **borrado** el 2026-09-17 con `marea`; nunca tuvo pecera |
| E-16 | El leviatán | C | **hecho** · en `abismo`, plano 0 |
| E-17 | El cuerpo | C | **hecho** · `cuerpo`, en `abismo`, plano 1 |
| E-19 | El glitch | nuevo | **hecho** · `glitch`, en `abismo`, sin plano |

Quedan **ocho implementaciones vivas** —`contagio`, `visitante`, `leviatan`, `carrona`,
`cuerpo`, `glitch`, `floracion` y `gemacion`—, y las ocho están en la escena del abismo.
Llegó a haber seis eventos hechos con cinco implementaciones; cuatro se borraron el
2026-09-17 a petición del usuario y ese mismo día se añadieron cuatro nuevos, de los
que el superpez se retiró después.

## Arquitectura, tal como quedó

`Acuario.evento(nombre, def)` en paralelo a `Acuario.especie`, y un `eventos: [...]`
de primer nivel en el mundo con la misma forma que `bichos`. Un evento actúa por dos
vías y **ninguna obliga a las especies a saber que existe**:

- **CAMPOS** — `M.campos.push({tipo, x, y, r, ri?, ky?, fuerza, filo?, c?})` y el bicho
  pregunta `M.campo(tipo, x, y)`, que devuelve el que más pesa con `.peso` y `.c`
  resueltos. `ri` convierte el disco en anillo (el frente de una onda), `ky` lo achata
  a elipse y `filo` define el canto. Tipos en uso: `apaga` y `enciende`.
- **MODULACIÓN** — `M.mod.agua` y `M.mod.ritmo`, que el motor aplica al pintar.
  `agua` por debajo de 1 oscurece con negro encima —en aditivo no hay otra forma de
  quitar luz— y por encima de 1 vuelve a sumar la tira del agua. (`vineta` y `haces`
  aparecían en la propuesta original y **no existen**: aquella pecera tenía viñeta y
  haces de sol, y el abismo no.)

Las cuatro decisiones se resolvieron como estaban propuestas:

1. **Solapamiento:** un único evento `exclusivo` a la vez; los ligeros en paralelo. Un
   exclusivo cuyo turno coincide con otro **espera** en vez de perderlo.
2. **Configuración:** `eventos: [...]` en el mundo, registro paralelo al de especies.
3. **El dedo dispara:** sí, con `porContacto: 0..1` en la entrada del evento.
4. **Las especies no se enteran:** todo pasa por campos y multiplicadores. La única
   línea que una especie necesita es `silencio(M, x, y)`.

Los eventos viven en `bichos.js` y no en un archivo aparte, para reutilizar `mancha`,
`rgba` y los rangos. Son vocabulario, igual que los bichos.

## LA SOMBRA EN EL AGUA — la otra mitad del mecanismo C (2026-09-17)

Esto es lo que faltaba para que un cuerpo oscuro se vea, y se descubrió por la vía
dura: el leviatán entregado **no se veía**, y el usuario lo describió exacto —«solo una
leve línea del contorno».

**El razonamiento que estaba mal.** El plan era «no se dibuja la cosa: se apaga lo que
hay», y eso es cierto pero incompleto. Un campo `apaga` con `plano: 0` sólo calla al
plancton del plano 0 —que es el MÁS TENUE de los tres, alfa 0,58 y `resDiv` 3— mientras
los planos 1 y 2 siguen brillando por encima del hueco. Medido: unas **33 motas de
210**. Un cuerpo enorme no se leía porque lo único que borraba era la capa que menos
aporta a la imagen.

**La otra mitad.** En aditivo no se puede oscurecer, pero la tubería tiene UN sitio
donde sí: `pintaAgua()`, sobre el agua y antes de que se sumen los planos. Ahí un
`apaga` pinta ahora negro con la misma elipse que resuelve `M.campo`, así que la sombra
y el silencio son la misma forma. El agua es lo más lejano que hay, así que ahí **no**
se mira la guarda de `plano`: todo `apaga` la tapa.

| | luminancia mediana |
|---|---|
| dentro del cuerpo del leviatán | **2,1** |
| agua limpia a la misma altura | 8,3 |
| agua limpia más arriba | 11,0 |

Cuatro veces más oscuro que su entorno: eso ya es una masa, no un agujero de motas.

**Y arregla otro evento de paso.** `E-07 La marea` se quejaba en su propio comentario
de que oscurecer un negro no hace nada; con la sombra, baja la mediana del cuadro de
9,4 a **5,8**. El `vacio` (E-01) gana lo mismo.

Parámetros en `ABISMO.agua.sombra`: `fuerza` (a 0 se apaga el mecanismo y los eventos
oscuros vuelven a depender sólo de las motas que faltan) y `nucleo` (hasta dónde llega
el negro pleno antes de desvanecerse). En el panel, «sombra en agua».

Coste: **ninguno medible** — 8,3 ms de mediana con los 17 degradados del leviatán y
8,3 sin ellos.

## Verificación de la primera tanda

- **El vacío**: 482 px de ancho en una pantalla de 280 —más ancho que el encuadre, como
  debe— y no dibuja nada. Perfil horizontal 0,90 → 0 y vertical 0,90 → 0 en la mitad de
  distancia: es una elipse achatada, no un círculo. En vivo se ve el plancton y las
  escas apagarse a su paso y volver detrás.
- **El contagio**: no dibuja nada. El campo es un anillo de verdad —centro 0, frente
  0,93— y el radio crece 1,05 → 4,2 U. Disparado con el dedo al décimo toque
  (`porContacto: 0.35`), con las motas prendiéndose hacia fuera.
- **La marea**: con `hondura` 0,9 da agua 0,26 · ritmo 0,59; con −0,6, agua 1,36.
  Mismo evento, registros opuestos.
- **El que mira**: separación de 199 px en una pantalla de 280 (el 71 % del ancho), que
  es justo lo que declara el tamaño de lo que no se dibuja.
- Exclusividad correcta: `mira`, `vacio` y `marea` exclusivos; `contagio` en paralelo.

(Tres de los cuatro verificados aquí se borraron después. Se deja la medición porque
es lo que dice que el mecanismo funcionaba, y el mecanismo sigue en el motor.)

## Siguiente acción

Elegir de la tabla los siguientes. `E-02 El apagón` sigue siendo el de más efecto por
línea de código. Pero la pecera ya NO está escasa de eventos: son ocho, y desde que
pasa uno a la vez el problema de que se pisen está cerrado por construcción. Lo que
hay que vigilar al añadir el noveno es lo contrario: cada evento nuevo REPARTE el
mismo hueco, así que sale menos cada uno. El mando de eso es `ABISMO.relevo`.

Y OJO CON LOS «YA CASI ESTÁ» DE ESTA SECCIÓN, que es lo que enseñó la revisión del
2026-09-20: decían que a `E-10 La manta` sólo le faltaba un `empuja` y a `E-14 Lluvia`
nada (mecanismo E). Comprobado en el código de hoy, ninguna de las dos: el tipo de
campo `empuja` no existe —se fue con el `vacio` y el plancton tampoco lo lee ya, que
se quedó sin velocidad— e `impulso()` no se exporta de `motor/dedo.js`, así que el
mecanismo E está cerrado. Antes de dar por barato un evento de aquí, mirar el motor.

Cabos sueltos:

- **La carroña no entra en `L.presas`**, que era la mitad del diseño de E-04: los rapes
  tendrían que dejar de emboscar y converger. Las listas por plano se rehacen de los
  grupos de especies, así que un objeto de evento no puede apuntarse. O la carroña pasa
  a ser especie, o el motor admite que un evento se apunte.
- **`E-10 La manta`** sigue a un `empuja` de distancia, y ese tipo de campo se fue con
  el `vacio`: hay que volver a escribirlo, y además devolverle velocidad a la mota.
- **`asusta` se ha quedado con un solo productor**, el rape al morder, y un solo
  lector, el pez linterna. Ni la medusa, ni el copépodo, ni el plancton miran ese
  campo, y el rape no lee ninguno. Es lo que hay que saber antes de prometer un
  evento que mueva a «todos los bichos» a la vez.
