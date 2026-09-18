# Idea: cuatro duplicados sueltos (dos lo eran)

**Estado: IMPLEMENTADA PARCIALMENTE** · analizada y ejecutada el 2026-09-18
**Resumen:** dos dedup hechas, una sustituida por otra mejor, una descartada al medirla
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 11 de 12**

Cuatro casos pequeños de «lo mismo escrito dos veces». Van juntos en una ficha porque
ninguno merece la suya: son de una sentada y no hay nada que decidir. Los grandes
—«cuánta luz me llega» y «una cadena de elipses a lo largo de un eje»— están en
[simpl-02](../idea-luz-recibida-unica-simpl-02.md).

## 1 · La pasada extra cuando el alfa pasa de 1

**Literalmente el mismo bloque y el mismo comentario en dos sitios**, los dos en
[motor/agua.js](../../../motor/agua.js):

| | |
|---|---|
| `pintaAgua()` líneas ~196-206 | para `MOD.agua · agua.brillo` |
| `pintaDispersion()` líneas ~266-272 | para `dispersion.fuerza` |

```js
let resto = Math.min(3, X);
while (resto > 0.002){
  V.ctx.globalAlpha = Math.min(1, resto);
  V.ctx.drawImage(FUENTE, 0, 0, V.W, V.H);
  resto -= 1;
}
```

Hasta el comentario está duplicado: «El tope de 3 pasadas es por si alguien escribe
un 40». → `function sumaVeces(img, fuerza)` en `agua.js`. **−8 líneas.**

## 2 · «Cae girando y derivando»

[carrona.js](../../../eventos/carrona.js) y [cuerpo.js](../../../eventos/cuerpo.js) bajan
por el cuadro con el mismo código y **los mismos nombres de parámetro** (`vel`, `ang`,
`giro`/`vGiro`, `deriva`, `fase`):

```js
e.y += e.vel * dt;
e.ang += e.vGiro * dt;
e.x += Math.sin(M.t*K + e.fase) * opt(p.deriva, 0) * M.U * dt;
if (e.y - e.Lg > M.H) return false;          // salió por abajo
```

Sólo difieren en la constante del seno (0,13 contra 0,11) y en el margen de salida.
→ `hunde(e, M, p, dt)` en un `eventos/comun.js` o en `bichos/comun.js`
—la carroña ya importa de ahí—. **−15 líneas**, y el día que se quiera que un cuerpo
suba en vez de bajar hay un solo sitio.

## 3 · El espejo que tarda en girar

Mismo mecanismo en dos bichos, con constantes distintas y sin motivo:

| | lerp | suelo | dónde |
|---|---|---|---|
| rape | `f.gx += (f.dir - f.gx) * min(1, p.velGiro*dt)` | `0.06` | [rape.js:234](../../../bichos/rape.js) |
| pez linterna | `z.gx += (lado - z.gx) * min(1, p.volteo*dt)` | `0.08` | [pezlinterna.js:376](../../../bichos/pezlinterna.js) |

Los dos con el mismo comentario en dos versiones («de perfil puro el pez no existe,
pero el trazado no puede degenerar»). → `voltea(o, objetivo, vel, dt)` y `gxSano(gx)`
en `bichos/comun.js`. **−10 líneas** y una constante en vez de dos.

## 4 · «Cada N segundos, otra idea»

El patrón `x -= dt; if (x <= 0){ …; x = rango(p.cada) }` aparece **ocho veces**:

| dónde | qué |
|---|---|
| rape | `proxBrillo` / `parpadeo` |
| rape | `espera` / `acecho` |
| rape | `angProx` / `cadaInclina` |
| rape | `giroProx` / `giro` |
| pez linterna | `prox` / `rumbo` |
| pez linterna | `proxNerv` / `cadaNervio` |
| pez linterna | `proxMira` / `reacciona` |
| copépodo | `espera` |

No todos son iguales —algunos rearman con otro rango, otros tienen guardas
(`giroProx` sólo dispara si `|vx| < U*0.15`)— así que **no todos se pueden colapsar**.
Los cinco limpios sí:

```js
const toca = (o, k, dt, r) => (o[k] -= dt) <= 0 ? (o[k] = M.rango(r), true) : false;
```

