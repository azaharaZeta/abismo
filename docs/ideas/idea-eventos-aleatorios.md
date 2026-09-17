# Idea: Eventos aleatorios

**Estado: EN CURSO** — arquitectura hecha; 3 implementaciones vivas de 16 eventos.
El catálogo restante sigue vivo aquí; este fichero registra el estado de cada uno.
**Empezada:** 2026-09-15 · **primera tanda:** 2026-09-15 · **última revisión:** 2026-09-17

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
- `impulso(x, y)` — las ondas del dedo son una función. Se puede llamar desde código.
- `M.empuje / M.borde / M.flujoX / M.flujoY` y el `susto` / `huida` de cada especie.

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

**C es la llave maestra.** Un solo mecanismo da el monstruo por ausencia, la estela
de la manta y la estampida. Si solo se implementa una cosa nueva, que sea ésta.

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

### E-04 · La caída  ·  mec. A (+ `L.presas`)
Carroña que se hunde desde arriba, lenta, volteando. **No es luminosa:** solo se ve
cuando pasa por la luz de alguien, así que aparece y desaparece a trozos durante todo
el descenso. El plancton se enciende a su paso —descomposición— y le deja un rastro
vertical que tarda en borrarse.

Lo que lo convierte en un evento de verdad y no en un adorno: **entra en `L.presas`**.
Los rapes dejan de emboscar y convergen. Durante un par de minutos la pecera cambia
de comportamiento porque ha llegado comida, que es lo que pasa en un abismo real.

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

### E-06 · La estampida  ·  mec. C
Algo fuera de cuadro. **Todos** los bichos salen disparados en la misma dirección a
la vez, el plancton da un fogonazo y se apaga, las escas mueren. Nunca se ve la causa.
Dura tres segundos y deja la pecera medio vacía un rato largo.

*Parámetros:* `desde` (borde o ángulo) · `fuerza` · `dura` · `secuela` (cuánto tardan
en volver a encenderse).

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

---

## Reparto sugerido por pecera

- **Abismo (hoy):** E-09 `contagio`, el `visitante` y E-16 `leviatan`. Son los tres
  únicos eventos que existen hoy: el resto de la tabla está por escribir o borrado.
- **Abismo (propuesto):** sumarle E-02, E-04 y E-06 · y E-08 de fondo.
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
4. **E-01 El vacío** — mec. C. La joya, y al abrir los campos deja hechas la estela
   de E-10 y la estampida de E-06.

## ESTADO POR EVENTO

| | evento | mec. | estado |
|---|---|---|---|
| E-01 | El vacío | C | **borrado** el 2026-09-17 · lo hace E-16, con anatomía |
| E-02 | El apagón | D | pendiente |
| E-03 | El que mira | A | **borrado** el 2026-09-17 |
| E-04 | La caída | A | pendiente |
| E-05 | El engaño | A | pendiente |
| E-06 | La estampida | C | pendiente |
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

Quedan **tres implementaciones vivas** —`contagio`, `visitante` y `leviatan`—, y las
tres están en la escena del abismo. Llegó a haber seis eventos hechos con cinco
implementaciones; cuatro se borraron el 2026-09-17 a petición del usuario.

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

Elegir de la tabla los siguientes. `E-06 La estampida` y `E-10 La manta` ya casi están
hechos: el mecanismo C está abierto y `E-16` acaba de estrenar campos con guarda de
plano, o sea que a la manta sólo le falta el tipo `empuja` —que `vacio` ya usa— y a la
estampida un `asusta`. `E-14 Lluvia` es prácticamente gratis (mecanismo E).

`E-02 El apagón` sigue siendo el de más efecto por línea de código, y ahora más: con
`mira`, `marea` y `vacio` borrados, el abismo se ha quedado con dos eventos ligeros y
un leviatán muy espaciado, y no hay ya nada registrado fuera de la escena.
