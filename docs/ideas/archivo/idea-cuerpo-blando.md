# Idea: el cuerpo, blando y de uno a tres

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-17

**Enunciado original:** «evento cuerpo: es demasiado rígido, haz que tenga ciertas
formas, y sus miembros floten, su cuerpo se doble, random, según caen y que pueda haber
entre 1 y 3 cuerpos distintos cayendo en el evento, pero no exactamente a la vez, sin
sincronizarse.»

## Por qué estaba rígido

No era falta de números, era la forma de describir el cuerpo. La primera versión eran
trece elipses con centro y ángulo fijos (`CUERPO_ANAT`) clavadas en un eje **recto**, y
un único seno (`vaiven`) que les torcía el ángulo a todas a la vez. De ahí salían los
tres defectos, y ninguno se arreglaba subiendo `vaiven`:

- **El eje recto** no se puede doblar: la postura es la que es en todo el descenso.
- **El ángulo de una elipse gira alrededor de su propio centro.** Un brazo con el centro
  por pivote es un aspa, no un brazo. Por eso `vaiven` estaba en 0,10: era todo lo que
  aguantaba sin que se viera el mecanismo.
- **Un solo seno** para los cuatro miembros: subían y bajaban juntos.

## Lo que se hizo

Reescrito el bloque entero en `bichos.js`. Lo que cambia es la **descripción**:

- `CUERPO_TRONCO` — las cinco piezas del eje (cabeza, cuello y tres del tronco), como
  antes: lo que se reconoce de un cuerpo es la proporción, y eso se escribe a mano.
- `CUERPO_MIEMBROS` — **nuevo**. Un miembro no es un centro con un ángulo: es un HUECO
  del que cuelgan dos eslabones en cadena. Los ángulos se miden desde «hacia los pies» y
  abriendo hacia fuera, que es como se piensa una postura, y el del segundo eslabón es
  relativo al primero, o sea que es el codo o la rodilla. Mover el brazo arrastra el
  antebrazo.
- `cuerpoFlexion()` — el espinazo se arquea (`arqueo`, con el signo sorteado) y le
  recorre una onda lenta (`onda`, `ondas`, `velOnda`). Pesa por la distancia al ombligo,
  así que el tronco aguanta y se doblan la cabeza y los pies. Se aplica **después** de la
  cadena de los miembros, así que un brazo se dobla además con el espinazo del que cuelga.
- Postura por cuerpo: `abre` multiplica el ángulo del hombro y la cadera, `dobla` el del
  codo y la rodilla. Mismos huesos, silueta distinta.
- Una fase y una velocidad **por eslabón**, sorteadas al nacer: ocho números por cuerpo,
  y con eso `vaiven` sube de 0,10 a 0,30 sin que se vea el mecanismo.
- `cuantos: [1,3]` y `retraso: [10,30]`, con `arranca` devolviendo un array `e.cuerpos` y
  `actualiza` viviendo mientras quede uno. El retraso es largo a propósito: el cuerpo
  tarda 55–115 s en bajar, así que cuando el segundo asoma el primero va por la mitad del
  cuadro. A la vez serían una formación.

## Segunda pasada: los óvalos y los miembros despegados

Con lo de arriba ya hecho, el usuario avisó de dos defectos que seguían ahí: **«los
miembros aparecen separados del cuerpo, y tienen formas demasiado simples (óvalos)»**. Las
dos cosas tenían la misma causa, y no era el reglaje: era que cada pieza era **una elipse**.

Una elipse se afila hasta un punto en sus dos extremos. Así que:

- Dos eslabones puestos punta con punta dejan un **pellizco** justo en la junta: el codo y
  la rodilla se leían como un corte, y el hombro y la cadera como que el miembro no
  llegaba a tocar el tronco.
- Y el tronco eran cinco elipses apiladas, o sea cinco óvalos con un pellizco en cada
  junta y un cinturón oscuro en la cintura, donde dos se solapaban.
- La flexión, además, desplazaba cada elipse **en bloque** según la altura de su centro.
  El muslo y la espinilla tienen los centros a un tercio de altura de diferencia, así que
  se iban a lados distintos: veinte píxeles de hueco en la rodilla.

