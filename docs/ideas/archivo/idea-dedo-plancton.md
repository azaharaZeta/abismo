# Idea: el dedo deja de dibujar y pasa a encender

**Estado: IMPLEMENTADA** · **Empezada y terminada:** 2026-09-18

> «tocar con el dedo: quitar las ondas que genera, ya no las quiero. quitar que
> asuste a los rapes. hacer que el placton cercano crezca y se ilumine
> momentaneamente, lanzando ondas de iluminación de placton»

## Lo que era y lo que es

Era: cada contacto pintaba un anillo de crestas con un degradado radial de 40
paradas, con su color, su tinte y su óvalo. El dedo **se veía a sí mismo**, que es
la única cosa de la pieza que se saltaba la regla de la casa —nadie está iluminado
por la escena.

Es: el contacto suelta una **onda que no se dibuja**, y lo que se ve del gesto es
el plancton. Dos mitades, y `M.luzDedo(x,y)` devuelve la mayor de las dos:

- **el fogonazo**, un disco de 2,6 U bajo el dedo que se apaga en medio segundo:
  la respuesta inmediata al toque;
- **el frente**, que se abre hasta 7 U y va prendiendo lo que cruza: la onda de
  iluminación, hecha de motas y no de pintura.

La mota que lo recibe hace las dos cosas que se piden: se enciende con su color
propio (`enciendeDedo`) y se **hincha** (`creceDedo`), en el halo y en el punto a
la vez. La hinchazón se apaga en 0,4 s —`apagaDedo`—, más deprisa que el brillo,
así que lo que queda es un destello y no una mota gorda.

## Tres decisiones que no estaban en el encargo

1. **El empuje se queda, pero flojo en el plancton.** El frente sigue apartando a
   medusas y banco, que es lo que hace que la onda se note viajando. Lo que no
   podía quedarse era `fuerzaDedo: 4` en el plancton: el toque ahuecaba la nieve
   marina justo donde acababa de encenderla, o sea que el gesto se borraba solo.
   A 1,2 la mota se aparta un poco y se queda.
2. **El alcance sube de 3,4 U a 7.** La nieve marina es rala —unas 680 motas en
   toda la pecera—, así que un frente corto cruzaba una docena y no se leía como
   onda. A 7 U el toque enciende unas cuarenta.
3. **Al rape se le quita el dedo ENTERO**, no sólo el susto: también el empuje.
   Un cazador de emboscada al que empuja algo invisible es peor que uno que huye.

## Lo que se fue con ello

`dibujaOndas` y su degradado de crestas, y de la escena `dedo.color`, `dedo.tinte`
y `dedo.brillo` —no queda nada que pintar—. Del rape, `umbralHuida`, `estampida`,
`huida`, `lag`, `fuerzaDedo`, su `fx`/`fy` y su `reaccionDedo`.

## Comprobado

En el navegador, con el andamio instrumentado: un toque deja 37-40 motas con
hinchazón viva y `glow` a 1, y el arrastre deja un reguero de motas crecidas a lo
largo del gesto con el frente abriéndose por detrás. El rape no se mueve de su
sitio cuando le pasa la onda por encima.

---

## Corrección · 2026-09-18 (tarde)

> «cuando el dedo toque la pantalla, no quiero que el placton huya. solo los
> pececitos de cardumen, pero además sin prisa, no huyen, sino que se apartan
> tranquilamente e incluso momentaneamente para dejarme pasar»

De las tres decisiones de arriba, **la primera estaba mal**: dejar el empuje
repartido entre plancton, medusa y banco. Ahora **sólo el banco se mueve**, y no
huyendo.

- **El plancton no se aparta.** Está en suspensión: que salga huyendo lo convierte
  en un bicho con opinión, y lo que tiene que hacer es encenderse y quedarse. Con
  esto la mota se queda **sin velocidad ninguna** —nada más la empujaba—, así que
  se le fueron `vx`, `vy`, `fx`, `fy`, `fren`, `huida` y `lag`, y pasa de `avanza`
  a `paso` directamente. De la escena, `huida`, `lag`, `frena` y `fuerzaDedo`.
- **La medusa tampoco** ← *rectificado el mismo día, ver abajo.* Se queda además su
  `destello` —el dedo la enciende—, y eso pasa a leer `luzDedo` en vez de `empuje`:
  lo que la enciende es luz, y así responde también al fogonazo de debajo del dedo
  y no sólo al frente.
