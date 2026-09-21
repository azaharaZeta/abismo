/* ══════════════════════════════════════════════════════════════════
   LA CAZA DEL RAPE
   Lo que hace y lo que reparte: la querencia de borde, el bocado, los
   campos con los que tapa y asusta, la mirada y la luz que le llega.
   ══════════════════════════════════════════════════════════════════ */
import { M } from '../motor.js';
const {clamp, rango, suave, opt} = M;
import { centro, aMundo } from './rape-cuerpo.js';
import { hacia } from './comun.js';

/* ── QUERENCIA DE BORDE ─────────────────────────────────────────────
   El rape no patrulla el centro: se arrima al canto y espera mirando
   hacia dentro. Va contra la tendencia de la casa —`M.borde` empuja hacia
   el centro—, y bajarle el `borde` no basta: eso lo deja a la deriva.

   Y EL CANTO ES EL LATERAL, no el más cercano. El aro se medía por ejes
   —`max(|ex|,|ey|)`, o sea que el techo lo cumplía igual que el lado— y
   el empuje iba en RADIAL, así que en cuanto la vertical le ganaba a la
   horizontal el empuje apuntaba casi hacia arriba y lo remataba contra el
   techo, donde el aro se daba por cumplido y se apagaba. Y lo que hacía
   que la vertical ganara es la propia embestida, que va inclinada hasta
   ±0,34 rad: un paseo aleatorio con un embudo al final. MEDIDO, ocho
   semillas de 600 s en caja de móvil: nacían todos en un lateral y los
   ocho acababan contra el techo o el suelo y en el centro horizontal, el
   84-97 % del tiempo por encima de 0,70 de altura. Justo lo contrario de
   lo que la escena dice que hace.

   `aro` es a qué distancia del centro se planta, ya SÓLO en x, y el
   empuje se apaga al llegar. `altura` es el tirón hacia la media altura y
   va APARTE del aro, sin apagarse nunca: es lo único que saca a uno ya
   plantado en un canto horizontal, y flojo a propósito —no prohíbe el
   techo, lo hace raro.                                              */
function querencia(f, M, p, dt){
  if (!p.querencia) return;
  const cx = M.W*0.5;
  /* ── LA ALTURA A LA QUE VIVE, Y ES LA DE SU BANDA ──────────────
     `aroY` es lo que se separa de la media altura el sitio de cada uno,
     en fracción de alto: a 0 los dos van al centro —lo de siempre— y a
     0,16 uno vive en el 34 % y el otro en el 66 %. Es lo que convierte
     el cuadrante de nacimiento en un SITIO en vez de en un punto de
     partida que se deshace en medio minuto.

     Y no puede subir mucho: el tirón al centro estaba medido y es lo
     que impide que el rape se instale contra el techo, que es donde
     peor se le ve la cara. `aroY` mueve su casa, no le quita el tirón. */
  const cy = M.H*(0.5 + f.banda*opt(p.aroY, 0));
  const ex = (f.bx - cx)/cx, ey = (f.by - cy)/(M.H*0.5);
  f.vy -= ey * opt(p.altura, 0) * M.U * dt;
  /* ── Y TIRA HACIA SU LADO, NO HACIA EL MÁS CERCANO ─────────────
     `f.lado` se sortea al nacer —o lo fija la escena con `lado`— y ya no
     cambia. Mirando `Math.sign(ex)`, el lado era el que tocara en cada
     fotograma: un rape que cruzaba el centro se quedaba en el otro
     canto, y con DOS en la pecera los dos acababan en el mismo. MEDIDO,
     cuatro semillas de 200 s: compartían lado entre el 23 % y el 83 %
     del tiempo y pasaban el 41-86 % a menos de 1,4 largos uno de otro,
     o sea encima. Con el lado propio, cada uno se planta en el suyo.

     `falta` va con SIGNO contra su lado, así que un rape que aparezca en
     el lado contrario tiene el empuje más grande y vuelve a su sitio. */
  const falta = p.aro - ex*f.lado;
  if (falta <= 0) return;
  /* la rampa sube rápido: con `falta*2.5` el empuje se queda en un tercio
     a mitad de camino y la corriente —que aquí da más que el crucero del
     bicho— lo devuelve al centro; se plantaba en 0,69 y no en 0,84. */
  f.vx += f.lado * p.querencia * M.U * Math.min(1, falta*6) * dt;
}

