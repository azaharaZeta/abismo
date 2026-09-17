# Idea: Cuatro ajustes al rape

**Estado: IMPLEMENTADAS** · procesadas y archivadas el 2026-09-17
**Enunciados originales:**
- «rapes: haz el masticado tras la caza menos exagerado»
- «rapes: no me gustan los pelillos que salen del señuelo. dejalo como una bola solo.»
- «rapes: haz que sus ojos brillen siempre.»
- «rapes: el color del señuelo y las barbas tiene que ser del mismo color base que el rape.»

## 1 · El masticado, menos exagerado

Sólo números de escena; el mecanismo no se tocó.

| | antes | ahora |
|---|---|---|
| `mastica` (s con la presa dentro) | 0,35–0,65 | **0,20–0,38** |
| `masticaLuz` (lo que emite la esca recogida) | 4,5 | **2,4** |
| `masticaRitmo` (dentelladas, rad/s) | 6,5 | **4,6** |
| `masticaAbre` (trabajo de la quijada, rad) | 0,26 | **0,13** |

El rato en que el bicho se alumbra él solo pasa de ~1,4 s a ~0,9 s: el bocado y poco
más, que es lo que lo devuelve a ser un vistazo.

## 2 · El señuelo, una bola sola

La escena ha dejado de pedir `pelos`. **El código de los filamentos sigue ahí**: la
especie los dibuja si la escena los pide, igual que `barbas`, `miomeros` y `radios`,
que ya funcionaban con el mismo contrato de «0 = no los hay». Volver a tenerlos es
añadir `pelos: [4, 6]` a la entrada del rape.

## 3 · Los ojos brillan siempre — y esto es una excepción declarada

**Rompe la regla que sostiene la pieza** («nadie está iluminado por la escena, cada
cuerpo existe sólo hasta donde llega la luz que le dan»), y conviene que quede escrito
en vez de descubrirse luego:

- el **globo** del ojo sigue siendo pasivo: sólo recoge la luz que le den.
- la **pupila** ahora emite por su cuenta, con suelo `ojoBrillo: 0.20`.

Consecuencia: al rape se le encuentra siempre si se le busca. Va bajo a propósito —a
0,45 deja de ser un pez a oscuras con los ojos encendidos y pasa a ser dos ojos
flotando— y lleva un halo pequeño, porque la pupila mide medio píxel en el plano de
delante y medio píxel a alfa baja no se ve. `ojoBrillo: 0` lo devuelve al diseño
original. Está en el panel de pruebas como «rape · pupila».

El ojo se pinta ahora FUERA del bloque del cuerpo, que sólo se dibuja si le llega luz.

## 4 · La esca y las barbas, del tono del animal

El rape tenía dos colores independientes: la esca sorteaba el círculo entero de tono
(0–350°) y el cuerpo sus dos arcos (morado→magenta→rojo, y un verde oscuro raro). Salía
un bicho magenta con una lámpara cian.

**Cómo se resolvió sin tocar el motor de paletas:** los dos espectros declaran ahora los
MISMOS arcos y los mismos `tramos`, y sólo cambian el brillo. `generaPaleta` reparte el
tono por índice de forma determinista —`h = tono[0] + (tono[1]-tono[0])·i/(n-1)`—, así
que la entrada *i* de una paleta y la *i* de la otra **son el mismo tono**, una quemada
y la otra a oscuras. `crear` sortea el cuerpo (que es quien lleva los pesos, porque el
arco verde es el raro) y lee la lámpara por su índice.

Verificado en vivo: las dos paletas tienen 26 entradas y **0 índices con los tonos
desalineados**; el rape de la escena salió con esca y cuerpo a 311°.

Si alguien toca un arco, tiene que tocarlo en los dos. Si dejan de cuadrar, `crear`
sortea la lámpara aparte: el tono deja de coincidir, pero nada se rompe.

## Cabo suelto

El color raro de la escena (`raro: ROJO`, con `raroProb` 0,30) se le asigna a `o.c`, o
sea **a la esca**, así que en las peceras donde sale rompe la regla que se acaba de
poner: lámpara roja sobre un cuerpo de otro tono. Se deja a propósito —el rape rojo es
un suceso declarado de la escena— pero está anotado en el índice por si se prefiere que
el raro tiña también el cuerpo.
