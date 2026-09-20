# Histórico de ideas

Una línea por idea procesada: qué se pidió, qué se decidió y —sólo cuando no
está ya en el código— el dato que costó averiguar. **Las fichas completas
están en git**, en `093f16b` y anteriores:

```
git show 093f16b:docs/ideas/archivo/idea-<nombre>.md
```

Esto es lo que queda para no repetir trabajo. Todo lo demás —el cómo, las
tandas de ajuste, las mediciones que ya cumplieron su función— se fue con
ellas, que es donde tiene que estar.

---

## 2026-09-15 · los cimientos

- **Espectro de color por animal** · en vez de colores contados, un
  `espectro` que se cuantiza en `tramos`. Se cuantiza porque el halo se
  pre-dibuja por entrada de paleta. La fórmula HSL reproduce las 22 entradas
  escritas a mano con 2/255 de desvío: las originales ya estaban construidas
  así. **Lo que separa una superficie de un abismo es `luzGlow`.**
- **Peceras cerradas** · nadie sale por los cantos. El conflicto declarado
  («las medusas suben, salen y vuelven por abajo, y ese tránsito reparte la
  población») era cierto, y de ahí salió la patrulla vertical.
- **Fogonazo al arrancar** · todos los rapes encendidos el primer instante.
  Era la esca naciendo encima del cuerpo: a distancia cero la penalización de
  `autoLuz` se disuelve entera. Nace ya en su sitio.
- **Patrulla de las medusas** · se probaron cuatro esquemas, 5×20 min
  simulados. **El valor por defecto ya era el mejor.** Sin cambios.
- **Rapes: volumen** · eran transparentes, de canto grueso y planos, por tres
  causas distintas. El reparto que lo sostiene: la piel pone un suelo, el
  direccional manda, y el reflejo del costado sustituye al óvalo centrado. El
  régimen real de `br` es 0,06-0,10 el 90 % del tiempo: **tunear a `br` alto
  es tunear fuera del rango que existe.**
- **¿El rape debe ocultar lo que tiene detrás?** · **DESCARTADA.** La queja
  era real y peor de lo dicho, pero la única palanca (`source-over` dentro de
  su plano) sólo tapa a medias, no arregla el agua y rompe el tragado, donde
  ver a la presa dentro de la boca ES el efecto.

## 2026-09-17 · la tanda grande

- **El abismo, casi negro pero no plano** · el agua es una tira de 4 px
  estirada, o sea que en horizontal la pecera entera era un único valor. Se
  añadió la ondulación de manchas.
- **Los fotóforos salían fuera del pez** · la hilera tenía fórmula propia y
  el canto de la panza otra. Ahora las dos salen de `panzaPez`.
- **El cardumen, más natural** · de las dos mitades del enunciado una era
  cierta (la sincronía, 0,84 de alineación) y la otra no. Lo que la arregla
  es que la información llegue MAL: `reacciona` la baja a 0,51.
- **Más desorden en los cardúmenes** · **resultado negativo, no repetir**: la
  hipótesis «forman una circunferencia» es FALSA —la elongación ya era 2,7-6,3—
  y bajar `alinea` y `propio` no sostiene la mejora. Lo que funcionó fue la
  cizalla (`desorden`), no más ruido en el rumbo.
- **La caza** · el banco huye al morder (campo `asusta`) y la ráfaga es UNA
  sola envolvente que cubre bocado y masticación. Dos encendidos seguidos se
  leían como un error.
- **Orden en el color** · el banco salía a confeti. Lo arregló el sorteo con
  `dominantes`/`tendencia`, no el color de cada pez.
- **El cuerpo, blando y de uno a tres** · no era falta de números sino la
  forma de describirlo: perfil interpolado más miembros con eslabones.
- **La carroña, siempre hueso** · deshace a propósito el diseño anterior: un
  esqueleto que coge el color del foco no se lee como esqueleto. Y zanjado por
  el usuario: **«la carroña no es presa, los rapes sólo se centran en los
  pececitos»**.
- **Relojes de los eventos** · revisados contra una simulación del reloj. De
  ahí salió `relevo`: un exclusivo que encuentra el turno ocupado vuelve a
  armar su reloj en vez de arrancar en el mismo fotograma en que muere el otro.
- **Cuatro ajustes al rape** · masticado menos exagerado, señuelo sin pelillos,
  ojos siempre encendidos, y señuelo y barbas del color base del bicho.

## 2026-09-18 · el aspecto

- **Menos peces, más grandes y coloridos** · el tamaño no viaja solo:
  `cardumen.roce` va en U, así que subir el bicho sin subirlo mete al banco
  dentro de sí mismo.
- **Los tamaños no pueden depender de la vista** · siete parámetros medían
  contra `M.W` o `M.H` sueltos, así que la esbeltez del leviatán ERA el formato
  de la pantalla (7:1 a 16:9, 1,9:1 en vertical). Todos a U. Lo que NO se toca:
  las posiciones en fracción de pantalla, que el encuadre es lo que hay.
- **Los sprites se ven pequeños en móvil** · **DESCARTADA.** No es resolución
  —el dpr se corta en 2 y el tope de píxeles no muerde—: es que U sale del
  área. Se valoraron tres arreglos y el usuario no quiso ninguno. Dejó un cabo
  analizado (el conteo en px²) que recogió `simpl-04`.
- **El móvil, vertical por defecto** · implementada y **retirada a medias** el
  mismo día: «quita el botón de girar, será suficiente con girar el móvil».
  Con él se fueron el vuelco por CSS, el desgiro del puntero y su regla del
  panel. Queda en pie que la pieza se compone para la caja que le dé la
  pantalla.
- **El dedo enciende en vez de dibujar** · el contacto ya no pinta nada: lo
  que se ve del gesto es el plancton que prende. La regla de la casa aplicada
  al que toca.
- **El marco náutico** · chapa, título y botón en CSS y no en lienzo. De ahí
  sale gratis que el abismo no pueda pintar encima.
- **El plancton al fondo, que todo lo tape** · **DESCARTADA.** Eran dos
  peticiones: el plano sólo cambia el aspecto y no tapa —sumar es
  conmutativo—, y tapar es sólo el mecanismo de campos.
- **Mitosis de la medusa** · sale gemación, no mitosis: dos campanas solapadas
  se leen como una más brillante. Y **no nace nadie**: la cría es la misma
  medusa pintada otra vez, más pequeña y más lejos.
- **Fuera el superpez, y en su sitio super colores** · se demolieron 400
  líneas (el evento, `forma.js` y la rama de formación del pez) y nació la
  `floracion`. **La trampa que dejó escrita: cualquier prueba de color de esta
  pieza hay que hacerla A OSCURAS** —a `ilum` 1,1 todo se ve, a 0,06 que es lo
  normal, no.

## 2026-09-18 / 19 · análisis de complejidad funcional

Doce recomendaciones numeradas por prioridad (`-simpl-NN`). **Ocho ejecutadas,
cuatro descartadas al comprobarlas.** Saldo: **−1 línea de código** y +92 de
documentación.

**Hechas**

- **01 · floración sin paleta gemela** · el núcleo se mezcla hacia el `mid`
  del propio pez (factor 0,88, ajustado contra la paleta vieja). Fuera
  `espectroVivo`, `paletaVivo`, `iC` y la invariante de índices.
- **02 · `M.luzEn`** · las cuatro implementaciones de «cuánta luz me llega» en
  una. Verificado con Δ = 0 en 4.000 puntos contra las tres viejas.