/* ── LA CAZA ────────────────────────────────────────────────────────
   El rape no persigue: espera a que algo se le ponga delante de la boca,
   que es justo donde cuelga la esca, y entonces da el bocado.

   Y después NO VUELVE A TIRAR EN UN RATO: eso es `reposo`. Con un banco
   entero entrando y saliendo del alcance, el rape muerde cada dos o tres
   segundos y el fogonazo pasa de acontecimiento a intermitente. Tras
   acertar tarda más que tras fallar: está tragando.

   ── LOS RELOJES SON NUEVE Y LAS FASES CUATRO ───────────────────────
   Acecho → bocado → mastica → digestión, y **`ataque` y `mastica` NO SE
   SOLAPAN NUNCA**: de eso depende que el orden de aquí abajo valga. De los
   otros cinco relojes, ninguno es una fase:

     `reposo`             el enfriamiento, y corre EN PARALELO a todo:
                          arranca al morder.
     `fogonazo`/`espanta` envolventes que CRUZAN las fases a propósito —la
                          ráfaga tiene que cubrir bocado y masticación con
                          una sola curva, y el susto durar más que la luz o
                          el pánico no se llega a ver.
     `masticaTotal`       la escala de `mastica`, para su envolvente.
     `masticaPend`        lo ganado al acertar, esperando turno. Ver abajo. */
/* la esca se apaga después de tragar, o sea después de masticar */
function apagaTrasComer(f, p){
  f.objBrillo = rango(p.escaSaciada);
  f.proxBrillo = f.digiere;
  f.digiere = 0;
}

function caza(f, M, L, p, dt){
  if (f.reposo > 0) f.reposo -= dt;
  /* MASTICAR. No alarga el bocado —un cazador de emboscada tiene que
     seguir siendo un tirón—, añade lo de después: con la presa dentro se
     queda trabajando la quijada unos segundos y con el ilicio recogido
     junto a la boca, o sea con su propia luz encima. Ahí se le ve. */
  if (f.mastica > 0){
    f.mastica = Math.max(0, f.mastica - dt);
    if (f.mastica === 0 && f.digiere > 0) apagaTrasComer(f, p);
  }
  if (f.ataque > 0){
    f.ataque = Math.max(0, f.ataque - dt/p.bocado);
    /* la esca sólo se apaga CUANDO TERMINA el bocado. Apagarla al morder
       mataba justo el instante que hay que ver. */
    if (f.ataque === 0){
      /* si ha cazado algo, en vez de apagarse se pone a masticarlo; si ha
         fallado no hay nada que masticar y se apaga como antes */
      /* Y AQUÍ ES DONDE SE GASTA `masticaPend`, que no es un rodeo:
         `f.mastica > 0` significa «está masticando AHORA MISMO» para SEIS
         lectores del dibujo —la envolvente `mast`, el trabajo de la
         quijada, la respiración, `congela`, `alFrente` y lo recogido que
         va el ilicio, dos de ellos combinados con `f.ataque` por
         `Math.max`—. Poniéndolo al morder, el rape masticaría durante el
         bocado: la quijada trabajando y el ilicio sin estirarse al final.
         Hacen falta dos ranuras: lo que VA a masticar y lo que masticA. */
      if (f.digiere > 0){
        if (f.masticaPend > 0){
          f.mastica = f.masticaTotal = f.masticaPend;
          f.masticaPend = 0;
        } else apagaTrasComer(f, p);
      }
      /* y se suelta la presa: el rape la sostiene mientras dura el bocado y no
         más. Normalmente ella se suelta antes, pero si deja de actualizarse a
         media boca —un repoblado a mitad de bocado— el enlace quedaría vivo
         para siempre, arrastrando un objeto que ya no está. */
      f.tragando = null;
    }
    return;
  }
  if (f.reposo > 0) return;
  /* Y NO CAZA CON LA TRAMPA APAGADA. `senuelo` es cuánto tira ahora mismo
     —el MISMO número que hace que la presa se acerque, ver rape.js—, así
     que a 0 no hay trampa: un rape saciado que se encuentre un pez en la
     boca no lo muerde.

     Hace falta decirlo aparte porque `reposo` NO lo cubre: lo que dura el
     apagón es `trasComer` y son dos sorteos distintos —10-24 s contra
     7-16—, así que se destapan solos. Medido antes de ponerlo: uno de
     cada cuatro bocados salía con la esca a cero. */
  if (!(f.senuelo > 0)) return;
  const rb = f.Lg*p.alcanceBoca;
  for (const z of L.presas){
    if (z.tragado) continue;              // ése ya va camino de una boca
    const dx = z.x - f.x, dy = z.y - f.y;
    if (dx*dx + dy*dy > rb*rb) continue;
    f.ataque = 1;
    f.fogonazo = 1;
    /* Y EL BANCO SE ENTERA: se empuja un campo `asusta` y quien lo lea
       huye. También al FALLAR, y a propósito —lo que ven los vecinos es el
       tirón y la ráfaga, que son los mismos acierte o no. */
    f.espanta = 1;
    f.lanza = Math.max(f.lanza, rango(p.acometida)*M.U);
    if (Math.random() < p.acierto){
      /* no se esfuma en la esca: queda engarzado y la boca tira de él hasta
         dentro. Desaparecer donde cuelga el señuelo era perder justo lo que
         explica para qué sirve el señuelo. */
      z.tragado = f; z.trago = 0;
      f.tragando = z;
      f.digiere = rango(p.trasComer);     // se apagará al acabar
      f.masticaPend = rango(opt(p.mastica, 0));
      f.reposo  = rango(p.reposo);
    } else {
      /* falló, y la presa sale disparada HACIA FUERA: el rumbo se le da desde
         la esca hacia él, y se le alarga el temporizador para que no sortee
         otro antes de haber escapado. Subiéndole sólo la velocidad acelera
         con el rumbo que traía —que apunta al señuelo— y vuelve a la boca. */
      z.susto = 1.6;
      z.angObj = Math.atan2(z.y - f.y, z.x - f.x);
      z.prox = Math.max(z.prox, 1.8);
      /* y aquí NO se le toca el brillo a la esca: subirlo la deja a tope
         hasta el siguiente parpadeo, o sea un segundo encendida detrás de
         la ráfaga. El parpadeo sigue su ciclo. */
      f.reposo = rango(p.reposoFallo);
    }
    return;
  }
}

