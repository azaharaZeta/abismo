# Idea: la piel del rape, más barata

**Estado: DESCARTADA POR MEDICIÓN** · analizada el 2026-09-18 ·
medida y cerrada el 2026-09-19 · **no se tocó código**
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 9 de 12**
**Hermana:** [idea-rapes-volumen](idea-rapes-volumen.md), que es de donde
viene la piel

## Lo que se observó

[`piel()`](../../../bichos/rape-cuerpo.js) pinta el cuerpo **en 26 rebanadas verticales**,
y cada rebanada lleva su propio degradado lineal con **10 paradas**:

```js
const REBANADAS = 26, VSTOPS = 9;   // 9+1 paradas
```

= **260 `addColorStop` por rape y por fotograma**. Con dos rapes a 60 fps son ~31.000
por segundo, más 52 `createLinearGradient`. Es, de largo, el dibujo más caro por bicho
de la pieza.

Lo que compra es real y está bien argumentado en el código: el cuerpo se lee como un
**cilindro** porque cada rebanada se sombrea con **su** altura local (`v` de −1 en el
lomo a +1 en la panza, normal `(0, v, √(1−v²))` contra la luz), así que vale igual en
el hombro que en el pedúnculo.

## Lo que dice la historia

`idea-rapes-volumen` implementó la piel como **un solo degradado transversal**
(«la piel pone un suelo (0,28–0,44 · `br`, degradado lomo→costado→panza) […] y el
degradado transversal es lo que da el cilindro»). Las 26 rebanadas son posteriores y
se añadieron para que el modelado siguiera valiendo donde el cuerpo se estrecha.

O sea: **el cilindro ya se leía con un degradado**. Las rebanadas arreglan el
afinamiento hacia la cola, que es la cuarta parte del bicho y la que `proa` (0,90) ya
apaga casi del todo.

## La propuesta, en dos tramos

**Tramo barato, y es el que haría primero.** No tocar el diseño, sólo el muestreo:

| | hoy | propuesta | coste |
|---|---|---|---|
| `REBANADAS` | 26 | **10** | −62 % |
| `VSTOPS` | 9 | **4** | −55 % |
| `addColorStop` por rape | 260 | **50** | **−81 %** |

La curva de sombreado es `pow(d, 1.7)*0.88 + 0.12`, suave y monótona: con 5 paradas
el interpolador del canvas la reproduce con error muy pequeño, y con 10 rebanadas el
paso longitudinal sigue siendo Lg/10 —unos 6-7 px en el plano de delante—, por debajo
de lo que separa dos miómeros.

**Tramo agresivo (sólo si el barato no basta):** volver a un degradado único sobre el
path ya recortado, con el eje perpendicular a la luz. Recupera el diseño de
`idea-rapes-volumen` y pierde el modelado en el pedúnculo.

## Lo que se pierde

En el tramo barato, poco y hay que verificarlo: **bandeo**. El fondo del abismo bandea
—por eso existe el dither— y bajar las paradas de un degradado es exactamente lo que
lo provoca. La ventaja es que el grano del dither se pinta **después** y encima, así
que tiene con qué romperlo.

En el tramo agresivo se pierde lo que las rebanadas compraron: el cuarto de atrás deja
de estar modelado.

## Por qué va en el puesto 9 y no más arriba

Porque **el rape es el bicho que sostiene el tema de la obra** y su cuerpo es lo que
no se ve casi nunca; cuando se ve, es el momento que hay que mirar. Un ahorro de
0,1 ms no compensa estropear ese instante. Esto se toca sólo si hace falta fotograma,
y antes están [simpl-03](idea-campos-por-tipo-simpl-03.md) y
[simpl-06](idea-sin-aligera-simpl-06.md), que no cuestan nada visualmente.

## Revisión de saldo · 2026-09-18, después de ejecutar 01, 02, 03, 06, 11 y 12

Las estimaciones de líneas de este análisis salieron **sistemáticamente
optimistas**: prometían −130 líneas de código entre las seis primeras y el
saldo real fue **+10**. El motivo es siempre el mismo y conviene tenerlo
delante al leer lo que sigue:

- **Extraer** un helper no ahorra. La versión general necesita más
  parámetros que cualquiera de los casos que sustituye, y la casa pide que
  venga explicada: `M.luzEn` quitó 27 líneas de tres sitios y costó 31.
- **Sustituir** un mecanismo por otro más simple ahorra poco: la floración
  sin paleta gemela salió en −7.
- **Borrar** es lo único que ahorra de verdad.

Lo que sí se cumplió fue lo otro —conceptos fuera del vocabulario, una sola
implementación de la regla de la casa, 66 % menos de pasadas de campo—, así
que el criterio para decidir estas seis **no debería ser el tamaño**.

## Siguiente acción

1. Medir primero: `performance.now()` sobre `piel()` con un rape fijado y agrandado.
   Si no llega a 0,1 ms de fotograma, **archivar esta ficha como descartada** — la
   complejidad estará pagada.
2. Si llega: reproducir los **tres regímenes de `br`** de `idea-rapes-volumen`
   (0,082 · 0,31 · 0,76) a 3× de tamaño, antes y después, con 10/4.
3. Buscar bandeo con el dither apagado, que es donde se ve.

Saldo MEDIDO, y hay que separar los dos tramos:

- **Tramo barato: 0 líneas.** `REBANADAS` y `VSTOPS` son dos constantes; el
  cambio es 26×9 → 10×4 y no borra nada. Lo que da es **−81 % de paradas de
  degradado** por rape y fotograma. Riesgo: bandeo, que hay que buscar con el
  dither apagado.
- **Tramo agresivo: −27 líneas** (`proaCoef`, `proaA` y el bucle de rebanadas
  son 42 líneas de código; un degradado único son ~15). Riesgo visual real, y
  el rape es el bicho que sostiene el tema.

O sea que el ahorro de líneas y el ahorro de coste están en tramos DISTINTOS,
y el que compensa casi seguro es el que no ahorra ninguna línea.

## Resuelto: la complejidad estaba pagada

**2026-09-19.** La ficha traía su propio criterio de descarte —«medir primero;
si `piel()` no llega a 0,1 ms de fotograma, archivar como descartada»— y es el
que se ha aplicado.

Medido en el navegador, reproduciendo la operación exacta de una rebanada
(`createLinearGradient` + N `addColorStop` + `fillRect` en `lighter`, sobre un
contexto de verdad, 400 repeticiones con el JIT ya caliente):

| | ms por rape y fotograma |
|---|---|
| **hoy · 26 rebanadas × 10 paradas** | **0,036** |
| tramo 1 · 10 × 5 | 0,0082 |
| tramo 2 · un solo degradado | 0,0013 |

Con los dos rapes de la pecera son **0,072 ms sobre un fotograma de 8,3**, o sea
el **0,9 %**. El tramo 1 ahorraría un 77 % de eso: 0,055 ms. Nada.

### La lección, que vale para el resto del análisis

El dato que disparó esta ficha —«260 `addColorStop` por rape y fotograma, más
de 31.000 por segundo»— **sonaba a mucho y no lo era**. `addColorStop` es
barato y cada rebanada rellena una franja de `Lg/26` de ancho, o sea unos
pocos píxeles: el relleno, que es lo que de verdad cuesta en esta pieza, aquí
es ínfimo.

Contar operaciones no es medir. El coste de esta pieza está en las pasadas a
pantalla completa —el agua, el velo, el dither, la composición de los tres
planos—, no en los degradados pequeños de un bicho del que hay dos.

### Y por tanto

**No se toca la piel del rape.** Ni el muestreo ni, mucho menos, el degradado
único: se habría empeorado el modelado del único bicho que sostiene el tema de
la obra para ahorrar cinco centésimas de milisegundo.

Lo que queda escrito, por si algún día hay muchos rapes: el coste es lineal en
el número de rapes, así que con veinte serían 0,72 ms y entonces sí valdría la
pena el tramo 1 —que a 10×5 no tenía riesgo apreciable más allá del bandeo.