- **03 · campos por tipo** · índice `Map` rehecho una vez por fotograma.
  **66 % menos pasadas** (560M → 190M en 6.000 fotogramas).
- **04 · un solo convenio de escala** · población en números absolutos y
  tamaños en U. Cierra el defecto: la pecera ya no depende del aparato.
- **06 · fuera `aligera`** · un gancho menos en el contrato de especie.
- **07 · `tScale` a la medusa** · el plano pierde una columna. `sharp` se
  QUEDA: probado a 1 en los tres y los bichos del fondo salen con el canto
  marcado.
- **11 · duplicados** · `sumaVeces`, `gxSano` y `hacia` (que estaba copiado a
  mano en diez sitios).
- **12 · `M.raro` al plancton** · un color que sólo usa uno no es un concepto
  de la pecera.

**Descartadas, y conviene no reabrirlas**

- **05 · gemación sin cupo** · la propuesta estaba MAL. Medido: el foco de
  mayor `rLuz` es **la esca del rape** (247 contra 161 de la mejor medusa).
  Sus tres partes hacen falta: el tipo de campo dice «sólo una medusa», el
  cupo dice «una y sólo una», la subasta dice «la más cercana».
- **08 · fases del rape** · la premisa era falsa. `masticaPend` no es un
  parche: `f.mastica > 0` significa «masticando AHORA» para seis lectores del
  dibujo, así que hacen falta dos ranuras.
- **09 · piel del rape** · descartada por su propio criterio de medición:
  0,036 ms por rape, 0,072 con dos, o sea el 0,9 % del fotograma. **Contar
  operaciones no es medir**: 260 `addColorStop` sonaban a mucho y no lo eran.
- **10 · el glitch** · decisión del usuario: **se queda**. Son ~100 líneas y
  dos conceptos de motor, y aun así no sobra: es lo único que no pertenece al
  abismo, y ésa es su idea.

### Lo que este análisis enseñó sobre refactorizar aquí

- **Extraer** un helper no ahorra líneas: la versión general necesita más
  parámetros que los casos que sustituye y la casa pide explicarla
  (`M.luzEn` quitó 27 y costó 31). **Sustituir** ahorra poco. **Borrar** es lo
  único que ahorra.
- Cuatro de doce propuestas cayeron, y todas por lo mismo: proponían sustituir
  un mecanismo que no se había entendido del todo. **Medir la premisa antes de
  reescribir.**
- El arnés de Node con `Math.random` sembrado permite exigir **firma de estado
  bit-idéntica** en un refactor que no debe cambiar nada. Es lo que cazó la
  colisión de nombre de `tent` y lo que dio confianza en los ocho cambios.

## 2026-09-19 · el rape saciado

- **Los peces picotean el señuelo y el rape no responde** · la queja era
  real y se midió: la caza empieza con `if (f.reposo > 0) return;`, o sea que
  durante el reposo el rape **no mira**, y `reposo` ocupa el 35-59 % del
  tiempo según la semilla. Dos tercios de las veces que un pez llegaba a la
  boca lo ignoraba, con episodios de hasta 17 s **y la esca encendida en el
  72 % de ellos**, que es lo que lo hacía leer como avería y no como
  saciedad. Bajar `reposo` estaba descartado de salida: un reposo largo ES el
  bicho —«uno quieto veinte segundos con la esca colgando es una trampa
  esperando»—, así que la solución no podía ser cazar más.

  Elegido: **la esca casi se apaga mientras está saciado** (`escaSaciada`,
  que cubre todo el `reposo` y no sólo la digestión). Resultado: el picoteo
  cae del 9,8 % al 4,2 % del tiempo y la esca está encendida en el 9 % de los
  episodios en vez del 72 %.

  **EL DATO QUE COSTÓ, y que invalidaba el plan escrito:** apagar la esca
  **no bastaba, y a solas habría sido cosmético**. Ni la atracción del banco
  ni el plancton miraban lo que la esca EMITE. La presa sólo comprobaba la
  bandera `senuelo` y la distancia, así que habría seguido acudiendo a un
  señuelo negro; y el plancton usa `o.rLuz` a pelo, así que habría quedado una
  nube de motas prendidas alrededor de un señuelo apagado —peor que el
  problema original—. Hicieron falta tres cosas atadas al mismo brillo: lo que
  se ve, `senuelo` (que pasó de bandera a **0..1**: cuánto tira ahora mismo, y
  la presa multiplica su `atraccion` por él) y `rLuz`.

  **Lo que se paga, y es el número a vigilar:** la esca tira a pleno el 48 %
  del tiempo en vez del 100 %. La esca es «el único punto de referencia que
  hay aquí abajo», así que si el cuadro se queda sin ancla, el mando es
  `escaSaciada`. Medido, lo que se derrumba es la CORONA y no el punto: los
  píxeles sobre 120 caen 26 veces y la luz total 3,9, pero quedan 5.296 sobre
  60. Deja de ser una lámpara y sigue siendo una brasa.

  Quedan sin usar tres alternativas que el análisis dejó descritas, por si
  esto no basta: que se le NOTE saciado (quijada lenta, ilicio recogido —los
  dos mecanismos ya existen), que AMAGUE sin morder, y que la presa se canse
  de esperar. Las tres suman al arreglo en vez de sustituirlo.

- **Ojo con los controles al medir esto:** el porcentaje de reposo oscila
  entre 35 % y 59 % **entre semillas del mismo código**, así que una sola
  tirada no distingue nada. Y un control hecho «deshaciendo el cambio en
  caliente» (poner `escaSaciada = intensidad`) NO es el original: deja la
  esca encendida también tras comer, que antes sí se apagaba. Para comparar
  hay que restaurar los ficheros desde git.

## 2026-09-19 · el rape en el techo

- **«Que tiendan ligeramente a una altura media, sin prohibir arriba ni
  abajo; comprueba que lo de ponerse en los laterales mirando al centro
  siga así»** · lo segundo **no era cierto y se midió**: el rape se plantaba
  en el techo o en el suelo el 84-97 % del tiempo, ocho semillas de ocho, y
  **nunca** en el tercio central. La escena decía lo contrario («las escas
  quedan por el perímetro apuntando al centro»).

  El fallo eran dos decisiones que por separado parecen bien y juntas se
  realimentan: el aro se medía con `max(|ex|,|ey|)` —el techo lo cumplía
  igual que el lado— y el empuje iba en RADIAL. Nace en un lateral; la
  embestida, que va inclinada hasta ±0,34 rad, lo sube unas décimas; en
  cuanto `|ey|` le gana a `|ex|` el empuje radial apunta casi hacia arriba y
  lo remata contra el techo, donde el aro se da por cumplido y el empuje se
  apaga. **Un embudo, no una deriva.** El aro pasa a medirse sólo en x y
  `altura` es un tirón aparte hacia la media, que no se apaga nunca.

  **EL DATO QUE COSTÓ:** `altura` no se puede elegir por el valor medio, hay
  que mirar la VARIANZA entre semillas. A 0,08 la media parece buena (9 % de
  tiempo arriba) y sin embargo una semilla de cada cuatro se queda pegada al
  techo el 28 % del tiempo —o sea que el bug sigue ahí, sólo que escondido en
  el promedio—. A 0,10 desaparece: máxima excursión 0,54-0,74 en seis
  semillas de 600 s, así que arriba se visita y no se vive. A 0,16 empieza a
  pinchar el bicho en el centro y a 0,45 lo clava (97 % en el tercio
  central), que es prohibir, no tender. Con UN rape por pecera, una sola
  tirada no distingue nada de nada.

  **Sin tocar, y anotado:** el rape mira hacia FUERA el 25-40 % del tiempo,
  antes y después. No es de esto: `f.dir` sólo se replantea cada
  `giro: [14, 38]` s y además exige estar casi parado, así que cruzar la
  vertical del centro le cuesta hasta medio minuto de espaldas.