- **El banco se aparta, no huye.** Fuera el `susto` (que era 1,2 s de pánico:
  viraje triple, nado a `velSusto` —cinco veces su crucero— y las reglas de grupo
  soltadas) y fuera el rumbo forzado de espaldas a la onda. Queda un empujón
  lateral que **no toca el rumbo**, así que el pez sigue nadando hacia donde iba.

Tres números nuevos en su entrada de escena, y el que manda no es el obvio:

| | | |
|---|---|---|
| `apartaDedo` | 0,6 (era `fuerzaDedo: 6`) | la fuerza |
| `lag` | [1,2 · 3,0] (era [4 · 12]) | con cuánta gana la coge |
| `apartaVuelve` | 0,70 (era un 0,12 incrustado) | **lo que se desplaza** |

`apartaVuelve` pesa tanto como la fuerza, porque el desvío total es el impulso
partido por −ln(apartaVuelve). Con el 0,12 de antes el pez volvía a su sitio antes
de que se notara que se había ido, por mucha fuerza que se le diese: de ahí que
subir sólo `fuerzaDedo` nunca hubiera dado un hueco.

`reaccionDedo` se ha ido de `comun.js` —que es «las piezas que usan varias
criaturas»— y vive en `pezlinterna.js` como `seAparta`, con su único consumidor.

**Medido**, con un toque en el centro del banco y en el pez al que más le toca (un
±20 % de tirada a tirada según quién se quede cerca): desvío de lado de 0,7 a
1,1 U/s contra un crucero de 0,66 —del orden de su propio nado, que es lo que
separa apartarse de huir—, uno o dos largos de pez fuera de su sitio, hueco
cerrado en tres o cuatro segundos, y `susto` a cero. El plancton no registra ni
una mota con velocidad.

### Rectificación de la rectificación · 2026-09-18

> «perdón, las medusas sí quiero que se aparten al pasar el dedo»

La medusa recupera el apartarse, con el carácter nuevo. Con dos consumidores,
`seAparta` vuelve de `pezlinterna.js` a `comun.js`, que es su sitio.

Y ahí apareció lo único que no era copiar y pegar: **metido en su `vx,vy` no se
nota**. Esa velocidad es la de su pulso y se la frena su `arrastre` de 0,28 —el
empujón se le queda en la mitad en medio segundo—, así que la medusa acaba donde
estaba: medido, 0,27 U de ladeo. Lleva por tanto su propia velocidad `dx,dy` con su
propio `apartaVuelve`, igual que el banco, y rebota en el cristal como `vx,vy` o un
dedo que la empuje contra él la deja pegada.

`apartaVuelve: 0.78` contra el 0,70 del banco: es lo más lento de la pecera, así
que su ladeo se va y vuelve en unos cinco segundos en vez de en tres.

Medido: el ladeo llega a 0,53 U/s contra los 1,21 que da su propio pulso —la onda
no la mueve más deprisa de lo que ella se mueve sola—, se va unas 2 U de su sitio y
vuelve del todo (ladeo residual 0,005 U/s).

**Lo que no se ha podido ver.** El panel de preview congela la página entre
llamadas: ocho fotogramas en ocho segundos de reloj. Se ve el arranque del ladeo
—0,38 U en los primeros 0,4 s de tiempo de escena, con el empujón todavía
subiendo— y se comprueba que vuelve a cero, pero los cinco segundos enteros de
deriva no se han podido mirar en marcha. Los números están, el ojo falta.

### Ajuste del plancton · 2026-09-18

> «cuando el placton reacciona al pasar el dedo, está un poco exagerado, crece
> demasiado y se ilumina demasiado, y además pierde su color, pasa a blanco»

Lo del blanco no era un color mal elegido: **era saturación**. La mota se pinta
sumando el punto y el halo, y con el brillo al máximo los dos juntos se pasaban de
255. El canal que satura primero se queda plano, el tono se aplana con él y encima
el velo le devuelve su propio borrón: sale blanca. Medido sobre la población
entera, con la mota partiendo de oscuras y el dedo a tope:

| | motas corrientes (1130) | radio | suma en el centro |
|---|---|---|---|
| en reposo | 0 saturan | ×1 | 0,55 |
| antes | **1130 saturan** | ×4,9 | 1,79 |
| ahora | **0 saturan** | ×2,2 | 1,19 |

