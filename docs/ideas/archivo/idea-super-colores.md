# Idea: fuera el superpez, y en su sitio un evento de super colores

**Estado: IMPLEMENTADA (opción A)** · analizada y ejecutada el 2026-09-18
**Enunciado original:** «el evento super pez ya no lo queremos. cámbialo por un evento
de super colores en los peces»

## Lo que se va, y es más de lo que parece

El superpez no es sólo su fichero: la mitad del evento vive DENTRO del pez linterna,
porque el banco tiene que saber obedecer una silueta.

| qué | dónde | tamaño |
|---|---|---|
| el evento | `eventos/superpez.js` | 183 líneas |
| la silueta y el reparto de puestos | `bichos/forma.js` | 117 líneas |
| la rama de formación del pez | `pezlinterna.js` (30 menciones de `forma`) | ~70 líneas |
| sus mandos | `escena.js` (18 menciones) | la entrada del evento + 6 parámetros del pez |
| el tipo de campo `forma` | lo empuja el evento, lo lee sólo el pez | — |

Son unas **400 líneas** y un tipo de campo entero. Nada más lo usa: `forma.js` sólo
lo importan el pez (`formaObjetivo`) y el evento (`escQueCabe`), y el campo `forma` no
lo consulta nadie más.

**Y eso conecta con la otra idea de la lista** —«revisa la lógica de los peces […]
mira de refactorizar para dejar algo sencillo»—: la rama de formación es la parte más
enredada del pez (dos sistemas de rumbo peleándose, `z.forma` apagando el cardumen,
`formaCalma` bajando el nervio, `realce` en el dibujo). Quitarla es el refactor más
grande que se le puede hacer al banco sin tocar cómo nada.

## Las tres formas de hacer «super colores», y lo que cuesta cada una

El color de un pez se sortea al nacer (`z.c`, una entrada de paleta) y no cambia
nunca. Hay tres maneras de moverlo, de menos a más obra:

**A · Una onda que tiñe al pasar** *(recomendada)*
Un evento como el `contagio`: un frente que se abre desde un punto y empuja un campo
con un color. El pez lo consulta —dos líneas en su `actualiza`— y mezcla su color
hacia el del campo, con una vuelta lenta a lo suyo.
- Se VE cruzar el banco, que es lo que hace legible un evento en esta pieza.
- Reutiliza un patrón que ya existe (`enciende` del contagio) y un solo campo.
- El pez necesita un `c` propio mezclable: hoy `z.c` es una referencia a una entrada
  de paleta compartida y **no se puede tocar** —la comparten todos los peces de ese
  tramo—, así que hace falta un color de instancia (tres números) o un peso de
  mezcla + el color del campo, que es más barato.

**B · Una nube de color que deriva**
Igual que A pero el campo no se expande: es una mancha que cruza despacio y los peces
que están dentro van saturados mientras están dentro.
- Más control sobre la composición; menos «acontecimiento».
- Mismo coste de campo y de lectura.

**C · La paleta del banco entera, por un rato**
Sin campo: el evento modula un escalar global (como `M.mod.agua`) y `resuelveEspectros`
resortea los dominantes con la saturación alta. Es el más barato de todos y el que
menos se nota como evento: cambia todo a la vez y no se ve venir.

En los tres casos el tope es el mismo que documenta la escena para el color del banco:
`luz` baja el tono hacia el puro y `sat` alta sin bajar `luz` da pastel, no color. El
«super» tiene que salir de bajar `luz` y subir `satGlow`, no de subir `sat` a 1.

## Lo que hace falta decidir antes de tocar

1. **¿A, B o C?** Yo haría **A**: es la que se lee como que ha pasado algo.
2. **¿Se borra la maquinaria de formación o se aparca?** Borrarla es lo que simplifica
   el pez; aparcarla (dejar el evento sin registrar en la escena) mantiene 400 líneas
   muertas que el motor sigue evaluando en cada `actualiza` del pez.

## Hecho

**Estado: IMPLEMENTADA** · 2026-09-18, opción A y demolición completa del superpez.

### Lo que se ha borrado