## 2026-09-19 · seguir sin que sea una orden

- **«Es más importante que naden bien a que naden en cardumen; que sigan a
  otros sólo si están cerca y si no les supone un giro forzado»** · la
  premisa era que el cardumen es lo que les impide sostener un rumbo.
  **Es falsa, y medirlo fue lo que salvó la idea.** Tres semillas de 300 s:
  el banco gira a 116 °/s —un 68 % del tope que le da `vira`—, pero
  quitándole las tres reglas de grupo ENTERAS sigue girando a 89. El
  cardumen pone 28 de los 116. Quien manda es `rumbo`, el reloj del rumbo
  propio, que estaba en [0,6 · 2,0] s.

  **RESULTADO NEGATIVO, y es el que hay que no repetir: la puerta del giro
  cómodo, apretada, hace lo contrario de lo que se le pide.** A `comodo` 0,9
  (52°) el giro baja de 117 a 104 °/s, pero la alineación entre vecinos se
  hunde de 0,43 a 0,07 y **el tiempo sosteniendo el rumbo EMPEORA, de 40 a
  36 %**. El motivo es que la alineación NO es lo que los hace virar: es lo
  que los ESTABILIZA. `propio` vale 0,40 y multiplica al rumbo anterior —que
  se sortea de nuevo cada poco—, mientras que `alinea` vale 1,6 y apunta a
  la media de los vecinos, que es un vector mucho más quieto. Quitándole el
  grupo, el pez se queda a solas con su propio reloj, que es peor. Y el pez
  se niega a seguir justo cuando no va ya alineado, o sea justo cuando la
  regla serviría para algo: la puerta apretada es circular.

  Lo que sí funciona es **alargar `rumbo` a [1,8 · 5,0] y dejar la puerta
  ANCHA (`comodo` 2,4 = 137°, sólo descarta medias vueltas)**. Cinco
  semillas, contra los valores viejos: giro 116 → **90 °/s**, tiempo
  sosteniendo rumbo 39 → **52 %**, giro que le pide el grupo 42° → **30°**, y
  la alineación entre vecinos NO se paga: 0,445 → 0,451.

  **Y LAS DOS COSAS SE AYUDAN, que es lo que no se veía:** la puerta es
  barata precisamente cuando los peces ya nadan bien. Con el `rumbo` corto
  el grupo pedía giros grandes todo el rato y cerrarles el paso mataba el
  banco; con el largo casi nunca hacen falta, así que a 2,4 cuesta 0,04 de
  alineación en vez de 0,15. Al revés —puerta estrecha sobre rumbo corto— es
  la peor esquina de las cuatro.

  **Lo que se paga:** el tiempo sin ningún vecino a la vista sube del 21 al
  29 %. Un pez que sostiene el rumbo se descuelga. Si el banco se ve
  deshilachado, el mando es `vista` (4,2 U), no `rumbo`.

  **Al medir esto:** la alineación hay que tomarla POR VECINDARIO y por
  plano —la media de cos(Δrumbo) con los que cada pez tiene dentro de
  `vista`—. El parámetro global de toda la pecera no distingue nada con 14
  peces en dos planos. Y «nadar bien» necesita su propia métrica, porque el
  giro medio no la da: la que sirvió es qué parte del tiempo el pez gira
  menos de 30° en un segundo.

  **Lo que ya estaba resuelto:** «sólo si están a su alcance cercano» no
  hizo falta tocarlo. `vista` son 4,2 U, que para el pez del plano de
  delante son 1,8 largos de cuerpo. Ya es cerca —de hecho es la razón de que
  cada pez vea a 1,2 vecinos de media y esté solo un cuarto del tiempo.

## 2026-09-20 · fuera el superpez y la estampida

- **«no quiero ni el superpez ni la estampida, quita del todo esos eventos»** ·
  **DESCARTADOS los dos**, y salen del catálogo de `idea-eventos-aleatorios.md`.
  El superpez ya no estaba en el código desde el 18 (ver la entrada de arriba);
  lo que quedaba era la ficha dándolo por vivo en cuatro sitios y contando siete
  eventos donde hay ocho. La estampida (E-06 · «algo fuera de cuadro, todos los
  bichos salen disparados a la vez, el plancton da un fogonazo y se apaga, las
  escas mueren») **nunca llegó a escribirse**.

  **El dato que costó y que la ficha tenía mal:** decía que a la estampida «ya
  sólo le falta el registro, el campo `asusta` está hecho y con dos consumidores».
  Hoy `asusta` tiene **un** productor —el rape al morder— y **un** lector —el pez
  linterna—: el segundo consumidor era el superpez. Ni la medusa, ni el copépodo,
  ni el plancton leen campo alguno de susto, y el rape no lee NINGÚN campo, así
  que «las escas mueren» no tenía mecanismo. La versión barata sí era barata —un
  `asusta` enorme con el centro fuera de cuadro da una dirección de huida casi
  común, como hace la gemación con `r: hypot(W,H)*1,2`—, pero sólo habría movido
  al banco. «Todos los bichos» era código nuevo en cuatro especies.

  **Y de paso, dos «ya casi está» de esa ficha que tampoco lo eran:** `E-10 La
  manta` necesita el tipo de campo `empuja`, que no existe (se fue con el `vacio`
  y la mota se quedó sin velocidad), y `E-14 Lluvia` no es gratis porque
  `impulso()` no se exporta de `motor/dedo.js`: el mecanismo E está cerrado.

## 2026-09-20 · primera tanda del backlog

- **¿Sigue habiendo cardumen?** · «ya no hay cardumen, no? se quitó, si recuerdo
  bien». **Sí lo hay, y es justo lo que se recordaba mal:** `cardumen()` en
  `bichos/pezlinterna.js` con sus tres reglas, la bandera `cardumen` de la especie,
  la lista `L.cardumen` por plano y el bloque `cardumen: {vista, roce, propio,
  aparta, alinea, junta, ciego, reacciona, comodo}` de la escena. Lo que no usaba
  nadie era **`M.cardumen()`**, el método con el que un EVENTO leía dónde estaba el
  banco: su único cliente fue el superpez. Borrado sólo eso.
- **El dedo y el contagio, separados** · «que no se pisen, son cosas distintas».
  Fuera `porContacto: 0.3` de la entrada del contagio. **Deja sin clientes la
  máquina de contacto** —`avisaContactos`/`contactoEventos` y los argumentos `x, y`
  de `arranca`—, que sigue en el motor a la espera de decisión.
- **`contagio` y `floracion`** · «son dos eventos distintos, permíteles vivir a los
  dos». No se factorizan.
