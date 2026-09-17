# Idea: la carroña, esqueleto más claro y siempre hueso

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-17

**Enunciado original:** «evento carroña: está muy bien, dale forma más clara de
esqueleto, y métele algún random. Siempre color hueso.»

Y de la misma tanda, la respuesta del usuario a una pregunta que había dejado Claude
—«La carroña no entra en `L.presas`, que era la mitad de su diseño: los rapes tendrían
que dejar de emboscar y converger cuando cae comida»—: **«la carroña no es presa, no es
necesario que los rapes la cacen. los rapes solo se centran en los pececitos.»**
Zanjado: no se toca nada, y `L.presas` se queda como está.

## «Siempre color hueso» DESHACE un diseño anterior, a propósito

La carroña cogía el color del foco que más le pesara, y eso estaba escrito como su gracia
—«no tiene color propio, tiene el de quien la encuentra», «es la regla de la casa
aplicada a un evento»—. Era más bonito de contar que de ver: un esqueleto verde o rosa no
se lee como un esqueleto, se lee como otro bicho que brilla.

Lo que tiene que cambiar con la luz que le llega es **cuánto se ve y por dónde**, y eso ya
lo hacía —y lo sigue haciendo— vértebra a vértebra. El color, no. Ahora tiene su propio
espectro en la escena, marfil mate (`tono [30,48]`, `sat [0.10,0.20]`, `luz [0.80,0.90]`),
y se sortea **al nacer**.

De paso sale del bucle caliente el rastreo del mejor foco (`mejor`/`c` por vértebra y por
luz), que era una comparación por luz y por vértebra.

**Que no se vuelva a revertir**: la regla de la casa —«cada cuerpo existe sólo hasta donde
llega la luz que le dan»— habla de la EXISTENCIA, no del tinte. La carroña la sigue
cumpliendo: a oscuras no está.

## Forma más clara de esqueleto

Era un collar de cuentas con un nudo en la punta. Cuatro cambios, y el criterio en todos
es «qué hace que esto se reconozca como un esqueleto de pez»:

1. **El hueso que une las vértebras.** Una fila de cuentas sueltas es un collar; con el
   tramo entre vértebra y vértebra dibujado es una columna. Cada tramo va al alfa del más
   apagado de sus dos extremos, así que se sigue encendiendo a trozos.
2. **El largo de cada costilla sale de `carronaPerfil`** y no de un seno cualquiera. Con
   el seno salían desiguales pero al azar —un peine desdentado—; con el perfil, las del
   centro del pecho son las largas y se acortan hacia los extremos, o sea que el conjunto
   tiene silueta de tonel. Y la jaula llega de 0,13 a 0,58 del cuerpo en vez de 0,16 a
   0,50: la caja de un pez llega más atrás que su tercio delantero.
3. **Chevrones en la cola** (`chevrones: [3,6]`): las espinas hemales salen en V
   apuntando al morro. Los dos tercios de atrás eran espinazo pelado.
4. **El cráneo es un cráneo**: bóveda, órbita y quijada, tres trazos, en vez de un punto
   gordo que se leía como una cuenta más grande.

Reglaje: el largo de costilla se probó primero a `Lg*0.30*perfil` —media eslora de alto—
y salía un peine. Bajado a `Lg*0.19*perfil`, que pone la más larga en 0,17 del cuerpo, o
sea lo que medía la más larga de antes.

## El random

Ahora que el color es fijo, lo que cambia de una carroña a otra es la anatomía:
`vertebras`, `costillas` y `chevrones` (cuántas piezas), `caja` (lo abombado del pecho,
que entra en el perfil y por tanto manda también sobre lo que TAPA), `falta: 0.18` (qué
costillas no están, **por lados sueltos** —a una jaula a la que le falta medio par se le
lee la edad— y sorteado una vez, que por fotograma los huesos irían y vendrían) y
`craneo: 0.86` (una de cada siete baja descabezada).

## Un fallo latente que salió al hacerlo

`dispara()` en `motor.js` no resolvía los espectros del `def.prueba`, así que cualquier
evento con espectro propio y **sin** entrada en la escena se caía en `M.color(undefined)`
al lanzarlo desde el panel. Hoy no había ninguno en esa situación, pero CLAUDE.md dice
que ese caso se admite. Arreglado con una llamada a `resuelveEspectros(gr.p)`.

## Siguiente acción

Nada pendiente.
