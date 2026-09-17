# Idea: Más desorden en los cardúmenes

**Estado: IMPLEMENTADA EN PARTE — con un resultado negativo que conviene no repetir**
· procesada y archivada el 2026-09-17
**Enunciado original:** «cardumen: meter algo más de desorden en los cardúmenes. los
peces van demasiado acompasados, siempre forma como circunferencia, la forma de los
cardúmenes debería fluir más, pero esto debería ser emergente, o si es más facil,
emulado basta.»

## Lo que la medición dijo que NO era

La primera hipótesis —«forman una circunferencia»— **es falsa**. Midiendo la elongación
del banco (raíz del cociente de autovalores de la covarianza de posiciones; 1 = disco),
salía 2,7–6,3 según el plano. Los bancos ya eran alargados.

Y la segunda hipótesis —que bajando `alinea` y `propio` se arregla— **no se pudo
sostener**. Tres tiradas emparejadas de 9 s:

| | alineación del grupo | elongación | variación de forma |
|---|---|---|---|
| valores originales (`alinea` 1,6 · `propio` 0,40 · `vista` 5,5) | 0,60 | 1,52 | 0,25 |
| candidato (`alinea` 0,85 · `propio` 0,80 · `vista` 4,6) | 0,65 | 1,38 | 0,25 |

Indistinguibles. **El suelo de ruido de estas métricas es ±0,2 entre tiradas**, y eso se
come el efecto. Por eso `alinea`, `propio`, `junta`, `aparta` y `roce` **se quedaron
como estaban**: no hay con qué defender tocarlos.

Un aviso de método: la elongación medida sobre *todos* los peces de un plano sólo
significa «la forma del banco» si hay UN banco. Al bajar `vista` a 3,6 los peces dejan
de agruparse y la métrica cae a ~1,3 no porque el banco se redondee, sino porque ya no
hay banco y lo que se mide es el reparto por la pecera. Hay que agrupar primero (enlace
simple a 2,2·`roce`) y medir el grupo mayor.

## Lo que sí era, y sí se arregló

**La dispersión de velocidad del banco era CERO.** Todos los peces nadaban exactamente
a `p.vel`, así que el grupo se trasladaba como un sólido: la forma que tuviera se
quedaba congelada, y no hay ruido de rumbo que arregle eso.

`desorden: 0.28` abre pez a pez tres números que antes eran idénticos para todos:

- `brio` — su velocidad de crucero (el susto no se escala: el pánico es igual para todos)
- `kAlinea` — cuánto caso le hace al rumbo del grupo
- `kJunta` — y cuánto a no quedarse solo

Desviación típica de la velocidad: **0 → 0,16 de la media**. Eso es aritmética, no
estadística: los peces ahora se adelantan entre sí, y la forma se deforma sola.

## Y el único parámetro con efecto resoluble

`vista`, la distancia a la que un pez mira a sus vecinos. Con 5,5 U cada pez veía a 12
de sus 15–27 vecinos: el banco entero llegaba a **un** acuerdo y viraba de una pieza.

| `vista` | alineación del grupo | tamaño del grupo mayor |
|---|---|---|
| 3,2 U | 0,41 | 24 |
| **4,2 U (elegido)** | **0,51** | **24** |
| 5,5 U | 0,70 | 25 |

Monótono en las dos tiradas, y la cohesión no se resiente. No se bajó a 3,2 porque ahí
empieza a no leerse como banco.

## Siguiente acción

Nada pendiente. Si alguien vuelve a esto: **medir con el banco aislado** (una sola
especie, sin rapes que lo rompan) y con ventanas de 30 s o más, o el ruido se vuelve a
comer el efecto.