**−12 líneas** y, sobre todo, un sitio donde acordarse de que la primera vez hay que
sortear dentro del rango (`rnd(0, rango(p.espera))`), que es un fallo que ya se ha
cometido dos veces en esta pieza y está comentado en los dos sitios.

## Riesgo

Nulo en los cuatro. Ninguno cambia un píxel; el 3 uniforma dos constantes (0,06 y
0,08) y hay que elegir una —0,07 o la que se vea mejor con el rape, que es el bicho
grande.

## Siguiente acción

Los cuatro de una sentada, con el panel abierto y los eventos lanzados a mano. El 4
sólo en los cinco sitios limpios; los tres con guarda se quedan.

Saldo estimado: **−45 líneas** y cuatro parejas de comentarios gemelos que se quedan
en uno.


## Hecho

**Estado: IMPLEMENTADA PARCIALMENTE (2 de 4, y una sustituida)** · 2026-09-18

Dos de los cuatro salieron como estaban escritos, uno se cambió por algo
mejor y **uno no se hizo porque al medirlo alargaba el código**. Lo que
sigue es lo que pasó con cada uno.

### 1 · `sumaVeces` — HECHO

`motor/agua.js` gana `sumaVeces(img, fuerza)` y los dos bloques idénticos
—el de `pintaAgua` y el de `pintaDispersion`— pasan a una llamada. Con ellos
se va la copia del comentario. **−7 líneas de código.**

### 2 · «cae girando y derivando» — NO SE HACE, Y ÉSTE ES EL MOTIVO

Al escribir el helper salieron las cuentas en contra:

| | |
|---|---|
| lo que ahorra en la carroña | 4 líneas → 1 |
| lo que ahorra en el cuerpo | 4 líneas → 1 |
| lo que cuesta el helper, con su comentario | +11 |
| **neto** | **+5 líneas** |

Y además obliga a renombrar campos en los dos eventos —la carroña llama
`fase` a la fase de deriva y el cuerpo la llama `deriva`, que encima choca
con `p.deriva`, que es la amplitud—, y a meter una dependencia nueva de
`eventos/` hacia `bichos/comun.js`.

El argumento de «un solo sitio donde cambiarlo» tampoco se sostiene al
mirarlo de cerca: **los dos cuerpos caen distinto a propósito** (seno a 0,13
contra 0,11, margen de salida por `Lg` contra `h*0.6`, y alturas de aparición
distintas), así que un cambio en uno no querría propagarse al otro. Cuatro
líneas parecidas en dos sitios no son una duplicación: son dos cosas que se
parecen.

### 3 · `gxSano` — HECHO

En `bichos/comun.js`, con el suelo como argumento: el rape sigue con 0,06 y
el pez linterna con 0,08. **Unificar la constante habría cambiado píxeles**,
y este bloque era justo el que no podía cambiar ninguno; si algún día se
unifica, que sea mirando.

### 4 · `toca()` — SUSTITUIDO POR `hacia()`

El helper de temporizadores **no se hizo, y hay que dejarlo escrito**: de los
ocho sitios sólo dos rearman el reloj como PRIMERA sentencia del bloque. En
los otros seis el rearme va después de consumir otro `rango()`, así que
meterlo en un `toca()` **invierte el orden de dos llamadas a `Math.random`**.
No cambia el comportamiento estadístico, pero cambia la tirada, no gana nada
y rompe la verificación por semilla. Tres más tienen guardas que un booleano
no puede expresar (`giroProx` sólo rearma si `|vx| < U*0,15`). Ahorro real:
cuatro líneas. No compensa.

En su sitio se hizo **`hacia(v, obj, k, dt)`**, que es el mismo vicio pero
de verdad: `v + (obj - v)*Math.min(1, k*dt)` estaba copiado a mano en **diez
sitios** (rape ×4, pez linterna ×4, rape-caza ×2). Es bit-idéntico —la misma
expresión, el mismo orden— y le pone nombre a lo que el clamp a 1 está
haciendo, que es impedir que un fotograma largo pase de largo el objetivo y
oscile. Ése es el fallo que no se ve hasta que la pestaña vuelve de segundo
plano.

### Verificado

Las cinco tiradas sembradas, **bit-idénticas**.
