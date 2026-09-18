# Idea: una medusa se reproduce por mitosis

**Estado: IMPLEMENTADA (opción D, con la cría yéndose)** · analizada y ejecutada el
2026-09-18
**Enunciado original:** «nuevo evento: una medusa se reproduce por mitosis. para
evitar que se llene de medusas el acuario, considera mantener un máximo y cuando haya
de más, hacer que una se vaya disimuladamente fuera del marco y desaparezca, por
ejemplo. pero antes de ejecutar, considera opciones, riesgos, complejidad, y vemos la
mejor solución.»

## El obstáculo: en esta pieza nadie NACE ni MUERE

Y no es un detalle de implementación, es el contrato del motor:

- la población se crea **una vez**, en `puebla()`, a partir de `def.conteo(area, plano, p)`;
- `pasoPlanos` recorre `for (const o of gr.items) def.actualiza(o, M, L, p, dt)` y
  **tira el valor devuelto**: una especie no puede decir «me muero». Los eventos sí
  —devuelven `false`—, pero un evento no tiene acceso a `gr.items` de nadie;
- `M` no expone los grupos, así que un evento no puede añadir un bicho aunque quiera.

Hay UN precedente de «aparecer» y es el que marca el camino: al pez linterna que se
come un rape **no se le borra**, se le teletransporta al cuadrante opuesto
(`z.comido`), y el comentario dice por qué: borrarlo «obligaría al motor a repoblar a
media escena».

## Cuatro caminos

**A · Contratos nuevos en el motor: `brota()` y morir.**
La especie deja un recién nacido en una lista y el motor lo añade después de la
pasada —el mismo patrón que ya usa `alFrente`/`frente`—, y `actualiza` pasa a poder
devolver `false` como los eventos.
- *A favor:* es la solución general y limpia; cualquier especie podría reproducirse.
- *Riesgos:* toca el bucle del motor, que es lo más delicado que hay. `escalaCalidad`
  y `degradar()` cuentan población **al poblar**, así que una población que crece se
  escapa de la vigilancia de calidad. Y `for...of` sobre un array al que se le empuja
  dentro del propio bucle **visita al recién nacido en el mismo fotograma**, con `dt`
  de un fotograma entero y sin haberse dibujado nunca: hay que apilar y añadir
  después, no empujar.
- *Complejidad:* media-alta, y el riesgo no está en la mitosis sino en el motor.

**B · Un evento que se dibuja él la escena entera.**
El evento `mitosis` pinta sus dos campanas y sus tentáculos, las separa y las saca del
cuadro; la población de medusas no se toca.
- *A favor:* cero cambios en el motor; el evento es autocontenido y se puede tirar.
- *Riesgos:* duplica el dibujo de la medusa —nueve capas aditivas, tentáculos con
  historial— o importa `bichos/medusa.js` desde un evento, que es un acoplamiento que
  la casa no tiene en ningún sitio. Y la medusa «de verdad» que estaba ahí no
  participa: o se la esconde o hay dos medusas distintas en pantalla.
- *Complejidad:* alta, y por el sitio equivocado.

**C · Un pozo de medusas dormidas** *(recomendada)*
La escena pobla el **máximo** de medusas (hoy son 2-6 según el área, `por` por plano)
y algunas nacen **dormidas**: sin dibujar, sin consultar nada, fuera del cuadro. La
mitosis despierta una: aparece pegada a la madre, con radio 0 y creciendo, y las dos
se separan. Cuando hay de más, la más vieja se va a la deriva y al salir del cuadro
se vuelve a dormir.
- *A favor:* **ni un contrato nuevo**. La población del array es fija, así que
  `degradar()` y `escalaCalidad` siguen valiendo; es exactamente el patrón del pez
  comido, y el tope está garantizado por construcción y no por una comprobación.
- *Riesgos:* una medusa dormida sigue ocupando su sitio en `items` —hay que saltarla
  en `actualiza` y en `dibuja` con una bandera, dos `if`—, y el `topa()` que las
  contiene en la caja hay que desactivárselo a la que se va, o no puede salir.
  Memoria: cada medusa lleva un buffer de historial de 48×3 flotantes, o sea 576
  bytes; seis dormidas más son 3,4 KB, nada.
- *Complejidad:* baja. Es la que yo haría.

**D · Mitosis sólo aparente: una medusa se parte y se vuelve a juntar.**
La campana se estrangula, se divide en dos lóbulos y uno se reabsorbe. No hay medusa
nueva en ningún momento.
- *A favor:* lo más barato de todo y cero riesgo de población.
- *En contra:* no es lo que se pide —no queda una medusa más— y el efecto se agota en
  una pasada.

