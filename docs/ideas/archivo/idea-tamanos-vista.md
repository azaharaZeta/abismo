# Idea: los tamaños no pueden depender de la vista

**Estado: EN CURSO** · **Empezada:** 2026-09-18

> «los tamaños relativos de distintos sprites y eventos son distintos en mobile
> (vertical) que en pc. Veo por ejemplo que los leviatanes son estrechos, y que los
> cuerpos cayendo son enormes. […] los elementos del mundo tienen que ser
> independientes del tamaño de la vista del navegador.»

## El diagnóstico

La pieza ya tiene su unidad de mundo: `V.U = sqrt(W·H)/escala`. La media
geométrica es **neutra al formato**: da lo mismo el alto que el ancho, así que dos
pantallas con la misma área dan la misma U aunque una sea vertical y la otra
apaisada. Casi todo mide en U —el rape en largos, la medusa en radios, todas las
velocidades— y por eso casi todo se traslada bien de una pantalla a otra.

Lo que falla son **siete parámetros que se saltan la unidad** y miden contra `M.W`
o contra `M.H` sueltos. Ahí es donde entra el formato: en apaisado `W > H` y en
vertical al revés, así que lo que mide contra el ancho encoge al girar el móvil y
lo que mide contra el alto crece.

| dónde | qué | contra |
|---|---|---|
| `leviatan` | `largo` | `M.W` |
| `leviatan` | `grosor`, `onda` | `M.H` |
| `visitante` | `largo` | `M.W` |
| `visitante` | `onda` | `M.H` |
| `carrona` | `largo` | `max(W,H)` |
| `cuerpo` | `alto` | `M.H` |
| `superpez` | `largo`, `largoMin` | `M.W` |
| `glitch` | `radio` | `min(W,H)` |

Y dos más del mismo vicio por otro camino: `glitch.paso` y `glitch.sep` van en
**píxeles pelados**, así que tampoco crecen con la escena.

Las dos quejas del encargo salen exactas de la tabla:

- **el leviatán** mide de largo contra el ancho y de grueso contra el alto, o sea
  que su esbeltez **es** el formato de la pantalla. A 16:9 sale 7:1; en un móvil
  vertical (390×844) sale 1,9:1. No es que esté estrecho: es que es otro bicho.
- **el cuerpo** mide contra el alto. En 1920×1080 su `alto` de 0,34 son 367 px con
  una U de 55, o sea 6,6 U. En 390×844 son 287 px con una U de 22, o sea 13 U: el
  doble de grande respecto a todo lo demás.

Lo que NO es el fallo, y por eso no se toca:

- **las posiciones** en fracción de pantalla (`rnd(0,M.W)`, `banda`, el sitio donde
  nace un cuerpo). Repartir por el encuadre es lo correcto: el encuadre es lo que
  hay.
- **`contagio.alcance`**, que va contra la diagonal. La diagonal en U vale 39,8 a
  16:9 y 42,1 en un móvil vertical —un 6 %—, porque `hypot` es casi tan neutra al
  formato como la media geométrica. Además es una onda que cruza la escena entera,
  no un cuerpo.
- **`borde.margen`**, que va contra `min(W,H)`. No es un tamaño de mundo: es a qué
  distancia del canto del ENCUADRE empieza a empujar hacia dentro.
- **`escQueCabe`** (forma.js), que cuenta cuánta silueta cae dentro de `M.W`/`M.H`.
  Eso es exactamente su trabajo.

## Lo que NO se hace: tocar la U

«Independiente de la vista» del todo sería una U constante, y eso no se puede: en
una pantalla pequeña la pieza se quedaría sin sitio y en una grande sería un
mosaico de motas. La U tiene que seguir saliendo del área —es el zoom— y lo que
tiene que ser independiente de la vista es **la proporción entre las cosas**, que
es lo que rompe medir contra un eje.

## La conversión

Pasar de una fracción de eje a un múltiplo de U, manteniendo lo que hoy se ve en
apaisado. Con `escala` a 26 y un formato de referencia de 16:9:

```
k·W  →  k · escala · sqrt(16/9)  =  k · 34,67  U
k·H  →  k · escala / sqrt(16/9)  =  k · 19,50  U
```

Los valores de la escena se sustituyen por su equivalente en U, así que **en un
monitor apaisado no cambia un píxel** y en vertical dejan de deformarse. Los
`prueba` de cada evento van con los suyos, por lo mismo.

## Lo que cambia en vertical

Esto SÍ se ve, y es el objetivo:

- el leviatán pasa a medir 27 U, o sea más de una pantalla de largo en un móvil
  vertical. Es lo que es: cinco veces más largo que ancho y enorme.
- el cuerpo pasa de 13 U a 6,6: la mitad de lo que ocupaba.
- la carroña y el visitante encogen; el superpez encoge y `escQueCabe` le deja
  sitio.

## Hecho

**Estado: IMPLEMENTADA** · 2026-09-18

Los siete parámetros pasan a U y los dos de `glitch` se multiplican por `M.U` al
empujar el campo, así que la escena los declara también en U. Los `prueba` de cada
evento van convertidos con los mismos factores.

Comprobado en el navegador, sin errores de consola y con los siete eventos vivos a
la vez:

| | 1024×768 (4:3) | 375×812 (vertical) |
|---|---|---|
| U | 34,1 | 21,2 |
| leviatán, en anchos de pantalla | 0,90 | 1,53 |
| esbeltez del leviatán | 5:1 | 5:1 |
| cuerpo, en altos de pantalla | 0,29 | 0,17 |

La esbeltez ya no depende de la pantalla, que era el fallo. Que el leviatán ocupe
más de una pantalla de largo en vertical es lo correcto: es el mismo animal visto
por una ventana más estrecha.

## Lo que deja pendiente

Nada que analizar. Si algún día se añade un tamaño nuevo, la regla está escrita en
el comentario de `escala`, en la escena.