- **El visitante, a la baja** · `largo` 25 → 18 U, `grosor` 0,80 → 0,62, `brillo`
  0,26 → 0,18. **El dato que no era evidente:** el visitante MÁS PEQUEÑO era el más
  brillante —pico 133 de 255, igual que el más grande— porque con el cuerpo corto
  las cuentas se juntan y sus halos se suman hasta saturar. O sea que encoger no
  apaga: había que bajar `brillo` en todo el rango, no sólo el tamaño del extremo
  grande. Medido sobre negro, sin bichos ni velo ni grano, con el peor de siete
  fotogramas por travesía. Queda: pico 66 el pequeño y 89 el grande.
  Y el tamaño se juzga contra el MÓVIL DE PIE, que es la caja estrecha: a 25 U el
  bicho medía el 204 % de su ancho.

## 2026-09-20 · el dedo, segunda tanda

- **«que se aparten rapidito de mi paso, pero no se vayan lejos»** · la queja tenía
  dos mitades —«les da pereza arrancar» y «luego se van lejos»— y **las dos salían
  del mismo sitio**: `empuje()` en `motor/dedo.js` no miraba la edad de la onda.

  **El resultado negativo que ahorra la próxima tarde:** el primer intento fue
  afinar los tres números del pez (`lag`, `apartaVuelve`, `apartaDedo`) y **no
  movían la aguja** —bajar `apartaVuelve` de 0,70 a 0,08, nueve veces más corto,
  cambiaba la deriva de 7,69 U a 6,25—. El motivo: `seAparta` sólo entra en su rama
  de decaimiento cuando el objetivo cae por debajo de la velocidad actual, y con un
  barrido hay veinte ondas vivas cuyo peso se satura a 1, así que el objetivo no
  bajaba nunca y esa rama no llegaba a correr. **Con el empujón sin acotar, los
  mandos del pez son decorativos.**

  Lo que lo arregló, en dos pasos: (1) el peso del empuje lleva ahora una
  envolvente, y (2) es la SUYA y no la de la luz —`ondaE`, con `dedo.empuja` como
  qué parte de la vida de la onda sigue moviendo cosas—. Hacen falta dos
  envolventes porque el frente VIAJA: la luz tiene que cruzar el cuadro, que es el
  gesto; el empujón no, o se aparta todo lo que el anillo pille de camino. Y
  `ondaR` frena al final (`crece` 1,7-2,2), así que sin envolvente un frente viejo
  se quedaba aparcado empujando a pleno con la luz ya apagada: el pez se iba solo,
  movido por un anillo invisible.

  Medido con un toque junto a un pez y con un barrido, leyendo `z.dx, z.dy` —que es
  sólo el ladeo del contacto, así que no hace falta restar dos tiradas—:

  | | punta al toque | se aparta | punta al barrido | deriva (mediana) |
  |---|---|---|---|---|
  | antes | 1,15 U/s | 2,15 U | 3,57 U/s | 7,69 U |
  | ahora | 2,32 U/s | 1,60 U | 2,92 U/s | 0,51 U |

  Y **la medusa lleva compensación**: `empuja` es global y le quitaba un tercio de
  ladeo sin que nadie lo pidiera. Su `apartaDedo` sube de 2,2 a 3,3 y la curva
  vuelve a ser la de antes decimal a decimal (3,64 U contra 3,65).

- **La máquina de contacto se queda** · «déjalo, por si acaso». `avisaContactos`,
  `contactoEventos` y los `x, y` de `arranca` siguen en el motor sin cliente, a
  propósito.
- **Onda de proa** · retirada por la usuaria. El leviatán y el plancton siguen como
  estaban: el leviatán lo APAGA, que es su mecanismo entero, y no lo empuja.

## 2026-09-20 · tercera tanda

- **El lomo del leviatán, «una catenaria colgada entre los picos»** · lo era, y por
  una razón que no estaba en el muestreo sino en la propia fórmula. `levCresta` daba
  a cada diente un semiancho de `0,62/n`, y la separación entre dos espinas es
  `0,62/(n−1)`: con diez espinas, 0,062 contra 0,069. **Las tiendas de dos vecinas
  se solapaban**, así que en el valle seguía quedando casi la mitad de la altura y
  el canto nunca volvía al lomo.

  **El resultado negativo:** el primer diagnóstico fue undersampling —40 muestras
  para un diente de periodo 0,069 son 2,8 por diente— y **subir el muestreo no lo
  arregla**: con N=160 el valle bajaba de 1,258 a 1,210 y ahí se quedaba, porque lo
  que no bajaba era el perfil. Medir el RELIEVE (punta menos valle sobre altura del
  diente) y no la altura de las puntas es lo que lo separó: por altura de punta no
  se veía nada, porque las puntas estaban bien.

  Hacen falta las dos mitades: semiancho a media separación (`levAncho`) y muestrear
  el trazo en los tres puntos de cada diente además de la base uniforme (`levLomoS`,
  cacheado por número de espinas). Relieve: 43 % → 82 % con sólo el ancho → **100 %
  con las dos**, y con 61 puntos, menos que un N=120 a ciegas que se quedaba en 95 %.

- **Los cuerpos, más pequeños y un pelín más rápidos** · `alto` [5,46 · 7,8] →
  [4,0 · 6,2] U y `vel` [0,30 · 0,55] → [0,36 · 0,66] U/s. **La caja que manda es el
  móvil TUMBADO**, no el de pie: ahí el cuerpo grande ocupaba el 64 % del alto del
  cuadro (contra el 29 % de pie), que es donde dejaba de leerse como algo que baja.
  Ahora 51 %. El rango se abre de 1,43 a 1,55 porque los cuerpos se ven de uno en
  uno, separados por `retraso`: la variedad sólo se lee contra el recuerdo del
  anterior.

- **Y una trampa del entorno, medida:** en el panel de vista previa del navegador el
  `requestAnimationFrame` va estrangulado —nueve segundos de reloj de pared dieron
  1,5 de escena—, así que para mirar un evento largo hay que subirle la `vel` por
  JSON, no esperar.

## 2026-09-20 · cuarta tanda

- **El plancton que se aleja del techo** · era verdad y la causa no era la que se
  suponía: no se «concentraba», **oscilaba como un pistón**. Con una sola `caida`
  para las 600 motas y todas naciendo con `sentido: 1`, la nieve marina rebotaba
  contra el cristal EN BLOQUE. Medido en diez franjas horizontales sobre quince
  minutos de escena: al minuto el techo al 0 % y el suelo al 19 %, a los seis
  minutos al revés, a los quince otra vez abajo.

  Arreglado con dos líneas y **sin necesidad del toroidal** que la usuaria ofrecía
  como plan B: `caida` pasa a ser un rango por mota ([0,08 · 0,24], misma media de
  0,16) y `sentido` se sortea al nacer. Hacen falta las dos: la velocidad sola deja
  el arranque acompasado y el sentido solo deja dos bloques en vez de uno. Después:
  ninguna franja se sale del 7-13 % en ningún momento, en tres semillas.

- **¿Mira el rape hacia fuera?** · «yo no noto nada mal… revisa otra vez y dime qué
  opinas». **Revisado: la queja de Claude estaba exagerada y la pieza se queda como
  está.** Lo medible: la esca apunta al cristal más cercano el 27-29 % del tiempo,
  en rachas de hasta 13-15 s —no «hasta medio minuto», como se había dicho—, y por
  delante de la esca hay 43 % del ancho del cuadro de agua abierta DE MEDIA. O sea
  que la trampa casi nunca está desperdiciada.

  **Y la métrica que no vale:** medir «cuánto tiempo mira hacia fuera» da 30-37 % y
  suena fatal, pero no distingue el rape aparcado de espaldas al agua del rape que
  simplemente está cruzando. La pregunta buena es hacia dónde apunta la ESCA
  respecto del centro. (Un primer intento midió la distancia de la esca a la pared
  con un umbral del 6 % del ancho: no puede dispararse nunca, porque `M.salto` ya
  recorta el objetivo de la esca a 0,9 U del cristal, que es más.)

  Si algún día se quisiera apretar, el mando es la guarda `|f.vx| < M.U*0.15` de
  `actualiza`, que hace que sólo se replantee el giro estando casi parado. Pero
  quitarla lo haría girar más a menudo, que es lo contrario de un cazador de
  emboscada.

