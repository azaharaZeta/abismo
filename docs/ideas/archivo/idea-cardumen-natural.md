# Idea: el cardumen, más natural y errático

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-17

**Enunciado original:** «peces - cardumen: tiende a formarse siempre en círculo, y
todavía con demasiada sincronia. mejoralo para que la formación sea más natural y
erratica y erronea, y cada pez haga lo que pueda para seguir al grupo, sin éxito
siempre.»

## Lo primero: el enunciado era CIERTO, y el fichero anterior se equivocaba

[idea-cardumen-desorden.md](idea-cardumen-desorden.md) declaró falsa la hipótesis del
círculo: «midiendo la elongación del banco salía 2,7–6,3. Los bancos ya eran
alargados». Medido otra vez, con el banco aislado y agrupando antes:

| | alineación del grupo | elongación |
|---|---|---|
| lo que había | **0,97** | **1,30** |

0,97 de alineación es que cada pez va a **tres grados** del rumbo medio de sus vecinos:
el banco se trasladaba como un sólido. Y 1,30 de elongación es un disco. O sea: círculo
y sincronía, las dos cosas, tal como se decía en el enunciado.

La discrepancia es de método, no de la pecera: aquella medida se tomó sobre *todos* los
peces de un plano —24 peces repartidos por la pantalla— y ésta sobre el grupo mayor por
enlace simple a 2,2·`roce` —12–14 peces—. No son la misma cantidad. **Lección: la fuente
de verdad es la medida de hoy, no la apuntada.**

## Por qué bajar pesos no podía funcionar

Lo que el fichero anterior sí dejó demostrado es que tocar `alinea`, `propio`, `junta`,
`aparta` y `roce` no se distingue del ruido. Tiene una explicación estructural: un banco
en el que cada pez ve a **todos** sus vecinos, **todo el rato** y **sin error**, converge.
Si A se alinea con B y B con A, los dos acaban en el mismo rumbo, y con qué fuerza lo
hagan sólo cambia lo que tarden. El desorden no sale de la ganancia; sale de romper la
reciprocidad y la simultaneidad.

## Lo que se hizo

Dos mecanismos, los dos de un pez de verdad, en `cardumen()` de `bichos.js` y con sus
mandos en `ABISMO.bichos.@pezlinterna.cardumen`:

- **`ciego: 1.9`** — cono ciego a la cola, unos 109°. Al de atrás no lo ve, así que la
  información viaja sólo hacia delante y la reciprocidad se rompe. La separación **sí**
  mira hacia atrás: un golpe se siente.
- **`reacciona: [0.18, 0.68]`** — segundos entre mirada y mirada, propios de cada pez y
  desfasados al nacer. Entre medias va con la idea de antes, o sea que corrige siempre
  hacia donde el grupo **estaba**. Esto es literalmente «hacer lo que puede sin
  conseguirlo». Esquivar no se posterga: la separación se aplica todos los fotogramas.

## Medición

Banco aislado, grupo mayor del plano de delante, ventanas de 40 s, tres poblaciones
nuevas por fila. «error» es el ángulo medio entre el rumbo de un pez y el de sus vecinos.

| | alin. | error | elong. | var. forma | grupo mayor |
|---|---|---|---|---|---|
| como estaba | 0,97 | 0,20 | 1,30 | 0,14 | 13 |
| sólo cono ciego 1,9 | 0,86 | 0,39 | 1,70 | 0,52 | 12 |
| + reacciona [0,08-0,30] | 0,79 | 0,48 | 1,56 | 0,56 | 12 |
| **+ reacciona [0,18-0,68]** | **0,63** | **0,70** | **1,88** | **0,58** | **12** |
| + reacciona [0,25-0,90] | 0,51 | 0,83 | 2,53 | 1,23 | 11 |

Monótono en los dos mandos y con el efecto muy por encima del ruido entre tiradas. El
grupo mayor se queda en 12–14 peces en todas las filas menos la última: **esto desordena
el banco, no lo deshace**. Se paró en [0,18-0,68] justamente por eso: a [0,25-0,90] la
alineación cae a 0,51 y el grupo empieza a perder peces.

Coste: ninguno medible. El bucle sigue siendo todos contra todos —hace falta para la
separación— y el reparto por cono ciego se hace sin una sola raíz cuadrada, comparando
cosenos al cuadrado.

## Siguiente acción

Nada pendiente. Si alguien vuelve aquí: medir **el grupo mayor**, no el plano entero, y
con ventanas de 40 s o más.
