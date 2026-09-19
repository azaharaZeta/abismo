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
