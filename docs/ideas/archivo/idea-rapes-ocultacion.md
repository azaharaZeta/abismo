# Idea: ¿Debe el cuerpo del rape ocultar lo que tiene detrás?

**Estado: EVALUADA — DESCARTADA** · archivada el 2026-09-15
**Enunciado original:** «Rapes: valorar si el cuerpo debe ocultar lo que tiene detrás;
hoy no puede, porque la escena se compone en aditivo.»

## La queja es real, y más de lo que yo había dicho

En la ficha de la idea del volumen afirmé que a `br` alto la saturación ya escondía lo
que hubiera detrás. **Medido, es falso.** Simulando la composición real (agua del
abismo + mota + cuerpo, todo en `lighter`), cuánto aporta al píxel final una mota de
plancton de alfa 0,7 que esté detrás del cuerpo:

| brillo del rape | lo que sigue aportando la mota |
|---|---|
| `br` 0,08 (a oscuras, el 90 % del tiempo) | 67 % |
| `br` 0,35 (revelado medio) | **62 %** |
| `br` 0,76 (el pico real) | 38 % |
| `br` 1,5 (quemando) | 34 % |

La mota nunca desaparece. En el régimen medio —justo donde se ve al pez— conserva casi
dos tercios de su fuerza.

## Por qué aun así se descarta

La única palanca disponible es dibujar el cuerpo en `source-over` dentro de su plano,
y no resuelve el problema:

- **Sólo tapa a medias.** `source-over` con alfa *a* deja pasar `(1-a)`. A `br` 0,35 el
  alfa del cuerpo es ~0,41, así que la mota bajaría al 59 % de su valor. Para taparla
  del todo haría falta un cuerpo opaco.
- **El agua seguiría viéndose igual.** El plano nace transparente y se compone con
  `lighter` sobre el agua: un cuerpo opaco *dentro* del plano sigue sumándose al agua
  al final. Nunca puede oscurecerla. Y es el agua de fondo, no el plancton, lo que más
  se lee como transparencia.
- **Los rapes se borrarían entre sí.** Comparten grupo y plano: el que se dibuje
  después borraría el halo y la esca del anterior.
- **A `br` bajo sería peor.** Un cuerpo en `source-over` sobre un plano vacío queda
  MÁS oscuro que el agua, así que aparecería una silueta oscura donde ahora no hay
  nada. Rompe la premisa entera de la pieza: el pez sólo existe hasta donde llega su
  luz.
- Condicionar el modo de composición al brillo arregla lo último a cambio de que el
  aspecto del bicho cambie de naturaleza a mitad de rango.

## Qué haría falta de verdad

Abandonar la composición aditiva para los planos de bichos y pasar a un modelo con
oclusión real (orden por profundidad y opacidad), que es rehacer el motor. La pieza
está construida sobre que la luz se suma; es de donde sale que el abismo funcione y de
donde salió el mejor evento del catálogo (el vacío, que se lee porque NO se dibuja).

**Recomendación: no tocarlo.** Lo que sí cerró la parte visible de la queja fue darle
cuerpo al bicho, que es lo que se hizo en la idea del volumen: piel con suelo de alfa
para que ninguna parte llegue a cero.