## 2026-09-20 · el picoteo del señuelo apagado

- **«los peces solo tienen que ir al señuelo cuando está encendido»** · la usuaria lo
  seguía viendo después de la tanda de `escaSaciada` del 19, y tenía razón: aquella
  tanda apagó la esca pero **no apagó lo que TIRA**.

  `senuelo` y `rLuz` salían los dos de la misma cuenta, `brillo/intensidad[0]`. Con
  `escaSaciada` en [0,06 · 0,16] e `intensidad[0]` en 0,42, eso deja `senuelo` entre
  0,14 y 0,38 estando saciado —nunca cero—, o sea un radio de atracción de 0,6 a
  1,7 U, que es un largo de pez. **Y el rape está saciado el 60-71 % del tiempo.**

  MEDIDO sobre diez minutos y dos semillas, contando pez·segundo cebado y mirando si
  el rape estaba en `reposo`: **el 42-49 % de todo el cebado del banco ocurría sobre
  una esca apagada**. La medición vieja de la ficha (9,8 % → 4,2 % de «episodios»)
  no lo cogía porque contaba episodios y no tiempo.

  Arreglo: las dos cuentas se separan. `rLuz` sigue contra `intensidad[0]` —una
  brasa tiene que seguir prendiendo las motas de al lado, o queda una nube encendida
  alrededor de un señuelo oscuro— y `senuelo` pasa a ir contra `escaSaciada[1]`, así
  que **llega a cero** en cuanto la esca baja a ese nivel. El suelo se lee de la
  escena y no se teclea, para que no se desalineen.

  Después: 6-8 pez·segundo (9-11 %), y lo que queda es el segundo que tarda el
  brillo en bajar al tragar, que es justo lo que hay que ver. **Y la trampa no
  pierde: el cebado con la esca ENCENDIDA sube** (50→52 y 64→86), porque el banco
  deja de gastar la mitad del rato en un señuelo que no responde.

## 2026-09-20 · la cabeza del leviatán

- **«el morro está poco definido, mandíbula más intimidante, el ojo demasiado
  bajo»** · los tres eran verdad y se veían de golpe al dibujar sus campos `apaga`
  —que SON la silueta— sobre un lienzo aparte. El morro era un bulbo del mismo
  radio que cualquier segmento del cuerpo; la quijada, UNA elipse casi circular
  colgando (papada, no mandíbula); y el ojo caía al 42 % hacia la panza, o sea
  justo encima de esa papada.

  - `levPerfil`: el morro pasa de `0,45 + 0,55·(s/0,06)` a
    `0,20 + 0,80·(s/0,11)^0,62` — más largo y con la potencia por debajo de 1, que
    es lo que hace un hocico: fino en la punta y ya ancho al llegar al cráneo.
  - La quijada pasa a ser una CADENA de cinco lóbulos achatados del morro a la
    charnela, y —esto es lo que costó— **medida por su canto de abajo contra
    `grosor`, no contra el semigrosor local**. Midiéndola contra el semigrosor se
    encogía con el morro y se quedaba DENTRO de la silueta, invisible. Lo que hace
    una cabeza de depredador es lo contrario: el canto de abajo va recto y el de
    arriba se curva.
  - El ojo sube al lado del LOMO (+30 % del semigrosor) y se adelanta a s=0,068,
    donde el cráneo ya tiene grosor y la primera espina de la cresta (s=0,14)
    todavía no ha empezado.

  Nuevo mando: `quijada` en la escena, lo que cuelga la mandíbula. Es lo único de
  la cabeza que es mando; el morro y el ojo son anatomía y viven en el evento.

- **Y cómo mirar un bicho que es un hueco:** dibujar `M.campos` filtrado por
  `tipo === 'apaga'` sobre un canvas propio, cada campo como su elipse. Da la
  geometría EXACTA sin duplicar una fórmula, y se ve en un fotograma —que con el
  `requestAnimationFrame` estrangulado del panel es la diferencia entre mirar y
  esperar un minuto a que el bicho cruce.

## 2026-09-20 · la cara del rape

- **«un pelín más pequeño, más intimidante, revisar su forma y su ojo»** · elegido
  por la usuaria sobre una hoja de bocetos: ojo recolocado + boca mayor, sin tocar
  el detalle interior ni el perfil del cuerpo (la forma se queda como estaba).

  - `largo` [5,4 · 7,4] → **[5,1 · 6,7] U**. Y un comentario que mentía por cuatro:
    decía «un quinto del ancho del cuadro» y eran el **80 %** del ancho de un móvil
    de pie —`largo` va en U y además lo multiplica el `scale` 1,32 del plano de
    delante, y el comentario venía de antes del cambio de `escala`—. Ahora, 72 %.
  - El ojo pasa de (0,175 · −0,155) a **(0,22 · −0,20)** y de r 0,042 a 0,050.
  - La boca: `bocaLargo` 0,47 → 0,56, `bocaHondo` 0,26 → 0,34, `abertura` 0,52 →
    0,70, `dientes` [10,15] → [15,20].

  **EL TOPE QUE SALIÓ DE MEDIRLO, y es el dato que vale:** la quijada de arriba
  gira sobre la charnela y el hueco que abre se le RESTA al cuerpo (`bocaPath`), así
  que un ojo dentro de ese barrido se queda flotando FUERA de la silueta. Medido
  punto en polígono contra el hueco en veinticinco posturas de `ataque`:

  | | ¿se come la boca al ojo? |
  |---|---|
  | boca vieja, ojo viejo | nunca |
  | boca nueva, ojo viejo | sí, desde `ataque` 0,44 |
  | boca nueva + `quijadaArriba` 0,42 | sí, con el ojo en CUALQUIER sitio probado |

  O sea: **`quijadaArriba` no se sube**, y no se arregla moviendo el ojo. La boca
  crece por `bocaLargo`. Con 0,30 y el ojo en 0,22/−0,20 queda libre en todo el
  bocado, con 0,175 de largo de margen hasta el lomo.

  Lo pilló la usuaria mirando los bocetos —«te han quedado los ojos fuera del
  cuerpo»— antes de que nada tocara la pieza.

- **Cómo se hicieron los bocetos**, que sirve para la próxima: un servidor local con
  un POST que guarda PNG, y en la página un panel por variante llamando a
  `ESPECIES.rape.dibuja()` sobre un lienzo propio con un rape clonado, la luz puesta
  a mano y el color FIJADO —si no, cada recarga lo re-sortea y dos paneles dejan de
  ser comparables—. Y para componer la hoja, `createImageBitmap` y no
  `img.decode()`: con el panel del navegador oculto, `decode()` no resuelve nunca.


## 2026-09-20 · la medusa: más pequeña, y recela de las trampas

