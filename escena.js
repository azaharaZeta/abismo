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
  /* El color excepcional. El motor sólo lo OFRECE en M.raro; quien lo
     quiera se lo coge, con su propia probabilidad. No hay reparto
     automático. Hoy sólo lo usa el plancton, por mota. */
  raro: ROJO,

  agua: {
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

  /* dos senos en función de la posición; aquí abajo, lenta y corta */
  corriente: { amplitud: 0.16, ondaY: 0.7, ondaX: 0.7, vel: 0.05 },

  /* Tendencia a no salirse del encuadre, no una pared: el empuje aparece
     a `margen` del canto y crece al acercarse. El cristal duro es aparte,
     en salto(). */
  borde: { margen: 0.14, fuerza: 1.0 },   // fracción de min(W,H) · U/s²

  /* el dedo: sólo contacto, nunca hover */
  dedo: {
    alcance: 3.4,                 // en unidades de escena
    vida:    3.2,
    color:   [96,150,180],        // el color del agua, no de un bicho
    tinte:   [0.10, 0.34],        // cuánto tira del color de un bicho
    brillo:  0.048,               // el fondo es casi negro: poco basta
    paso:    0.9,                 // separación mínima entre ondas al arrastrar
    tope:    20,                  // ondas vivas a la vez como máximo
  },

  /* ── TRES PLANOS: fondo, medio, frente ────────────────────────────
     La distancia se lee por cuatro avisos a la vez: más pequeño
     (`scale`), más borroso (`resDiv`), más tenue (`alpha`) y más lento
     (`drift`). `sharp` atenúa los núcleos casi blancos; `tScale` es el
     largo de los tentáculos de la medusa. */
  planos: [
    {resDiv:3, alpha:0.58, scale:0.40, sharp:0.35, tScale:0.62, drift:0.44},
    {resDiv:2, alpha:0.86, scale:0.74, sharp:0.78, tScale:0.85, drift:0.72},
    {resDiv:1, alpha:1.00, scale:1.32, sharp:1.00, tScale:1.00, drift:1.00},
  ],

  escala: 26,                     // divisor de sqrt(área) → unidad U
  maxPx: 4.6e6,                   // tope de píxeles de lienzo

  /* Cuánto espera un evento exclusivo que le toca turno y se lo
     encuentra ocupado. Sin relevo se le sigue descontando el reloj, se
     queda en negativo y arranca en el mismo fotograma en que muere el que
     lo tapaba: un tercio de los exclusivos salían encadenados. */
  relevo: [25, 70],

  /* ── EVENTOS ──────────────────────────────────────────────────────
     Cada entrada: {evento, plano?, ...parámetros}. Un `porContacto: 0..1`
     deja que el dedo lo dispare. */
  eventos: [
    /* la cadena de encendido: un soplo que va prendiendo la nieve marina */
    { evento: 'contagio', vel: [3, 7], salto: 6.5,
      alcance: [0.55, 1.1], cada: [55, 145], primero: [18, 55],
      porContacto: 0.3 },

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
      /* El tamaño se ajusta contra el alto que ocupa la MASA oscura (donde
         el apagado pasa de 0,45), no contra la penumbra, y la esbeltez se
         mantiene en ~5:1: a 8:1 lee como anguila y no como leviatán. */
      largo: [0.72, 0.86], grosor: [0.086, 0.108], onda: [0.155, 0.185],
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
         diagonal lo sacaría del cuadro: con `largo` de casi una pantalla,
         0,22 rad todo el trayecto son más de 300 px de subida. `velRumbo`
         bajo hace que vire en unos cuatro segundos y no de golpe. */
      rumbo: [-0.22, 0.22], cadaRumbo: [9, 20], velRumbo: 0.25,
      /* Sombra y no silueta, y hacen falta los dos números: el máximo de
         cada elipse cae en el espinazo, así que con `filo` a solas sale un
         canto duro o un degradado sin masa. `penumbra` agranda la elipse
         un 30 %, de modo que la silueta cae en la zona llena y el
         desvanecido ocurre fuera de ella. */
      hondura: [0.94, 1.0], filo: 2.2, penumbra: 1.3, segmentos: 22,
      /* la cresta dorsal, en campos aparte: sierra el canto de arriba y
         deja la panza lisa. Dientes desiguales. */
      espinas: 10, cresta: 0.55,
      /* `brillo` es SÓLO los dos cantos, los fotóforos y el ojo: el cuerpo
         no emite nada. */
      brillo: 0.32, fotoforos: 11,
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
      /* multiplica a `brillo`, así que el mando del panel lo apaga también.
         Por encima de 1 y no es contradictorio con «sutil»: el leviatán
         vive en el plano del fondo, a un tercio de resolución y al 58 %
         de alfa, así que a 1,1 el punto se disuelve en el borrón. A 2,0
         es un alfiler rojo y sigue sin alumbrar nada. */
      brilloOjo: 2.0,
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

         AJUSTADOS POR AMPLITUD Y NO POR LUZ TOTAL: el velo del lomo suma
         un tercio de lo que emite la bestia y casi no se ve, porque lo
         reparte por veinte mil píxeles. Lo que dice si un detalle se lee
         es cuánto sube el píxel más alto. Contra el hilo de la panza, que
         sube 347 de 765, el lomo va a una trigésima parte y las espinas a
         una docena de veces menos. */
      brilloLomo: 0.35, brilloEspinas: 1.4 },

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
      cada: [130, 280], primero: [35, 95],
      vel: [0.55, 0.95], largo: [0.15, 0.26],
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

       Es el evento que más se repite —cae cada minuto o dos— y por eso lo
       que se sortea por travesía son las PROPORCIONES y no sólo el
       tamaño:

         `grosor`  el grueso del cuerpo, casi al doble de un extremo a otro.
         `merma`   cuánto adelgaza hacia la cola: 0,18 es un tubo, 0,70 un
                   cono.
         `panza`   dónde tiene lo más gordo. A 0, en la cabeza; a 0,42, un
                   bulto a un tercio del morro, que es un huso y no un
                   gusano.
         `cuentas` con el largo ya sorteado, lo que cambia es la SEPARACIÓN,
                   o sea lo gruesa que se lee la segmentación: dieciocho
                   dan segmentos marcados, cuarenta un cuerpo casi liso. No
                   llega a collar en ningún caso —el halo de una cuenta
                   mide 93-177 px y la separación 11-43.

       `variedad` abre además los tres apéndices, cada uno por su lado.
       Va alto (0,8) y asimétrico, así que de vez en cuando uno sale a 0 y
       cruza un bicho sin parapodios o sin antenas. A 0, todos los
       visitantes son exactamente el mismo. */
    { evento: 'visitante', plano: 0,
      cada: [50, 120], primero: [15, 42],
      cruce: [28, 46], cuentas: [18, 40],
      largo: [0.40, 0.72], onda: [0.03, 0.10],
      grosor: [0.42, 0.80], merma: [0.18, 0.70], panza: [0, 0.42],
      variedad: 0.8, brillo: 0.26,
      patas: 0.95, antenas: 1.5, cola: 1.7 },

    /* ── EL CUERPO ──────────────────────────────────────────────────
       No dibuja NADA: la silueta es de campos `apaga`, así que lo que baja
       es el hueco de un cuerpo humano. `alto` va en fracción del alto del
       cuadro, y grande —un tercio— porque lo que hace el evento es que se
       RECONOZCA; más pequeño es una mancha con forma rara.

       El más lento y el más raro de la pecera. A 0,3-0,55 U/s cada cuerpo
       tarda entre 55 y 115 segundos en bajar, que es el rato que hace
       falta para dudar de lo que se está viendo; con `cada` de seis a doce
       minutos no se convierte en decorado. `giro` en centésimas: una
       vuelta cada dos minutos. Caen de uno a tres, escalonados. */
    { evento: 'cuerpo', plano: 1,
      /* `cada` sube con los cuerpos de dos en dos y de tres en tres: con
         el desfase, una tirada de tres dura casi el doble que una sola, y
         a reloj igual el evento se comía más cuadro del que le toca.
         Medido sobre seis horas de reloj de escena, [360,720] deja al
         cuerpo en el 15,2 % de los fotogramas y a todos los exclusivos en
         el 43 %. */
      cada: [360, 720], primero: [110, 250],
      alto: [0.28, 0.40], vel: [0.30, 0.55],
      giro: [-0.055, 0.055], deriva: 0.22,
      /* `cuantos` es cuántos caen en una tirada y `retraso` los segundos
         que tarda cada uno en asomar detrás del anterior. El retraso es
         LARGO —10-30 s, y el cuerpo tarda 55-115 en bajar— porque no son
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
         El agua de la mitad de abajo del cuadro ya es casi negra —[0,1,3]
         contra [4,13,21] del techo—, así que ahí un hueco negro sobre
         negro no se lee y el cuerpo se perdería justo mientras baja.

         NO SE LE PONE LUZ DESDE LA ESCENA: un filo fijo por el canto de
         arriba es lo que la regla de la casa prohíbe. Lo que se enciende
         es lo que un foco de verdad alcanza —la luz se acumula COMO
         VECTOR y sólo se pinta el lado del canto que mira a ella, así que
         el de sombra se queda negro.

           `borde`      la ganancia, multiplicador sobre la luz que le
                        llega y no un brillo suyo: a 0 el evento vuelve a
                        no dibujar nada.
           `bordeAlcance` agranda el radio con el que un foco lo revela, y
                        va alto por lo mismo que en la carroña: los radios
                        de la casa revelan un pez, y un cuerpo mide medio
                        cuadro. Medido: en una travesía entera lo más
                        cerca que le pasó algo fueron 320 px, contra
                        radios de 16 a 125.
           `bordeCaida` alta es alcance corto. La curva es la de
                        `luzRecibida` —pow(1/(1+d²/r²), caida)— y no la de
                        la carroña, que se corta en el radio: con corte el
                        canto sale todo o nada.
           `bordeTecho` el tope, con rodilla blanda. La luz que le llega va
                        de 0,02 a más de 1 según lo que pase cerca, y sin
                        techo el canto se clava en alfa 1 cada vez que se
                        le acerca una medusa: deja de ser un hueco y pasa
                        a ser una figura recortada en blanco.
           `bordeTono`  GRIS casi neutro: no es un esqueleto pálido ni un
                        bicho que emite, es carne mojada.
           `bordeTinte` lo poco que coge del color de quien lo alumbra. A 0
                        se despega de la escena; a 1 parece otro bicho
                        encendido.
           `bordeTapado` a partir de qué campo `apaga` se considera que un
                        trozo de canto está ENTERRADO en otra parte del
                        cuerpo —el brazo por donde cruza el hombro— y no
                        se pinta. Sin esto salen rayas por dentro de la
                        masa oscura y el cuerpo se lee como un despiece.

         Con estos valores, y medido sobre tres travesías enteras: de los
         82 trozos de canto se encienden unos 30, 41 quedan de espaldas a
         la luz y 11 enterrados. Que la mitad esté siempre negra es lo que
         mantiene al cuerpo siendo un hueco; el alfa del trazo va de 0,04
         a 0,20, o sea que se ve siempre un poco y mucho más cuando algo
         lo encuentra. */
      borde: 2.2, bordeAlcance: 4.2, bordeCaida: 2.0, bordeTecho: 0.09,
      bordeGrosor: 0.05, bordeTono: [182, 196, 204],
      bordeTinte: 0.22, bordeTapado: 0.25 },

    /* ── EL GLITCH ──────────────────────────────────────────────────
       No es un fallo de la pantalla, es un fallo del DIBUJANTE: una o dos
       medusas se quedan pintadas en bandas escalonadas mientras las otras
       están perfectas. Lo aplica el motor con el campo `tajo` (ver
       `pintaBicho`); la medusa no se entera. No dibuja nada.

       VA A PASITOS. El foco se sortea una vez al nacer y después cada
       tirón AVANZA lo que ya había: `avance` es cuánto cambia la rotura
       por paso y `giro` cuánto se recoloca cada banda. Sorteando el foco
       entero en cada tirón se ven SALTOS —la rotura desaparece y aparece
       otra en otro sitio—; avanzando se ve una sola avería dando pasos.
       Y dura: 22-40 pasos repartidos por 14-24 segundos.

       A QUIÉN LE TOCA no lo decide el evento: lo declara la especie con
       `rompible` (ver el REGISTRO DE ESPECIES), y el evento reparte
       campos sin saber a quién le caen. Hoy sólo la medusa, que es el
       sprite más grande y el más lento: en una mota de tres píxeles la
       escalera no cabe.

       De ahí sale el reglaje. `radio` decide CUÁL de las cuatro medusas
       le toca, así que va a media pantalla: más grande les toca a todas y
       más chico a ninguna. `parte` a 1 rompe a todas las que caen dentro
       —con cuatro candidatos, bajarlo dejaba el evento en que no pasara
       nada; el «sólo algunos» ya lo da el foco—. En una pecera con más
       cosas rompibles hay que bajarlo.

       `bandas` y `paso` son los pasitos DENTRO del bicho: 8-14 bandas de
       6-13 píxeles de escena, una pila de unos cien píxeles que le cruza
       la campana entera. Los tentáculos caen en la última banda y se van
       en bloque: campana en escalera y cortina desalineada por debajo.

       `sep` y `estira` son el tope a plena rotura, y los dos salen del
       mismo `k`, así que la rotura crece y decrece como una sola cosa.

       CUIDADO AL SUBIR `bandas` O `radio`: cada banda es un dibujo entero
       del bicho. Cronometrado, una medusa cuesta 0,069 ms normal y 0,050
       por banda; el peor caso —las cuatro medusas con catorce bandas—
       serían 2,6 ms sobre un fotograma de 8,3. Con el `radio` de la
       escena le toca a una o dos: 0,7-1,3 ms y sólo durante los tirones. */
    { evento: 'glitch',
      cada: [240, 540], primero: [70, 200],
      dura: [14, 24], saltos: [22, 40], salto: [0.22, 0.50],
      focos: [1, 2], radio: [0.30, 0.52],
      bandas: [8, 14], paso: [6, 13],
      sep: 34, estira: 0.85,
      avance: 0.14, giro: [0.20, 0.70],
      parte: 1,
      /* `filo` alto: el foco queda casi plano dentro de su radio, así que
         el que le toca se rompe ENTERO. Con `filo` bajo, los del borde
         salen medio rotos y eso se lee como que la imagen tiembla. */
      filo: 3 },

    /* ── EL SUPERPEZ ────────────────────────────────────────────────
       Parte del banco se encuentra un rato con forma de pez enorme —o de
       dos—, avanza, describe una curva y se deshace. No caza nada y no va
       a ningún sitio. No dibuja nada: manda un rato, y flojo, sobre una
       población que ya estaba, y ni siquiera sobre toda.

       Va en el plano de DELANTE porque es donde vive el 42 % del banco y
       porque una silueta hecha de puntos necesita los puntos nítidos: al
       fondo, a un tercio de resolución, no se lee la forma.

       QUE PAREZCA CASUALIDAD es todo el evento, y aquí no hay ni un
       número que empuje. El centro y el rumbo salen del propio banco
       —centro de masa y rumbo medio—, así que nadie se desplaza a una
       cita: la silueta aparece encima de ellos. Lo que hace que cuaje no
       es la fuerza, es el TIEMPO: `entra` de ocho a catorce segundos.

       `minimo` es cuántos peces hacen falta POR SILUETA una vez aplicado
       el cupo; con menos no hay evento, o hay una sola.

       `vel` es lento —unos diez segundos para cruzar un tercio del
       cuadro— y `giro` es la velocidad ANGULAR, que camina dentro de
       `±giroMax`: a 0,10 rad/s son hasta 70° en doce segundos, una curva
       abierta. Con un giro fijo describe un arco de compás y con un rumbo
       objetivo sorteado da tirones; caminando, la curva se abre y se
       cierra sola.

       `sale` LARGO: la silueta se deshila descolgándose pez a pez —cada
       uno tiene su umbral, ver `formaDesorden` en el banco— y eso
       necesita rampa. No hay ningún empujón al final: un banco que
       estalla no se deshace casualmente. */
    { evento: 'superpez', plano: 2,
      cada: [200, 440], primero: [70, 190],
      /* `largo` y `largoMin` van juntos: el segundo es el suelo por debajo
         del cual una silueta se descarta, así que si no baja con el
         primero, `escQueCabe` se queda sin sitio donde encoger. A un
         tercio de pantalla cabe; a media no —`escQueCabe` la coloca con
         el 87 % dentro AL NACER, pero después nada de 160 a 640 px y no
         hay borde que la contenga. */
      largo: [0.28, 0.38], largoMin: 0.18,
      /* ── CUÁNTOS Y CUÁNTAS ─────────────────────────────────────
         `reparto` es la fracción del banco que entra en la silueta, y no
         es 1 a propósito: los que quedan fuera siguen nadando a lo suyo
         por encima de la forma, y eso es la mitad de lo que la hace
         parecer una casualidad en vez de una coreografía. Se sortea por
         travesía, así que unas salen casi completas y otras a medias.

         `reparto` y `largo` TIENEN QUE MOVERSE JUNTOS: lo que cierra el
         canto es la densidad por PERÍMETRO —que vale 3,9·`esc`—, así que
         bajar los peces sin bajar el tamaño deja la silueta hecha de
         guiones sueltos. Con estos valores quedan unos 47 px entre peces
         del canto con una silueta y 66 con dos; un pez de este plano mide
         52, así que con DOS el canto nunca cierra del todo.

         `superpeces` es cuántas siluetas: una o dos. Dos sólo si hay
         peces para las dos —`minimo` por cabeza— y partiendo el banco por
         donde se partiría solo, por el costado de su propio rumbo. Cada
         una mide menos: el largo se divide por la raíz del número, que es
         lo que mantiene la densidad por perímetro.

         `redondez` es lo gorda que sale CADA silueta, sorteado por ella:
         a 0,70 un pez fusiforme y a 1,55 uno de cuerpo alto, casi un
         disco. Con dos en pantalla, que no se parezcan es lo que dice que
         son dos bichos y no un efecto duplicado. */
      superpeces: [1, 2], reparto: [0.40, 0.68], redondez: [0.70, 1.55],
      minimo: 10,
      entra: [8, 14], nada: [7, 13], sale: [4, 7],
      /* `vira` es con cuánta gana se tuerce hacia dentro cuando el MORRO
         de la silueta se acerca al canto (se mide en el morro y no en el
         centro: ver el evento). Tiene que poder más que su propio
         `giroMax`, que es lo único que se le impone a este evento. */
      vel: [0.25, 0.55], giroMax: 0.10, giroPaso: 0.035, vira: 2.8,
      /* alcance del campo, ancho y plano: ver el `filo` del banco. Los que
         quedan fuera no se apuntan, y eso está bien. */
      alcance: 2.2, filo: 6.0 },
  ],

  /* ── BICHOS ───────────────────────────────────────────────────────
     Cada entrada: {especie, plano?, ...parámetros}. En aditivo sumar es
     conmutativo, así que el orden de la lista no cambia un píxel. Un
     `paleta` o un `espectro` le dan colores propios a esa especie. */
  bichos: [

    /* nieve marina: mucha, lenta y casi apagada. Sólo existe de verdad
       cuando una esca pasa cerca. */
    { especie: 'plancton',
      total: {cada:1150, min:340, max:1150},
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
      radio: [0.28,1.50], alfa: [0.025,0.14], alfaAlto: [0.16,0.42],
      destacadas: 0.07, raro: 0.02,
      apaga: 0.78,                // el rastro dura lo suyo
      enciende: 3.8, enciendeDedo: 3.6,
      huida: [0.25,1.2], lag: [2,11], frena: [0.05,0.40], fuerzaDedo: 4,
      caida: 0.16,                // la nieve marina cae
    },

    /* LAS MEDUSAS. El otro foco que se mueve: grandes, encendidas en todo
       su volumen, y lo que hacen es ALUMBRAR DE PASO. Pocas y lentas. */
    { especie: 'medusa',
      por: [ {cada:480000, min:1, max:3},
             {cada:600000, min:1, max:2},
             {cada:900000, min:0, max:1} ],
      /* Frío y tirando a violeta, para no competir con el moteado del
         banco. `luzCore` por debajo del 0,95 de la casa: la campana son
         nueve capas aditivas de `core`, y con 0,95 esas nueve suman
         blanco. */
      espectro: { tono: [184, 272], tramos: 12,
                  sat: [0.52, 0.90], luz: [0.62, 0.80],
                  satGlow: [0.45, 0.75], luzGlow: [0.14, 0.24],
                  luzCore: [0.84, 0.90] },
      radio: [0.55, 1.35],
      nTent: [12, 26], canales: [7, 11], brazos: [3, 5],
      periodo: [2.6, 4.8], empuje: 2.4, arrastre: 0.28,
      flota: [0.55, 1.45], patrulla: [0.06, 0.42],
      vigor: [0.45, 1.0], brillo: 0.9,
      tilt: [0.05, 0.26], tiltVel: [0.15, 0.55],
      perfil: [0.50, 0.84], ancho: [0.82, 1.20], alto: [0.80, 1.22],
      faldon: [0.22, 0.48], mEnv: [0.7, 1.3], mBase: [0.45, 0.80],
      lobulos: [5, 9], ensancha: [0.10, 0.26], achata: [0.10, 0.26],
      cuelga: 2.6, alcanceLuz: 3.4, alcanceCuerpo: 2.2, emision: 0.55,
      huida: [0.4, 1.1], lag: [2, 8], fuerzaDedo: 3, borde: 0.8,
    },

    { especie: 'copepodo',
      total: {cada:70000, min:4, max:12},
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
      por: [ 0,
             {cada:1400000, min:0, max:1},
             1 ],
      /* GRANDE: es lo que sostiene el detalle —miómeros, cristalino,
         dientes y barbilla no existen por debajo de cierto tamaño—. En el
         plano de delante, un quinto del ancho del cuadro. */
      largo: [5.4, 7.4],
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
      dientes: [10, 15],
      paladar: true,              // la fila interior, la del paladar
      entreabierta: 0.13,         // la quijada nunca acaba de cerrar
      bocaLargo: 0.47,            // casi media cabeza es boca
      bocaHondo: 0.26,            // y la quijada se descuelga
      /* reparto de la abertura: 0,30 la quijada de arriba y el resto la de
         abajo, que es como abre un rape. A 0,5 la de arriba le pasa por
         encima al ojo en pleno bocado. */
      quijadaArriba: 0.30,
      barba: 0.50, barbas: [3, 5], barbaBrillo: 0.42,
      /* y el detalle del cuerpo, que sólo existe a este tamaño */
      miomeros: [7, 10], radios: [5, 7],
      /* Se arrima al canto y mira hacia dentro: `querencia` es el empuje
         hacia fuera y `aro` dónde se planta, medido por ejes. El `borde`
         de la casa empuja al revés, así que va bajo. Las escas quedan por
         el perímetro apuntando al centro y el centro del cuadro se vacía. */
      querencia: 0.55, aro: 0.84, miraAlCentro: true,
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
      abertura: 0.52,             // cuánto se abre la quijada, en radianes
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

      /* la onda del dedo le hace dar media vuelta y salir de ahí */
      umbralHuida: 0.25, estampida: [3, 6],
      huida: [0.4, 1.2], lag: [0.7, 2.2], fuerzaDedo: 2.2,
    },

    /* LA PRESA, y a la vez el foco que se mueve. En cardumen son las dos
       cosas: de lejos, la única cosa viva y de colores que cruza el
       cuadro; de cerca, lo que ALUMBRA. */
    { especie: 'pezlinterna',
      /* Muchos: el banco es el espectáculo, y con nueve peces no hay
         banco, hay nueve peces. El tope alto es para pantallas grandes;
         `escalaCalidad` los recorta si la máquina no da.

         OJO A CUÁL DE LOS TRES MANDA: a 1024×768 son 786.000 píxeles, o
         sea 71 peces por área, así que el que corta es `max` y no `cada`.
         Para que el cambio se note en una pantalla chica, donde manda
         `cada`, hay que mover los dos. */
      total: {cada:11000, min:24, max:60},
      /* cargado hacia delante: el banco que se tiene que leer como banco
         es el de cerca; el del fondo son motas */
      reparto: [0.24, 0.34, 0.42],
      /* `roce` (en el cardumen) va en U y no en largos, así que al crecer
         el bicho hay que subirlo CON ÉL o el banco se solapa. */
      largo: [0.86, 1.44],
      /* El círculo entero de tono, porque fotóforos verdes, ámbar y
         rosados los hay de verdad, y bastantes tramos porque el banco
         tiene que leerse moteado de color. `luzGlow` abajo: el bicho tiene
         color, el agua no.

         PLATEADO PERO NO GRIS, y el mando de eso es `luz` y NO `sat`: en
         HSL las dos se pelean —a `luz` 0,85 un `sat` de 0,9 da
         (182,251,182), un pastel con un 27 % de saturación real—. El
         plateado sale subiendo `luz` un poco y bajando `sat` un poco; al
         revés (`luz` 0,88 con `sat` al máximo) el banco sale blanco. Con
         estos valores la saturación real del `mid` queda en 0,33-0,67.

         `satGlow` va aparte y algo más bajo, porque de un pez a distancia
         lo que se ve es el HALO del fotóforo: el punto es `core` y sale
         casi blanco pase lo que pase. */
      espectro: { tono: [0, 352], tramos: 32,
                  sat: [0.78, 1.00], luz: [0.64, 0.80],
                  satGlow: [0.56, 0.82], luzGlow: [0.20, 0.30],
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
           `blanco` cuánto `core` se le suma encima, plano. Es lo que de
                    verdad saca al cuerpo del negro: el tinte propio de un
                    pez azul oscuro sobre agua negra sigue siendo oscuro.
           `canto`  lo marcada que va la línea del contorno, en `core`. No
                    subirlo: a 0,48 el filo se come al bicho, y la forma
                    tiene que leerse por el relleno y no por una raya
                    brillante alrededor de un hueco negro.

         `base`, `cuerpo` y `canto` multiplican a la luz que le LLEGA, así
         que a oscuras del todo apenas hacen nada. `blanco` va con la luz
         que el pez EMITE —la de sus propios fotóforos—, y por eso es el
         único que sirve para que se le vea la forma a oscuras: atado a la
         luz recibida se quedaba por debajo del ruido del dither. No rompe
         la regla de la casa: no es la escena la que lo ilumina, es él.

         Medido sobre un pez apagado del todo y sin nada a menos de 97 px,
         contra un suelo de dither de 2,4 de media: `blanco` 0,10 le sube
         11 de luminancia media, o sea un gris oscuro con su forma; a 0,18
         los peces salen lechosos y pierden el «apenas están». */
      base: 0.10,
      cuerpo: 1.22, blanco: 0.06, canto: 0.34,
      brillo: 1.15, revelado: 1.6,// a cuántas U del cebo ya se le ve
      /* Desde cuántas U ve una esca. Generoso a propósito: con un solo
         rape, un alcance corto deja la trampa sin clientes y el bocado
         —lo único que enciende al bicho— no llega a ocurrir en una
         sesión. Si se suben los rapes, éste es el primer número que hay
         que bajar. */
      atraccion: 4.5,

      /* ── EL BANCO ────────────────────────────────────────────────
         `vista` es a cuántas U se mira a los vecinos y `roce` a cuántas
         empiezan a estorbarse; los tres pesos son no chocar / ir a la par
         / no quedarse solo, y `propio` cuánto de su idea conserva.
         `aparta` tiene que mandar sobre `junta`: al revés el banco se
         anuda.

         `vista` corta (4,2 y no 5,5) es lo que evita que el banco entero
         llegue a UN acuerdo: con 5,5 cada pez veía a 12 de sus 15-27
         vecinos y la alineación del grupo subía de 0,51 a 0,70. Por
         debajo de 3,2 deja de leerse como banco.

         ── Y LAS DOS QUE HACEN QUE NINGUNO LO CONSIGA ────────────
         `reacciona` (cada cuánto vuelve a mirar, en segundos) y `ciego`
         (el cono que no ve a su espalda, en radianes: 1,9 ≈ 109°). El
         mecanismo está explicado en `cardumen()`, en bichos.js. Lo que
         hay que saber para tocarlos: `reacciona` es el que hace el
         trabajo —por sí solo baja la alineación del grupo de 0,84 a
         0,51—; `ciego` a solas no hace nada, pero encima del primero
         llega a 0,42. Ninguno toca la FORMA del banco: la elongación se
         queda en 1,84 y el grupo mayor en 19-21 peces.

         AL MEDIR: comprobar primero que `M.cardumen().length` es el que
         toca. Una tanda tomada con la población recortada por
         `degradar()` da un banco más denso, más apretado y más redondo, y
         lleva a conclusiones falsas. */
      cardumen: { vista: 4.2, roce: 2.25, propio: 0.40,
                  aparta: 1.8, alinea: 1.6, junta: 0.9,
                  ciego: 1.9, reacciona: [0.18, 0.68] },
      /* Segundos de pánico cuando algo muerde al lado, a peso pleno del
         campo. Entra en el mismo `susto` que usan el dedo y el fallo de un
         rape: triplica el viraje, sube el nado a `velSusto` y suelta las
         reglas de alinear y juntar —no la de no chocar—, así que el banco
         se abre y se rehace solo. */
      panico: 1.8,
      /* ── SI ALGUIEN LOS FORMA ──────────────────────────────────
         `formaPega` es la fuerza del tirón a su sitio, en 1/s, y va FLOJA:
         a 4,0 la silueta cuaja en un segundo y lo que se ve es un pelotón
         cuadrándose. Con 1,3 y un `entra` largo, cada pez llega cuando
         llega y parece que se han encontrado. `formaCerca` es a cuántos
         largos de su sitio deja de apuntar a él y se alinea con el
         contorno. `formaBrillo` es cuánto emite de más el banco formado
         —más color, no otro tono, que daría un salto.

         ── Y QUE NO VAYAN COMO REMACHES ───────────────────────────
         Los tres siguientes a 0 dan una plantilla: los sesenta y ocho
         tirando a su casilla con la misma fuerza, el morro clavado en la
         tangente y todos cuadrándose y deshaciéndose en el mismo
         instante.

         `formaError` es cuánto se equivoca cada pez de puesto, en fracción
         del largo de la silueta, y va pequeño: a 0,055 son unos treinta
         píxeles de una silueta de quinientos —bastante para que ninguno
         esté donde «debería» y poco para que el contorno siga cerrando—.
         El error transversal va a la mitad del longitudinal, porque
         desdibuja el canto mucho más.

         `formaDesorden` abre pez a pez lo demás: la gana con la que tira a
         su sitio (±80 %, así que unos llegan en un tercio del tiempo que
         otros), el desvío del morro (±0,35 rad) y el umbral al que se
         apunta y se suelta (0 a 0,77 de campo). Ese último es el que quita
         los dos momentos más forzados: el banco formándose en bloque y la
         silueta desapareciendo de golpe.

         `formaCalma` es cuánto se le baja el nervio en formación. A 0,70
         queda un 30 % de tirón y de desvío y la silueta tiembla; apagado
         del todo, los peces quedan clavados. */
      formaPega: 1.3, formaCerca: 0.20, formaBrillo: 1.1,
      formaError: 0.055, formaDesorden: 0.7, formaCalma: 0.70,

      /* DESORDEN POR CIZALLA: abre la velocidad de crucero y los pesos de
         grupo pez a pez, así que unos adelantan a otros. Sin esto todos
         nadan a la misma velocidad exacta, el banco se traslada como un
         sólido y la forma que tiene se queda congelada. El susto no se
         escala: el pánico es igual para todos. */
      desorden: 0.28,

      /* ÁGILES: viran rápido, cambian de idea a menudo y el tirón del
         nervio pesa. Un banco de peces lentos es una procesión. */
      vel: 0.66, velCebada: 0.92, velSusto: 3.4,
      vira: [2.0, 3.8],           // rad/s: vira rápido y corrige a menudo
      rumbo: [0.6, 2.0],          // cambia de idea cada poco
      /* NERVIO: tirones cortos por encima del crucero, con un desvío de
         rumbo en el mismo instante. No va más lejos, va a sacudidas. */
      nervio: [0.5, 1.6],         // U/s de tirón, se suma al nado
      cadaNervio: [0.18, 0.75],   // cada cuánto le da
      desvio: 0.5,                // radianes que tuerce al dárselo
      aleteo: 17,
      trago: 0.42,                // lo que tarda en entrar por la boca
      huida: [0.6, 1.6], lag: [4, 12], fuerzaDedo: 6, borde: 1.0,
    },

  ],
};
