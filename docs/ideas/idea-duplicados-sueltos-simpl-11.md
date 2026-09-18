# Idea: cuatro duplicados sueltos

**Estado: PROPUESTA** · analizada el 2026-09-18 · sin tocar código
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 11 de 12**

Cuatro casos pequeños de «lo mismo escrito dos veces». Van juntos en una ficha porque
ninguno merece la suya: son de una sentada y no hay nada que decidir. Los grandes
—«cuánta luz me llega» y «una cadena de elipses a lo largo de un eje»— están en
[simpl-02](idea-luz-recibida-unica-simpl-02.md).

## 1 · La pasada extra cuando el alfa pasa de 1

**Literalmente el mismo bloque y el mismo comentario en dos sitios**, los dos en
[motor/agua.js](../../motor/agua.js):

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

[carrona.js](../../eventos/carrona.js) y [cuerpo.js](../../eventos/cuerpo.js) bajan
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
| rape | `f.gx += (f.dir - f.gx) * min(1, p.velGiro*dt)` | `0.06` | [rape.js:234](../../bichos/rape.js) |
| pez linterna | `z.gx += (lado - z.gx) * min(1, p.volteo*dt)` | `0.08` | [pezlinterna.js:376](../../bichos/pezlinterna.js) |

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