- **«reduce su tamaño máximo, es demasiado grande»** · `radio` [0,55 · 1,35] →
  **[0,55 · 1,10] U**. La campana del plano de delante pasa del 35 % al 28 % del
  ancho de un móvil de pie. El mínimo no se toca: la variedad de tamaño es lo que
  hace que tres medusas en tres planos se lean como tres distancias.

  **Cómo se mide, que es lo que costó:** `radio · planos[2].scale · ancho · U`, y
  `U = √(W·H)/escala` **en px de CSS** —no de dispositivo—. Con el `dpr` de más
  sale la mitad y parece que el bicho es diminuto. `ancho` además va normalizado
  por área en `crear()` (`1/√(an·al)`), así que su tope efectivo es 1,22 y no 1,20.

- **«que las medusas tiendan a alejarse de los rapes, con poco código y elegante»** ·
  hecho en 11 líneas. La medusa mira `L.luces` de su plano y se aparta de las que
  traen `senuelo > 0` —la MISMA bandera por la que la presa se acerca—, con dos
  mandos nuevos: `recela: 5.0` (radio, en U) y `recelo: 0.9` (velocidad, en U/s).
  Ninguna especie nombra a otra, la profundidad sale gratis porque `L.luces` es por
  plano, y recela de la TRAMPA y no del animal: con la esca apagada el rape es un
  hueco invisible y se le acerca sin saberlo.

  **Los dos tropiezos, que son el valor de la entrada:**

  1. **Como FUERZA sobre `vx,vy` no funciona, y el porqué ya estaba escrito cuatro
     bloques más arriba en el mismo fichero** (el ladeo del dedo): se lo come el
     `arrastre` y la medusa acaba donde estaba. Va de VELOCIDAD, directa a
     `avanza`. Cuatro semillas de cinco minutos como fuerza: cero ganancia.
  2. **Con una medusa NO SE PUEDE MEDIR.** El ruido entre semillas es de ±1,5 U y
     tapa el efecto entero; por poco se archiva como imposible. Con seis medusas
     en el plano y cinco semillas —30× muestras— sale limpio: el tiempo a menos de
     4 U de una esca encendida es del **12,7 % contra el 24,7 %**, y dura después
     de apagarse (1,6 U más lejos de media).

  Y lo que acota el valor: los percentiles de su velocidad real no se mueven ni
  una milésima (p50 0,417 · p90 0,845 · p99 1,26 U/s, con recelo y sin él). Se
  aparta dentro de lo que ya se movía, porque una medusa que huye deja de ser una
  medusa.

  **Trampa al leer `senuelo`:** el pez linterna lo declara como booleano `false` y
  sólo el rape lo trae numérico, así que la guarda es `if (!(o.senuelo > 0))` y no
  un `if (o.senuelo)` —con `true` valdría 1 y daría repulsión a tope—. Es el mismo
  idiom que ya usaba `pezlinterna.js`.

## 2026-09-20 · dos convenios: el banco en largos, y un evento a la vez

- **«Decide un convenio de unidades para el pez linterna y simplifica esa lógica»** ·
  el convenio es: **toda distancia de un bicho va en LARGOS DE SU CUERPO; sólo lo que
  viene de fuera del agua —el dedo— va en U.** `Lg` ya lleva dentro el `scale` del
  plano, y `scale` es PERSPECTIVA: el pez de en medio no es otro bicho, es el mismo
  más lejos, así que todo lo suyo tiene que encoger a la vez.

  `cardumen.vista` 4,2 → **1,8 largos**, `cardumen.roce` 3,0 → **1,3**,
  `atraccion` 4,5 → **2,0**, `revelado` 1,6 → **0,7**.

  **EL DEFECTO SE MEDÍA, y es el dato que vale:** `roce` 3,0 U eran 1,31 largos en el
  plano de delante y 2,34 en el de en medio, o sea que a los de en medio **su propio
  roce les prohibía juntarse**. Tres semillas de 100 s en caja de móvil:

  | | a <1,2 largos | vecinos a <2 largos |
  |---|---|---|
  | en medio, antes | **0,0 %** | 0,00-0,03 |
  | en medio, ahora | 3,0-6,5 % | 0,46-0,54 |
  | delante, antes | 12-14 % | 1,13-1,31 |
  | delante, ahora | 8-15 % | 1,05-1,48 |

  **El anclaje se eligió midiendo.** Anclar en la media de la población afloja el
  plano de delante —los apiñados caen al 2,5 %— y ése es justo el que estaba
  ajustado. Anclado en el plano de delante, ése no se mueve y el otro entra en vereda.

  Y `atraccion`/`revelado` son **inertes hoy**: `rape.por` es [0,0,1] y `L.luces` va
  por plano, así que sólo hay esca que ver en el plano de delante. Comprobado igual,
  porque el comentario de la escena avisa de que un alcance corto deja la trampa sin
  clientes: 10 min × 3 semillas, 26-31 bocados antes y 28-31 después.

  La simplificación que pedía la usuaria salió sola: `cardumen()` usaba `M` **sólo**
  para `M.U`, así que el parámetro se fue. Y no cuesta nada, porque los cuatro sitios
  ya se calculaban por pez.

- **«Solo un evento a la vez»** · la bandera `exclusivo` se borró entera —ocho defs,
  el motor, el contrato y el panel—: con la regla universal no distinguía nada. Pasa
  a ser una propiedad de la pieza (`evVivos.length > 0`), y el mecanismo de espera que
  ya existía para los exclusivos —rearmar el reloj con `ABISMO.relevo`— vale tal cual
  para todos.

  **LO QUE SORPRENDIÓ AL MEDIRLO**, tres semillas de media hora de reloj de escena:
  el cuadro NO se vacía. Sigue teniendo algo pasando el 70 % del tiempo (67,8-72,1 %
  después, 67,5-72,6 % antes), porque lo que desaparece no es tiempo de evento sino el
  AMONTONAMIENTO —se llegaban a solapar cuatro, y el 26 % del rato había más de uno—.
  Lo que baja es la cuenta: de ~145 a ~90 eventos/hora. Y no se muere de hambre
  ninguno de los ocho, ni siquiera el `cuerpo`, que es el del reloj más largo (4-6/h,
  su ritmo natural).

  De paso, `dispara()` tenía un `para(nombre)` seguido de un bucle que borraba todo:
  ahora es `para()` a secas, que además limpia campos y modulación.

## 2026-09-20 · quién tapa la nieve marina, y la pieza instalable

