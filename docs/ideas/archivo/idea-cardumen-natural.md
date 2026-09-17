# Idea: el cardumen, más natural y errático

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-17

**Enunciado original:** «peces - cardumen: tiende a formarse siempre en círculo, y
todavía con demasiada sincronia. mejoralo para que la formación sea más natural y
erratica y erronea, y cada pez haga lo que pueda para seguir al grupo, sin éxito
siempre.»

## De las dos mitades del enunciado, una era cierta y la otra no

**La sincronía, sí.** Medido con el banco aislado: **0,84** de alineación del grupo, o sea
cada pez a **diecisiete grados** del rumbo medio de sus vecinos. El banco se trasladaba
casi como una pieza.

**El círculo, no.** La elongación sale **1,89** —un banco claramente alargado—, así que
[idea-cardumen-desorden.md](idea-cardumen-desorden.md) tenía razón cuando declaró falsa esa
hipótesis, y no hacía falta corregirla.

> ⚠️ **Y aquí hubo un error propio que conviene no repetir.** La primera tanda de estas
> medidas dio 0,97 de alineación y **1,30** de elongación, y con eso se escribió —en el
> código y en este fichero— que el banco era un disco y que el fichero anterior se había
> equivocado. Estaba mal: el banco de pruebas bombeaba fotogramas con un `dt` de 1/20, que
> es el tope del motor, así que `vigila()` veía 50 ms por fotograma, decidía que la máquina
> no daba y llamaba a `degradar()` a los 90 fotogramas. Todo lo medido a partir de ahí
> corría con la población **recortada al 55 %** —37 peces en vez de 59— y un banco la mitad
> de denso sale más apretado y más redondo. Bombeando a 1/60 no degrada.
>
> **Al medir aquí: comprobar primero que `M.cardumen().length` es el que toca.**

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

Banco aislado, **población entera (59 peces)**, grupo mayor del plano de delante por enlace
simple a 2,2·`roce`, ventanas de 40 s y tres poblaciones nuevas por fila. «error» es el
ángulo medio entre el rumbo de un pez y el de sus vecinos, en radianes.

| | alin. | error | elong. | grupo mayor |
|---|---|---|---|---|
| como estaba | 0,84 | 0,29 | 1,89 | 21 |
| sólo cono ciego 1,9 | 0,88 | 0,27 | 1,74 | 18 |
| sólo `reacciona` [0,18-0,68] | 0,51 | 0,74 | 1,96 | 19 |
| **las dos (lo que se queda)** | **0,42** | **0,81** | **1,84** | **19** |

Tres cosas que leer:

1. **Lo que se arregló es la sincronía, no la forma.** La alineación cae a la mitad
   (0,84 → 0,42) y el error de seguimiento casi se triplica (17° → 46°). La elongación
   **no se mueve**: 1,89 antes, 1,84 después. El banco no era un disco y sigue sin serlo.
2. **`reacciona` es quien hace el trabajo**: por sí solo lleva la alineación de 0,84 a 0,51.
3. **El cono ciego a solas NO HACE NADA** —0,88 contra 0,84, dentro del ruido— pero sí
   baja de 0,51 a 0,42 **encima** de `reacciona`, y los rangos por tirada no se solapan
   ([0,53 0,46 0,53] contra [0,41 0,42 0,44]). Tiene explicación: con información al día y
   completa da igual perder a los de atrás, porque los de delante ya traen el acuerdo; con
   información vieja, el de atrás era un canal de corrección más. **Se queda por la medida,
   no porque suene bien** — si algún día deja de medirse, fuera.

El grupo mayor se queda en 19–21 peces en todas las filas: esto **desordena** el banco, no
lo deshace.

Coste: ninguno medible. El bucle sigue siendo todos contra todos —hace falta para la
separación— y el reparto por cono ciego se hace sin una sola raíz cuadrada, comparando
cosenos al cuadrado.

## Siguiente acción

Nada pendiente. Si alguien vuelve aquí, tres avisos de método, y los tres salieron de
equivocarse:

1. Medir **el grupo mayor**, no el plano entero, y con ventanas de 40 s o más.
2. Comprobar que la población **no está degradada** antes de creerse un número.
3. Bombear fotogramas con `dt` de 1/60, no de 1/20: con 1/20 se dispara `degradar()`.
