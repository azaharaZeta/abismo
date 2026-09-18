/* ══════════════════════════════════════════════════════════════════
   LA CAZA DEL RAPE
   Lo que hace y lo que reparte: la querencia de borde, el bocado, los
   campos con los que tapa y asusta, la mirada y la luz que le llega.
   ══════════════════════════════════════════════════════════════════ */
import { M } from '../motor.js';
const {rnd, rango, opt} = M;
import { centro, aMundo } from './rape-cuerpo.js';
import { hacia } from './comun.js';

/* ── QUERENCIA DE BORDE ─────────────────────────────────────────────
   El rape no patrulla el centro: se arrima al canto y espera mirando
   hacia dentro. Va contra la tendencia de la casa —`M.borde` empuja hacia
   el centro—, y bajarle el `borde` no basta: eso lo deja a la deriva.

   La distancia al canto se mide por ejes y no radialmente: en un cuadro
   apaisado «al 80 % del radio» es el borde lateral pero todavía el centro
   por arriba, así que un empuje radial los amontona a los lados.

   `aro` es dónde se planta, y el empuje se apaga al llegar.         */
function querencia(f, M, p, dt){
  if (!p.querencia) return;
  const cx = M.W*0.5, cy = M.H*0.5;
  const ex = (f.bx - cx)/cx, ey = (f.by - cy)/cy;   // -1..1 por eje
  const falta = opt(p.aro, 0.80) - Math.max(Math.abs(ex), Math.abs(ey));
  if (falta <= 0) return;
  const d = Math.hypot(ex, ey);
  /* justo en el centro no hay «hacia fuera» que valga: se le da un lado y
     ya se encarga el resto */
  const nx = d > 1e-3 ? ex/d : (Math.random() < 0.5 ? 1 : -1);
  const ny = d > 1e-3 ? ey/d : 0;
  /* la rampa sube rápido: con `falta*2.5` el empuje se queda en un tercio
     a mitad de camino y la corriente —que aquí da más que el crucero del
     bicho— lo devuelve al centro; se plantaba en 0,69 y no en 0,84. */
  const k = p.querencia * M.U * Math.min(1, falta*6) * dt;
  f.vx += nx*k; f.vy += ny*k;
}

/* ── LA CAZA ────────────────────────────────────────────────────────
   El rape no persigue: espera a que algo se le ponga delante de la boca,
   que es justo donde cuelga la esca, y entonces da el bocado.

   Y después NO VUELVE A TIRAR EN UN RATO: eso es `reposo`. Con un banco
   entero entrando y saliendo del alcance, el rape muerde cada dos o tres
   segundos y el fogonazo pasa de acontecimiento a intermitente. Tras
   acertar tarda más que tras fallar: está tragando.                 */
/* la esca se apaga después de tragar, o sea después de masticar */
function apagaTrasComer(f){
  f.objBrillo = rnd(0.08, 0.22);
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
    if (f.mastica === 0 && f.digiere > 0) apagaTrasComer(f);
  }
  if (f.ataque > 0){
    f.ataque = Math.max(0, f.ataque - dt/p.bocado);
    /* la esca sólo se apaga CUANDO TERMINA el bocado. Apagarla al morder
       mataba justo el instante que hay que ver. */
    if (f.ataque === 0){
      /* si ha cazado algo, en vez de apagarse se pone a masticarlo; si ha
         fallado no hay nada que masticar y se apaga como antes */
      if (f.digiere > 0){
        if (f.masticaPend > 0){
          f.mastica = f.masticaTotal = f.masticaPend;
          f.masticaPend = 0;
        } else apagaTrasComer(f);
      }
      /* y se suelta la presa: el rape la sostiene mientras dura el bocado y no
         más. Normalmente ella se suelta antes, pero si deja de actualizarse a
         media boca (al degradar se recorta población) el enlace quedaría vivo
         para siempre, arrastrando un objeto que ya no está. */
      f.tragando = null;
    }
    return;
  }
  if (f.reposo > 0) return;
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
      f.masticaPend = rango(p.mastica || 0);
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
      f.reposo = rango(opt(p.reposoFallo, p.reposo));
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
   AUSENCIA de motas. Para que a oscuras no esté, escalar `fuerza` con la
   luz recibida: suave(clamp(f.ilum/(p.techo*0.18), 0, 1)).

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
  const filo = opt(p.tapaFilo, 28);
  for (const T of TAPAS){
    const c = aMundo(f, f.gx, Lg*T[0], 0);
    M.campos.push({ tipo:'tapa', plano: L.i, x: c[0], y: c[1],
                    r: Lg*T[1], ky: T[2], rot, filo, fuerza: k });
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
  const k = opt(p.velMira, 2.4);
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
