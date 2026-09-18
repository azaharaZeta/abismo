# Idea: la gemación sin cupo ni apretón de manos

**Estado: PROPUESTA** · analizada el 2026-09-18 · sin tocar código
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 5 de 12**
**Hermana:** [idea-medusa-mitosis](archivo/idea-medusa-mitosis.md), que la implementó

## Lo que se observó

El evento `gemacion` resuelve «que geme UNA, y la más cercana» con un protocolo de dos
fotogramas montado sobre el `d` del campo:

```js
{ cupo: { quedan: 1, mejorR: 0, lista: false }, fot: 0 }
```

- fotograma 1: cada medusa que lee el campo **apunta su radio** en `mejorR` y no coge
  nada; el evento pone `lista = true`.
- fotograma 2: la que tenga `r >= mejorR` **descuenta `quedan`** y gema.
- el evento se muere al ver `quedan <= 0`.

Son ~12 líneas en [gemacion.js](../../eventos/gemacion.js), ~14 en
[medusa.js:314](../../bichos/medusa.js) y **unas 40 de comentario** entre los dos
explicando por qué hace falta el retardo. El motivo real está bien documentado y es
correcto: `pasoPlanos` recorre del fondo al frente, así que la primera que pregunta es
la más pequeña y borrosa de la pecera (medido: radio 0,43 U contra 1,16 la buena).

El problema no es el mecanismo, es que **se eligió el camino largo para mantener una
regla que el motor ya sabe romper de otra forma**: «el evento no sabe que hay
medusas». Pero el motor tiene `M.luces(plano)` y `M.cardumen(plano)` justo para que un
evento pueda LEER la escena sin preguntar por especies, y son la mitad del vocabulario
documentado en CLAUDE.md. La carroña ya usa el primero.

## La propuesta

El evento lee `M.luces()`, se queda con **la luz de mayor `rLuz`** —que es la medusa
más cercana, porque el radio lleva dentro la escala del plano— y pone un campo `gema`
**pequeño y centrado en ella**:

```js
arranca(M, p){
  let mejor = null;
  for (let i = 0; i < 3; i++)
    for (const o of M.luces(i))
      if (!mejor || o.rLuz > mejor.rLuz) mejor = o;
  return mejor ? { o: mejor } : null;      // sin nadie a quien pedírselo, no nace
},
actualiza(e, M, p){
  if (!e || !e.o) return false;
  M.campos.push({ tipo:'gema', x: e.o.x, y: e.o.y, r: e.o.rLuz*0.25,
                  fuerza: 1, filo: 1 });
  return false;                             // un solo fotograma y fuera
}
```

Y en la medusa, `if (M.campo('gema', j.x, j.y)) gemar(j, p);`

Desaparecen: `cupo`, `quedan`, `mejorR`, `lista`, `fot`, `espera`, el descuento en la
medusa y las 40 líneas de comentario que los justifican.

## Los dos agujeros, y cómo se tapan

**1 · La luz mayor no tiene por qué ser una medusa.** Un rape del plano de delante
puede tener `rLuz` mayor. Pero **sólo la medusa lee `gema`**, así que el peor caso es
que el campo caiga sobre un rape y no lo coja nadie: el evento se pierde ese ciclo.
Con 2-6 medusas y 1-2 rapes pasa poco, y si molesta, el radio del campo generoso
(`rLuz*0.6`) hace que alcance a la medusa que haya cerca.

Alternativa más limpia si el agujero molesta: que el motor ofrezca un lector por
bandera igual que ya hace con `luz`/`presa`/`cardumen`. Pero **eso es una bandera
nueva en el contrato de especie para un solo uso**, que es justo lo que este análisis
intenta quitar. No lo haría.

**2 · Dos medusas dentro del radio.** Con `r = rLuz*0.25` (un cuarto del alcance de
luz de la propia campana) tendrían que estar casi solapadas. Si ocurre, geman dos, y
eso no rompe nada: cada una lleva su `j.cria` por su cuenta. Hoy el cupo lo impide;
mañana lo impide la geometría, que es más barato de leer.

## Lo que se pierde

El «una y sólo una» pasa de estar **garantizado por construcción** a estar garantizado
por el radio. Es un debilitamiento real de la invariante, y es la razón por la que
esta ficha va en el puesto 5 y no en el 1.

## Siguiente acción

1. Lanzar `gemacion` desde el panel veinte veces seguidas y contar cuántas geman
   (hoy: exactamente 1) y de qué radio es la madre (hoy: 1,16 U).
2. Reproducir el mismo par de números con la versión corta.
3. Si el radio de la madre baja, subir el factor del radio del campo antes de
   descartar la idea.

Saldo estimado: **−30 líneas** de código y **−40 de comentario**.
