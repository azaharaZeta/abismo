/* ══════════════════════════════════════════════════════════════════
   LA ESCENA DEL ABISMO
   Toda la configuración de la pecera: la paleta, el agua, los planos, y
   la lista de bichos y de eventos con sus parámetros. Aquí no hay
   ninguna criatura ni una línea de motor —sólo números y el porqué de
   cada uno—, y es el único fichero que hay que abrir para ajustar cómo
   se ve la pieza.
   ══════════════════════════════════════════════════════════════════ */

/* Cada entrada: núcleo casi blanco, color de identidad, tono de halo.
   `peso` es cuánto sale en el sorteo. */
const AZUL    = {core:[226,238,255], mid:[ 96,150,255], glow:[ 22, 46,140], peso:1.6};
const CIAN    = {core:[226,252,255], mid:[ 88,214,236], glow:[ 16, 92,120], peso:1.2};
const HIELO   = {core:[228,248,255], mid:[126,206,238], glow:[ 22, 82,124], peso:1.0};
const VERDOSO = {core:[228,255,246], mid:[110,224,190], glow:[ 14, 96, 92], peso:0.9};
const PLATA   = {core:[240,248,255], mid:[176,206,224], glow:[ 54, 82,104], peso:0.3};
const ROJO    = {core:[255,226,220], mid:[228, 74, 62], glow:[120, 16, 14]};

