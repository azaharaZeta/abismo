# Idea: un solo convenio de escala, y el conteo en U

**Estado: PROPUESTA** · analizada el 2026-09-18 · sin tocar código
**Origen:** análisis de complejidad funcional del 2026-09-18 · **recomendación 4 de 12**
**Recoge el cabo que dejó** [idea-tamanos-movil](archivo/idea-tamanos-movil.md), que
lo dejó analizado y sin ejecutar «porque no es un problema mientras `escala` no se
toque». **`escala` se ha tocado** (26 → 18).
**Hermanas:** [idea-tamanos-vista](archivo/idea-tamanos-vista.md),
[idea-banco-cantidad-tamano-color](archivo/idea-banco-cantidad-tamano-color.md)

## Lo que se observó: hay dos convenios y ninguno está declarado como el convenio

| | tamaño | conteo | quién |
|---|---|---|---|
| **convenio U** | múltiplos de `M.U` | número suelto o por plano | pez linterna, medusa, rape, todos los eventos |
| **convenio píxel** | píxeles pelados | por área en px² (`{cada,min,max}`) | plancton, copépodo |

Cada uno es coherente por dentro. El problema es que conviven y **nada dice cuál usa
una especie nueva**. `escala` ya documenta la consecuencia como limitación en vez de
como defecto: «Lo que NO crece con él es el plancton y el copépodo».

## La evidencia, ya medida en la ficha vieja

| | área CSS | plancton | densidad por 1000 px² |
|---|---|---|---|
| escritorio 1000×698 | 698 k | 607 | 0,87 |
| iPhone de pie 359×750 | 269 k | 340 (tope `min`) | **1,26** |

El móvil va un 45 % más denso, y **lo sostiene el `min: 340`, no el reparto por área**.
O sea que el mecanismo `{cada, min, max}` no está haciendo su trabajo: en las dos
pantallas que importan el resultado lo decide una de las dos pinzas del `clamp`.

Lo mismo con las otras entradas que lo usan:

- medusa `por: [{cada:480000,…}, {cada:600000,…}, {cada:900000,…}]` → con áreas de
  0,27 a 1,0 M px el cociente va de 0,3 a 2,1, así que casi siempre sale el `min`.
- rape `por: [0, {cada:1400000, min:0, max:1}, 1]` → el del plano medio es 0 salvo en
  pantallas muy grandes.

Tres objetos `{cada,min,max}` cuyo resultado real es **una constante casi siempre**.

Y el banco ya lo resolvió al revés y está escrito en su comentario: «UN NÚMERO SUELTO
Y NO `{cada, min, max}`: el cuadro enseña siempre `escala`×`escala` U de mundo […] así
que el banco tiene que ser el mismo. Contándolo por área en píxeles salían 38 en un PC
y 15 en un iPhone SE —el mismo mar con la mitad de peces».

**Esa frase es la regla. Sólo se aplicó a una especie.**

## La propuesta

1. **Conteos absolutos** en todas partes: `total: 620` en vez de `{cada,min,max}`,
   repartido por `reparto` como ahora. `maxPx` ya acota el coste en pantalla grande,
   así que el conteo no tiene que acotarlo otra vez.
2. **Tamaños en U** también en plancton y copépodo (`radio: [0.007, 0.035]` en vez de
   `[0.28, 1.50]` px, y los `0.9*S` / `1.4*S` / `1.3*S` del copépodo).
3. Con eso, `cuenta()` desaparece y `porReparto`/`porPlano` se funden en una sola
   función; **el argumento `area` del contrato `conteo(area, plano, p)` deja de tener
   sentido** y el contrato se queda en `conteo(plano, p)`.

## Lo que se pierde, y hay que decidirlo antes

**En escritorio cambia la densidad de plancton.** Hoy un monitor grande saca más motas
que uno pequeño; con conteo absoluto saca las mismas, más gordas. Eso es exactamente
lo que promete `escala` —«el cuadro enseña siempre `escala`×`escala` U de mundo»— pero
**se va a ver**, y hay que elegir el número nuevo mirando, no calculándolo.

Punto de partida razonable: el valor de escritorio de hoy (~607 en 1000×698), que es
donde se ajustó la pieza.

**Y en móvil las motas salen ~1,7× más gordas en mundo.** Es lo correcto (un px CSS
mide 0,18 mm en un móvil y 0,265 en un monitor, y no se mira desde el doble de cerca)
pero es un cambio visible en la pantalla pequeña.

## El aviso de la ficha vieja, que ya se ha cumplido a medias

Decía: «subir U sin pasar el conteo a U² multiplica el área de cada bicho sin quitar
bichos, y el cuadro se llena». `escala` bajó de 26 a 18, o sea que **U subió un 44 % y
el área de cada cuerpo se dobló**, con los mismos conteos. Para el plancton no llegó a
morder —su radio también va en px, así que no creció— pero para el banco, las medusas
y el rape sí: hoy el cuadro lleva algo más del doble de superficie de cuerpo que a
`escala` 26, con la misma cuenta.

Puede estar bien —el commit se llamaba «escala más grande» y era la intención— pero
conviene saber que esa parte del aviso ya se ejecutó.

## Siguiente acción

1. Empezar por el **copépodo**, que son 12 bichos y cuatro números: es el ensayo
   barato del convenio.
2. Después el plancton, eligiendo el `total` mirando el escritorio, y comprobando el
   móvil con el emulador de viewport.
3. Sólo entonces colapsar `cuenta`/`porReparto`/`porPlano` y limpiar el contrato.

Saldo estimado: **−25 líneas**, un argumento menos en el contrato de especie y la
promesa de `escala` cumplida por todas las especies.