/* ── LO QUE TAPA ────────────────────────────────────────────────────
   El cuerpo del rape, puesto en el campo `tapa` para que lo que esté
   detrás deje de dibujarse ahí. `M.campo` no sabe de siluetas, pero para
   un cuerpo casi horizontal la elipse acierta: lo que hay que tapar es la
   masa del tronco, no el filo de la cola.

   Tapa SIEMPRE, también negro sobre negro: se le encuentra por la
   AUSENCIA de motas.

   ── Y CUANDO NO LO ALUMBRA NADIE, ADEMÁS OSCURECE ──────────────────
   Tapar no basta para que un cuerpo se lea a oscuras: quitarle las motas
   a lo que tiene detrás deja un hueco del color del agua, y el agua ahí
   abajo ya es casi negra. `oscuro` le añade la otra mitad —le quita luz
   al AGUA, que es lo que hace legible al leviatán— y va por `agua` en el
   mismo campo `tapa`, sin uno nuevo: es la misma elipse, así que la
   sombra y el silencio no se pueden desalinear.

   VA AL REVÉS QUE TODO LO DEMÁS DEL BICHO: crece según BAJA `ilum`, así
   que el rape es un agujero mientras nadie lo mira y se disuelve en el
   agua en cuanto algo lo alumbra y hay cuerpo que enseñar. El umbral es
   medio `techo`, el mismo que usa `congela`: las dos cosas contestan a
   «ya lo han encontrado» y contestarlo dos veces en sitios distintos es
   la forma de que un día dejen de pasar a la vez.

   Se llama desde la pasada de campos, o sea ANTES de que el bicho se
   actualice, así que la postura que lee es la del fotograma anterior: da
   igual por los píxeles que se mueve en 16 ms, y la alternativa es que el
   plancton del fondo no vea el campo nunca. */
/* EL PERFIL, en dos elipses y no en una: un rape es gordo y corto por
   delante y fino y largo por detrás, así que una sola o se pasa del morro
   o deja la cola destapada. `M.campo` se queda con el que más pesa, así
   que la unión sale sola.
   [u del centro, semieje mayor en largos, proporción del eje corto] */
const TAPAS = [[0.32, 0.36, 1.06],      // el tronco
               [0.76, 0.28, 0.46]];     // la cola

function tapa(f, M, L, p){
  const k = opt(p.tapa, 0);
  if (k < 0.004) return;
  /* EL CANTO VA DURO: la materia tiene canto, y el desvanecido largo es
     para los eventos. El reglaje está en escena.js. */
  const Lg = f.Lg, rot = -f.gx*f.ang;   // el mismo giro que enPez()
  const filo = p.tapaFilo;
  /* lo que se lleva del agua, y sólo mientras esté a oscuras */
  const agua = opt(p.oscuro, 0)
             * (1 - suave(clamp(f.ilum/Math.max(0.001, p.techo*0.5), 0, 1)));
  for (const T of TAPAS){
    const c = aMundo(f, f.gx, Lg*T[0], 0);
    M.campos.push({ tipo:'tapa', plano: L.i, x: c[0], y: c[1],
                    r: Lg*T[1], ky: T[2], rot, filo, fuerza: k, agua });
  }
}

