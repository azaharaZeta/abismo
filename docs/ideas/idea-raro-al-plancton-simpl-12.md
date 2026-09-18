# Idea: `M.raro` es un parámetro del plancton, no un concepto del motor

**Estado: PROPUESTA** · analizada el 2026-09-18 · sin tocar código
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 12 de 12**
**Hermana:** [idea-espectro-color](archivo/idea-espectro-color.md), donde `raro` se
definió como «la excepción, y una excepción no se sortea»

## Lo que se observó

`raro` es un concepto de primer nivel del motor y de la escena:

| | |
|---|---|
| [escena.js:26](../../escena.js) | `raro: ROJO` en la raíz de `ABISMO`, con 4 líneas de comentario |
| [api.js:62](../../motor/api.js) | `get raro(){ return ABISMO.raro; }` en la API pública |
| [registro.js:35](../../motor/registro.js) | documentado en el contrato de especie (`M.raro`) |
| CLAUDE.md | tiene su propio párrafo en la sección de Color |

**Y tiene exactamente un consumidor**, con su propia probabilidad:

```js
// bichos/plancton.js:17
const c = (M.raro && Math.random() < p.raro) ? M.raro : M.color(p.paleta);
```

O sea: un concepto global, un accesor de motor, una entrada en el contrato de especie
y un párrafo de documentación para **una línea de una especie**. El propio comentario
de la escena lo admite: «No hay reparto automático. Hoy sólo lo usa el plancton».

En la pieza hermana (`medusas`) sí lo usaba otra especie; aquí no.

## La propuesta

El color excepcional baja a la entrada del plancton, al lado de la probabilidad que
ya vive ahí:

```js
{ especie: 'plancton',
  …
  raro: 0.02, colorRaro: ROJO,     // la ascua: una de cada cincuenta
  … }
```

y en la especie, `const c = (p.colorRaro && Math.random() < p.raro) ? p.colorRaro : M.color(p.paleta)`.

Se van: `ABISMO.raro`, `M.raro`, su línea del contrato de especie y su párrafo de
CLAUDE.md. La constante `ROJO` se queda donde está, arriba con las demás.

## Lo que se pierde

La idea de «la pecera tiene un color excepcional que cualquiera puede coger». Es una
idea bonita y por eso esto va el último: **si mañana el copépodo o el banco quieren
ascuas, devolverla cuesta lo mismo que quitarla.** El criterio que aplicaría es el que
la casa ya usa para `tScale` (ver [simpl-07](idea-planos-menos-mandos-simpl-07.md)):
un mando de escena con un solo consumidor pertenece a ese consumidor.

## Nota: esto NO se aplica a `M.cardumen()`

`M.cardumen()` también tiene hoy cero consumidores —se añadió para el superpez, que se
demolió— y aun así se conservó a propósito: es **la mitad del vocabulario de lectura
de un evento** (la otra es `M.luces()`), está documentado como tal en CLAUDE.md y es
lo que permite que exista un evento que le pase algo al banco sin saber de especies.
Eso es infraestructura del diseño; `raro` es un color.

## Siguiente acción

De una sentada, junto con [simpl-11](idea-duplicados-sueltos-simpl-11.md). Comprobar
que las ascuas siguen saliendo: repoblar desde el panel y contar motas rojas
(esperadas ≈ 2 % de ~600).

Saldo estimado: **−6 líneas** y un concepto menos en el vocabulario del motor.
