# Idea: la piel del rape, más barata

**Estado: PROPUESTA — RIESGO ESTÉTICO ALTO** · analizada el 2026-09-18 · sin tocar código
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 9 de 12**
**Hermana:** [idea-rapes-volumen](archivo/idea-rapes-volumen.md), que es de donde
viene la piel

## Lo que se observó

[`piel()`](../../bichos/rape-cuerpo.js) pinta el cuerpo **en 26 rebanadas verticales**,
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

## Siguiente acción

1. Medir primero: `performance.now()` sobre `piel()` con un rape fijado y agrandado.
   Si no llega a 0,1 ms de fotograma, **archivar esta ficha como descartada** — la
   complejidad estará pagada.
2. Si llega: reproducir los **tres regímenes de `br`** de `idea-rapes-volumen`
   (0,082 · 0,31 · 0,76) a 3× de tamaño, antes y después, con 10/4.
3. Buscar bandeo con el dither apagado, que es donde se ve.

Saldo estimado: **−25 líneas**, −81 % de paradas de degradado, y riesgo visual real.
