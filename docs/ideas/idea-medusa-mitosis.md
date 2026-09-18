# Idea: una medusa se reproduce por mitosis

**Estado: EN CURSO** · analizada el 2026-09-18 · **sin implementar, a propósito: el
encargo pedía ver opciones y riesgos antes**
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

## Pendiente

Sin implementar, esperando la decisión sobre C.