`eventos/superpez.js` y `bichos/forma.js` ya no existen. Con ellos se fueron su
entrada de escena (75 líneas), los seis mandos de formación del banco (34) y toda la
rama de formación del pez, que baja de 660 a 529 líneas: el campo `forma`, los
diecisiete campos de estado por pez (`orden`, `oy`, `apunta`, `kPega`, `errL`, `errT`,
`errA`, `errVel`, `errFase`, `suelta`, `forma`, `realce`…), el `_fo` compartido y las
tres líneas donde la formación mandaba sobre el nado —el cardumen sólo corría por
debajo de 0,3 de campo, el nervio se bajaba con `formaCalma` y el crucero se
amortiguaba al 55 %—. El tipo de campo `forma` no lo empuja ni lo lee nadie.

Lo único que se ha dejado es `M.cardumen()`, el accesorio de lectura del motor: se
añadió para el superpez y hoy no lo usa nadie, pero es la mitad del vocabulario de
lectura de un evento —la otra es `M.luces()`— y está documentado como tal en
CLAUDE.md. Su comentario ya no habla del superpez.

### El evento nuevo

`eventos/floracion.js`, 46 líneas, hermano del contagio: un anillo que se abre y
empuja un campo `tinta`. **No dibuja nada y no trae color.** Cada pez coge su propia
casilla de `paletaVivo` —el gemelo saturado de su tono, que sale del `espectroVivo`
del banco—, así que lo que cruza el cuadro es el moteado del banco subido de golpe y
no una mancha de un color.

Tres cosas que costaron una decisión:

1. **El color se mezcla a mano y no se escribe en la entrada de paleta**, porque el
   halo se cachea DENTRO de ella (`M.halo`): tocarla le dejaría el halo viejo a todos
   los peces de ese tramo. El halo se cruza pintando los dos —los dos están
   cacheados— y el resto se interpola.
2. **`paletaVivo[i]` es el mismo tono que `paleta[i]`** porque `generaPaleta` saca el
   tono del índice del tramo; basta declarar el mismo `tono` y los mismos `tramos`.
   El pez guarda su índice (`iC`) al nacer.
3. **La onda va lenta y ancha** (`vel` a la mitad del contagio, `salto` al doble):
   con cuarenta peces en toda la pecera, un frente rápido y fino no se lee como una
   ola sino como peces sueltos cambiando.

### Lo que no se veía, y por qué

La primera versión **no se notaba**, y el motivo es una lección sobre esta pieza: de
un pez en agua abierta el cuerpo NO SE VE —vive con `base` 0,10 y sin nada que lo
alumbre—, así que lo único que se ve es la hilera del vientre, y esos puntos se
pintan con `core`. El `espectroVivo` no declaraba `luzCore`, así que heredaba el
0,94-0,97 de la casa: el punto seguía saliendo casi blanco y lo que cambiaba era el
`mid`, que sólo pinta el cuerpo y el halo.

Medido sobre la paleta resuelta, saturación real del núcleo:

| tramo | `core` normal | `core` vivo, con `luzCore` 0,95 | `core` vivo, con 0,60-0,70 |
|---|---|---|---|
| 0 (rojo) | 255,226,226 · 0,11 | 255,235,235 · **0,08** | 255,83,83 · **0,67** |
| 8 (verde) | 244,255,233 · 0,09 | 243,255,232 · **0,09** | 161,255,72 · **0,72** |
| 16 (cian) | 229,254,255 · 0,10 | 232,254,255 · **0,09** | 71,250,255 · **0,72** |

O sea que el gemelo «saturado» tenía el núcleo idéntico al normal. Con `luzCore`
bajado, la hilera pasa de blanca a encendida en el color del pez, que es el evento.

**Y la trampa de la verificación:** la primera comparación A/B la pinté con `ilum`
1,1 —un pez pegado a una esca—, y ahí el cuerpo domina y el cambio se veía
perfectamente. A `ilum` 0,06, que es lo normal, no se veía nada. Cualquier prueba de
color de un bicho de esta pieza hay que hacerla a oscuras.

### Medido

Arnés de Node, la onda lanzada a mano sobre una pecera en reposo:

| | |
|---|---|
| la onda vive | 12,1 s |
| peces teñidos a la vez | hasta **30 de 38** |
| peces alcanzados en la travesía | **38 de 38** |
| tinte máximo | 1,00 |

Y la curva es la de una ola: 3 teñidos a 1,5 s, 27 a los 4,5, 28 a los 6, 4 a los 9 y
ninguno a los 10,5. Cero NaN en el contexto.
