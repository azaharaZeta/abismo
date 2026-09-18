# Idea: el plancton al fondo y que todo lo tape

**Estado: DESCARTADA** · analizada y archivada el 2026-09-18 · **no se tocó código**
**Enunciado original:** «¿es posible hacer que el plancton esté al fondo y todos los
organismos y eventos lo tapen?»

## Son dos peticiones, no una

- **El plano** sólo cambia el ASPECTO: tamaño (`scale`), borrosidad (`resDiv`), alfa
  y deriva. No tapa nada —los tres planos se suman y sumar es conmutativo—, así que
  el orden de `ABISMO.bichos` no pinta un píxel distinto.
- **Tapar es sólo el mecanismo de campos**: alguien empuja `tapa`/`apaga` y el otro
  pregunta `silencio()`. Es el único camino que hay en aditivo.

La primera mitad es una línea (`reparto: [1, 0, 0]` en la entrada del plancton). La
segunda es la que tumba la idea.

## Quién tapa hoy

| | empuja | tapa bichos | oscurece el agua |
|---|---|---|---|
| rape | `tapa` ×2 elipses | sí | no |
| carroña | `tapa` | sí | no |
| leviatán | `apaga` | sí, en los tres planos | sí |
| cuerpo | `apaga` | sí, en los tres planos | sí |
| pez linterna, medusa, copépodo | **nada** | no | no |

## Por qué se descarta: el coste

`M.campo()` recorre TODO el array de campos y filtra por tipo dentro del bucle, así
que añadir campos de cualquier tipo encarece TODAS las consultas. El plancton hace
**tres por mota y fotograma** (`enciende`, `apaga`, `tapa`) y hay unas 600 motas.
Medido en la pieza a 1000×698:

| escena | campos vivos | µs/consulta | coste del plancton |
|---|---|---|---|
| hoy, en reposo | 2 | 0,115 | **0,21 ms** |
| +1 campo por medusa | 8 | ~0,28 | 0,5 ms |
| +1 por pez, medusa y copépodo | 58 | 1,67 | **3,0 ms** |
| lo anterior + un `cuerpo` vivo | 185 | 5,05 | **9,2 ms** |

El presupuesto es 16,7 ms y la pieza ya gasta unos 4. La última fila no significa «va
lento»: `vigila()` llamaría a `degradar()`, que **no tiene vuelta atrás**, y la sesión
se quedaría con la población recortada y sin dither. Lo mismo que ya está apuntado en
el índice (la rejilla para `M.campo`) y medido por su lado en el comentario de
`cuerpo.js`.

## Y el peaje estético de la mitad barata

El plano 0 va a **1/3 de resolución**, **alfa 0,58** y radio ×0,6 contra el ×1,32 del
plano de delante. Mandar toda la nieve ahí la deja borrosa y pequeña, y se lleva por
delante las motas nítidas de cerca —que son justo donde se lee el dedo, porque el
fogonazo del gesto se ve sobre ellas.

## Lo que haría falta, si alguna vez se retoma

1. **Máscara de oclusión a baja resolución**: una vez por fotograma se pintan las
   elipses de los ocluyentes en un lienzo a 1/8 y cada mota consulta UN píxel —O(1),
   sin recorrer nada—, que es el mismo camino que ya usan el agua, el velo y el
   grano. Coste fijo e independiente de cuántos cuerpos haya. Es la única versión que
   escala.
2. **Trocear `campos` por tipo** (un mapa tipo→lista) si se prefiere seguir con
   campos: mucho más barato de escribir que una rejilla y quita el efecto cruzado de
   que 56 elipses de cuerpo encarezcan las consultas de `enciende`.
3. **Un campo que sólo lea el plancton** (`tapaFondo`): es lo que resuelve la
   autoexclusión —ver abajo— sin romper el anonimato de la casa.

Descartados de entrada: el orden de pintado (en aditivo no existe) y **un cuarto
plano al fondo**, que obliga a renumerar 10 referencias `plano:` de la escena y de
los `def.prueba` y a alargar 5 arrays de reparto, con fallo silencioso si se olvida
una.

## Cuatro costuras que quedan dichas, y existen sin esta idea

Salieron del análisis y no dependen de que se haga o no:

1. **Dos canales con dos reglas.** `silencio()` consulta `apaga` SIN guarda de
   profundidad y `tapa` CON ella, pero los campos `apaga` del leviatán y del cuerpo
   sí llevan `plano`: el dato dice una cosa y el lector se la salta, así que un
   leviatán del fondo calla a un pez del plano de delante.
2. **`pintaSombras()` sólo mira `apaga`**: el rape y la carroña tapan bichos pero no
   oscurecen el agua. «Ocluir» significa distinto según quién ocluya.
3. **La autoexclusión del rape es posicional y no por identidad**: llama a
   `silencio()` sin `L`, o sea que ignora todos los `tapa` y no sólo el suyo.
   Funciona porque hoy es el único cuerpo que empuja uno; el día que los peces
   empujen `tapa`, cada pez se callará a sí mismo, porque ellos sí pasan `L`.
4. **Cuatro sitios deciden quién tapa a quién**: `silencio(…, L)`, `silencio(…)` sin
   `L`, `M.campo('apaga', …)` a pelo en el borde del cuerpo, y `pintaSombras()`
   leyendo `campos` directamente.
