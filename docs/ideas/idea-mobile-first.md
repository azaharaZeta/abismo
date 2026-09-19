# Idea: mobile first, y una sola pieza para las dos pantallas

**Estado: EN CURSO** — la política queda fijada y hay una primera
aplicación hecha; queda la auditoría de lo que aún no se lee en móvil.
**Empezada:** 2026-09-19

> Lo pedido, literal: «vamos a centrar la aplicación en mobile first,
> compatible también con escritorio. pero todas las optimizaciones de estilo
> gráfico, tamaños, etc, irán pensadas sobre todo para movil, y no serán
> diferentes para escritorio».

---

## Lo que ya estaba hecho, y conviene no deshacer

La pieza **ya** es una sola para las dos pantallas, y por construcción:

- `escala: 18` y `U = sqrt(W·H)/escala` hacen que el cuadro enseñe siempre
  324 U² de mar, sea cual sea el aparato.
- Toda medida de cuerpo va en U y ninguna en píxeles.
- Toda población es un número absoluto y ninguna va por área de pantalla.
- El marco no gira el cuadro: la pieza es la caja que dé la pantalla.

O sea que **no hay ni una rama por dispositivo, y la política pide que siga
sin haberla.** «Mobile first» aquí no significa añadir un camino para móvil:
significa **elegir en qué pantalla se juzgan los números**. La respuesta es
el móvil, y el escritorio hereda.

## Por qué el móvil es el caso duro, con la cuenta

Mismo bicho, dos cajas. **Medido en el navegador y no en el arnés**: el
lienzo va dentro del marco, así que es un 6 % más chico que la ventana y
tomarlo del arnés infla todas las cifras.

| | móvil (lienzo 359×750) | escritorio (lienzo 1416×830) |
|---|---|---|
| U | 28,8 px | 60,2 px |
| pez del banco · más chico | 33,1 px | 69,1 px |
| pez del banco · más grande | 73,1 px | 152,6 px |
| rape · esca (radio) | 10,3 px | 21,5 px |
| medusa · radio fondo | 6,3 px | 13,3 px |
| rape · diente | **6,2 px** | 12,9 px |
| rape · pupila | **4,5 px** | 9,4 px |
| fotóforo del pez más chico | **1,8 px** | 3,8 px |
| plancton · mota chica | **0,10 px** | 0,22 px |

El móvil da **2,09× menos píxeles** para lo mismo. Y encima el píxel mide
menos: 0,18 mm contra 0,265, o sea **0,68×**. Multiplicando, un mismo
elemento mide **3,0 veces menos en milímetros** en el móvil. La distancia de
lectura no lo compensa: un teléfono se mira a unos 30 cm y un monitor a
unos 60, así que queda un factor ~1,5 en contra del móvil.

**Esa diferencia es física y no se toca desde la escena** —ya lo dice el
comentario de `escala`—. Lo que sí se puede es poner el suelo donde el móvil
lo necesita, y dejar que el escritorio salga sobrado. Es exactamente lo que
hace `escala: 18`: se bajó desde 26 para subir el suelo del móvil hasta donde
ya estaba el monitor.

## La regla, en una línea

> Un número de la escena se ajusta mirando una caja de móvil de pie. Si en
> el monitor sale grande, es correcto. Nunca se bifurca por dispositivo.

Corolario: los cuatro avisos de distancia de `ABISMO.planos` —`scale`,
`resDiv`, `alpha`, `drift`— se multiplican por el tamaño base, así que **el
caso a vigilar siempre es «lo más pequeño del plano del fondo en un móvil»**,
que es donde caen las tres filas marcadas arriba.

## Hecho

