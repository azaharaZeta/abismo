# Idea: fuera el superpez, y en su sitio un evento de super colores

**Estado: EN CURSO** · analizada el 2026-09-18 · **sin implementar, falta decidir el
mecanismo**
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

## Pendiente

Sin implementar. La retirada del superpez y el evento nuevo van juntos en el mismo
paso: si se quita el campo `forma` antes de tener el nuevo, el banco se queda un rato
sin ningún evento propio.
