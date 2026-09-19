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

Mismo bicho, dos cajas (semilla fija, medido):

| | móvil 375×812 | escritorio 1440×900 |
|---|---|---|
| U | 30,7 px | 63,3 px |
| pez del banco · fondo | 19 px | 39,2 px |
| pez del banco · frente | 77,7 px | 160,3 px |
| rape · esca (radio) | 10,9 px | 22,5 px |
| rape · pupila | **4,8 px** | 9,9 px |
| rape · diente | **6,6 px** | 13,5 px |
| medusa · radio fondo | 6,7 px | 13,9 px |
| fotóforo del pez · fondo | **1,0 px** | 2,2 px |
| plancton · mota chica | **0,1 px** | 0,2 px |

El móvil da **2,06× menos píxeles** para lo mismo. Y encima el píxel mide
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

- **Tamaños del banco** (2026-09-19). El pez más chico del fondo medía 13 px
  de largo en una caja de 359×750 y no se leía como pez: era una raya.
  `largo` pasó de `[1.15, 1.92]` a `[1.55, 1.92]` —18-19 px—, tocando sólo el
  extremo chico, que es lo que se pidió. Se paga variedad: la razón entre el
  más grande del frente y el más chico del fondo baja de 5,5 a 4,1.

  **RESULTADO NEGATIVO, y vale la pena guardarlo:** la regla de la escena
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

Por orden de lo que peor se lee en móvil:

1. **El fotóforo del pez del fondo, 1,0 px.** Es la hilera del vientre, y es
   «lo único que se ve de lejos» según la propia escena. A 1 px no es una
   hilera: es un punto. Mirar si `fotoforos: [6, 10]` tiene sentido en el
   plano del fondo o si ahí manda el halo.
2. **La cara del rape: pupila 4,8 px, diente 6,6 px.** La escena dice que el
   rape va grande justamente porque «miómeros, cristalino, dientes y barbilla
   no existen por debajo de cierto tamaño». En móvil están en ese filo.
   Medir si `dientes: [10, 15]` se resuelve o es un peine gris.
3. **La mota chica del plancton, 0,1 px.** Se dibuja con un sprite, así que
   no desaparece —queda como un punto tenue—, pero por debajo del píxel el
   extremo bajo de `radio: [0.0060, 0.0323]` ya no aporta variedad: aporta
   ruido. Comprobar si el rango se puede estrechar sin perder textura.
4. **Contraste, no tamaño:** con `agua.brillo` a 3 el techo pasa de
   [6,16,25] a [12,38,64], así que un bicho tenue del fondo tiene menos
   negro contra el que recortarse en la mitad de arriba. Eso pega justo a los
   puntos 1 y 3. Revisarlos **con el brillo nuevo puesto**, no con el viejo.

## Siguiente acción

El punto 1, que es el que la propia escena declara crítico («la hilera del
vientre es lo único que se ve de lejos») y el que peor sale en la tabla.