El arreglo es un tope, `topeDedo: 0.55`: el dedo sube el brillo **hasta ahí y no
más**, que es donde el tono se sigue leyendo. Nunca lo BAJA —si ya la alumbraba
algo más fuerte, el dedo no le quita nada—. Con el tope puesto, `enciendeDedo` ya
sólo decide lo rápido que llega, no a cuánto, y baja de 3,6 a 2,2.

Y el crecimiento va corto: `creceDedo` de 3,0 a 0,7, más los coeficientes del halo
a la mitad (0,14 → 0,08 en el alfa y 7 → 4 en el radio). La mota queda en 2,2 veces
su radio de reposo, poco más que las 1,9 a las que la deja una esca al pasar.

**Lo que sigue blanqueando, y es de antes:** las `destacadas` —el 7 % de motas con
un núcleo de `core` casi blanco, las 84 de 1214— saturan las 84 en cuanto algo las
alumbra, sea el dedo o una medusa. Es su diseño: son las únicas que brillan por su
cuenta y las únicas que pueden tener el corazón blanco. En reposo no saturan. Si
molesta, los mandos son `destacadas` (cuántas hay) y `alfaAlto` (lo brillantes que
son), no nada del dedo.

### El apartarse no se veía · 2026-09-18

> «cuando paso el dedo, no se están apartando ni los peces ni las medusas»

Tenía razón, y mi medición anterior estaba mal: la había tomado con el panel de
vista previa estrangulando `requestAnimationFrame`, y de ahí salieron números que
no se parecían a los de un navegador de verdad. Rehecha con el **arnés de Node**
(dos tiradas con la misma semilla, una tocando y otra con el mismo gesto fuera del
cuadro, y se restan las posiciones), a 60 fps reales:

| t (s) | 0,3 | 0,6 | 1 | 2 | 3 |
|---|---|---|---|---|---|
| desvío del banco, antes (U) | 0,00 | 0,01 | **0,04** | 0,12 | 1,62 |

Al segundo del gesto el pez se había movido **un píxel y medio**. Se apartaba, sí,
pero tres segundos después de pasar el dedo, o sea cuando ya no estaba: se lee como
que no pasa nada.

**Dos causas, y las dos eran mías.**

1. **`lag` demasiado bajo.** Lo puse a [1,2 · 3,0] para que fuera «sin prisa», pero
   eso retrasa la *fuerza*, y el frente cruza al bicho en menos de un segundo: la
   rampa sólo llegaba al 13 % de `apartaDedo` antes de que el frente se fuera. Lo
   tranquilo no puede salir de aquí. A [5 · 9] coge el empujón mientras el frente
   está encima.
2. **Era una FUERZA y tenía que ser una VELOCIDAD.** Con una fuerza hay que
   integrar dos veces —fuerza → velocidad → posición— y el desvío no aparece hasta
   segundos después por pura cinemática. `seAparta` deja ahora una velocidad en
   `o.dx, o.dy` que el consumidor SUMA a su movimiento. `apartaDedo` pasa a estar
   en U/s, lo que además lo hace comparable de un vistazo con la velocidad de nado.

Y una tercera cosa que apareció al medir: **`M.empuje` no normaliza**, y arrastrando
el dedo se apilan ondas (peso medido hasta 2,5), así que el desvío se iba a 2,8 U/s
—más del doble de lo que se mueve una medusa sola—. `seAparta` topa el módulo a uno
y se queda con la dirección de la suma, de modo que `apartaDedo` es de verdad el
máximo.

**Cómo queda**, medido con el arnés cruzando el banco de lado a lado en 1,5 s:

| t (s) | 0,3 | 0,6 | 0,9 | 1,2 | 2 |
|---|---|---|---|---|---|
| banco (U) | 0,04 | 0,36 | 0,69 | 0,93 | 1,82 |
| medusa (U) | 0,02 | 0,08 | 0,14 | 0,21 | 0,97 |

El desvío del banco se topa en 1,78 U/s, que está dentro de lo que el pez ya hace
solo —su crucero es 0,66 pero con el tirón del nervio darda a 1,7-2,5—, así que se
lee como un viraje suyo. El de la medusa, en 1,42 contra el 1,2 de su latigazo.
