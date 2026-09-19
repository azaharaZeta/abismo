/* ── REGISTRO DE ESPECIES ───────────────────────────────────────────
   Acuario.especie(nombre, def) donde def es:

     conteo(plano, p)          → cuántos en ese plano (0..2). Un número
                   absoluto: el cuadro enseña el mismo trozo de mundo en
                   cualquier pantalla, así que la población no va por área.
     siembra(M, p)             → opcional. Una vez por pecera, antes de
                   crear a nadie y para los tres planos a la vez: es donde
                   va lo que toda la población COMPARTE y `crear` no puede
                   decidir por su cuenta. Escribe en `p`, que es la
                   entrada de la escena.
     crear(M, L, p)            → el objeto; debe tener x, y
     actualiza(o, M, L, p, dt) → void
     dibuja(o, M, L, p, g)     → void, en el contexto del plano
     luz         → entra en L.luces, o sea que alumbra. El contrato de un
                   foco, que lee `M.luzEn` y no sólo el plancton:
                     x, y     dónde está la luz, en mundo. NO tiene por qué
                              ser el cuerpo: la del rape es su esca.
                     c        su color, para quien se tiña de él.
                     rLuz     a cuánto enciende plancton —generoso.
                     rCuerpo  a cuánto REVELA otro cuerpo. Suele ir más
                              corto; sin él se usa `rLuz`.
                     luzI     cuánto emite ahora mismo. Quien no lo declare
                              vale 1, o sea más que un pez linterna entero.
                     senuelo  si es una trampa. Lo mira la presa para no
                              perseguir a cualquiera que brille.
     presa       → es comestible: entra en L.presas
     rompible    → se le puede romper el DIBUJO: un campo `tajo` encima y
                   el motor lo pinta cortado en bandas (ver pintaBicho).
                   Sin la bandera, ni se le consulta.
     cardumen    → se agrupa: entra en L.cardumen y los suyos se miran
                   entre ellos sin saber de qué especie son; necesita
                   x, y y ang. Dos especies que lo pidan hacen banco mixto.
     escalaCalidad → su población se puede recortar al degradar
     campos(o, M, L, p) → opcional. Empujar campos a M.campos, como un
                   evento. Se llama para los tres planos ANTES de que se
                   actualice nadie, que es la única forma de que un campo
                   puesto por un bicho de delante lo lea uno del fondo.
                   Aquí no se dibuja ni se mueve nada.

   Un objeto puede ponerse `o.alFrente = true` en su actualiza(): ese
   fotograma se pinta el último y en el plano de delante. La bandera la BAJA
   el motor al consumirla, así que vale para un fotograma y no hay que
   acordarse de apagarla.

   M es la escena viva: M.W M.H M.U M.t M.paleta y los métodos
   M.color() M.empuje(x,y,banda) M.borde(x,y) M.flujoX(y,t) M.flujoY(x,t)
   M.envuelve(o,inset) M.salto(x,y,inset) M.campo(tipo,x,y,plano)
   M.luzEn(x,y,luces,op) M.luzDedo(x,y) M.halo(color) M.punto(color),
   más las utilidades M.rgba
   M.clamp M.rnd M.rango M.rangoE M.elige M.mezcla M.suave M.opt M.TAU.
   L es el plano. p son los parámetros de la escena para esa especie. */
const ESPECIES = {};
function especie(nombre, def){ ESPECIES[nombre] = def; }

/* Los parámetros de una entrada de escena, sea de bicho o de evento:
   van en la propia entrada, o en un `params: {...}`. */
const paramsDe = conf => conf.params || conf;

/* ── REGISTRO DE EVENTOS ────────────────────────────────────────────
   Acuario.evento(nombre, def). Un evento no es una población: es algo
   que le pasa a la escena entera cada tanto.

   NO LLEVA VALORES. Todos sus parámetros salen de su entrada en
   `ABISMO.eventos` y de ningún otro sitio: un bloque de valores propios
   para poder lanzarlo desde el panel es una segunda copia que nadie
   ejercita y que envejece sola. Para probar uno sin que salga por su
   cuenta se le pone `cada: null` en la escena y queda DORMIDO.

   def es:

     exclusivo     → no admite otro exclusivo a la vez
     cada, primero → [a,b] segundos. La escena los puede pisar, y con
                     `cada: null` lo deja dormido: no sale nunca solo.
     arranca(M, p, x, y)    → el estado. x,y sólo si lo disparó un contacto.
     actualiza(e, M, p, dt) → false cuando ha terminado. Aquí es donde
                     empuja campos y modulación.
     dibuja(e, M, p, g)     → opcional. Muchos de los buenos NO dibujan.

   Actúa por dos vías, y ninguna obliga a las especies a saber que existe:
     · CAMPOS → M.campos.push({tipo, x, y, r, ri?, ky?, rot?, plano?,
                fuerza, filo?, c?, d?}) y el bicho pregunta M.campo(...).
                Un bicho también puede empujarlos —el rape tapa y asusta
                con ellos—, pero entonces tiene que actualizarse ANTES que
                quien lo lea: los campos se vacían al empezar cada
                fotograma.
     · MODULACIÓN → M.mod.agua / .ritmo, que el motor aplica al pintar.

   Para LEER la escena un evento no recibe `L`: tiene M.luces(plano) y
   M.cardumen(plano) —ésta, sin argumento, da los tres planos juntos—.
   Con la primera puede existir un evento que no emita nada y se vea sólo
   cuando algo lo alumbra, como la carroña; con la segunda, uno que se
   forme donde el banco ya estaba, sin preguntar de qué especie es. */
const EVENTOS = {};
function evento(nombre, def){ def.nombre = nombre; EVENTOS[nombre] = def; }
export { ESPECIES, EVENTOS, especie, evento, paramsDe };