- **«¿Cómo de viable es que, salvo medusas y peces, todo lo demás tape el plancton?
  Estudiarlo bien, podría tener impacto o ser engorroso»** · **ya estaba hecho en
  cuatro de cinco cuerpos.** El estudio, medido con la nieve marina real (600 motas,
  sin rape en la pecera para que su vaivén no tapara la señal, y contando sólo
  mientras el evento vive):

  | | motas apagadas, media | pico |
  |---|---|---|
  | leviatán (`apaga`) | 66-73 | 19 % de la nieve |
  | cuerpo (`apaga`) | 10-12 | 4-5 % |
  | carroña (`tapa`) | 3-5 | 2 % |
  | rape (`tapa`) | 31-68 | — |
  | **visitante** | **0** | **0** |

  Así que la idea entera se reduce a **un bicho**, y son 25 líneas: un `tapa` por el
  espinazo del visitante, como la carroña por las vértebras. Ahora apaga 3,9-4,0 motas
  de media (pico 14-18) y **sólo en su plano**, que es lo que da gratis la guarda de
  profundidad de `M.campo`.

  **EL COPÉPODO NO ENTRA, y no por pereza:** mide 0,019-0,028 U de radio y una mota de
  plancton mide 0,006-0,032. Es del mismo tamaño. Que una mota tape a otra no es
  oclusión, es ruido.

  **Coste medido**, campos vivos y JS puro por fotograma: el visitante pasa de 0 a 20
  campos y de +0,00 a +0,08 ms. Para comparar, la carroña son 14 campos (+0,05 ms) y
  el cuerpo y el leviatán 41-43 (+0,21 ms). O sea: no es engorroso ni pesa.

  Dos cosas que costaron y no se ven en el código:

  1. **`K` sigue a la ONDULACIÓN y no al largo.** El bicho lleva 2,6-4,2 ondas de
     cuerpo; una cadena de elipses que las corte por las esquinas deja el agujero
     fuera del animal en los vientres. Con seis por onda el error baja del grosor.
  2. **La fuerza va con `fade`**, que en el visitante es su PRESENCIA y no su luz
     —entra y sale del cuadro con ella—. Es la excepción a «tapa siempre, también a
     oscuras» del rape y la carroña: aquéllos tienen el cuerpo ahí y a éste le
     aparecería el agujero en la nieve antes que el animal.

  **Y AL MEDIR ESTO SE FALLÓ DOS VECES**, que es lo que vale guardar: primero
  comparando una ventana de 3 s contra otras de 12 s —el pico crece solo con la
  ventana—, y después creyendo que `rape.total = 0` quitaba los rapes. **El rape
  cuenta por `por`, no por `total`** (usa `porPlano`), así que seguía ahí tapando
  31-68 motas y haciendo de suelo. Con el suelo puesto, el visitante —que entonces no
  empujaba NINGÚN campo— salía +32 motas en una semilla y −14 en otra.

- **`manifest.json`** · la pieza es instalable en la pantalla de inicio. `background_color`
  y `theme_color` son el mismo `#000103` del `body`, que es lo que pinta el sistema
  mientras arranca; cualquier otro da un fogonazo antes del abismo. El icono es un SVG
  y no un PNG porque aquí no hay binarios: agua del degradado real de `ABISMO.agua.tono`
  y una esca del tono del rape con su caña, sin rape —que es la obra.

  El icono es **un pez linterna grande y verde con nieve marina detrás** —el primero
  fue una esca sola sobre negro y a tamaño de pantalla de inicio era un cuadro negro
  con un punto—. La curva del cuerpo, el ojo y la hilera de fotóforos salen de los
  mismos números que `bichos/pezlinterna.js` (`PANZA`, `DENTRO`, `FOTO_T`). Tres cosas
  que hubo que bajar del dibujo a mano al dibujo de la pieza: el canto iba a 0,020·Lg
  y era un contorno de tebeo (ahora 0,009), el ojo a alfa plena era una pelota de golf
  (ahora halo suave y núcleo a 0,40) y el cuerpo con `core` encima al 13 % salía
  lavado en vez de verde (ahora 6 %).

  **PENDIENTE DE DECIDIR: `orientation: portrait` riñe con el diseño.** La pieza no
  gira el cuadro y se ve en las dos posturas a propósito; hay valores de la escena
  ajustados mirándola TUMBADA. Instalada, esto la clava de pie. Queda como se pidió y
  con el aviso escrito en `index.html`: son cuatro letras («any») para recuperarlo.

## 2026-09-20 · la cresta del leviatán: de ubres a colmillos

- **«Que el mismo algoritmo que genera la posición de la cresta se use para dibujar
  su brillo, justo ahí»** · había **tres** expresiones distintas del canto de arriba:
  el campo oscuro y el halo de la punta usaban `1 + levAlta(i)·cresta` en la espina, y
  el velo de color usaba `levCresta`, una carpa lineal aparte. Ahora hay UNA:
  **`levPua(d)`**, la altura del diente a la distancia `d` de su eje, de la que salen
  el campo, el velo y el halo.

  **LA FORMA COSTÓ TRES INTENTOS, y el orden importa:**

  1. **Carpa lineal** → «palos». Lados rectos, y peor: el factor de masa multiplicaba
     también al cuerpo desnudo, así que entre diente y diente el velo se quedaba
     colgado un 45 % por encima del lomo. Cuñas con el pie en el aire.
  2. **Envolvente de la elipse del campo** → «ubres». Alto y ancho parecidos y punta
     redonda: una cúpula, no una cresta.
  3. **`(1 − |d|)²`** → colmillo. Base ancha que arranca del lomo y punta de aguja:
     a media altura el diente mide ya el 29 % de su base. Elegido por la usuaria
     sobre una hoja de tres formas.

  **Y AQUÍ ESTÁ LO QUE HAY QUE ENTENDER PARA NO REPETIRLO: una elipse no puede tener
  los lados cóncavos**, así que la sombra NO puede hacer un colmillo con un campo por
  diente. Se persiguió un rato: cadenas de rebanadas apiladas y de elipses anidadas,
  midiendo el RMS contra la curva, y ninguna converge —a doce rebanadas por diente
  (120 campos) todavía queda un escalón del 6,6 %—.

  La salida no era una aproximación mejor sino **otra manera de repartir el trabajo**:
  `levPua` es LA DEFINICIÓN, el velo la traza exacta y la sombra la aproxima con
  cuatro rebanadas que quedan siempre POR DEBAJO de la curva. De ahí sale gratis que
  el velo pase por el canto o por fuera y jamás hundido en la masa. «Un solo
  algoritmo» es una sola DEFINICIÓN, no una sola fórmula de dibujo.

  Alineación del velo con el borde de la sombra —midiendo el apagado del motor en los
  puntos del propio trazo, tres semillas; el borde es 0,45:

  | | mediana | fuera de la masa | hundido |
  |---|---|---|---|
  | carpa | 0,29-0,37 | 31-45 % | 0 % |
  | cúpula | 0,40-0,44 | 14-22 % | 0 % |
  | **colmillo** | **0,45-0,48** | **12-15 %** | 1-2 % |

  **Coste:** la cresta pasa de 10 a 40 campos y el leviatán de 41 a 71; en JS puro,
  de 0,69 a 0,83 ms de fotograma. Cuatro rebanadas y no más: el escalón peor es el
  16 % del alto del diente, cinco píxeles en un móvil, y el desvanecido del campo se
  los come. Subir a doce cuesta ochenta campos para arreglar algo que no se ve.

  Dos números que ahora se derivan en vez de estar a mano: **`levLee`** —hasta dónde
  llega un campo, `1 − 0,45^filo`, que con `filo` 2,2 son 0,83 y estaba escrito 0,76—
  y el alto del diente, que pasa a ser `cresta` a secas (0,55 → **0,80**, el mismo
  alto de antes) en vez de `cresta` multiplicado por un factor de masa.

  **Y UN FALLO MÍO AL VERIFICAR, que casi cuela:** dije que el velo nuevo salía «casi
  plano». Era falso — para ver el dibujo había borrado el `<body>` de la página y con
  él el lienzo, así que `M.U` se fue a cero y lo que medía no era el velo. La segunda
  vez, el velo salía flotando muy por encima de la sombra: le estaba pasando el ancho
  del diente en PÍXELES a una cuenta que mide en `s`.

## 2026-09-20 · las burbujas, y la esca más baja al estar saciado