/* ── LO QUE REPARTE AL MORDER ───────────────────────────────────────
   Un campo `asusta` centrado en la boca. El rape no le habla a nadie: lo
   empuja y quien lo lea huye, que es todo el vocabulario que tiene la
   pieza —el mismo que usa para taparle la luz a los de detrás.

   Va en `campos()` y NO en `actualiza()`, como el `tapa`: los campos se
   vacían al empezar el fotograma y esta pasada corre para los tres planos
   antes de que se mueva nadie, que es la única forma de que lo lea también
   un pez del fondo.

   Con guarda de plano: un rape del plano de delante no asusta a un banco
   que está treinta metros más allá.                                 */
function espanto(f, M, L, p){
  const r = opt(p.espanta, 0);
  if (!(r > 0) || !(f.espanta > 0.01)) return;
  M.campos.push({ tipo:'asusta', plano: L.i, x: f.bocaX, y: f.bocaY,
                  r: f.Lg*r, fuerza: f.espanta,
                  filo: opt(p.espantaFilo, 1) });
}

/* los dos campos que pone el rape, en una sola función porque el contrato
   de especie sólo admite un `campos` */
function camposRape(f, M, L, p){
  tapa(f, M, L, p);
  espanto(f, M, L, p);
}

/* ── LA MIRADA ──────────────────────────────────────────────────────
   A QUÉ está atento. Sólo mantiene un punto en el mundo; la pupila la
   coloca ojo() y el destello sale de comparar este punto con el de la luz.
   Por orden: la presa más cercana dentro de `vigila`; si no hay, lo que lo
   esté ALUMBRANDO —el dedo no tiene caso especial: sale de que el dedo
   enciende cosas—; y si no, su propia esca. O sea que el ojo está
   normalmente al frente, y por eso cualquier desvío se lee.

   Llega TARDE a propósito: `velMira` bajo es la diferencia entre un
   reflejo y una decisión. Subirlo deja una torreta.                 */
function mirada(f, M, L, p, dt){
  const R = f.Lg*opt(p.vigila, 0);
  let d2m = R*R, presa = null;
  const cen = centro(f, f.gx), cx = cen[0], cy = cen[1];
  for (const z of L.presas){
    /* la que ya va camino de una boca, no: el ojo se quedaba mirando lo que
       el propio bicho tiene dentro */
    if (z.tragado) continue;
    const dx = z.x - cx, dy = z.y - cy, d2 = dx*dx + dy*dy;
    if (d2 < d2m){ d2m = d2; presa = z; }
  }
  let tx, ty;
  if (presa)              { tx = presa.x; ty = presa.y; }
  else if (f.ilum > 0.02) { tx = f.luzX;  ty = f.luzY;  }
  else                    { tx = f.x;     ty = f.y;     }
  const k = p.velMira;
  f.miraX = hacia(f.miraX, tx, k, dt);
  f.miraY = hacia(f.miraY, ty, k, dt);
}

/* ── LUZ RECIBIDA ───────────────────────────────────────────────────
   La suma de las escas del plano, con la propia penalizada —apunta al
   frente y no al dueño—. La cuenta la hace `M.luzEn`, que es la misma para
   todo el que se enciende porque algo lo alumbra; aquí sólo van el reglaje
   del rape y qué se guarda.

   `caida` alta es alcance corto y `ganancia` alta es mucha luz dentro de
   ese alcance: juntas son lo que hace que un rape sea difícil de ver pero
   se vea bien cuando se ve. SIN corte, o el cuerpo se apagaría de golpe al
   salir del foco en vez de irse. */
function luzRecibida(f, M, L, p, dt){
  /* el centro del cuerpo otra vez, ya movido: medirlo contra el de antes de
     integrar dejaba la iluminación un frame por detrás */
  const cen = centro(f, f.gx);
  const luz = M.luzEn(cen[0], cen[1], L.luces, {
    caida: p.caida, ganancia: p.ganancia, umbral: 0.004,
    propio: f, autoLuz: p.autoLuz,
  });
  /* de la luz dominante se guarda DÓNDE está, no de qué color es: el lado
     por el que se enciende es suyo, el tono es del bicho */
  if (luz.total > 0){ f.luzX = luz.x; f.luzY = luz.y; }
  f.ilum = hacia(f.ilum, luz.total, 9, dt);         // sin parpadeos duros
}
export { querencia, caza, camposRape, mirada, luzRecibida };