## Lo que hay que decidir

1. **¿C?** Si vale, lo siguiente es elegir el reparto: cuántas dormidas por plano
   —hoy el plano de delante admite 0-1, así que una mitosis ahí no tiene sitio sin
   subir su `max`— y cada cuánto pasa (`cada`, como los demás eventos).
2. **La salida.** «Irse disimuladamente» funciona si se va por el canto de abajo con
   la corriente: la medusa ya se hunde sola (`hundimiento`), así que basta dejarla
   sin `topa()` y bajarle el brillo mientras sale. Irse por arriba se ve más.
3. **¿La mitosis la lanza un evento o la propia especie?** Con C puede ser un evento
   de verdad (con su reloj `cada`, y así se puede disparar desde el panel) que
   simplemente marca a una medusa: el evento no crea nada, despierta.

## Hecho: la D con la cría yéndose

El usuario eligió la **D** con una vuelta que la arregla: en vez de reabsorberse, la
segunda **se va haciéndose pequeña**. Y eso la pone por delante de la C por un motivo
que esta ficha había infravalorado: **en esta pieza pequeño ES lejos** —los tres planos
codifican la distancia como más pequeño, más borroso, más tenue y más lento—, así que
una cría que se encoge mientras deriva no es un truco para tapar un borrado: es la
gramática de la propia obra diciendo «se va al fondo». La C seguía necesitando el tope,
las banderas de dormida y quitarle la contención a la que se iba; esto no necesita nada.

Y no es mitosis: es **gemación**. Una medusa no se parte en dos —eso lo hace el pólipo,
brotando— y además partir la campana no saldría: sumando luz, dos campanas solapadas se
leen como una campana más brillante, no como dos.

### La forma que se le ha dado

- **`eventos/gemacion.js`** (61 líneas) no dibuja nada y no elige a nadie: empuja un
  campo `gema` sobre todo el cuadro —una orden en el agua— con el cupo viajando en su
  `d`, y se muere en cuanto alguien lo coge o a los seis segundos si no hay quien.
- **La medusa se pinta a sí misma dos veces.** `dibuja` se llama con `j.cria` apartada,
  dentro de un `translate`+`scale`: la cría es la MISMA campana vista más pequeña y más
  lejos, así que no hay un segundo sitio describiendo la misma medusa. Para poder
  llamarse, el def pasa a `const MEDUSA = {…}; especie('medusa', MEDUSA);`.
- **`pasoCria`** lleva tres tramos sobre una sola `u` de 0 a 1: brota el 30 %, se
  suelta el 20 %, se va el 50 %. El tamaño se va antes que la distancia (exponente
  1,3), que es lo que hace que parezca perderse en el agua.
- **Tres mandos en la escena**, en la entrada de la medusa: `gemaVida` [15, 24] s,
  `gemaEsc` [0,42, 0,58] y `gemaLejos` [7, 11] radios.

### La elección tarda un fotograma, y hace falta

La primera versión gemaba **siempre una del fondo**: `pasoPlanos` recorre los planos
del fondo al frente, así que la primera que preguntaba se lo quedaba, y era la más
pequeña y borrosa de la pecera (medido: radio 0,43 U). Ahora en el primer fotograma
cada medusa apunta su radio en el campo y del segundo en adelante se lo queda la mayor
—o sea la más cercana, porque el radio lleva dentro la escala de su plano—. Medido: la
madre pasa a ser la del plano de delante, radio 1,16 U.

### Medido

Arnés de Node, el evento lanzado sobre una pecera en reposo con cuatro medusas:

| | |
|---|---|
| geman a la vez | **1** |
| el evento, después | muerto (ha hecho su trabajo) |
| la cría, al acabar | soltada; no queda nada |
| recorrido | esc 0,10 → 0,50 pegada · 0,50 a 2,2 radios al soltarse · 0,24 a 5,2 · 0,06 a 7,6 · nada a 9,8 |

Y lo que cuesta: una medusa se pinta en **0,118 ms** y la cría, dentro de la
transformación, en **0,122** —o sea +0,12 ms mientras dura, sobre 16,7 de presupuesto,
y cero cuando nadie está gemando—. Cero NaN.

### Un detalle que salió bien por casualidad

La cría se coloca **relativa a su madre** (`dx, dy` desde su posición actual), así que
si la madre deriva, la cría deriva con ella. Eso además arregla lo de los tentáculos:
se trazan desde el historial de por dónde ha pasado la campana, y la cría hereda el de
su madre —con una posición absoluta, su rastro apuntaría a donde la madre estuvo y se
leería como que va arrastrada.