- **«Evento: burbujas, no muy grandes, juntas, como si algún organismo hubiera soltado
  aire; de un color random, pero todas de un mismo rango de color cada vez, de distintos
  tamaños, subiendo y explotando algunas y otras no»** · hecho, `eventos/burbujas.js`.
  Es el noveno evento, y con él cada uno sale menos: el reparto del hueco lo manda
  `ABISMO.relevo` y no la entrada de nadie.

  **UNA BURBUJA NO EMITE**, así que no se pinta un disco: se pintan las dos cosas que
  tiene una película de aire en agua negra, y las dos salen de `M.luzEn`. **El ARO**
  —`mancha` con `r0`, el centro vacío, que por ahí se ve el agua de detrás— y **el
  DESTELLO**, un punto en el lado que mira a la luz, sacado del vector `vx,vy` que ya
  usaba el canto del `cuerpo`. Sin el destello son anillos planos; con él, esferas. En
  agua vacía casi no están y se encienden enteras cuando les pasa una medusa por debajo:
  es la carroña aplicada a algo que sube.

  **«Un mismo rango de color cada vez» no pedía un mecanismo nuevo.** `generaPaleta`
  reparte el tono LINEALMENTE por el rango del espectro, o sea que la paleta ya viene
  ordenada por tono: un racimo es un TROZO CONTIGUO de ella —se sortea dónde empieza y
  cada burbuja coge una de las `tramo` siguientes—. Se indexa a mano y no con
  `M.color()` a propósito, que ahí está el punto: que NO sea un sorteo por toda la
  paleta. De ahí que su espectro vaya sin `peso`, que nadie miraría.

  Lo único físico que llevan es que **la grande sube más** (de `radio[1]`); sin eso el
  racimo asciende en bloque y se lee como una cortina. El serpenteo va en la POSICIÓN y
  no en la velocidad: integrado se acumula y la burbuja se va de lado sin volver.

- **«Baja un poquito más el brillo del señuelo del rape cuando no está cazando»** ·
  `escaSaciada` de `[0.06, 0.16]` a `[0.04, 0.11]`. No es cosmético: de ese número
  cuelgan también lo que TIRA (`senuelo`) y hasta dónde enciende plancton (`rLuz`), que
  baja de 34 a 23 px en caja de móvil. `senuelo` sigue llegando a 0 estando saciado,
  así que el picoteo no vuelve.

  **Y LA MEDIDA VIEJA DEL BLOQUE ERA IRREPETIBLE**, que fue la mitad del trabajo. Medir
  la esca restando dos fotogramas no converge por tres motivos a la vez, y los tres hay
  que quitarlos: **el grano se re-sortea cada fotograma** (la resta se lo lleva entero),
  **el ilicio sigue oscilando** con su muelle, y **el bicho se mueve**. Con el grano
  apagado, el rape clavado y un cuadro de 90 px la medida sale limpia y monótona: de
  encendida a saciada, los píxeles por encima de 120 pasan de 1.492 a NINGUNO y los de
  más de 60, de 3.518 a 148. Los números que había en el comentario (17.454 → 671) no
  se pueden reproducir con ninguna receta; se sustituyeron por éstos.

- **Y UN FALLO ESTRUCTURAL QUE SALIÓ DE PASO: el agua no veía a los cuerpos.**
  `pintaSombras` corre dentro de `pintaAgua` y la pasada `def.campos()` de los bichos
  estaba dentro de `pasoPlanos`, que va DESPUÉS. O sea que el agua sólo llegaba a ver
  los campos de los EVENTOS: un cuerpo podía callar a los de detrás (`tapa`) pero no
  oscurecer el agua, hiciera lo que hiciera. La pasada se sacó a `camposBichos()` y
  ahora va entre `pasoEventos` y `pintaAgua`. **No cambia la simulación** —nadie empuja
  un campo entre los dos sitios— y está comprobado exigiendo firma numérica idéntica en
  seis tiradas sembradas. Sin esto, la idea del rape oscuro no podía funcionar y no se
  veía por qué.

## 2026-09-20 · la ficha: un «acerca de» en la franja

- **«Un botón Acerca De al lado del de reiniciar, que abra un popup con el logo, el
  título y una descripción de la aplicación, sencilla y graciosa»** · hecho con un
  **`<dialog>` modal**, que es lo que evita escribir código: el fondo, el ESC, el foco
  atrapado y el pintar por encima de todo los trae el navegador, y aquí no hay
  dependencias que los traigan. Lo único escrito a mano es cerrar al tocar fuera, y
  sale de una decisión de CSS: **el diálogo no lleva relleno y todo su interior es el
  `<article>`**, así que un clic cuyo `target` sea el diálogo llegó por el fondo. El
  logo es `icono.svg` —el mismo fichero de la pantalla de inicio, recortado a ojo de
  buey—, y la pieza sigue viva detrás mientras la ficha está abierta.

  **LA FICHA SE MIDE CONTRA LA PANTALLA Y NO CONTRA EL CUADRO**, y por eso cuelga del
  `<body>` y no de `#marco`: la chapa es un `container-type:inline-size` —lo que
  gobierna el título de la franja— y un modal que lo heredase se ajustaría al lado del
  cuadro en vez de al de la pantalla.

  **El fondo va opaco, sin `backdrop-filter`:** desenfocar a pantalla completa un
  lienzo que se repinta entero cuesta lo que cuesta el panel de pruebas —unos 7 ms por
  fotograma en un móvil, ya medido— y la pieza sigue corriendo detrás. El velo ya
  tapa, así que el desenfoque sólo se pagaría.

- **El texto, a la segunda, y el primero estaba MAL.** Decía que los bichos no tienen
  luz propia. La emiten ellos: lo que no hay es luz de escena. Dicho en corto, la
  regla de la casa es **«aquí la luz la ponen ellos y no hay más»**, nunca «nadie
  tiene luz propia». Además era largo y aburrido. El que va son dos párrafos: qué es
  —un abismo simulado—, que la luz la ponen ellos, que de vez en cuando cruza algo, y
  el remate del rape, que ya estaba escrito en la descripción de la web.

- **Y AL ACORTARLO SE DIO LA VUELTA LA RAZÓN DEL CSS DE TUMBADO.** Un móvil de lado
  deja 320-375 px de alto y la ficha de pie no cabe. Hay dos palancas —ensancharla
  (menos líneas) o encoger el armazón: ojo de buey, márgenes y cuerpo de letra— y
  **cuál manda depende del largo del texto.** Medido en 812×375, alto que pide:

  | | texto largo (4 bloques) | texto corto (2 bloques) |
  |---|---|---|
  | como está de pie | 311 | 350 |
  | sólo ensanchar a 42 rem | **280** | 335 |
  | sólo encoger el armazón | 271 | **249** |

  Con el texto largo ensanchar valía 31 px y era la palanca buena; con el corto vale
  15 y la buena es encoger, que vale 101. La razón es que **el ancho sólo ahorra
  LÍNEAS y el armazón es constante**: cuanto menos texto, menos pinta el ancho. Así
  que el ensanchado se quitó y queda sólo el bloque que aprieta.

  De pie ya no hay nada que resolver: pide 392 px —428 en un móvil de 320, el peor— y
  cabe con aire en todos, así que el tope de alto es sólo el fondo que queda a la
  vista para poder tocarlo. Tumbada el tope se queda en el 92 % porque con el 80 el
  margen en una pantalla de 320 se queda en 7 px, y **la prosa va en Georgia, que
  Android no trae**: una sola línea de la fuente de repuesto se los come.