**Arreglo:** ni el tronco ni los miembros son piezas. Son **perfiles que se recorren**
dejando campos solapados con el grosor interpolado (`CUERPO_PERFIL` + `cuerpoAncho()` para
el tronco, `anchos: [raíz, junta, punta]` para cada miembro). La unión de los campos es una
manga continua, la flexión se aplica campo a campo —así el cuerpo se dobla en vez de
partirse— y las puntas van a casi cero de ancho para que lo que asoma por la coronilla y
por los dedos sea un pelo.

### El paso, y por qué el tronco va más fino

El paso entre campos es **el detalle más pequeño que se puede resolver**: dos campos
consecutivos se solapan a propósito, así que cualquier estrechamiento más corto que el paso
lo rellenan entre ellos. El tronco tiene uno que no se puede perder —el cuello, tres
centésimas del alto— y con el paso a 0,072 los campos de la cabeza y de los hombros se
daban la mano por encima: salía un cuerpo **sin cabeza**, un bulto puntiagudo. De ahí
`PASO_TRONCO = 0.030` y `PASO_MIEMBRO = 0.075`: los miembros son conos lisos y no tienen
ningún detalle así.

El factor de largo (1,35) sale de una cuenta: dos elipses de semieje `a` separadas `s`
dejan la unión, en medio, a `sqrt(1 − (s/2a)²)` de su ancho. Con el semieje igual al paso
eso es el 87 % y el pellizco se ve; con 1,35 es el 93 % y no.

De paso se corrigieron dos cosas que se veían mal al mirarlo de cerca: la coronilla salía
cónica (se le añadieron puntos de control para redondear el cráneo) y las dos piernas
salían **fundidas en una columna** —el muslo medía 0,058 y el hueco de la cadera está a
0,046 del eje, o sea que se cruzaban—. Muslo a 0,050 y cadera a 0,046: se tocan en el eje
y de ahí para abajo se separan. La rodilla se bajó de 0,34 a 0,11 porque en una silueta
plana sólo puede doblar de lado, y a 0,34 el cuerpo bajaba haciendo un compás.

## Tercera pasada: que se vean

**«Los cuerpos oscuros apenas se ven. ¿Puedes iluminarles el contorno con un ligero borde
gris en la zona donde les daría la luz desde la superficie?»**

El diagnóstico era cierto: el agua de la mitad de abajo del cuadro vale `[0,1,3]` de tono
contra `[4,13,21]` del techo, así que ahí un hueco negro sobre agua negra no se lee y el
cuerpo se perdía justo mientras bajaba.

Pero **la luz de superficie no se podía hacer**: es literalmente el caso que la regla de la
casa prohíbe —«cualquier cambio que ilumine a un bicho *porque no se ve* va contra el tema
de la obra»— y además aquí no llega el sol. Se le plantearon al usuario cuatro vías y
eligió la que respeta la regla: **el borde lo enciende lo que pasa cerca**, no la escena.

`pintaBordeCuerpo()` recorre el canto que `cuerpoCampos` ya dejó apuntado en `b.piel` y
consulta `M.luces(plano)`. Dos cosas lo separan de la carroña, que es de donde sale la
idea:

- **La luz tiene DIRECCIÓN.** Se acumula como vector y el canto se enciende por
  `dot(normal, luz)`, así que sólo se pinta el lado que mira al foco. Sumando sólo
  intensidades se encendería el contorno entero y el cuerpo pasaría de hueco a muñeco
  recortado. Medido: **41 de los 82 trozos de canto están siempre de espaldas** y se quedan
  negros. Eso es lo que lo mantiene siendo un hueco.
- **Es gris, no del color del foco.** `bordeTono` casi neutro con un `bordeTinte` de 0,22:
  un cuerpo no es un esqueleto pálido, es carne mojada.

Y se salta los trozos de canto **enterrados en otra parte del cuerpo** —el brazo por donde
cruza el hombro— preguntándole al motor por su propio campo `apaga`: en el canto, el campo
de esa misma muestra vale cero, así que lo que devuelva viene de otra parte. Sin esto salen
rayas por dentro de la masa oscura y el cuerpo se lee como un despiece.

### Lo que costó ajustarlo

Tres cosas que no salieron a la primera, y las tres se vieron midiendo:

1. **La curva de caída.** Con la de la carroña —`pow(1 − d/r, caida)`, que se corta en `r`—
   el canto era todo o nada: `alcance` 9 daba el **0 %** de fotogramas con algo encendido y
   13 el **100 %**, porque a 13 el radio de una medusa cubre la pantalla. Los radios de esta
   escena van de 16 px a 125 —ocho veces— y un cuerpo baja por agua vacía: medido, en una
   travesía entera lo más cerca que le pasó algo fueron **320 px**. Con la curva de
   `luzRecibida` —`pow(1/(1+d²/r²), caida)`, que no llega a cero— hay un hilo de luz a
   cualquier distancia y sube cuando algo se acerca.
2. **El largo del trazo.** Estaba atado al ancho del cuerpo y tenía que estar atado al
   PASO entre muestras: en el tronco sobraba (26 px de trazo para 7 de paso) y en los
   miembros faltaba (7 para 18), así que el canto de un brazo salía a rayitas y el cuerpo
   se leía como una escalera.
3. **El techo.** La luz que le llega va de 0,02 a más de 1, así que sin techo el borde se
   clavaba en alfa 1 cada vez que se le acercaba una medusa. Con rodilla blanda
   —`cara/(1+cara/techo)`— y el techo en 0,09·2,2 = 0,20.

Medido sobre **tres travesías enteras** (184 s simulados, un fotograma de cada cuatro):
100 % de fotogramas con algo de canto, 31 trozos encendidos de 82, y alfa
**p10 0,03 · mediana 0,12 · p90 0,17 · máx 0,20**. O sea que el borde sube casi seis veces
entre pasar por agua vacía y tener una medusa al lado. `bordeTecho` estuvo en 0,14 y la
mediana se iba a 0,20: el borde vivía pegado al techo y dejaba de reaccionar.

Coste: **ninguno medible.** Apagando `borde` la diferencia es de −0,17 ms, o sea ruido —41
muestras × 15 focos son 615 cuentas por cuerpo, contra las 170.000 comparaciones que ya
hace el plancton.

**Aviso de método:** la primera tanda de estas medidas salió mal y hubo que repetirla. La
bomba de fotogramas rebasaba su reloj al reloj real en cada llamada, así que llamándola en
un bucle apretado el `dt` del motor salía casi cero: lo que creía que eran tres travesías
completas eran tres ventanas de unos segundos. Con un reloj persistente, arreglado.

## Lo que costó, medido

**41 campos `apaga` por cuerpo** con los perfiles muestreados —19 del tronco, 5 por brazo,
6 por pierna—; eran 13 con las elipses sueltas. Cronometrado con la bomba de fotogramas y
con los cuerpos parados, para que la medida no dependa de por dónde vayan:

| | campos vivos | ms/fotograma |
|---|---|---|
| sin evento | 4 | 2,5 |
| un cuerpo | 45 | 3,2 |
| tres cuerpos (el peor caso) | 127 | 4,5 |

Unos **0,018 ms por campo**: dos milisegundos en el peor caso de todos, sobre un
presupuesto de 16,7 y sólo durante el evento más raro de la pecera.

**Y el gasto no está en dibujar.** Apagando `pintaSombras` entera —`agua.sombra.fuerza` a
0— la diferencia es de 0,02 ms, o sea ninguna. Está todo en `M.campo()`, que es un
recorrido lineal del array de campos y al que el plancton llama por mota: setecientas motas
× dos consultas × 127 campos son 170.000 comparaciones por fotograma. Eso es lo que pone el
tope al paso, y no el número de elipses: si algún día hace falta afinarlo más, lo que hay
que arreglar antes es la consulta (una rejilla), no este evento.

## Y lo que le costó al reloj

Una tirada de tres dura casi el doble que una de una sola, así que a `cada` igual el
evento se comía más cuadro del que le toca. Seis horas simuladas del reloj de la escena:

| | cuerpo | todos los exclusivos |
|---|---|---|
| un cuerpo, `cada` [300,620] | 13,8 % | 41,2 % |
| 1-3 cuerpos, [300,620] | 19,1 % | 46,2 % |
| **1-3 cuerpos, [360,720]** | **15,2 %** | **43,0 %** |

`cada` sube a [360,720]: 31 travesías en seis horas en vez de 39. Menos veces y más cosa
cada vez, que es lo que se le pide a un exclusivo.

## Siguiente acción

Nada pendiente.