- **Tamaños del banco** (2026-09-19, en dos pasadas). El pez más chico del
  fondo medía 13 px de largo en una caja de 359×750 y no se leía como pez:
  era una raya. Primero se subió sólo el extremo chico, `largo` de
  `[1.15, 1.92]` a `[1.55, 1.92]` —18 px—. **No bastó**, y la segunda pasada
  dio con el motivo:

  **`largo` NO PUEDE ARREGLARLO, y hay un techo que lo demuestra.** El tamaño
  en pantalla es `largo × scale` del plano, así que con el extremo grande
  fijo en 1,92 el pez del plano del fondo **no puede pasar de 22 px** ni
  aunque se igualen los dos extremos —o sea renunciando a toda la variedad—.
  Y el tamaño no era todo: ese plano va además a un tercio de resolución y al
  58 % de alfa, así que el bicho sale pálido y borroso además de pequeño.

  La salida fue **quitar al banco del plano del fondo** (`reparto` de
  `[0.24, 0.34, 0.42]` a `[0, 0.45, 0.55]`), que es exactamente lo que la
  escena ya hacía con el rape —`por: [0, 0, 1]`, «un rape lejano es una
  mancha sin dientes, barbilla ni ojo»—. El pez más chico pasa a ser el del
  plano de en medio: **33 px**, contra 73 del más grande, que no se tocó.

  **Y salió gratis lo contrario de lo que temía:** el cardumen se rehace POR
  PLANO, así que concentrar el banco en dos lo deja más junto, no más suelto.
  Medido, cuatro semillas: 1,59 vecinos dentro de `vista` contra 1,06 antes,
  y la alineación igual (0,540 contra 0,571).

  **Aviso sobre cómo medir la alineación en este banco:** hay que hacerlo POR
  PLANO. Agrupando los tres con `M.cardumen()` salen 0,36 con mucho ruido,
  porque son tres bancos independientes promediados como si fueran uno.

  **RESULTADO NEGATIVO de la primera pasada, y vale la pena guardarlo:** la regla de la escena
  dice que al crecer el bicho hay que subir `roce` CON él o el banco se
  solapa. **No es cierto aquí, y se midió.** Seis semillas de 100 s: agrandar
  el pez sube el apiñamiento en largos de cuerpo (vecinos a menos de 1,2
  largos, de 0,43 a 0,54), pero subir `roce` de 3,0 a 3,4 **no lo baja**
  (0,56, dentro del ruido) y afloja algo la alineación. El motivo es que
  `roce` y `atraccion` van **los dos en U**: lo que aprieta al banco es que
  varios peces convergen en la misma esca, y ahí manda la atracción. El
  apiñamiento EN U no cambió; sólo se ve más junto porque el bicho es mayor.
  `roce` se quedó en 3,0.

  Ojo al medir alineación en este banco: con 14 peces la dispersión entre
  semillas (±0,04) es del orden de las diferencias que se buscan. Hacen falta
  seis tiradas para decir algo.

## Pendiente: la auditoría

El banco ya está resuelto. Lo que queda, por orden de lo que peor se lee:

1. **La cara del rape: pupila 4,5 px, diente 6,2 px.** La escena dice que el
   rape va grande justamente porque «miómeros, cristalino, dientes y barbilla
   no existen por debajo de cierto tamaño». En móvil están en ese filo, y el
   rape es lo único que NO puede resolverse quitándolo de un plano: ya vive
   sólo en el de delante (`por: [0, 0, 1]`). O sube `largo`, o el detalle de
   la cara se declara de escritorio y se acepta que en móvil es una silueta.
2. **El fotóforo del pez más chico, 1,8 px.** Es la hilera del vientre, y es
   «lo único que se ve de lejos» según la propia escena. Mejoró solo al
   quitar el banco del fondo —era 1,0 px—, pero a 1,8 sigue siendo un punto y
   no una hilera. Mirar si a esa distancia lo que se lee es el halo.
3. **La mota chica del plancton, 0,10 px.** Se dibuja con un sprite, así que
   no desaparece —queda como un punto tenue—, pero por debajo del píxel el
   extremo bajo de `radio: [0.0060, 0.0323]` ya no aporta variedad: aporta
   ruido. Comprobar si el rango se puede estrechar sin perder textura. (Ojo:
   el plancton pone un suelo de 0,6 a `L.scale`, así que no escala como el
   resto.)
4. **Contraste, no tamaño:** con `agua.brillo` a 3 el techo pasa de
   [6,16,25] a [12,38,64], así que un bicho tenue tiene menos negro contra el
   que recortarse en la mitad de arriba. Eso pega justo a los puntos 2 y 3.
   Revisarlos **con el brillo nuevo puesto**, no con el viejo.
5. **¿Y la medusa y el copépodo?** Siguen en el plano del fondo, donde el
   banco ya no está. La medusa a 6,3 px de radio es una mancha luminosa, que
   para una medusa lejana puede estar bien —no tiene detalle que perder—.
   Decidirlo mirando, no por analogía con el pez.

## Siguiente acción

El punto 1: es el único que no tiene salida por composición, y el rape es
el bicho que sostiene el tema de la pieza.
