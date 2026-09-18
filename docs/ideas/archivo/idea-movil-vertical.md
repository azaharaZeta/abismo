# Idea: el móvil, vertical por defecto y tumbado a petición

**Estado: IMPLEMENTADA Y DESPUÉS RETIRADA A MEDIAS** · 2026-09-18

> **Lo que queda en pie:** la pieza se compone para la caja que le dé la
> pantalla, así que de pie sale vertical. Eso no ha cambiado.
>
> **Lo que se retiró el mismo día:** el botón y el vuelco de 90° por CSS.
> «quita el botón de girar, ya no hace falta, porque será suficiente con girar
> el movil». Con ellos se fueron la clase `.tumbado`, la variable `--giro`, el
> desgiro del puntero de `motor/dedo.js` y la regla del tirador de `pruebas.js`.
> Abajo se describe el mecanismo tal como fue; sirve para saber qué se quitó y
> por qué el motor no tiene hoy ningún marco de coordenadas girado.
>
> **Y destapó el fallo de verdad**, que el vuelco por CSS escondía: al girar el
> móvil DE VERDAD se intercambian ancho y alto, o sea que el ÁREA no cambia, y
> la regla de `alRedimensionar()` sólo miraba el área. No repoblaba, y la
> escena se quedaba compuesta para la caja anterior —«se queda todo mal
> colocado en la resolución anterior»—. Ahora mira también la forma: por qué
> lado es más largo el cuadro. La barra de URL del móvil no puede cruzar esa
> línea, así que sigue sin repoblar por ella (medido: 8,3 % de área, no
> repuebla; giro, 0,0 % de área, repuebla).

**Enunciado original:** «en movil, ahora queremos que sea siempre por defecto
vertical, y solo poner en horizontal si se pulsa el botón de giro. al pulsar el
botón de cambiar a horizontal / vertical, hay que recolocar o regenerar la escena,
para que cuadre con la nueva forma de la pecera.»

## Lo que había

El vuelco de 90° lo aplicaba **la consulta de medios a secas**: con el móvil de pie
el marco se volcaba solo, siempre, y la pieza salía horizontal quisiera el que mira
o no. El botón «girar» hacía otra cosa —pantalla completa más `screen.orientation
.lock('landscape')`—, o sea un giro DE VERDAD, y por eso sólo aparecía en Android:
iOS no tiene ninguna de las dos APIs.

## El cambio, en una frase

El vuelco pasa de la consulta a una **clase en la raíz** (`.tumbado`), y el botón la
pone y la quita. Sin clase, la pecera es vertical.

La consulta se queda **delante** de la clase:

```css
@media (orientation:portrait) and (hover:none) and (pointer:coarse)
   and (max-width:560px){
  :root.tumbado{--giro:90deg}
  :root.tumbado #marco{ … }
}
```

Y hace falta que se quede: con el aparato **ya tumbado** el cuadro es horizontal por
su cuenta, así que volcarlo encima lo pondría de pie. Girar el móvil de verdad no
toca la clase, sólo deja de aplicarla —y al volver a ponerlo de pie vuelve a valer.

## La otra mitad: pecera nueva al volcar

Volcar **cambia la forma de la caja** —de 359×750 a 796×325 en un iPhone— y la escena
está compuesta para la que había: las posiciones van en fracción de pantalla y el
tamaño de todo sale de `sqrt(área)`. Un `resize` **no salta**, porque la ventana no
ha cambiado: sólo una clase. Así que `marco.js` avisa a mano con `reinicia()`, que
es la única llamada al motor que sale de ese fichero y ya estaba permitida.

No hace falta esperar a nada: `setup()` lee `clientWidth`, y leerlo fuerza el cálculo
de estilo, así que el motor ve ya la caja volcada.

## Lo que se ha QUITADO, y por qué

La pantalla completa y el bloqueo de orientación. Servían para girar de verdad, pero
con el botón convertido en un interruptor de dos estados dejaban dos mandos
peleándose: con la orientación bloqueada en horizontal la consulta de medios deja de
valer, el botón se esconde por su propia regla y el que mira se queda **dentro de la
pantalla completa sin nada que pulsar**. El vuelco de la hoja no pide permiso, no
necesita gesto previo y sale igual en iOS, que es donde antes no había nada.

## Ficheros

| fichero | qué |
|---|---|
| `marco.css` | el vuelco cuelga de `:root.tumbado`; el comentario, reescrito |
| `marco.js` | el botón es un interruptor y pide `reinicia()`; fuera la API de pantalla completa |
| `index.html` | la etiqueta de arranque del botón pasa a «tumbar» |
| `pruebas.js` | el tirador del panel sigue al vuelco: `:root.tumbado #pr-tirador` |
| `CLAUDE.md` | la sección del marco describía el vuelco automático |

## Comprobado

En el navegador a 375×812 con emulación de táctil, sin errores de consola:

| | de pie (por defecto) | tumbado (botón) |
|---|---|---|
| lienzo | 359×750 | 796×325 |
| `--giro` | 0deg | 90deg |
| etiqueta | «tumbar» | «enderezar» |
| reloj de la pieza | — | reiniciado a 0,05 s |

Y el dedo, que es el único acoplamiento que cruza el vuelco: tumbado, la caja mide
325×796 **en pantalla** contra un lienzo de 796×325, y un toque en el centro de la
pantalla cae en el centro del lienzo (luz 0,913) con la esquina a 0,000. De pie, un
toque a 30 px del canto cae en (30, 30). `motor/dedo.js` sigue leyendo `--giro` y no
se ha tocado.

## Lo que deja pendiente

Nada. Al retirar el vuelco desapareció también lo único que quedaba apuntado aquí
—la condición del vuelco repetida en tres sitios—: hoy no está en ninguno.