export const ABISMO = {
  nombre: 'Abismo',

  paleta: [AZUL, CIAN, HIELO, VERDOSO, PLATA],

  agua: {
    /* LA LUZ DE FONDO, multiplicador sobre la tira de abajo: a 0 el agua
       es negra del todo y los bichos quedan flotando en el vacío. Lo
       multiplica además `M.mod.agua`, que es lo que mueve un evento.

       Por encima de 1 la tira se vuelve a pasar entera (ver `sumaVeces`), y
       lo que hace no es aclarar el cuadro sino ABRIR EL DEGRADADO: como el
       techo parte de [4,13,21] y el suelo de [0,0,1], multiplicar reparte
       casi todo arriba. MEDIDO en pantalla de 1 a 3 —mediana de 40 muestras
       por franja, para que no la sesguen los bichos—, el techo pasa de
       [6,16,25] a [12,38,64] y el suelo se queda donde estaba, de [4,4,6] a
       [4,5,9]. O sea que la hondura CRECE.

       Lo que se paga es contraste en la mitad de arriba: un bicho tenue del
       plano del fondo tiene ahí menos negro contra el que recortarse. */
    brillo: 3,
    pos: [0.000, 0.070, 0.220, 0.480, 0.760, 1.000],
    /* Casi negro de arriba abajo; el poco azul del techo evita que la
       pantalla sea un rectángulo plano. Perfil ajustado a mano. */
    tono: [[4,13,21],[3,10,17],[2,6,12],[1,3,7],[0,1,3],[0,0,1]],

    /* Cuánta luz del agua le quita un campo `apaga`: a 1 el cuerpo deja
       el agua en negro, a 0 el mecanismo se apaga. `nucleo` es hasta
       dónde llega el negro pleno antes de desvanecerse. */
    sombra: { fuerza: 1.0, nucleo: 0.55 },

    /* Cuatro manchas de azul oscuro cruzándose muy despacio, sumadas al
       agua con alfa mínima: rompen el negro plano en horizontal, que el
       degradado sólo varía en vertical. Van a `div` de resolución y se
       amplían, o sea con el desenfoque del bilineal. `fuerza` a 0 la
       apaga; a 0,32 el negro se rompe sin irse y el píxel más oscuro sigue
       en [0,1,3]; a 0,9 ya no hay negro. */
    ondulacion: {
      div: 6, manchas: 4, fuerza: 0.32,
      radio: [0.40, 0.80],        // en fracción de la diagonal
      vel: 0.035,                 // el recorrido, muy lento
      tonos: [[6,22,30], [4,12,32], [10,26,24], [14,10,30]],
      /* ── EL RECORRIDO DE CADA MANCHA ─────────────────────────────
         Nace en `centro` y describe dos senos lentos y desfasados, de
         amplitud `vaiven` y frecuencia `ritmo`. Todo en FRACCIÓN DE
         PANTALLA, que es lo que las deja sobrevivir a un redimensionado
         sin volver a sortearse: re-sortearlas haría que la escena
         cambiara de color al esconderse la barra de URL del móvil.

         Los `ritmo` van desiguales y sin razón entera entre ellos: con
         los cuatro a la par las manchas vuelven a la misma postura cada
         tantos segundos y el fondo late. `alfa` es lo opaca que sale
         cada una, para que no pesen las cuatro igual. */
      centroX: [0.15, 0.85], centroY: [0.12, 0.88],
      vaivenX: [0.16, 0.40], vaivenY: [0.10, 0.32],
      ritmoX:  [0.55, 1.35], ritmoY:  [0.45, 1.20],
      alfa:    [0.62, 1.00],
    },
  },

  dither: true,

  /* ── LA DISPERSIÓN DEL AGUA ───────────────────────────────────────
     Lo que hace que esto sea AGUA y no vacío: sin ella, entre dos luces
     no hay nada y la pieza se lee como pegatinas sobre negro. Va por
     ESCENA, con la luz de los tres planos ya sumada: es lo único que
     puede unirlos. La luz baja a una pirámide de lienzos y se vuelve a
     sumar de pequeño a grande —reducir y ampliar con bilineal ES un
     desenfoque—, y en varias escalas da a la vez el velo corto pegado a
     una esca y el resplandor ancho de un banco. */
  dispersion: {
    div: 4,                       // el primer nivel, respecto al lienzo
    niveles: 4,                   // cada uno la mitad del anterior
    /* `fuerza` es cuánto velo hay y `caida` cuánto se ENSANCHA. El
       segundo es el que levanta el cuadro entero: a 0,86 se suman
       cientos de motas y deja de ser un abismo. */
    fuerza: 1.0,                  // cuánto velo se suma al final
    caida: 0.72,                  // lo que pierde cada nivel al ensanchar
  },

  /* ── LA CORRIENTE ─────────────────────────────────────────────────
     Remolinos que se deshacen y se rehacen, no un arrastre. `ondaX` y
     `ondaY` son CUÁNTOS caben a lo ancho y a lo alto, y TIENEN QUE SER
     ENTEROS: de ahí depende que el agua se deslice a lo largo del cristal
     en vez de empujar contra él, que es lo único que impide que la nieve
     marina se apelotone en una esquina. El porqué, en `flujoX` de
     motor/estado.js. El motor los redondea, pero escríbelos enteros.

     `amplitud` es la punta de velocidad en U/s y `vel` cada cuánto se
     transforman —a 0,05 la vuelta entera son dos minutos. */
  corriente: { amplitud: 0.16, ondaY: 2, ondaX: 1, vel: 0.05 },

  /* Tendencia a no salirse del encuadre, no una pared: el empuje aparece
     a `margen` del canto y crece al acercarse. El cristal duro es aparte,
     en salto(). */
  borde: { margen: 0.14, fuerza: 1.0 },   // fracción de min(W,H) · U/s²

  /* ── EL DEDO ──────────────────────────────────────────────────────
     Sólo contacto, nunca hover, y NO DIBUJA NADA: cada toque suelta una
     onda que enciende plancton, primero debajo del dedo y después en el
     frente que se va abriendo. Lo que se ve del gesto es la nieve marina,
     que es la regla de la casa aplicada al que toca. */
  dedo: {
    /* `alcance` va largo —un cuarto de pantalla— porque la nieve marina es
       rala: por debajo de tres U el frente cruza una docena de motas y
       deja de leerse como onda. */
    alcance: 7.0,                 // en U: hasta dónde llega el frente
    vida:    3.6,                 // y lo que tarda en llegar y apagarse
    frente:  1.3,                 // grosor del frente, en U
    /* el fogonazo de debajo del dedo: la respuesta inmediata al toque. Va
       corto porque lo que tiene que quedarse es la onda, no una mancha. */
    radio:   2.6,                 // en U
    brote:   0.5,                 // segundos
    paso:    0.9,                 // separación mínima entre ondas al arrastrar
    tope:    20,                  // ondas vivas a la vez como máximo

    /* ── Y CADA ONDA, LA SUYA ───────────────────────────────────────
       Los de arriba son la medida nominal; `varia` es cuánto se aparta de
       ella cada onda, como factor. Todo a 1 y arrastrando el dedo sale una
       hilera de anillos calcados, que se lee como un efecto y no como
       agua. Es lo mismo que hace `ondulacion.centro/vaiven/ritmo` con las
       manchas del agua: sin dispersión, el mecanismo se ve. */
    varia: { alcance: [0.80, 1.22], vida:  [0.82, 1.22],
             frente:  [0.84, 1.20], radio: [0.85, 1.20],
             brote:   [0.80, 1.25], fuerza:[0.80, 1.18] },
    /* LA FORMA DE LA ONDA, los dos exponentes. `crece` es cuánto FRENA al
       abrirse —a 1 el anillo avanza a velocidad constante y parece un
       barrido, no una onda—; `decae`, cuánto tarda en apagarse. */
    crece: [1.70, 2.20],
    decae: [1.45, 1.95],
    /* 1/s de la rampa de ENTRADA, y va alta a propósito: el anillo abre en
       unas siete centésimas, que es lo que hace que el toque se lea como
       instantáneo aunque la onda luego tarde `vida` en cruzar. */
    rampa: 14,
    /* el grosor del frente que EMPUJA, en `frente`: algo más estrecho que
       el que enciende, o el banco se aparta antes de que se le note luz */
    banda: 0.9,
    /* ── Y CUÁNTO DURA EL EMPUJÓN ───────────────────────────────────
       Qué parte de la vida de la onda sigue moviendo cosas. La LUZ dura
       toda —es el gesto, y tiene que cruzar el cuadro—; el empujón no,
       porque el frente viaja `alcance` U y lo que se pide es que se
       aparten de tu paso, no que el anillo arrastre a todo el que pille
       de camino. A 0,22 el empujón vive nueve décimas de los cuatro
       segundos de la onda, o sea mientras el frente sigue cerca de donde
       tocaste. */
    empuja: 0.30,
  },

  /* ── TRES PLANOS: fondo, medio, frente ────────────────────────────
     La distancia se lee por cuatro avisos a la vez: más pequeño
     (`scale`), más borroso (`resDiv`), más tenue (`alpha`) y más lento
     (`drift`). `sharp` atenúa los núcleos casi blancos, y hace falta:
     con los tres a 1 los bichos del fondo salen con el canto marcado y
     dejan de estar lejos.

     Aquí no va nada que use una sola especie. */
  planos: [
    {resDiv:3, alpha:0.58, scale:0.40, sharp:0.35, drift:0.44},
    {resDiv:2, alpha:0.86, scale:0.74, sharp:0.78, drift:0.72},
    {resDiv:1, alpha:1.00, scale:1.32, sharp:1.00, drift:1.00},
  ],

  /* El zoom de la pieza: la unidad de mundo sale de sqrt(área)/escala.
     TODO tamaño de cuerpo o de evento va en U —nunca en fracción de W o de
     H—, o las proporciones entre las cosas cambian al girar el móvil. Las
     POSICIONES sí van en fracción de pantalla: el encuadre es lo que hay.

     Y ES EL MANDO DEL TAMAÑO APARENTE. El cuadro enseña siempre
     `escala`×`escala` U de mundo, así que bajarlo enseña MENOS mundo con
     todo más grande. A 18 un pez subtiende 2,0° en un iPhone y 2,3° en
     un monitor, contra 1,4° y 1,6° que daba a 26.

     Lo que NO arregla es la diferencia entre móvil y monitor: al ser
     global los sube a los dos y la razón entre ellos se queda igual. Esa
     diferencia es física —un px CSS mide 0,18 mm en un móvil y 0,265 en
     un monitor, y no se mira desde el doble de cerca— y no se toca desde
     aquí. Lo que se ha hecho es subir el suelo hasta que el móvil llega a
     donde estaba el monitor.

     Y AHORA VALE PARA TODO: no queda ni un tamaño en píxeles ni un conteo
     por área de pantalla. Cada población es un número absoluto y cada
     tamaño un múltiplo de U, así que la pecera es la misma en un móvil y
     en un monitor —sólo cambia cuántos píxeles le toca a cada cosa. */
  escala: 18,
  maxPx: 4.6e6,                   // tope de píxeles de lienzo

  /* ── LA CALIDAD ───────────────────────────────────────────────────
     Lo que la pieza está dispuesta a gastar en píxeles, y ya no hay más:
     el coste es RELLENO —varias pasadas a pantalla completa por
     fotograma—, así que lo único que de verdad mueve el reloj es cuántos
     píxeles tiene el lienzo.

       `dprMax`  tope de densidad. Por encima de 2 no se distingue y
                 cuadruplica el relleno.
       `dprMin`  suelo al recortar por `maxPx`: por debajo se ve el píxel
                 y deja de haber agua.

     AQUÍ HUBO UN `degradar()` que a los dos segundos recortaba población,
     grano, niveles del velo y ondas del dedo, y se borró porque SE MIDIÓ
     QUE NO GANABA NADA: en un Pixel 7a, 22 fps con la pieza entera y
     22 fps con la pieza recortada, el mismo número. La razón es
     estructural y vale la pena no volver a tropezar con ella: lo que
     recortaba no escala con los píxeles, y lo que cuesta sí. El `dpr` se
     calcula una vez en `setup()` y aquello no lo tocaba nunca, así que
     recortaba todo menos lo único que manda. El precio era medio banco y
     medio plancton.

     Si algún día hay que recortar de verdad, el mando es `dprMax` y se
     puede probar sin tocar nada: `?dpr=1.2` en el panel. */
  calidad: { dprMax: 2, dprMin: 0.7 },

  /* Cuánto espera un evento que le toca turno y se encuentra el cuadro
     ocupado —y SIEMPRE lo puede estar: en el abismo pasa una cosa a la
     vez, sin excepción ni bandera que la pida (ver motor/registro.js)—.
     Sin relevo se le sigue descontando el reloj, se queda en negativo y
     arranca en el mismo fotograma en que muere el que lo tapaba: salían
     encadenados.

     ES EL MANDO DEL RITMO DE LA PIEZA, y el que hay que tocar si se
     quieren más cosas o menos. Medido, tres semillas de media hora de
     reloj de escena: el cuadro tiene algo pasando el 70 % del tiempo y
     salen unos 90 eventos por hora. Subirlo vacía y bajarlo aprieta; los
     ocho eventos
     siguen saliendo todos, incluido el `cuerpo`, que es el de reloj más
     largo. */
  relevo: [25, 70],

  /* ── EVENTOS ──────────────────────────────────────────────────────
     Cada entrada: {evento, plano?, ...parámetros}. Un `porContacto: 0..1`
     deja que el dedo lo dispare, y un `cada: null` lo deja DORMIDO —está
     configurado y no sale nunca solo, que es como se prueba uno desde el
     panel sin instalarlo en la pieza.

     `banda` lo llevan casi todos y quiere decir lo mismo en todos: en qué
     franja de pantalla puede NACER, en fracción y por el eje que le toque
     según cómo se mueva —el leviatán y la carroña cruzan, así que es
     dónde cae su eje; el contagio nace en un punto, así que son los dos—.
     Es un margen y no una pared: sólo evita que algo salga con el cuerpo
     entero fuera del cuadro. Cada cosa tiene el suyo porque cada una mide
     lo suyo, y el margen va con el tamaño. */
  eventos: [
    /* la cadena de encendido: un soplo que va prendiendo la nieve marina */
    { evento: 'contagio', vel: [3, 7], salto: 6.5,
      alcance: [0.55, 1.1], cada: [55, 145], primero: [18, 55],
      /* SIN `porContacto`: el dedo y el contagio son cosas distintas y no
         se pisan. Lo que hace el dedo es encender el plancton que tiene
         cerca —su propia onda, en motor/dedo.js—; el contagio es una
         cadena que cruza el agua por su cuenta. Tocar y que además saliera
         un contagio mezclaba las dos. */
      banda: [0.12, 0.88] },

    /* ── EL LEVIATÁN ────────────────────────────────────────────────
       Imposiblemente grande, al fondo del todo, y lo que se ve de él es
       el hueco: dentro de su silueta la nieve marina se calla.

       Lo alto que ocupa lo llena la ONDULACIÓN (`onda`), no el cuerpo
       (`grosor`, que es el semigrosor): mide unas cinco veces más largo
       que ancho y lo que barre la banda es el latigazo. `velOnda` hace
       que la onda viaje del morro a la cola y `embestida` sincroniza el
       avance con el coletazo, así que no cruza a velocidad constante. */
    { evento: 'leviatan', plano: 0,
      cada: [150, 330], primero: [45, 120],
      /* En U. El tamaño se ajusta contra el alto que ocupa la MASA oscura
         (donde el apagado pasa de 0,45), no contra la penumbra, y la
         esbeltez se mantiene en ~5:1: a 8:1 lee como anguila y no como
         leviatán. */
      largo: [25, 29.8], grosor: [1.68, 2.11], onda: [3.02, 3.61],
      ondas: [1.6, 2.4], velOnda: [0.45, 0.75], embestida: 0.55,
      vel: [0.5, 0.9],
      /* `banda` es dónde puede caer su eje, y de ella sale también el tope
         de la vertical: los dos sitios que la necesitan no se pueden
         desalinear. Casi de canto a canto; el margen sólo evita que acabe
         con el cuerpo entero fuera del cuadro. */
      banda: [0.12, 0.88],
      /* `rumbo` es cuánto se aparta de la horizontal (±0,22 rad ≈ 13°) y se
         replantea cada `cadaRumbo` segundos, así que a lo largo de la
         travesía se compensa y describe un camino sinuoso. Sostener la
         diagonal lo sacaría del cuadro: con un `largo` de 25 a 30 U,
         0,22 rad todo el trayecto son más de seis U de subida. `velRumbo`
         bajo hace que vire en unos cuatro segundos y no de golpe. */
      rumbo: [-0.22, 0.22], cadaRumbo: [9, 20], velRumbo: 0.25,
      /* Sombra y no silueta, y hacen falta los dos números: el máximo de
         cada elipse cae en el espinazo, así que con `filo` a solas sale un
         canto duro o un degradado sin masa. `penumbra` agranda la elipse
         un 30 %, de modo que la silueta cae en la zona llena y el
         desvanecido ocurre fuera de ella. */
      hondura: [0.94, 1.0], filo: 2.2, penumbra: 1.3, segmentos: 22,
      /* la cresta dorsal, en campos aparte: sierra el canto de arriba y
         deja la panza lisa. Dientes desiguales.

         `cresta` es CUÁNTO SOBRESALE del lomo el diente más alto, en
         veces el semigrosor del cuerpo de ahí. El ancho no se toca desde
         aquí y no es un gusto: es media separación entre espinas, que es
         lo que hace que se toquen base con base y el canto salga una
         sierra y no pinchos sueltos. La forma del diente —base ancha y
         punta de aguja— vive en `levPua`, en eventos/leviatan.js. */
      espinas: 10, cresta: 0.80,
      /* Lo que cuelga la mandíbula bajo el cráneo, en veces el semigrosor
         del cuerpo. Es lo único de la cabeza que es un mando: el morro y
         el ojo son anatomía y viven en el evento. A 0 el bicho acaba en
         punta y deja de tener boca. */
      quijada: 1.0,
      /* `brillo` es SÓLO los dos cantos, los fotóforos y el ojo: el cuerpo
         no emite nada.

         MEDIDO sobre negro, pintándolo a mano y contando píxeles: deja 400
         píxeles por encima de 60 con un pico de 280 de 765. El mando de
         que se LEA es el ÁREA encendida y no el pico: a la mitad de
         `brillo` el pico casi no baja —250— y el área se queda en 32
         píxeles, o sea doce veces menos. Más sitios con luz, no un punto
         más brillante. */
      brillo: 0.55, fotoforos: 16,
      /* ── SU COLOR ────────────────────────────────────────────────
         De aquí sale todo lo que emite: ojo, hilo de la cresta, fotóforos
         y filo de la caudal. Un color por travesía, no por componente, y
         no es el azul del agua: el leviatán es lo único que no pertenece
         a esta pecera.

         Rojo o morado. `tono` cruza el 0 por el rojo y corta en 366: a
         378 (18°) el tramo del extremo sale ÁMBAR y el ojo parece una
         farola. `tramos` bajo porque el halo se cachea por entrada de
         paleta y aquí hay un leviatán cada vez. `giroGlow` NEGATIVO y no
         el +5 de la casa: con el +5 el halo del rojo se va al ámbar; con
         −6 el rojo tiene halo rojo y el morado, halo violeta. */
      espectro: { tono: [272, 366], tramos: 10,
                  sat: [0.86, 1.00], luz: [0.50, 0.64],
                  satGlow: [0.82, 1.00], luzGlow: [0.24, 0.34],
                  luzCore: [0.80, 0.90], giroGlow: -6 },
      /* multiplica a `brillo`, así que el mando del panel lo apaga también
         y el que manda es el PRODUCTO de los dos. Por encima de 1 y no es
         contradictorio con «sutil»: el leviatán vive en el plano del
         fondo, a un tercio de resolución y al 58 % de alfa, así que por
         debajo de 0,6 de producto el punto se disuelve en el borrón. A
         0,7 es un alfiler rojo (185,55,40 el píxel más alto) y sigue sin
         alumbrar nada; pasado 1,2 el núcleo se satura y el ojo deja de
         ser rojo para ser una farola blanca. */
      brilloOjo: 1.3,
      /* ── Y EL LOMO ───────────────────────────────────────────────
         Le dan color al canto de arriba, que sólo tenía la sierra oscura
         de los campos. Los dos van CORTOS a propósito —el leviatán es un
         hueco, no un dibujo— y los dos multiplican a `brillo`:

           `brilloLomo`    velo ancho de `glow` siguiendo el diente de
                           sierra, en un trazo de 0,30 U. No es un filo:
                           lo que se lee es que por encima del lomo el
                           agua tiene un color que no es el suyo.
           `brilloEspinas` la punta de cada diente encendida, con halo de
                           0,17 U contra los 0,24 de un fotóforo. Late
                           desacompasada del coletazo.

         AJUSTADOS POR AMPLITUD Y NO POR LUZ TOTAL: lo que dice si un
         detalle se lee es cuánto sube el píxel más alto, no cuánta luz
         suma. El velo del lomo aporta un tercio de lo que emite la bestia
         y casi no se ve, porque lo reparte por veinte mil píxeles: contra
         el hilo de la panza —347 de 765— va a una trigésima parte, y las
         espinas a una docena de veces menos. */
      brilloLomo: 0.55, brilloEspinas: 2.0 },

    /* ── LA CARROÑA ─────────────────────────────────────────────────
       Algo muerto que se hunde, y NO EMITE NADA: se ve sólo mientras pasa
       por la luz de alguien. Va en el plano de en medio —al fondo, a un
       tercio de resolución, un esqueleto es una mancha, y delante taparía
       demasiado cuadro durante el minuto que tarda en bajar.

       `vel` baja porque lo que tiene que dar es el tiempo largo de la
       pieza: a 0,55 U/s tarda unos 50 s en cruzar de arriba abajo. `giro`
       es el volteo, en centésimas: una vuelta cada minuto. `caida` y
       `ganancia` altas son «hay que ponerse cerca, pero entonces se ve
       bien»; `base` es lo que se intuye sin nada, y va mínimo. */
    { evento: 'carrona', plano: 1,
      cada: [130, 280], primero: [35, 95], banda: [0.14, 0.86],
      vel: [0.55, 0.95], largo: [5.2, 9.0],
      giro: [-0.10, 0.10], deriva: 0.25,
      /* ── SIEMPRE HUESO ───────────────────────────────────────────
         Marfil mate, y fijo: un esqueleto que coge el color del foco que
         lo alumbra no se lee como esqueleto sino como otro bicho
         encendido. Lo que cambia con la luz que le llega es cuánto se ve
         y por dónde, y eso ya lo hace vértebra a vértebra.

         `sat` muy baja y `luz` alta es hueso y no ámbar; `tramos` a 4
         porque del rango sólo se pide que una carroña salga marfil y la
         siguiente algo más gris. */
      espectro: { tono: [30, 48], tramos: 4,
                  sat: [0.10, 0.20], luz: [0.80, 0.90],
                  satGlow: [0.14, 0.26], luzGlow: [0.26, 0.36],
                  luzCore: [0.93, 0.98], giroGlow: 4 },
      /* ── LA ANATOMÍA, Y NO HAY DOS IGUALES ───────────────────────
         `vertebras`, `costillas` y `chevrones` son cuántas piezas tiene;
         `caja` lo abombado del pecho, que entra en el perfil del cuerpo y
         por tanto manda también sobre lo que TAPA y sobre el largo de las
         costillas; `falta`, la probabilidad de que una costilla suelta no
         esté, por lados —una jaula completa y simétrica se lee como un
         dibujo—; `craneo`, la de que le quede cabeza. */
      vertebras: [11, 16], costillas: [6, 9], chevrones: [3, 6],
      caja: [0.30, 0.90], falta: 0.18, craneo: 0.86,
      /* `alcance` agranda el radio con el que un foco la revela, y es la
         única licencia de este evento: los radios de `alcanceCuerpo` están
         puestos para un pez oscuro y un esqueleto es pálido y mate, así
         que se le ve desde más lejos. Sin esto no se enciende nunca.

         Ajustado por COBERTURA —qué fracción del lienzo tiene luz
         bastante para revelarla— y no por travesías, que dependen de por
         dónde caiga. A 3,2 sale ~10 %: casi siempre hay algún hueso
         iluminado y casi nunca todos. */
      alcance: 3.2,
      caida: 2.2, ganancia: 1.9, techo: 1.5, base: 0.025,
      /* Tapa, y también a oscuras: es lo que la convierte en un cuerpo.
         `filo` mucho más bajo que el del rape (28) porque un esqueleto no
         es macizo: se le cuela luz entre las costillas. */
      tapa: 0.85, tapaFilo: 6,
      /* la descomposición va prendiendo la nieve marina a su paso */
      enciende: 0.55 },

    /* ── EL VISITANTE ───────────────────────────────────────────────
       El poliqueto que cruza el fondo cada tanto, tan tenue que casi no
       está. `patas`, `antenas` y `cola` son el detalle: a 0 vuelve a ser
       la cadena de cuentas pelada.

       Es el evento que más se repite —cae cada minuto o dos—, así que lo
       que se sortea por travesía son las PROPORCIONES y no sólo el
       tamaño:

         `grosor`  el grueso del cuerpo, casi al doble de un extremo a otro.
         `merma`   cuánto adelgaza hacia la cola: 0,18 es un tubo, 0,70 un
                   cono.
         `panza`   dónde tiene lo más gordo. A 0, en la cabeza; a 0,42, un
                   bulto a un tercio del morro, que es un huso.
         `cuentas` con el largo ya sorteado, lo que cambia es la SEPARACIÓN
                   entre ellas: dieciocho dan segmentos marcados, cuarenta
                   un cuerpo casi liso. No llega a collar en ningún caso
                   —el halo de una cuenta mide 93-177 px y la separación
                   11-43.

       `variedad` abre además los tres apéndices, cada uno por su lado. Va
       alto y asimétrico, así que de vez en cuando uno sale a 0 y cruza un
       bicho sin parapodios o sin antenas. A 0 todos son el mismo. */
    { evento: 'visitante', plano: 0,
      cada: [50, 120], primero: [15, 42],
      cruce: [28, 46], cuentas: [18, 40],
      /* ── EL TAMAÑO, Y LA CAJA QUE MANDA ES EL MÓVIL DE PIE ──────
         `largo` va en U y el cuadro enseña `escala` U de lado, así que un
         largo se lee como fracción de pantalla distinta según la caja. A
         25 U el bicho medía el 204 % del ancho de un móvil de pie —el
         doble de la pantalla—, y de un cuerpo que no cabe entero dos veces
         no se ve un animal, se ve una pared que pasa. A 18 queda en el
         147 % ahí y en el 79 % de un portátil: sigue entrando y saliendo,
         que es lo suyo, pero se le ve la forma. */
      largo: [12.5, 18.0], onda: [0.59, 1.95],
      grosor: [0.38, 0.62], merma: [0.18, 0.70], panza: [0, 0.42],
      /* Tapa la nieve marina por el espinazo, que es lo que lo convierte
         en un cuerpo que PASA por delante en vez de un dibujo que se suma
         encima. `tapaFilo` entre el del rape (28, macizo) y el de la
         carroña (6, un esqueleto con huecos): un poliqueto es blando,
         tiene canto pero no filo. */
      tapa: 0.9, tapaFilo: 14,
      /* ── Y EL BRILLO, QUE NO VA CON EL TAMAÑO ───────────────────
         MEDIDO sobre negro, sin bichos ni velo ni grano, tomando el peor
         fotograma de siete por travesía: el visitante MÁS PEQUEÑO era el
         que más pico daba —118 de 255 contra 99 el más grande—, porque
         con el cuerpo corto las cuentas se solapan y sus halos se suman.
         O sea que bajar el tamaño no baja el brillo: hay que bajar los
         dos. A 0,18 el pico del grande cae de 99 a 79 y los píxeles por
         encima de 60 se quedan en la mitad. */
      variedad: 0.8, brillo: 0.18,
      patas: 0.95, antenas: 1.5, cola: 1.7 },

    /* ── EL CUERPO ──────────────────────────────────────────────────
       No dibuja NADA: la silueta es de campos `apaga`, así que lo que baja
       es el hueco de un cuerpo humano. `alto` va en U, y tiene un suelo
       —por debajo de unas cuatro deja de reconocerse y es una mancha con
       forma rara— y un techo, que es que quepa tumbado. Lo que hace el
       evento es que se RECONOZCA.

       El más lento y el más raro de la pecera. A 0,36-0,66 U/s cada cuerpo
       tarda entre 48 y 80 segundos en bajar, que es el rato que hace
       falta para dudar de lo que se está viendo; con `cada` de seis a doce
       minutos no se convierte en decorado. `giro` en centésimas: una
       vuelta cada dos minutos. Caen de uno a tres, escalonados. */
    { evento: 'cuerpo', plano: 1,
      /* `cada` sube con los cuerpos de dos en dos y de tres en tres: con
         el desfase, una tirada de tres dura casi el doble que una sola, y
         a reloj igual el evento se comía más cuadro del que le toca.
         Medido, tres semillas de media hora: [360,720] deja al cuerpo en
         el 6-16 % de los fotogramas —sale dos o tres veces por tirada, así
         que el reparto es ruidoso; lo firme es que es de los que más
         ocupan—. Y ahora que pasa una cosa a la vez, lo que ocupa se lo
         quita a los otros siete: por eso éste lleva el reloj más largo de
         la escena. */
      cada: [360, 720], primero: [110, 250], banda: [0.16, 0.84],
      /* ── EL TAMAÑO SE JUZGA TUMBADO ─────────────────────────────
         `alto` va en U, así que el cuerpo ocupa una fracción distinta
         según cómo se sostenga el aparato, y la caja apretada es el móvil
         TUMBADO: ahí 7,8 U eran el 64 % del alto del cuadro y el bicho
         pasaba de «algo que baja» a «algo que no cabe». A 6,2 se queda en
         el 51 % tumbado, el 39 % de un portátil y el 23 % de un móvil de
         pie. Y el rango se abre un poco —1,55 contra 1,43— porque los
         cuerpos se ven de uno en uno, separados por `retraso`: la
         variedad sólo se lee comparando con el recuerdo del anterior.

         `vel` sube un 20 %, que es lo que cabe sin tocar el tema: lo que
         hace el evento es dar tiempo a dudar de lo que se está viendo.
         Con estos, un cuerpo tarda 48-80 s en cruzar un móvil de pie y
         27-43 s tumbado, contra los 62-106 y 36-59 de antes. */
      alto: [4.0, 6.2], vel: [0.36, 0.66],
      giro: [-0.055, 0.055], deriva: 0.22,
      /* `cuantos` es cuántos caen en una tirada y `retraso` los segundos
         que tarda cada uno en asomar detrás del anterior. El retraso es
         LARGO —10-30 s, y el cuerpo tarda 48-80 en bajar— porque no son
         tres cuerpos a la vez sino una formación: cuando el segundo entra
         por arriba el primero va ya por la mitad del cuadro. Cada uno
         lleva su sitio, tamaño, velocidad, volteo, postura y flexión. */
      cuantos: [1, 3], retraso: [10, 30],
      /* La del ahogado es la postura de reposo; esto es cuánto se aparta
         de ella cada cuerpo. `abre` multiplica el ángulo del hombro y de
         la cadera, `dobla` el del codo y de la rodilla. En los brazos,
         `abre` a 0,70 los deja en cruz y a 1,22 casi verticales sobre la
         cabeza. */
      abre: [0.70, 1.22], dobla: [0.3, 1.8],
      /* ── Y LO QUE LO HACE BLANDO ─────────────────────────────────
           `arqueo`  cuánto se arquea el espinazo, constante y con el signo
                     sorteado: uno baja recogido hacia delante y el
                     siguiente arqueado hacia atrás.
           `onda` ·  y cuánto le RECORRE, con su largo y su velocidad.
           `ondas`   Media onda por cuerpo y muy despacio: en un cuerpo de
           `velOnda` trescientos píxeles, 0,04 de onda son unos doce, y se
                     recorren en medio minuto. No se pide que nade, sino
                     que se le note que el agua lo mueve.
           `vaiven`  cuánto se va cada MIEMBRO de su postura. Cada eslabón
                     cuelga de su hueco y lleva su propia fase, así que
                     0,30 rad se leen como un brazo suelto en el agua.

         La flexión pesa por la distancia al ombligo, así que el tronco
         aguanta y lo que se dobla son la cabeza y los pies, arrastrando
         con ellos los miembros que cuelgan de ahí. */
      arqueo: [0.04, 0.13], onda: [0.02, 0.055],
      ondas: [0.35, 0.8], velOnda: [0.10, 0.26], vaiven: 0.30,
      /* `hondura` casi a 1 y `penumbra` como en el leviatán: el máximo de
         cada elipse cae en su centro, así que sin agrandarlas la silueta
         cae donde el apagado ya se desvanece y no hay masa oscura. `filo`
         más bajo que el del leviatán (2,2) porque aquí los trozos son
         finos —un brazo— y con canto duro se despegan. */
      hondura: [0.92, 1.0], filo: 1.8, penumbra: 1.25,
      /* ── EL CANTO, CUANDO ALGO LO ALUMBRA ────────────────────────
         El agua de la mitad de abajo ya es casi negra —[0,1,3] contra
         [4,13,21] del techo—, así que ahí un hueco negro sobre negro no
         se lee y el cuerpo se pierde justo mientras baja.

         NO SE LE PONE LUZ DESDE LA ESCENA, que es lo que la regla de la
         casa prohíbe: se enciende lo que un foco de verdad alcanza. La
         luz se acumula COMO VECTOR y sólo se pinta el lado del canto que
         mira a ella; el de sombra se queda negro.

           `borde`      la ganancia sobre la luz que le llega, no un
                        brillo suyo: a 0 el evento no dibuja nada.
           `bordeAlcance` agranda el radio con el que un foco lo revela.
                        Va alto porque los radios de la casa revelan un
                        pez y esto mide medio cuadro: medido, lo más cerca
                        que le pasó algo en una travesía fueron 320 px
                        contra radios de 16 a 125.
           `bordeCaida` alta es alcance corto. Curva de `luzRecibida`
                        —pow(1/(1+d²/r²), caida)—, sin el corte en el
                        radio de la carroña: con corte sale todo o nada.
           `bordeTecho` el tope, con rodilla blanda. La luz recibida va de
                        0,02 a más de 1, y sin techo el canto se clava en
                        alfa 1 cada vez que se acerca una medusa: de hueco
                        pasa a figura recortada en blanco.
           `bordeTono`  GRIS casi neutro: es carne mojada, no un hueso ni
                        un bicho que emite.
           `bordeTinte` lo poco que coge del color de quien lo alumbra. A
                        0 se despega de la escena; a 1 parece otro bicho.
           `bordeTapado` desde qué campo `apaga` se da un trozo de canto
                        por ENTERRADO en otra parte del cuerpo —el brazo
                        cruzando el hombro— y no se pinta. Sin esto salen
                        rayas por dentro de la masa y el cuerpo se lee
                        como un despiece.

         Medido sobre doce cuerpos con luz por los cuatro lados: de 74
         trozos de canto se encienden 27, 37 quedan de espaldas y 10 salen
         enterrados. Que la mitad esté siempre negra es lo que mantiene al
         cuerpo siendo un hueco. El alfa del trazo va de 0,04 a 0,20. */
      borde: 2.2, bordeAlcance: 4.2, bordeCaida: 2.0, bordeTecho: 0.09,
      bordeGrosor: 0.05, bordeTono: [182, 196, 204],
      bordeTinte: 0.22, bordeTapado: 0.25 },

    /* ── EL GLITCH ──────────────────────────────────────────────────
       Una o dos medusas se quedan pintadas en bandas escalonadas
       mientras las otras están perfectas. No dibuja nada: reparte campos
       `tajo` y los aplica el motor al pintar (ver `pintaBicho`). El
       mecanismo, en eventos/glitch.js; aquí va el reglaje.

       `radio` decide CUÁL de las cuatro medusas le toca, así que va a
       unas ocho U —media pantalla de alto en apaisado—: más grande les
       toca a todas y más chico a ninguna. `parte` a 1 rompe a todas las
       que caen dentro; con sólo cuatro candidatos, bajarlo deja el
       evento en que no pase nada, y el «sólo algunos» ya lo da el foco.
       En una pecera con más cosas rompibles hay que bajarlo.

       `bandas` y `paso` son los pasitos DENTRO del bicho: 8-14 bandas de
       0,11 a 0,24 U, una pila de una a tres U que cruza la campana
       entera. Los tentáculos caen en la última banda y se van en bloque.

       `sep` y `estira` son el tope a plena rotura y los dos salen del
       mismo `k`, así que la rotura crece y decrece como una sola cosa.

       CUIDADO AL SUBIR `bandas` O `radio`: cada banda es un dibujo
       entero del bicho. Una medusa cuesta 0,069 ms normal y 0,050 por
       banda, así que el peor caso —cuatro medusas con catorce bandas—
       son 2,6 ms sobre un fotograma de 8,3. Con este `radio` le toca a
       una o dos: 0,7-1,3 ms, y sólo durante los tirones. */
    { evento: 'glitch',
      cada: [240, 540], primero: [70, 200],
      dura: [14, 24], saltos: [22, 40], salto: [0.22, 0.50],
      focos: [1, 2], radio: [5.85, 10.1],
      bandas: [8, 14], paso: [0.108, 0.235],
      sep: 0.61, estira: 0.85,
      avance: 0.14, giro: [0.20, 0.70],
      parte: 1,
      /* `filo` alto: el foco queda casi plano dentro de su radio, así que
         el que le toca se rompe ENTERO. Con `filo` bajo, los del borde
         salen medio rotos y eso se lee como que la imagen tiembla. */
      filo: 3 },

    /* ── LA FLORACIÓN ───────────────────────────────────────────────
       Una onda de color que cruza el banco: al pez que le pasa el frente
       por encima se le enciende SU tono saturado y se le va despacio. No
       dibuja nada —lo que se ve son los peces— y no trae color: el color es
       de cada pez (ver `tinteSat` en el banco).

       `vel` va a la mitad que la del contagio y `salto` —el grosor del
       anillo, en U— al doble: los peces son cuarenta en toda la pecera, así
       que un frente rápido y fino no se lee como una ola, se lee como peces
       sueltos cambiando. Con estos, la onda tarda unos ocho segundos en
       cruzar el cuadro. */
    { evento: 'floracion', vel: [1.6, 3.0], salto: 7.0,
      alcance: [0.6, 1.1], filo: 1.4, banda: [0.12, 0.88],
      cada: [90, 210], primero: [25, 70] },

    /* ── LA GEMACIÓN ────────────────────────────────────────────────
       Una medusa echa una cría por el costado y la cría se va haciéndose
       pequeña. El evento no dibuja nada y no elige a nadie: empuja una
       orden en el agua con cupo para UNA, y la primera medusa que la lee se
       la queda (ver eventos/gemacion.js). Lo que dura la maniobra y lo
       grande que sale la cría son de ella, no de aquí: están en su entrada,
       abajo.

       `espera` es lo que el evento aguanta sin que nadie lo coja —con las
       medusas de la pecera siempre hay alguna, así que es una red por si un
       día no hay—. `cada` va largo: es de las cosas que se miran, y a menudo
       deja de ser un hallazgo. */
    { evento: 'gemacion', espera: 6,
      cada: [150, 340], primero: [40, 110] },
  ],

  /* ── BICHOS ───────────────────────────────────────────────────────
     Cada entrada: {especie, plano?, ...parámetros}. En aditivo sumar es
     conmutativo, así que el orden de la lista no cambia un píxel. Un
     `paleta` o un `espectro` le dan colores propios a esa especie. */
  bichos: [

    /* nieve marina: mucha, lenta y casi apagada. Sólo existe de verdad
       cuando una esca pasa cerca. */
    { especie: 'plancton',
      /* CUÁNTAS MOTAS HAY, y son ésas en cualquier pantalla. El cuadro
         enseña siempre 324 U² de mar, así que la cuenta no puede depender
         de los píxeles que tenga el aparato. */
      total: 600,
      reparto: [0.50, 0.32, 0.18],
      /* Dos arcos de tono: el frío ancho y un segundo cálido con peso
         bajo, unas pocas motas ámbar entre cientos de azules. Las ascuas
         de `raro` son otra cosa y van aparte. La saturación sube poco: una
         nieve marina de colores saturados es confeti. */
      espectro: [
        { tono: [166, 262], tramos: 16,
          sat: [0.16, 0.62], luz: [0.72, 0.90],
          satGlow: [0.25, 0.55], luzGlow: [0.15, 0.27] },
        { tono: [24, 66], tramos: 6, peso: 0.14,
          sat: [0.20, 0.58], luz: [0.70, 0.86],
          satGlow: [0.26, 0.50], luzGlow: [0.14, 0.24] },
      ],
      /* variedad de tamaño y de brillo: es lo que evita que tanta mota se
         lea como una textura regular */
      /* en U, como todo lo demás: a 0,0060-0,0323 una mota mide de 0,28 a
         1,5 px en una ventana de escritorio y algo menos en un móvil, que
         es lo que toca —el px del móvil mide la mitad. */
      radio: [0.0060, 0.0323], alfa: [0.025,0.14], alfaAlto: [0.16,0.42],
      destacadas: 0.07,
      /* LA ASCUA: el color excepcional, y es de esta especie y de nadie
         más. `raro` es con qué probabilidad le toca a una mota. */
      raro: 0.02, colorRaro: ROJO,
      apaga: 0.78,                // el rastro dura lo suyo
      enciende: 3.8,
      /* ── LO QUE LE HACE EL DEDO ─────────────────────────────────
         Son las dos mitades del gesto, porque el contacto no dibuja nada:
         `enciendeDedo` es con cuánta gana sube el BRILLO y `creceDedo`
         cuánto se HINCHA la mota. `apagaDedo` deja la hinchazón en la mitad
         en 0,4 s: lo que tiene que leerse es un destello que pasa y no una
         mota gorda que se queda.

         EL QUE MANDA ES `topeDedo`, y el motivo es que esto SUMA. Al brillo
         pleno el punto y el halo se pasan de 255, el canal que satura
         primero se queda plano y la mota deja de tener color: sale blanca,
         y encima el velo le devuelve su propio borrón y la blanquea más. A
         0,55 el tono se sigue leyendo. Con el tope puesto, `enciendeDedo`
         ya sólo decide lo rápido que llega, no a cuánto.

         Y el crecimiento va CORTO: a 0,7 la mota queda en 2,2 veces su
         radio de reposo, poco más que las 1,9 a las que la deja una esca
         que pase cerca. Por encima de 1,5 no es un destello, es un bulto. */
      enciendeDedo: 2.2, topeDedo: 0.55, creceDedo: 0.7, apagaDedo: 0.2,
      /* ── LO QUE CAE CADA MOTA, Y ES UN RANGO A PROPÓSITO ────────
         Con un solo número para todas, la nieve marina rebotaba contra el
         cristal EN BLOQUE y el reparto vertical se iba: al minuto el
         techo al 0 % y el suelo al 19 %, y a los seis minutos al revés.
         Abierto —y con el sentido sorteado al nacer, que es la otra
         mitad, en bichos/plancton.js— ninguna franja se sale del 7-13 %
         en quince minutos. La media se queda donde estaba, 0,16. */
      caida: [0.08, 0.24],
    },

    /* LAS MEDUSAS. El otro foco que se mueve: grandes, encendidas en todo
       su volumen, y lo que hacen es ALUMBRAR DE PASO. Pocas y lentas. */
    { especie: 'medusa',
      por: [1, 1, 1],
      /* Frío y tirando a violeta, para no competir con el moteado del
         banco. `luzCore` por debajo del 0,95 de la casa: la campana son
         nueve capas aditivas de `core`, y con 0,95 esas nueve suman
         blanco. */
      espectro: { tono: [184, 272], tramos: 12,
                  sat: [0.52, 0.90], luz: [0.62, 0.80],
                  satGlow: [0.45, 0.75], luzGlow: [0.14, 0.24],
                  luzCore: [0.84, 0.90] },
      /* EL MÁXIMO LO PONE EL MÓVIL DE PIE, medido en la campana del plano
         de delante —`radio · planos[2].scale · ancho · U`—: a 1,35 medía
         el 35 % del ancho del cuadro y a 1,10 mide el 28 %. De pie es el
         caso que aprieta porque `U` va con la DIAGONAL, así que el mismo
         número ocupa más proporción de ancho cuanto más estrecha sea la
         caja. Y el tope gobierna la nube de paso: todo el bicho sale de
         `j.r`. El mínimo no se toca: la variedad de tamaño es lo que hace
         que tres medusas en tres planos se lean como tres distancias. */
      radio: [0.55, 1.10], banda: [0.04, 0.96],
      /* El largo de los tentáculos por plano: al fondo la nube se recoge
         además de encogerse, o la medusa lejana arrastra una melena tan
         larga como la de cerca. Vive aquí y no en `ABISMO.planos` porque
         no lo usa nadie más. */
      tent: [0.62, 0.85, 1.00],
      nTent: [12, 26], canales: [7, 11], brazos: [3, 5],
      periodo: [2.6, 4.8], empuje: 2.4, arrastre: 0.28,
      flota: [0.55, 1.45], patrulla: [0.06, 0.42],
      vigor: [0.45, 1.0], brillo: 0.9,
      tilt: [0.05, 0.26], tiltVel: [0.15, 0.55],
      perfil: [0.50, 0.84], ancho: [0.82, 1.20], alto: [0.80, 1.22],
      faldon: [0.22, 0.48], mEnv: [0.7, 1.3], mBase: [0.45, 0.80],
      lobulos: [5, 9], ensancha: [0.10, 0.26], achata: [0.10, 0.26],
      cuelga: 2.6, alcanceLuz: 3.4, alcanceCuerpo: 2.2, emision: 0.55,
      /* ── LA CRÍA, CUANDO LE TOCA GEMAR ─────────────────────────
         `gemaVida` es lo que dura la maniobra entera, en segundos, y va
         LARGA: su pulso tarda de 2,6 a 4,8 s, así que por debajo de diez
         segundos la cría sale y se va sin que haya latido tres veces y eso
         se lee como un salto, no como que ha brotado. Dentro de esa vida el
         reparto es fijo —brota el 30 %, se suelta el 20 % y se va el 50 %:
         ver `pasoCria`—.

         `gemaEsc` es lo grande que sale respecto a su madre: a la mitad se
         lee como cría; por encima de 0,7 se lee como que hay dos medusas y
         una se va, que es otra cosa. `gemaLejos` es hasta dónde llega,
         medido en radios de su madre: lo que se ve es que se aleja, así que
         tiene que salir del sitio donde ha nacido —a menos de cinco radios
         parece que se apaga en el mismo punto. */
      gemaVida: [15, 24], gemaEsc: [0.42, 0.58], gemaLejos: [7, 11],
      /* ── SE LADEA AL PASAR EL DEDO ─────────────────────────────
         El mismo mecanismo y los mismos tres números que el banco, con
         dos diferencias:

           el ladeo va en una velocidad APARTE de la del pulso, o su
           `arrastre` —que la deja en la mitad en medio segundo— se lo
           comería y la medusa acabaría donde estaba;

           `apartaVuelve` más alto (0,78 contra 0,70): es lo más lento de
           la pecera, así que su ladeo va y vuelve en unos cinco segundos
           en vez de en tres.

         MEDIDO tocando a 1,2 U de una medusa del plano de delante: punta
         de 1,72 U/s a un tercio de segundo y 3,6 U de ladeo en total, o
         sea dos campanas y media. Las de atrás se ladean menos: `drift`
         les recorta la velocidad igual que se la recorta al pulso.

         Y EL 3,3 ES COMPENSACIÓN, no un cambio de gusto: al acotar el
         empujón con `dedo.empuja` —que es global— la medusa perdía un
         tercio de ladeo sin que nadie lo hubiera pedido. A 3,3 la curva
         vuelve a ser la de antes decimal a decimal (3,64 U contra 3,65).
         Si algún día se toca `empuja`, este número va detrás. */
      apartaDedo: 3.3, aparta: [0.7, 1.2], lag: [7, 12],
      apartaVuelve: 0.78,
      /* ── Y RECELA DE LAS TRAMPAS ───────────────────────────────
         `recela` es a cuántas U de un señuelo empieza a apartarse y
         `recelo` la VELOCIDAD del desvío pegada al foco, en U/s —una
         velocidad y no una fuerza: ver por qué en bichos/medusa.js—. El
         radio lo escala el propio `senuelo` del foco, igual que hace la
         `atraccion` del banco: es la misma cuenta con el signo cambiado,
         así que una esca apagada ni atrae ni espanta.

         PARA MEDIR ESTO HACEN FALTA MUCHAS MUESTRAS: con una medusa y
         cinco minutos el ruido entre semillas es de ±1,5 U y tapa el
         efecto entero. Con seis en el plano y cinco semillas sale limpio
         —con la esca encendida el tiempo que pasan a menos de 4 U de ella
         es del 12,7 % contra el 24,7 % sin recelo—, y dura: con la esca
         ya apagada la media se queda 1,6 U más lejos.

         Y NO LA PONE NERVIOSA, que es lo que acota el valor: los
         percentiles de su velocidad real no se mueven ni una milésima
         (p50 0,417 · p90 0,845 · p99 1,26 U/s, con recelo y sin él). Se
         aparta dentro de lo que ya se movía. Una medusa que huye deja de
         ser una medusa. */
      recela: 5.0, recelo: 0.9,
      borde: 0.8,
    },

    { especie: 'copepodo',
      total: 10,
      reparto: [0.30, 0.40, 0.30],
      /* un trazo de medio milímetro: pálido y frío, no un organismo de color */
      espectro: { tono: [176, 232], tramos: 8,
                  sat: [0.28, 0.62], luz: [0.70, 0.86],
                  satGlow: [0.30, 0.52], luzGlow: [0.15, 0.25] },
      espera: [0.9, 3.4], tiron: [1.8, 4.4], frena: 0.02, borde: 0.5,
    },

    { especie: 'rape',
      /* Uno, y dos en pantalla grande. Ninguno al fondo: un rape lejano es
         una mancha sin dientes, barbilla ni ojo. Números sueltos porque
         por área esto no se puede decir. */
      por: [0, 0, 1],
      /* GRANDE: es lo que sostiene el detalle —miómeros, cristalino,
         dientes y barbilla no existen por debajo de cierto tamaño—. Pero
         la caja que manda es el MÓVIL DE PIE: `largo` va en U y además lo
         multiplica el `scale` 1,32 del plano de delante, así que a 7,4 el
         bicho medía el 80 % del ancho de esa pantalla. A 6,7, el 72 %.
         El mínimo baja poco: por debajo de 5 se le empieza a caer el
         detalle, que es lo que lo sostiene. */
      largo: [5.1, 6.7],
      brillo: 1.15,               // el del señuelo: éste sí quema
      /* El cuerpo casi no se ve, y aquí se decide: `cuerpo` escala la luz
         recibida y `techo` la recorta ANTES de escalarla. */
      cuerpo: 0.62, techo: 1.25,  // el del animal: un susurro
      /* `proa` reparte la piel entre un suelo uniforme y un término que cae
         hacia la cola: alto, del fogonazo se ve sobre todo la boca. No
         llega a 1 para dejar suelo —sin él el cuarto de atrás es un
         agujero. */
      proa: 0.90,
      /* ── EL COLOR DEL RAPE ─────────────────────────────────────
         Un arco, un color por bicho y ninguna excepción: morado →
         magenta → rojo → vino. Corta en 364 (4°) porque de ahí para
         arriba el rojo se va al salmón —el tramo de 12° sale (251,86,45)
         y en pantalla lee cobre, no sangre. Se sortea al nacer y lo usan
         la esca, el cuerpo, la barbilla y la pupila: no hay un color por
         componente, y la posición de la luz decide por dónde se enciende,
         no de qué color es.

         La diferencia entre EL FOCO y EL SUSURRO la sostienen sólo el
         alfa —`brillo` 1,15 contra `cuerpo` 0,62— y el núcleo blanco de
         la esca, así que `luz` y `luzGlow` van a media altura: sirven
         para los dos usos. `giroGlow` NEGATIVO, contra el +5 de la casa:
         con el halo tirando al azul un rape rojo sale magenta y deja de
         ser sangre. */
      espectro: { tono: [268, 364], tramos: 18,
                  sat: [0.66, 0.96], luz: [0.44, 0.58],
                  satGlow: [0.66, 0.92], luzGlow: [0.22, 0.32],
                  luzCore: [0.80, 0.90], giroGlow: -5 },
      /* punto pequeño y quemado, no mancha grande y suave */
      esca: 0.050,                // radio del señuelo, en largos
      difusion: 2.9,              // cuánto se derrama alrededor
      /* En largos, así que el radio crece con el bicho. Chica e intensa: a
         1,05 el halo se come un tercio del cuadro y eso no es una lámpara
         con corona, es el agua teñida. */
      halo: 0.45,                 // corona de la lámpara, en largos
      nucleo: 0.34,               // el corazón blanco: deja ver el tono
      /* Nunca se apaga del todo: la esca es el único punto de referencia
         que hay aquí abajo. El techo pasa de 1 porque es lo ÚNICO que
         tiene que quemar. */
      intensidad: [0.42, 1.00],
      /* ── Y CUANDO ESTÁ SACIADO ─────────────────────────────────
         El parpadeo sigue, pero aquí abajo: mientras dura `reposo` la esca
         queda CASI apagada, a un séptimo de lo que da normalmente. No a
         cero, porque es el único punto de referencia del cuadro —lo que
         tiene que leerse es una brasa, no un hueco.

         DE AQUÍ SALEN TRES COSAS, no una, porque las tres cuelgan del
         brillo de ahora normalizado contra `intensidad[0]`: lo que se ve,
         lo que TIRA (`senuelo`, que la presa multiplica por su
         `atraccion`) y hasta dónde enciende plancton (`rLuz`). Bajar sólo
         lo que se ve sería cosmético: el banco seguiría acudiendo a un
         señuelo negro y quedaría una nube de motas prendidas alrededor.

         MEDIDO en pantalla, en un cuadro de 140 px alrededor de la esca:
         lo que se derrumba es la CORONA, no el punto. Los píxeles por
         encima de 120 pasan de 17.454 a 671 —26 veces menos— y la luz
         total cae 3,9 veces, pero quedan 5.296 píxeles por encima de 60.
         O sea que deja de ser una lámpara y sigue siendo una brasa, que es
         lo que se le pide: sin ella el cuadro se queda sin ancla.

         Y ES EL SUELO DE LO QUE TIRA. `escaSaciada[1]` no sólo dice lo
         apagada que se queda: es el punto en el que `senuelo` llega a
         CERO, así que de este número depende que una esca apagada deje de
         atraer del todo (ver `senuelo` en bichos/rape.js). Subirlo apaga
         la trampa antes; bajarlo la deja tirando más rato.

         MEDIDO sobre diez minutos y dos semillas, con el rape saciado el
         60-71 % del tiempo: el cebado del banco sobre una esca APAGADA
         cae de 47-49 pez·segundo a 6-8, o sea del 42-49 % de todo el
         cebado al 9-11 %. Lo que queda es el segundo que tarda el brillo
         en bajar al tragar, que es justo lo que hay que ver.

         Y la trampa no pierde: el cebado con la esca encendida SUBE
         (50→52 y 64→86 pez·segundo), porque el banco deja de gastar la
         mitad del rato en un señuelo que no responde. */
      escaSaciada: [0.06, 0.16],

      /* Delante del morro, no encima del lomo: es para lo que sirve, y es
         lo que mantiene al pez a oscuras —cuanto más separada está la luz
         de la boca, más grande es lo que no se ve. En LARGOS. */
      delante: 0.46, encima: 0.26,
      muelle: 34, freno: 7.0,     // baja el muelle y se retrasa más al girar

      /* ── LO QUE TAPA ───────────────────────────────────────────
         Todo se pinta sumando, así que por defecto ningún cuerpo puede
         taparle a otro. `tapa` es la oclusión por el único camino que un
         aditivo permite: no se añade negro, se le quita la luz al que
         estaba detrás. Es contra los DEMÁS bichos —que el rape se vea a
         través de sí mismo es el diseño, explicado en bichos.js.

         Tapa SIEMPRE, también negro sobre negro: aunque no se dibuje un
         píxel de él, se le encuentra por la AUSENCIA de motas.

         `tapaFilo` es lo que lo hace leer macizo: entra como
         pow(1 - d/r, 1/filo), así que a `filo` bajo el apagado se
         desvanece antes del canto y se cuela luz por dentro de la silueta
         —29,6 % con filo 5, 4,8 % con filo 28. */
      tapa: 1, tapaFilo: 28,

      /* `vigila` son los largos en los que algo le llama la atención;
         `velMira` lo que tarda el ojo en llegar; `pupila`, cuánto se
         desplaza dentro del ojo. `destelloOjo` es el tapetum, y sólo se ve
         en la penumbra. */
      vigila: 1.9, velMira: 2.4, pupila: 0.40, destelloOjo: 2.6,
      /* La pupila NUNCA se apaga: emite por su cuenta, así que al rape se
         le encuentra siempre si se le busca. Es la única excepción
         declarada a la regla de la casa, y va baja —a 0,45 deja de ser un
         pez a oscuras con los ojos encendidos y pasa a ser dos ojos
         flotando. */
      ojoBrillo: 0.20,

      /* Radianes que abre la quijada al bombear las branquias. El ritmo va
         por bicho, o los rapes respirarían a la vez. */
      respira: 0.055, ritmoRespira: [1.7, 2.7],

      /* Se congela al ser alumbrado: 0 lo deja como estaba, 1 lo clava. A
         0,85 lo único que se mueve cuando algo lo descubre es la pupila. */
      congela: 0.85,

      /* Quién ve a quién: `alcanceLuz` es a qué distancia enciende plancton
         —el aspecto— y `alcanceCuerpo` a qué distancia una esca REVELA a
         otro pez —el mecanismo. */
      alcanceLuz: 0.62,           // largos en los que enciende plancton
      /* El rape vive a oscuras y estos cuatro lo sostienen. Deciden cuándo
         se ENCIENDE, no cuándo está: apagado tapa igual. */
      alcanceCuerpo: 0.88,        // largos en los que alumbra a otro pez
      caida: 3.2,                 // exponente: alto = alcance corto
      ganancia: 2.0,              // pero mucha luz dentro de ese alcance
      autoLuz: 0.08,              // su propia esca apunta al frente, no a él
      base: 0.002,                // lo que se intuye sin que nada lo alumbre

      parpadeo: [1.6, 9],
      cola: 0.055, velCola: [0.8, 1.8],
      /* LA CARA. Dientes largos y desiguales en dos filas, la boca nunca
         cerrada del todo y una barbilla ramificada (Linophryne). La
         barbilla pone una SEGUNDA luz separada de la esca, y entre las dos
         no se dibuja nada: el tamaño de la cabeza lo declara su
         distancia. */
      dientes: [15, 20],
      paladar: true,              // la fila interior, la del paladar
      entreabierta: 0.13,         // la quijada nunca acaba de cerrar
      bocaLargo: 0.56,            // más de media cabeza es boca
      bocaHondo: 0.34,            // y la quijada se descuelga
      /* ── EL REPARTO DE LA ABERTURA, Y ES UN TOPE MEDIDO ──────────
         0,30 la quijada de arriba y el resto la de abajo, que es como abre
         un rape. Y NO SE PUEDE SUBIR: la de arriba gira sobre la charnela
         y el hueco que abre se le RESTA al cuerpo (ver `bocaPath`), así
         que barriendo de más se traga el ojo y lo deja flotando fuera de
         la silueta.

         MEDIDO punto en polígono contra el hueco, en veinticinco posturas
         de `ataque` y con la boca de aquí arriba: a 0,30 el ojo queda
         libre en todo el bocado; a 0,34 ya choca a `ataque` 0,60 y a 0,42
         choca esté el ojo DONDE ESTÉ —subirlo no se arregla moviendo el
         ojo, se arregla no subiéndolo—. Si algún día se quiere una boca
         aún mayor, el que crece es `bocaLargo`, no esto. */
      quijadaArriba: 0.30,
      barba: 0.50, barbas: [3, 5], barbaBrillo: 0.42,
      /* y el detalle del cuerpo, que sólo existe a este tamaño */
      miomeros: [7, 10], radios: [5, 7],
      /* Se arrima al LATERAL y mira hacia dentro: `querencia` es el empuje
         hacia el lado y `aro` a qué distancia del centro se planta, ya sólo
         en x. El `borde` de la casa empuja al revés, así que va bajo. Las
         escas quedan a un lado apuntando al centro y el centro se vacía.

         `altura` es lo que le falta al aro, que no mira la vertical: un
         tirón flojo y permanente hacia la media altura. Sin él el rape
         acababa contra el techo o el suelo —medido, ocho semillas de
         600 s en caja de móvil: el 84-97 % del tiempo por encima de 0,70
         de altura, y NUNCA en el tercio central—, que es donde peor se le
         ve la cara y donde menos tiene sentido una trampa. Con él se pone
         al revés: el 81 % del tiempo en el tercio central y excursiones de
         hasta 0,69, o sea que arriba se visita y no se vive.

         Y HAY QUE ELEGIRLO POR LA VARIANZA, no por la media: a 0,08 la
         media sale bien y sin embargo una semilla de cada cuatro se queda
         pegada al techo el 28 % del tiempo, que es el fallo otra vez
         escondido en el promedio. A 0,16 empieza a pincharlo en el centro
         y a 0,45 lo clava. Con UN rape por pecera, una tirada no dice
         nada.

         `bandaY` es a qué altura nace, con querencia o sin ella. Estrecha,
         porque el tirón es lento a propósito: naciendo en el techo lo que
         se ve es el minuto que tarda en bajar. */
      querencia: 0.55, aro: 0.84, altura: 0.10, miraAlCentro: true,
      banda: [0.08, 0.92], bandaY: [0.30, 0.70],
      borde: 0.30,
      /* ACECHO: crucero mínimo y ratos largos clavado entre embestidas. Un
         rape que patrulla es un pez que pasa; uno quieto veinte segundos
         con la esca colgando es una trampa esperando. */
      crucero: 0.055,             // empuje constante, en U/s
      acecho: [7, 22],            // quieto entre embestidas
      embestida: [0.5, 1.7],
      arrastre: 0.26,             // más alto = frena menos = planea más
      /* la inclinación del cuerpo, que es por donde empuja. Positiva es
         hacia abajo, mire el pez donde mire. */
      inclina: [-0.34, 0.34],     // unos 20° arriba o abajo
      cadaInclina: [9, 24],
      velInclina: 0.4,            // vira despacio, como un submarino
      topeInclina: 0.55,          // sólo al huir puede pasar de ahí
      giro: [14, 38], velGiro: 5, // el giro pasa por el perfil, no salta
      /* LA CAZA. No persigue: espera a que algo llegue a la esca. */
      alcanceBoca: 0.16,          // a qué distancia de la esca muerde
      /* cuánto tarda en volver a tirar: es lo que separa un cazador al
         acecho de una trituradora. Tras acertar, más: está tragando. */
      reposo: [10, 24], reposoFallo: [3, 7],
      bocado: 0.55,               // lo que dura el ¡ÑACA!, en segundos
      abertura: 0.70,             // cuánto se abre la quijada, en radianes
      acometida: [5, 8],          // el tirón del bocado
      acierto: 0.72,              // falla una de cada cuatro
      trasComer: [7, 16],         // la esca se apaga DESPUÉS de tragar
      /* ── LA RÁFAGA, Y UNA SOLA ─────────────────────────────────
         No es una luz aparte: la esca emite once veces más durante un
         instante y a la vez se recoge hacia la boca, así que el cuerpo se
         enciende por el modelo de siempre. El tope está en `techo`.

         `fogonazoCaida` es lo que la convierte en RÁFAGA: la luz sale de
         elevar la fase a este exponente, así que por encima de 1 el
         ataque es instantáneo y la caída violenta —a 1,8 queda en el 60 %
         al primer quinto y en el 8 % a tres cuartos. Con exponente 1 baja
         a ritmo constante y se lee como un foco que se enciende.

         `fogonazoDura` cubre el bocado MÁS la masticación (0,75-0,93 s):
         es la única luz que hay, y tiene que llegar viva —de cola— hasta
         que acaba de tragar. */
      fogonazo: 11, fogonazoDura: 0.9, fogonazoCaida: 1.8, retrae: 0.95,

      /* ── MASTICAR ──────────────────────────────────────────────
         El bocado dura medio segundo y tiene que seguir durándolo: un
         cazador de emboscada es un tirón. Lo que se alarga es lo de
         después —con la presa dentro trabaja la quijada y lleva el ilicio
         recogido junto a la boca—, y no pone luz: pone movimiento, que se
         ve con la cola de la ráfaga. Por encima del segundo deja de ser un
         vistazo y se convierte en un rape al que da tiempo a mirarse. */
      mastica: [0.20, 0.38],      // segundos con la presa dentro
      masticaRitmo: 4.6,          // dentelladas por segundo, en rad/s
      masticaAbre: 0.13,          // cuánto trabaja la quijada, en rad
      masticaRetrae: 0.82,        // lo recogido que se queda el ilicio

      /* ── Y EL BANCO SE ENTERA ──────────────────────────────────
         Un campo `asusta` en la boca al morder. `espanta` es el radio en
         LARGOS del rape, así que espanta más lejos cuanto más grande es el
         animal y la escala se mantiene en cualquier pantalla.

         NO puede ir generoso: a 4,2 —el 61 % del ancho— entraban en
         pánico los 68 peces a la vez y el susto dejaba de ser local. A
         2,0 el radio es el 29 % del ancho y se asustan 34 de 68: huye el
         que está cerca.

         `espantaDura` es más largo que la ráfaga a propósito: si el susto
         se apagara con la luz, cuando el ojo vuelve a ver al banco ya
         está rehecho y el pánico no se ha visto. `espantaFilo` por debajo
         de 1 entra como pow(u, 1,25), así que el peso cae rápido en el
         canto y los del borde no llegan al umbral: el miedo no tiene
         borde duro. */
      espanta: 2.0, espantaDura: 2.2, espantaFilo: 0.8,
    },

    /* LA PRESA, y a la vez el foco que se mueve. En cardumen son las dos
       cosas: de lejos, la única cosa viva y de colores que cruza el
       cuadro; de cerca, lo que ALUMBRA. */
    { especie: 'pezlinterna',
      /* POCOS Y GRANDES, pero el banco sigue siendo el espectáculo, y lo
         que lo hace banco es la DENSIDAD y no la cuenta. Por debajo de una
         docena no hay banco, hay una docena de peces.

         Y LA DENSIDAD ES POR PLANO, que es lo que no se ve en esta línea:
         `L.cardumen` se rehace por plano, así que un pez sólo mira a los
         de su misma distancia y `reparto` decide de cuántos dispone.
         MEDIDO en caja de móvil, cada pez ve a 1,6 vecinos dentro de su
         `vista` repartido en dos planos, contra 1,06 cuando estaban en los
         tres: quitar el plano del fondo dejó el banco MÁS junto, no menos,
         y la alineación se quedó igual (0,54 contra 0,57).

         UN NÚMERO SUELTO Y NO {cada, min, max}: el cuadro enseña siempre
         `escala`×`escala` U de mundo, o sea el mismo trozo de mar en un
         móvil que en un monitor, así que el banco tiene que ser el mismo.
         Contándolo por área en píxeles salían 38 en un PC y 15 en un
         iPhone SE —el mismo mar con la mitad de peces—, que es parte de
         lo que hacía que en móvil se viera todo pequeño y apretado. */
      total: 14,
      /* NINGUNO AL FONDO, por el mismo motivo por el que no hay rapes
         lejanos: a ese plano no le llega el bicho, le llega una mancha.
         Un pez del fondo va a `scale` 0,40 Y ADEMÁS a un tercio de
         resolución y al 58 % de alfa, así que en un móvil salía pálido,
         borroso y de 18 px —y eso no se arregla desde `largo`: aunque se
         igualara al extremo grande, el techo del plano del fondo son 22 px.

         Quitándolos, el pez más chico pasa a ser el del plano de en medio:
         33 px en una caja de 359x750, contra 73 del más grande. Se pierde
         la capa más lejana del banco y se gana que TODOS se lean. */
      reparto: [0, 0.45, 0.55],
      /* EL SUELO LO PONE EL MÓVIL, que es la pantalla contra la que se
         ajusta esto. El extremo chico salía a 13 px de largo y no se leía
         como pez: era una raya. El extremo grande no se toca —73 px—, así
         que lo que se estrecha es el rango: la razón entre el más grande y
         el más chico queda en 2,2, repartida entre el largo (1,24) y los
         dos planos que quedan (1,78).

         Y `roce` NO SUBE CON ÉL, aunque la regla de abajo lo pida.
         MEDIDO, seis semillas de 100 s en caja de móvil: agrandar el pez
         sube el apiñamiento en largos de cuerpo —vecinos a menos de 1,2
         largos, de 0,43 a 0,54—, pero subir `roce` a 3,4 no lo baja (0,56,
         dentro del ruido) y afloja la alineación. El motivo es que `roce` y
         `atraccion` van los dos en U: lo que aprieta al banco es que varios
         peces convergen en la misma esca, y ahí manda la atracción, no el
         roce. O sea que el apiñamiento EN U no ha cambiado; sólo se ve más
         junto porque el bicho es mayor. */
      largo: [1.55, 1.92],
      /* El círculo entero de tono, porque fotóforos verdes, ámbar y
         rosados los hay de verdad, y bastantes tramos porque el banco
         tiene que leerse moteado de color. `luzGlow` abajo: el bicho tiene
         color, el agua no.

         COLOR Y NO PLATEADO, y el mando de eso es `luz` y NO `sat`: en HSL
         las dos se pelean —a `luz` 0,85 un `sat` de 0,9 da (182,251,182),
         un pastel con un 27 % de saturación real—. El color sale BAJANDO
         `luz` hacia 0,5, que es donde el tono es puro; subiéndola se va a
         plateado, y con `luz` 0,88 y `sat` al máximo el banco sale blanco.
         Con estos valores la saturación real del `mid` queda en 0,56-0,91
         y la del halo, en 0,82-0,96.

         `satGlow` va aparte y algo más bajo, porque de un pez a distancia
         lo que se ve es el HALO del fotóforo: el punto es `core` y sale
         casi blanco pase lo que pase. */
      espectro: { tono: [0, 352], tramos: 32,
                  sat: [0.88, 1.00], luz: [0.54, 0.70],
                  satGlow: [0.70, 0.92], luzGlow: [0.20, 0.30],
                  giroGlow: 6 },
      /* ── Y EL ORDEN EN EL SORTEO ──────────────────────────────
         Uno o dos tonos mandan en toda la pecera y `tendencia` es qué
         parte del banco se apunta; el resto sigue saliendo de la paleta
         entera. Es una TENDENCIA: con 0,74, uno de cada cuatro peces va a
         lo suyo, así que el banco tiene un color —o dos— y además
         moteado, en vez de tener los treinta y dos. Lo que quitó el
         confeti fue este sorteo, no el color de cada pez.

         Se sortean al poblar y no aquí: escritos a mano serían los mismos
         en todas las sesiones. Lo hace `siembra()` de la especie. */
      dominantes: [1, 2], tendencia: 0.74,
      /* la hilera del vientre es lo único que se ve de lejos, así que es
         donde va el brillo: puntos quemados, no un cuerpo iluminado */
      fotoforos: [6, 10],
      foto: 1.15,                 // brillo de los fotóforos
      emision: 0.32,              // lo que alumbra alrededor
      alcanceLuz: 1.5,            // largos en los que enciende plancton
      /* `alcanceCuerpo` corto a propósito: su propia trampa le trae las
         presas por delante, y con 1,15 el rape que le tocaba sitio de paso
         del banco se quedaba visible el 75 % del tiempo —lo delataban las
         presas que él había atraído. */
      alcanceCuerpo: 0.80,        // largos en los que revela un cuerpo
      /* ── LO NEGROS QUE SE VEN ────────────────────────────────────
           `base`   lo que se intuye sin nada que lo alumbre.
           `cuerpo` cuánto tinte propio coge el relleno —el degradado de
                    `mid` a `glow` que va del morro a la cola.
           `blanco` cuánto `core` se le suma encima, plano. Es lo que
                    saca al cuerpo del negro: el tinte propio de un pez
                    azul oscuro sobre agua negra sigue siendo oscuro.
           `canto`  lo marcada que va la línea del contorno, en `core`. No
                    subirlo: a 0,48 el filo se come al bicho, y la forma
                    tiene que leerse por el relleno y no por una raya
                    brillante alrededor de un hueco negro.

         `base`, `cuerpo` y `canto` multiplican a la luz que le LLEGA, así
         que a oscuras apenas hacen nada. `blanco` va con la luz que el pez
         EMITE —sus propios fotóforos—, y por eso es el único que le da
         forma a oscuras. No rompe la regla de la casa: no lo ilumina la
         escena, se ilumina él.

         Medido sobre un pez sin nada a menos de 97 px, contra un suelo de
         dither de 2,4: `blanco` 0,10 le sube 11 de luminancia media —un
         gris oscuro con su forma—; a 0,18 salen lechosos. */
      base: 0.10,
      cuerpo: 1.22, blanco: 0.06, canto: 0.34,
      /* ── TODA DISTANCIA DE ESTE BICHO VA EN LARGOS DE CUERPO ───
         `revelado`, `atraccion`, `vista` y `roce` se multiplican por el
         `Lg` DEL PEZ, que ya lleva dentro el `scale` de su plano, y no
         por `U`. El motivo es que `scale` es PERSPECTIVA: el pez de en
         medio no es otro bicho, es el mismo más lejos, así que todo lo
         suyo tiene que encoger a la vez. En U no encogía, y se medía:
         `roce` 3,0 U eran 1,31 largos delante y 2,34 en medio, o sea que
         a los de en medio su propio roce les PROHIBÍA juntarse —0,0 % a
         menos de 1,2 largos, contra el 13 % de delante—. Los valores de
         aquí abajo están anclados al plano de delante, que es contra el
         que se ajustó el banco, así que ése no se mueve y el otro entra
         en vereda (2,8-5,3 %).

         LO ÚNICO QUE SE QUEDA EN U es lo que viene de FUERA del agua: el
         dedo (`apartaDedo`, `aparta`), porque un dedo en la pantalla no
         está a ninguna profundidad y no encoge con el plano. */
      brillo: 1.15, revelado: 0.7, // largos del cebo a los que ya se le ve
      /* Desde cuántos largos ve una esca. Generoso a propósito: con un
         solo rape, un alcance corto deja la trampa sin clientes y el
         bocado —lo único que enciende al bicho— no llega a ocurrir en una
         sesión. Si se suben los rapes, éste es el primer número que hay
         que bajar.

         Hoy esto y `revelado` sólo actúan en el plano de delante, porque
         `rape.por` es [0,0,1] y `L.luces` va por plano: en los otros no
         hay esca que ver. */
      atraccion: 2.0,

      /* ── EL BANCO ────────────────────────────────────────────────
         `vista` es a cuántos LARGOS se mira a los vecinos y `roce` a
         cuántos empiezan a estorbarse —ver arriba por qué en largos y no
         en U—; los tres pesos son no chocar / ir a la par
         / no quedarse solo, y `propio` cuánto de su idea conserva.
         `aparta` tiene que mandar sobre `junta`: al revés el banco se
         anuda.

         `vista` CORTA es lo que evita que el banco entero llegue a un
         acuerdo: al doble de ésta cada pez ve a 12 de sus 15-27 vecinos y
         la alineación sube de 0,51 a 0,70. Por debajo de 1,4 largos deja
         de leerse como banco.

         `reacciona` (cada cuánto vuelve a mirar, en segundos) y `ciego`
         (el cono que no ve a su espalda, en radianes: 1,9 ≈ 109°) son las
         dos que lo desincronizan; el mecanismo está en `cardumen()`, en
         bichos/pezlinterna.js. Para tocarlos basta saber que `reacciona`
         hace el trabajo —de 0,84 a 0,51 de alineación— y que `ciego` a
         solas no hace nada pero encima del otro llega a 0,42. Ninguno
         toca la FORMA: la elongación se queda en 1,84.

         AL MEDIR: comprobar primero que los `L.cardumen` de los tres
         planos suman los que pide la escena. Con menos peces el banco sale
         más denso y más redondo, y lleva a conclusiones falsas.

         `comodo` es el mayor giro, en radianes y desde el rumbo que
         LLEVA, que un pez acepta por seguir al grupo: 2,4 son 137°, o
         sea que lo único que descarta son las medias vueltas. El grupo
         sugiere y esto es poder decirle que no, para que seguir a otro
         se lea como una decisión y no como una orden.

         NO ES EL MANDO DE QUE SOSTENGAN EL RUMBO, aunque lo parezca, y
         además CUESTA SI SE APRIETA. Medido, tres semillas de 300 s: a
         0,9 (52°) el giro medio baja de 117 a 104 °/s pero la alineación
         entre vecinos se hunde de 0,43 a 0,07 —el pez se niega a seguir
         justo cuando no va ya alineado, que es cuando serviría— y el
         tiempo sosteniendo rumbo EMPEORA, de 40 a 36 %. Lo barato es
         dejarlo ancho: a 2,4, y con el `rumbo` de abajo largo, cuesta
         0,04 de alineación porque casi nunca hace falta. */
      cardumen: { vista: 1.8, roce: 1.3, propio: 0.40,
                  aparta: 1.8, alinea: 1.6, junta: 0.9,
                  ciego: 1.9, reacciona: [0.18, 0.68], comodo: 2.4 },
      /* Segundos de pánico cuando algo muerde al lado, a peso pleno del
         campo. Entra en el mismo `susto` que usan el dedo y el fallo de un
         rape: triplica el viraje, sube el nado a `velSusto` y suelta las
         reglas de alinear y juntar —no la de no chocar—, así que el banco
         se abre y se rehace solo. */
      panico: 1.8,
      /* ── Y LO QUE LE HACE LA FLORACIÓN ─────────────────────────
         `tinteVuelve` es a qué velocidad se le va el tinte, en 1/s: a 0,4
         el color aguanta dos segundos y medio después de que el frente
         pase, así que la onda deja rastro en vez de una línea.
         `tinteBrillo` es cuánto emite de más mientras lo tiene, y hace
         falta: de lejos, de un pez lo que se ve es el halo del fotóforo, y
         un cambio de tono a brillo constante casi no se lee. */
      /* `tinteSat` es CUÁNTO se va el núcleo del fotóforo hacia el color
         del pez cuando pasa la onda, y es el número que hace el evento:
         el punto se pinta con `core`, que sale casi blanco pase lo que
         pase, así que a 0 la floración no se nota. A 0,88 el punto queda
         en el color del bicho (saturación real 0,88-0,99) y la hilera
         pasa de blanca a encendida; a 1 es el `mid` pelado y el núcleo
         deja de leerse como núcleo. */
      tinteVuelve: 0.4, tinteBrillo: 1.2, tinteSat: 0.88,

      /* DESORDEN POR CIZALLA: abre la velocidad de crucero y los pesos de
         grupo pez a pez, así que unos adelantan a otros. Sin esto todos
         nadan a la misma velocidad exacta, el banco se traslada como un
         sólido y la forma que tiene se queda congelada. El susto no se
         escala: el pánico es igual para todos. */
      desorden: 0.28,

      /* ÁGILES PERO NO NERVIOSOS, y la diferencia la marcan los cuatro
         números del nervio, no `vira` —ése es el que sostiene el cardumen:
         un pez que no puede virar no sigue al grupo—. Con el dardo cada
         medio segundo el pez no nada, da sacudidas: medido, el 3,1 % de los
         fotogramas tenían un salto de velocidad de más de un cuarto y la
         media era 1,43 U/s contra un crucero de 0,66, o sea que el tirón
         ERA el estado normal. Con estos valores, el 1,0 % y 1,23 U/s: el
         dardo vuelve a ser un acento. */
      vel: 0.66, velCebada: 0.92, velSusto: 3.4,
      vira: [2.0, 3.8],           // rad/s: vira rápido y corrige a menudo
      /* CADA CUÁNTO SE SORTEA UN RUMBO NUEVO, y es EL mando de que el pez
         nade en vez de corregir. MEDIDO, cinco semillas de 300 s: a
         [0,6 · 2,0] el banco giraba a 116 °/s —un 68 % del tope que le da
         `vira`, o sea virando casi siempre— y sólo sostenía el rumbo
         (menos de 30° en un segundo) el 40 % del tiempo.

         Y NO ES EL CARDUMEN el que lo hace, que era lo que se sospechaba:
         quitándole las tres reglas de grupo enteras seguía girando a
         89 °/s. El cardumen pone 28 de los 117.

         Alargándolo, la alineación entre vecinos NO cae: SUBE. Un vecino
         que sostiene el rumbo es un vecino al que se puede seguir, así
         que el banco sale mejor de aflojarle la mano. Lo que sí se paga
         es soledad: el pez que va recto se descuelga, y el tiempo sin
         nadie a la vista pasa del 25 al 30 %. */
      rumbo: [1.8, 5.0],          // segundos entre rumbo y rumbo
      /* NERVIO: un dardo corto por encima del crucero, con un desvío de
         rumbo en el mismo instante. Es un ACENTO: a `cadaNervio` corto deja
         de leerse como que el pez ha decidido algo. */
      nervio: [0.35, 1.1],        // U/s de tirón, se suma al nado
      cadaNervio: [0.7, 2.4],     // cada cuánto le da
      nervioVuelve: 0.22,         // lo que le queda al tirón cada segundo
      desvio: 0.28,               // radianes que tuerce al dárselo
      /* y cuánto tarda en voltear de un lado al otro, en 1/s: el escorzo
         del espejo (ver `dibuja`). A 7 tarda unas dos décimas. */
      volteo: 7,
      /* ── EL ALETEO VA CON EL AVANCE ──────────────────────────────
         `zancada` es cuántos LARGOS DE CUERPO recorre por coletazo, y de
         ahí sale la frecuencia: el pez bate despacio al crucero y deprisa
         en el dardo, que es lo que se lee como nadar. Un pez de verdad
         hace un largo por coletazo; entre 0,7 y 1,2 el nado parece nado, y
         por debajo de 0,3 se sacude en el sitio. Con 0,8 el crucero sale a
         medio coletazo por segundo y la huida, a unos 2,7. */
      zancada: 0.8,               // largos de cuerpo por coletazo
      trago: 0.42,                // lo que tarda en entrar por la boca
      /* ── SE APARTA DEL DEDO ────────────────────────────────────
         No es huir: nadie le toca el rumbo, sólo se desplaza de lado
         mientras le pasa el frente. El mecanismo, en `seAparta` de
         comun.js; aquí van las medidas.

           `apartaDedo`   la velocidad del desvío a plena onda, en U/s.
                          Queda entre su crucero (0,66) y su velocidad de
                          pánico (3,4): un quiebro, no una huida.
           `lag`          con cuánta gana lo coge, en 1/s. Es el mando de
                          lo SECO, no el de cuánto.
           `apartaVuelve` lo que le queda cada segundo cuando el frente se
                          va. A 0,18 se le ha ido en medio segundo.
           `aparta`       la gana de cada pez: el hueco se abre desigual y
                          no como una cortina.

         ── LOS TRES SE AJUSTAN JUNTOS, Y CONTRA DOS GESTOS ──────────
         MEDIDO leyendo `z.dx, z.dy` —que es SÓLO el ladeo del contacto,
         el nado va por `ang` y `vel`—, con un toque junto a un pez y con
         un barrido de punta a punta:

                              toque              barrido
                         punta   se aparta   punta   deriva (mediana)
           antes         1,15      2,15 U    3,57      7,69 U
           ahora         2,32      1,60 U    2,92      0,51 U

         O sea: el doble de rápido al arrancar y una quinceava parte de
         deriva. Antes tardaba en salir y luego se iba media pantalla de
         móvil; ahora da el quiebro y se acabó.

         Y NO SALE DE AQUÍ, sale de `dedo.empuja`: mientras el empujón
         duraba toda la vida de la onda, estos tres números no movían la
         aguja —bajar `apartaVuelve` de 0,70 a 0,08 no cambiaba nada,
         porque el objetivo nunca bajaba y la rama que decae no llegaba a
         correr—. Primero se acota el empujón, después se afina aquí. */
      apartaDedo: 6.0, aparta: [0.7, 1.3], lag: [16, 26],
      apartaVuelve: 0.18,
      borde: 1.0,
    },

  ],
};
