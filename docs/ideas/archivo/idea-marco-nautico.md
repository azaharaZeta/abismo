# Idea: el marco, el título y los dos botones

**Estado: IMPLEMENTADA** · **Empezada y terminada:** 2026-09-18

Junta dos entradas del índice, porque el segundo botón no tiene dónde vivir hasta
que existe el primero:

> «Dibujar un marco náutico fino y algo creep en el borde de la pantalla. En la zona
> inferior, incluir una región con un título bonito creepy "Abyss by Zeta". añadir
> en esa región inferior un boton de reiniciar, que reinicie la simulación con nuevo
> seed. Cuida que no se dibuje nada del abismo sobre el marco ni la botonera
> inferior.»

> «en mobile, meter que la pantalla se ajuste a horizontal al girar el movil,
> automáticamente si se puede hacer de forma limpia, o con un botón en la zona
> inferior.»

## La decisión: el marco es DOM, no lienzo

«Que no se dibuje nada del abismo sobre el marco» tiene dos soluciones, y una es
mucho mejor:

- **recortar en el lienzo**: el marco se pinta el último y el abismo se clipa a un
  rectángulo interior. Obliga a que TODAS las pasadas a pantalla completa —el agua,
  la ondulación, las sombras, los tres planos, el velo y el grano— se acuerden del
  recorte, y a que el dedo reste el desplazamiento. Una pasada que se olvide pinta
  encima del marco.
- **hacer el lienzo más pequeño**: el marco es CSS alrededor, el `<canvas>` ocupa
  sólo el hueco de dentro y `V.W`/`V.H` ya salen de `clientWidth`/`clientHeight`.
  El abismo **no puede** alcanzar el marco, y el motor no se entera de que existe.

Se ha hecho lo segundo. Coste: cero líneas de motor. A cambio, la chapa no comparte
el grano ni el velo con el agua —es metal delante del cristal, no parte de la
imagen—, que además es lo que se quiere.

## Lo que hay

`marco.css` monta tres cosas: la **chapa** (un degradado casi negro con filo de
1 px, una hilera de remaches por lado y cuatro escuadras en las esquinas), el **ojo
de buey** (el lienzo, hundido con una sombra interior) y la **franja**, en tres
columnas —vacía, título, botones— para que el título caiga en el centro de la
pantalla y no en el centro de lo que sobra. Por debajo de 560 px el título se va a
la izquierda: centrado no cabe con los dos botones, y uno que se descentra según el
ancho se lee como un fallo.

El título respira en 13 s y una vez por vuelta se le va un instante. Un parpadeo
regular es un letrero de neón; uno que falla es otra cosa.

`marco.js` son los dos botones y nada más.

## `reinicia()`, que sí es motor

«Nuevo seed» no es repoblar: hay tres cosas que sobreviven a un `setup(true)` porque
se sortean una sola vez, y sin tirarlas la pecera nueva sale igual que la vieja.

1. **Las paletas.** Se cachean en la propia entrada de escena la primera vez que se
   resuelve su espectro, y los halos y los puntos de luz se cachean dentro de cada
   color. Se tiran y se vuelven a sortear —pero **sólo las generadas**: una paleta
   escrita a mano en la escena es una decisión y se queda. De ahí la marca
   `pal.deEspectro` que pone `resuelveEspectros()`.
2. **Las manchas de la ondulación del agua**, que se guardan en fracciones de
   pantalla para sobrevivir a un redimensionado.
3. **Los relojes de los eventos.**

Y se reinicia la vigilancia del fotograma, o los primeros fotogramas tras el botón
—lentos, como los de cualquier arranque— cuentan como máquina lenta. Lo que **no**
se restaura es la calidad ya degradada: si la máquina demostró que no podía,
devolverle el detalle es volver a hacerle la misma pregunta.

## El giro en móvil: no se puede hacer automático

Bloquear la orientación exige pantalla completa, y pedir pantalla completa exige un
gesto del usuario. No hay forma limpia sin botón, así que botón. Y donde la API no
existe —iOS no tiene `screen.orientation.lock` ni pantalla completa de documento—
**el botón no se pinta**: uno que no hace nada es peor que no tenerlo. Se esconde
también en escritorio, donde `lock` existe pero rechaza y nadie ha pedido pantalla
completa.

Si el bloqueo falla con la pantalla completa ya puesta, no se deshace: es la mitad
de lo que el usuario acaba de pedir.

## Comprobado

En 1024×768 el lienzo queda en 1000×698 y en 375×812 el marco adelgaza a 8 px. El
botón de reiniciar devuelve otra pecera —otros colores, otra población, otros
relojes— sin recargar. En vertical con puntero grueso sale «girar»; en escritorio,
no.
