/* ══════════════════════════════════════════════════════════════════
   PEZ LINTERNA
   La presa, y lo que come un rape de verdad. Lleva una hilera de
   fotóforos en el vientre, así que en lo oscuro se lee como una fila de
   puntitos que avanza. Vaga a tirones hasta que ve una esca; se descuelga
   del banco y se va acercando, cada vez más visible porque la propia esca
   lo va alumbrando.
   ══════════════════════════════════════════════════════════════════ */
import { M, especie } from '../motor.js';
const {rgba, clamp, rnd, rango, rangoE, opt, TAU} = M;
import { porReparto, pintaHalo, reparte, giroCorto, mezclaAng,
         seAparta, reaccionBorde, avanza, silencio } from './comun.js';
import { formaObjetivo } from './forma.js';

/* ── EL CARDUMEN ────────────────────────────────────────────────────
   Tres reglas y ninguna más: no chocar, ir a la par y no quedarse solo.
   No hay líder, y ningún pez sabe dónde está el banco ni cuántos son:
   cada uno mira a los que tiene al lado.

   No manda, SUGIERE: lo que sale de aquí se suma al rumbo que el pez ya
   llevaba —el peso `propio`— y después su `vira` dibuja la curva, así que
   el banco se dobla en vez de quebrarse.

   `libre` es si el pez está a lo suyo. Cuando NO lo está —va a una esca, o
   huye— se le quitan las dos reglas de grupo, pero NO la de no chocar: con
   la separación apagada, la mitad de los cebados acaba con otro encima.

   ── POR QUÉ NINGUNO LO CONSIGUE ────────────────────────────────────
   Un banco en el que cada pez ve a todos sus vecinos, todo el rato y sin
   error, CONVERGE: llegan a un rumbo común y a partir de ahí se trasladan
   como una pieza —medido, 0,84 de alineación, o sea cada pez a diecisiete
   grados del rumbo medio de sus vecinos—. Bajar los pesos no lo arregla:
   el efecto no sale del ruido de la medida (está en
   docs/ideas/archivo/idea-cardumen-desorden.md). Lo que lo arregla es que
   la información les llegue MAL, y hay dos formas que además son las de
   un pez de verdad:

     · `reacciona` · NO MIRA TODO EL RATO, y es el que hace el trabajo.
       Mira, decide, y va con esa idea unas décimas de segundo; cuando
       vuelve a mirar, el grupo ya no está donde estaba, así que corrige
       hacia un sitio equivocado. Cuanto más rápido se mueva el grupo, más
       se equivoca. Medido: la alineación baja de 0,84 a 0,51 y el ángulo
       entre un pez y sus vecinos pasa de 17° a 42°.
     · `ciego` · NO VE HACIA ATRÁS. Rompe la reciprocidad: si A se alinea
       con B y B con A, los dos convergen. El golpe sí se siente por
       detrás, que la separación no mira el cono.

       OJO CON ÉSTE: a solas NO HACE NADA —0,88 contra 0,84, dentro del
       ruido—; lo que hace es bajar de 0,51 a 0,42 ENCIMA de `reacciona`.
       Con información al día da igual perder a los de atrás, porque los
       de delante ya traen el acuerdo; con información vieja, el de atrás
       era un canal de corrección más. Se queda por la medida.

   Ninguno de los dos cambia la FORMA del banco: la elongación se queda en
   1,9 con ellos y sin ellos. Lo que arreglan es la sincronía.

   `mira` es si a este pez le toca mirar en este fotograma. Cuando no le
   toca, la separación se aplica igual —esquivar es un reflejo, no una
   decisión— y las dos reglas de grupo se quedan con la idea de antes.

   Es todos contra todos dentro del plano: con las docenas que puebla la
   escena son unos cientos de comparaciones por plano y fotograma. El día
   que haya cientos de peces, aquí entra una rejilla.                */
function cardumen(z, M, L, p, libre, mira){
  const C = p.cardumen;
  if (!C) return;
  const vista = C.vista*M.U, v2 = vista*vista;
  const roce  = (C.roce || 0)*M.U, r2 = roce*roce;
  /* el cono ciego, como coseno y al cuadrado: así el reparto de vecinos se
     hace sin una sola raíz cuadrada, que en un bucle de todos contra todos
     es lo que importa */
  const cc = Math.cos(opt(C.ciego, 0)*0.5), cc2 = cc*cc;
  const vx = Math.cos(z.ang), vy = Math.sin(z.ang);
  let n = 0, jx = 0, jy = 0, ax = 0, ay = 0, ex = 0, ey = 0;
  for (const o of L.cardumen){
    if (o === z) continue;
    const dx = o.x - z.x, dy = o.y - z.y, d2 = dx*dx + dy*dy;
    if (d2 > v2) continue;
    /* NO CHOCAR, y esto va SIEMPRE: sólo con los de dentro del roce, y el
       peso crece como 1/d, no como (1 − d/roce). Con la caída lineal, en un
       grupo denso los vecinos están casi todos dentro del roce y sus
       vectores se anulan entre ellos: la separación desaparece justo cuando
       más falta hace. Con 1/d manda el más cercano, que es lo que hace un
       pez de verdad. */
    if (d2 < r2){
      const d = Math.sqrt(d2) || 1e-4;
      const q = Math.min(8, roce/d - 1);
      ex -= dx/d*q; ey -= dy/d*q;
    }
    if (!mira) continue;
    /* y a éste, ¿lo ve? El de detrás del cono ciego no cuenta para las dos
       reglas de grupo. `proy` es el producto escalar con su rumbo, y
       compararlo al cuadrado contra `cc2*d2` es lo mismo que comparar el
       coseno del rumbo relativo con el del cono, sin la raíz. */
    const proy = dx*vx + dy*vy;
    if (proy < 0 && proy*proy > cc2*d2) continue;
    n++;
    /* JUNTARSE: hacia el centro del grupo, acumulando el vector relativo
       —luego sólo importa la dirección, así que dividir por n sobra—. PERO NO
       CUENTAN LOS QUE ESTÁN DENTRO DEL ROCE: a distancia casi cero el vecino
       ES el centro del grupo, así que la cohesión apunta derecha a él y
       cancela a la separación. La regla buena es «voy hacia el grupo que
       veo, esquivo al que estoy tocando». */
    if (d2 >= r2){ jx += dx; jy += dy; }
    /* IR A LA PAR: la media de los rumbos, como vectores. Promediar los
       ángulos en radianes se rompe al cruzar el ±π —179° y −179° promedian
       0°, o sea justo el contrario. */
    ax += Math.cos(o.ang); ay += Math.sin(o.ang);
  }
  /* Las dos de grupo se normalizan porque lo que aportan es un RUMBO: da
     igual si el centro está a dos cuerpos o a diez. La separación NO,
     porque aporta una URGENCIA: normalizada, la cohesión gana siempre de
     cerca y el banco se cierra en un nudo que deja de ir a la par. */
  let sx = Math.cos(z.angObj)*C.propio, sy = Math.sin(z.angObj)*C.propio;
  if (libre && n){
    /* los pesos van por pez: un banco en el que todos hacen el mismo caso a
       sus vecinos converge a un solo rumbo y deja de fluir */
    const jl = Math.hypot(jx, jy);
    if (jl > 1e-4){ const w = C.junta*(z.kJunta || 1);
                    sx += jx/jl*w;  sy += jy/jl*w; }
    const al = Math.hypot(ax, ay);
    if (al > 1e-4){ const w = C.alinea*(z.kAlinea || 1);
                    sx += ax/al*w; sy += ay/al*w; }
  }
  sx += ex*C.aparta; sy += ey*C.aparta;
  if (sx || sy) z.angObj = Math.atan2(sy, sx);
}

/* LA PANZA, como los tres puntos de la curva que la dibuja. La hilera de
   fotóforos sale de aquí y no de una fórmula suya: escritas por separado se
   despegan en cuanto se toca un número, y es justo lo que pasaba —la hilera
   iba por debajo del canto y los puntos se veían fuera del pez.
   `t` va de 0 en la cola a 1 en el morro; la flexión de la cola entra en el
   primer punto, que es el único que se mueve. */
const PANZA = [[-0.42, 0.07], [0.10, 0.20], [0.50, 0.00]];
const _pz = [0,0];
/* el sitio que le toca a un pez dentro de una silueta impuesta, y con qué
   rumbo. Compartido y consumido en el acto, como los demás de la casa. */
const _fo = [0,0,0];
function panzaPez(t, Lg, cola){
  const mt = 1-t, a = mt*mt, b = 2*mt*t, c = t*t;
  _pz[0] = (a*PANZA[0][0] + b*PANZA[1][0] + c*PANZA[2][0]) * Lg;
  _pz[1] = (a*(PANZA[0][1] + cola*0.05) + b*PANZA[1][1] + c*PANZA[2][1]) * Lg;
  return _pz;
}
/* Dentro del canto, no encima: el punto tiene radio y la panza es fina, así
   que la hilera se mete a `DENTRO` de su profundidad y se queda en el tramo
   donde el cuerpo tiene grosor —en el morro y en la cola no cabe nada. */
const DENTRO = 0.72, FOTO_T = [0.12, 0.88];

especie('pezlinterna', {
  luz: true,                    // sus fotóforos también encienden plancton
  presa: true,
  cardumen: true,               // y hace banco con los suyos
  escalaCalidad: true,
  conteo: porReparto,

  /* ── LOS TONOS QUE MANDAN ─────────────────────────────────────
     Uno o dos por pecera, y en `crear` la mayoría se apunta a ellos: con
     un tono por pez y el círculo entero de la paleta salen los cuarenta a
     la vez y el banco se lee como confeti.

     Va en `siembra` y no en `crear` porque el banco se reparte en los
     tres planos y es UN banco: sorteándolo por plano saldrían hasta seis
     tonos mandando.

     Y se sortea cada vez que se puebla en vez de escribirlo en la escena:
     un dominante escrito a mano sería el mismo en todas las sesiones, y
     lo que se pide es una tendencia, no una identidad. */
  siembra(M, p){
    const n = rangoE(opt(p.dominantes, 0));
    if (!(n > 0) || !p.paleta){ p.mandan = null; return; }
    p.mandan = [];
    for (let i=0;i<n;i++) p.mandan.push(M.color(p.paleta));
  },

  crear(M, L, p){
    const Lg = rango(p.largo) * M.U * L.scale;
    const dso = opt(p.desorden, 0);
    /* el desorden de la formación va aparte del del banco: son dos cosas
       distintas —una es cómo nadan solos y otra cómo obedecen— */
    const fdo = opt(p.formaDesorden, 0), fer = opt(p.formaError, 0);
    /* su intervalo entre miradas, sorteado UNA vez: la primera mirada sale
       de él, así que tiene que ser el mismo número */
    const rea = rango((p.cardumen && p.cardumen.reacciona) || 0);
    return {
      /* TENDENCIA, no regla: el resto sigue sorteando de la paleta entera,
         así que entre los dominantes siguen cruzándose peces sueltos de
         cualquier tono. Sin ese resto el banco es monocromo y pierde el
         moteado, que es lo que lo hacía bonito. */
      c: (p.mandan && Math.random() < opt(p.tendencia, 0))
         ? M.elige(p.mandan) : M.color(p.paleta),
      Lg,
      x: rnd(0,M.W), y: rnd(0,M.H),
      /* como emisor es débil y NO es un señuelo: los demás peces linterna no
         deben perseguirse entre ellos */
      rLuz: Lg*p.alcanceLuz, luzI: p.emision, senuelo: false,
      rCuerpo: Lg*opt(p.alcanceCuerpo, 0.7),
      ang: Math.random()*TAU, angObj: Math.random()*TAU,
      vel: 0, prox: rnd(0.5, 4),
      vira: rango(p.vira),
      /* CADA PEZ, UN POCO DISTINTO. Sin esto todos nadan a la misma velocidad
         EXACTA y con los mismos pesos, y entonces el banco se traslada como
         un sólido: la forma que tenga se queda congelada. Lo que deshace eso
         es la cizalla —que unos vayan más rápidos que sus vecinos—, no más
         ruido en el rumbo. `desorden` es cuánto se abre cada número. */
      brio:    1 + rnd(-dso, dso),
      kAlinea: 1 + rnd(-dso, dso)*1.5,
      kJunta:  1 + rnd(-dso, dso)*1.5,
      /* CADA CUÁNTO MIRA A SUS VECINOS, y cuándo le toca la próxima. El
         segundo arranca sorteado dentro del primero y no a 0: naciendo
         todos a cero, los sesenta y ocho miran el mismo fotograma y el
         retraso deja de ser un retraso —vuelve a haber un banco que
         decide a la vez, sólo que a tirones. */
      reacciona: rea,
      proxMira:  Math.random()*rea,
      fase: Math.random()*TAU,
      nFoto: rangoE(p.fotoforos),
      ilum: 0, cebada: false,
      vx:0, vy:0,
      /* dx,dy es la velocidad de APARTARSE del dedo, aparte del nado */
      dx:0, dy:0,
      aparta: rango(p.aparta), lag: rango(p.lag),
      comido: false, susto: 0,
      /* el pánico de este fotograma y hacia dónde huye: los pone el campo
         `asusta` y los consume el rumbo, después del cardumen */
      panico: 0, huye: 0,
      /* ── SU SITIO SI ALGUIEN LOS FORMA ────────────────────────
         `orden` es un número que NO CAMBIA en toda su vida, y de él sale su
         puesto dentro de una silueta: así el reparto es estable y la forma
         no hierve. Sorteándolo por fotograma, cada uno es un reparto nuevo
         y lo que sale es una nube agitándose. `oy` es el lado que le toca
         si le cae relleno y no contorno. */
      orden: Math.random(), oy: rnd(-1, 1),
      forma: 0, realce: 0,
      /* ── Y LO QUE LE HACE NO IR COMO UN REMACHE ───────────────
         Con el puesto a secas, los sesenta y ocho peces tiran a su casilla
         con la misma fuerza y con el morro clavado en la tangente, y eso
         no es un banco imitando a un pez: es una plantilla. Cinco números
         por pez, sorteados al nacer y suyos para siempre:

           `kPega`  con cuánta gana tira a su sitio: unos llegan enseguida
                    y otros van rezagados todo el rato.
           `errL`   cuánto se equivoca de puesto A LO LARGO del cuerpo:
                    adelantado o retrasado.
           `errT`   y a lo ancho, que va a la mitad —el error transversal
                    desdibuja el contorno mucho más que el longitudinal.
           `errA`   cuánto lleva el morro desviado de la tangente.
           `suelta` a partir de qué fuerza de campo se apunta, y por debajo
                    de qué se suelta. Es lo que hace que ni se formen ni se
                    deshagan todos a la vez, y tiene que llegar ALTO: con
                    un tope de 0,35 la silueta aguanta con los 68 hasta el
                    último segundo de la rampa y luego cae de golpe; con
                    0,77 se descuelgan repartidos. Al que le sale alto sólo
                    se apunta en lo más alto del campo, o sea que participa
                    poco: también eso es un banco.

         Y el error VAGA, no está congelado: con `errVel` y `errFase` cada
         uno recorre despacio una elipse alrededor de su puesto. Congelado,
         la silueta sale con sus defectos clavados y vuelve a parecer
         dibujada, sólo que peor dibujada. */
      /* `apunta` decide si a este pez le toca entrar en una silueta: cada
         travesía sortea un cupo y entran los que lo traen por debajo. Es
         de nacimiento, así que no cambia a medio evento —y los que quedan
         fuera siguen nadando a lo suyo por encima de la forma, que es la
         mitad de lo que la hace parecer una casualidad. */
      apunta:  Math.random(),
      kPega:   1 + rnd(-1, 1)*fdo*0.8,
      errL:    rnd(-1, 1)*fer,
      errT:    rnd(-1, 1)*fer*0.55,
      errA:    rnd(-1, 1)*fdo*0.5,
      errVel:  rnd(0.25, 0.75),
      errFase: Math.random()*TAU,
      suelta:  Math.random()*fdo*1.1,
      tiron: 0, proxNerv: rnd(0, rango(p.cadaNervio || 1)),
      /* tragado: el rape que lo tiene, cuánto lleva dentro y cuánto queda de
         él. mengua 1 es entero, 0 es ya no está. */
      tragado: null, trago: 0, mengua: 1,
    };
  },

  actualiza(z, M, L, p, dt){
    const Lg = z.Lg;

    /* ── TRAGADO ──────────────────────────────────────────────────
       Ya no nada: de él tira la boca. El tirón acelera con el trayecto, el
       bicho se encoge y las quijadas se cierran encima. El destino se lee
       cada frame porque el rape se está lanzando al mismo tiempo. Nunca
       dura más que el bocado.                                       */
    if (z.tragado){
      const f = z.tragado, T = p.trago || 0.45;
      z.trago += dt;
      const u = clamp(z.trago/T, 0, 1);
      const k = Math.min(1, (4 + 14*u)*dt);
      z.x += (f.bocaX - z.x)*k;
      z.y += (f.bocaY - z.y)*k;
      const dm = giroCorto(Math.atan2(f.bocaY - z.y, f.bocaX - z.x), z.ang);
      z.ang += clamp(dm, -9*dt, 9*dt);
      /* cuadrática y no lineal: llega entero y desaparece dentro. Con 1−u
         empezaba a encogerse antes de haber entrado, y entonces no se leía
         tragado, se leía disuelto. */
      z.mengua = 1 - u*u;
      /* y se le sube la luz: dentro de esa boca están la esca recogida y el
         fogonazo, lo más brillante de la pieza. Sin esto la iluminación se
         congelaba en la del último frame libre y el bicho entraba a oscuras. */
      z.ilum += (1.1 - z.ilum) * Math.min(1, 8*dt);
      if (u < 1 && f.ataque > 0) return;   // ni busca, ni huye, ni deriva
      z.tragado = null; f.tragando = null;
      z.comido = true;
    }

    /* se lo han comido: reaparece lejos en vez de borrarlo del array, que
       obligaría al motor a repoblar a media escena */
    if (z.comido){
      z.comido = false; z.mengua = 1; z.trago = 0;
      /* En una caja no hay fuera del que volver: reapareciendo junto al canto,
         el cristal lo pegaba a la pared al fotograma siguiente y el bicho salía
         de la nada a la vista. Dentro y en el cuadrante opuesto: sale a oscuras
         y para cuando se le ve ya está nadando. */
      z.x = z.x < M.W*0.5 ? rnd(M.W*0.55, M.W*0.95) : rnd(M.W*0.05, M.W*0.45);
      z.y = z.y < M.H*0.5 ? rnd(M.H*0.55, M.H*0.95) : rnd(M.H*0.05, M.H*0.45);
      z.vx = z.vy = z.dx = z.dy = 0; z.vel = 0; z.ilum = 0; z.susto = 0;
      z.ang = z.angObj = Math.random()*TAU;
    }

    /* ── EL PÁNICO ────────────────────────────────────────────────
       Alguien ha mordido aquí al lado. No hace falta saber quién: el campo
       trae su centro, así que el rumbo sale de huir de ahí, y ni el pez
       sabe que existen los rapes ni el rape que existe el banco.

       Se LEE aquí, antes de mirar si hay una esca a la vista —`cebada` se
       apaga con el susto, y lo que se tiene que ver es el banco soltando
       la trampa—, pero el rumbo de huida se aplica DESPUÉS del cardumen.
       Ver más abajo: puesto aquí no llegaba a ninguna parte. */
    const sus = M.campo('asusta', z.x, z.y, L.i);
    z.panico = sus ? sus.peso : 0;
    if (z.panico > 0.04){
      z.susto = Math.max(z.susto, z.panico * opt(p.panico, 1.4));
      z.huye  = Math.atan2(z.y - sus.y, z.x - sus.x);
      z.prox  = Math.max(z.prox, 1.6);
    } else z.panico = 0;

    /* ── LE ESTÁN DANDO FORMA ─────────────────────────────────────
       Un campo `forma` trae en `d` el centro, el ángulo y la escala de una
       silueta, y el pez saca SU sitio de su `orden`. No sabe qué silueta
       es ni quién la pone.

       Y va con TIRÓN DE POSICIÓN y no sólo de rumbo. Con rumbo solo la
       forma no cuaja: un pez que vira a 3 rad/s y nada a 0,66 U/s describe
       una órbita alrededor de su sitio, no llega a él, y sesenta órbitas
       son una nube. El tirón es un lerp cuya fuerza sube con el peso del
       campo, así que la silueta cuaja desde el centro hacia fuera. A cambio
       se le baja el nado propio —si no, se pasa de largo. */
    const fm = M.campo('forma', z.x, z.y, L.i);
    /* `cupo` es la fracción del banco que esta travesía admite: al que no
       le toca, el campo no le dice nada */
    z.forma = (fm && fm.d && z.apunta < fm.d.cupo) ? fm.peso : 0;
    /* NI SE APUNTAN NI SE SUELTAN TODOS A LA VEZ. `suelta` es el umbral de
       cada pez, así que al subir el campo se van sumando de uno en uno y al
       bajar se van descolgando igual. Es una línea y es lo que quita de en
       medio los dos momentos más forzados del evento: el banco cuadrándose
       en bloque y la silueta desapareciendo de golpe. */
    if (z.forma > 0.02 + z.suelta){
      const d = fm.d;
      formaObjetivo(d, z, _fo);
      /* EL ERROR DE PUESTO, y vagando. `w` recorre despacio la elipse que
         cada pez describe alrededor de su casilla: longitudinal y
         transversal en contrafase, así que no es un temblor sino una
         deriva. Sin esto los peces se clavan en su sitio exacto y lo que se
         ve es una plantilla; con esto, unos van adelantados, otros
         retrasados, y ninguno está donde «debería». */
      const w = Math.sin(M.t*z.errVel + z.errFase);
      const ca = Math.cos(d.ang), sa = Math.sin(d.ang);
      const eL = z.errL * d.esc * (0.55 + 0.45*w);
      const eT = z.errT * d.esc * (0.55 - 0.45*w);
      const tx = _fo[0] + eL*ca - eT*sa;
      const ty = _fo[1] + eL*sa + eT*ca;
      /* ── HACIA DÓNDE MIRA, Y ESTO ES LO QUE LO HACE CASUAL ───
         De lejos, HACIA SU SITIO: un pez que nada de lado mientras se
         coloca se ve teledirigido, y lo que se tiene que ver es un pez
         yendo a donde va, que resulta que es ahí.

         De cerca, A LO LARGO DEL CONTORNO —es lo que cierra la silueta—, o
         al rumbo si le cayó relleno. Mirando a su sitio también de cerca,
         al llegar se queda sin destino y gira sobre sí mismo.

         Se mezcla entre los dos según lo que le falte (`mezclaAng`).
         `formaCerca` es a qué distancia —en largos de la silueta— se
         considera que ya ha llegado. Y encima, su desvío: una fila de
         peces perfectamente paralelos es lo que más delata la plantilla. */
      const fx = tx - z.x, fy = ty - z.y;
      const fd = Math.hypot(fx, fy) / d.esc;
      const cerca = 1 - clamp(fd/opt(p.formaCerca, 0.2), 0, 1);
      const av = Math.atan2(fy, fx);           // hacia su sitio
      z.angObj = mezclaAng(av, _fo[2], cerca) + z.errA*(0.4 + 0.6*w);
      z.prox = Math.max(z.prox, 0.5);
      /* y cada uno con SU gana, y flojo: lo que cuaja la silueta es el
         tiempo, no la fuerza. Unos llegan enseguida y otros van rezagados
         toda la maniobra. */
      const k = Math.min(1, z.forma*opt(p.formaPega, 2.2)*z.kPega*dt);
      z.x += (tx - z.x)*k;
      z.y += (ty - z.y)*k;
      /* y COGE MÁS COLOR: no cambia de tono —eso daría un salto—, sube lo
         que emite. Se guarda porque lo consume `dibuja`. */
      z.realce = z.forma;
    } else {
      /* fuera de la formación no manda nadie, aunque el campo siga ahí: al
         bajar, cada pez se descuelga en su umbral y las reglas del banco
         vuelven solas. */
      z.forma = 0;
      if (z.realce > 0) z.realce = Math.max(0, z.realce - dt*1.2);
    }

    /* ¿hay una esca a la vista? Sólo señuelos: un pez linterna no persigue a
       otro pez linterna. */
    let cebo = null, md2 = Infinity;
    const R = p.atraccion*M.U;
    for (const o of L.luces){
      if (!o.senuelo) continue;
      const dx = o.x - z.x, dy = o.y - z.y, d2 = dx*dx + dy*dy;
      if (d2 < R*R && d2 < md2){ md2 = d2; cebo = o; }
    }
    z.cebada = !!cebo && !z.susto;

    z.prox -= dt;
    if (z.cebada){
      /* el rumbo apunta al cebo pero el viraje es lento: describe una
         curva, no una recta */
      z.angObj = Math.atan2(cebo.y - z.y, cebo.x - z.x);
    } else if (z.prox <= 0){
      /* cerca del canto el rumbo nuevo se sortea alrededor de «hacia dentro» en
         vez de al azar puro */
      const bb = M.borde(z.x, z.y);
      z.angObj = bb[2] > 0.02
        ? Math.atan2(bb[1], bb[0]) + rnd(-1.1, 1.1)*(1 - bb[2]*0.5)
        : Math.random()*TAU;
      z.prox = rango(p.rumbo);
    }
    /* El banco. Una esca a la vista o un susto lo rompen, pero ni así
       puede atravesar a los demás: se llama siempre y es `cardumen` quien
       decide qué reglas le tocan. Mientras la forma manda, el banco no
       —las tres reglas y una silueta impuesta se pelean y gana el grupo—;
       por debajo de 0,3 vuelve, y es lo que hace que deshacerse se vea.

       `mira` es si le toca replantearse el grupo en este fotograma. Se
       llama IGUAL cuando no le toca: esquivar al de al lado no es una
       decisión que se pueda posponer. */
    z.proxMira -= dt;
    const mira = z.proxMira <= 0;
    if (mira) z.proxMira = z.reacciona;
    if (z.forma < 0.3) cardumen(z, M, L, p, !z.cebada && !z.susto, mira);

    /* ── Y AHORA SÍ, HUIR ─────────────────────────────────────────
       Después del cardumen y no antes: `aparta` acumula un vector por
       vecino dentro del roce, y en un banco denso le pasa por encima a
       cualquier rumbo puesto antes.

       Se MEZCLA con lo que dijo el grupo en vez de sustituirlo. Así el que
       tiene el campo encima huye casi en línea recta y el del canto del
       radio apenas se desvía, y en ningún caso se apaga la separación: el
       banco se abre sin anudarse. */
    if (z.panico > 0.04) z.angObj = mezclaAng(z.angObj, z.huye, z.panico*0.85);

    /* ── NERVIO ───────────────────────────────────────────────────
       El crucero va suavizado —rampa de casi medio segundo—, así que un
       tirón metido por ahí sale blando. Éste se suma aparte y se apaga
       solo, y de paso tuerce el rumbo: un pez pequeño no es que se mueva
       más rápido, es que cambia de idea más veces.

       EN FORMACIÓN NO SE CALLA, SE BAJA: apagado del todo los peces quedan
       clavados como remaches. Con `formaCalma` queda un resto y la silueta
       TIEMBLA. */
    if (p.nervio){
      const cal = 1 - z.forma*opt(p.formaCalma, 1);
      z.proxNerv -= dt;
      if (z.proxNerv <= 0){
        z.proxNerv = rango(p.cadaNervio || 1);
        z.tiron = rango(p.nervio)*M.U*cal;
        z.angObj += rnd(-1,1)*(p.desvio || 0)*cal;
      }
      z.tiron *= Math.pow(0.03, dt);
    }

    const dd = giroCorto(z.angObj, z.ang);
    const giro = z.vira * (z.susto ? 3 : 1) * dt;
    z.ang += clamp(dd, -giro, giro);

    z.susto = Math.max(0, z.susto - dt);
    const objVel = M.U * (z.susto ? p.velSusto
                                  : (z.cebada ? p.velCebada : p.vel) * (z.brio || 1))
                  /* y NO dejan de nadar: al 85 % de amortiguación se
                     quedaban colgados de su casilla como boyas. Con 0,55
                     siguen empujando a lo suyo y el tirón sólo los sesga,
                     que es lo que hace que parezcan nadando por su cuenta
                     y coincidiendo. */
                  * (1 - z.forma*0.55);
    z.vel += (objVel - z.vel) * Math.min(1, 2.4*dt);

    /* EL DEDO. Aquí NO se toca `susto` ni `angObj`: el susto es lo que
       reparte un rape al morder —triplica el viraje, sube el nado a
       `velSusto` y suelta las reglas de grupo—, y el dedo no es eso. Lo que
       hace el contacto es apartar al pez de lado mientras sigue nadando
       hacia donde iba. */
    seAparta(z, M, p, M.empuje(z.x, z.y, Lg*0.9), dt);
    /* vx,vy queda SÓLO para el empuje del canto, y se frena rápido: el
       nado va por z.ang y z.vel y no debe heredar esa frenada. */
    const fr = Math.pow(0.12, dt);
    z.vx *= fr; z.vy *= fr;
    reaccionBorde(z, M, p, z.x, z.y, dt);

    /* el desvío del dedo se SUMA al nado: ya es una velocidad */
    const nado = z.vel + z.tiron;
    avanza(z, M, L, dt, Math.cos(z.ang)*nado + z.dx,
                        Math.sin(z.ang)*nado + z.dy);
    /* éste sí sabe girar: se le pone el rumbo hacia dentro y su `vira` dibuja
       la curva, así que la media vuelta se ve como una decisión */
    const par = M.envuelve(z);
    if (par[0] || par[1]){
      z.angObj = Math.atan2(par[1] || Math.sin(z.ang), par[0] || Math.cos(z.ang));
      z.prox = rango(p.rumbo);
    }

    /* cuanto más cerca del cebo, más se le ve: la propia trampa lo va sacando
       de la oscuridad */
    const ob = cebo
      ? clamp(1.25/(1 + (Math.sqrt(md2)/(M.U*p.revelado))**2), 0, 1) : 0;
    z.ilum += (ob - z.ilum) * Math.min(1, 7*dt);
  },

  dibuja(z, M, L, p, g){
    const Lg = z.Lg, sh = L.sharp;
    /* mengua < 1 sólo mientras lo están tragando: se encoge hacia la boca y
       pierde luz, pero no del todo —apagándose antes de entrar no se ve
       entrar. */
    const men = z.mengua, apaga = (0.35 + 0.65*men)*(1 - silencio(M, z.x, z.y, L));
    if (apaga < 0.02) return;
    /* `realce` es lo que le sube el evento que lo ordena: el banco formado
       no cambia de color —eso daría un salto de tono— sino que emite más */
    const rl = 1 + z.realce*opt(p.formaBrillo, 0);
    const br = (p.base + z.ilum) * p.brillo * apaga * rl;
    /* LO QUE EMITE ÉL, que no es lo mismo que lo que le llega. `br` es la
       luz recibida y va de 0,12 a 1,5 según lo que tenga al lado —trece
       veces—; esto es su hilera de fotóforos, que está encendida igual
       cuando no le da nada. La diferencia era justo el problema del que se
       quejaba el cuerpo negro: los fotóforos se ven siempre y el cuerpo
       sólo cuando algo lo alumbraba, así que un pez a solas era una fila
       de puntos sobre nada. */
    const propia = p.foto * (0.75 + 0.45*z.ilum) * apaga * rl;
    const cola = Math.sin(M.t*p.aleteo + z.fase);

    g.save();
    g.translate(z.x, z.y);
    g.rotate(z.ang);            // +x es hacia donde nada
    if (men < 1) g.scale(Math.max(0.06, men), Math.max(0.06, men));

    /* El cuerpo. Se pinta siempre que haya ALGO que pintar, y ahora eso
       incluye su propio blanco: con la guarda en `br` a solas, un pez al
       que no le da nada se saltaba el bloque entero y no había forma de
       que se le viera la silueta. */
    if (br > 0.02 || opt(p.blanco, 0)*propia > 0.004){
      g.beginPath();
      g.moveTo(Lg*0.50, 0);
      g.quadraticCurveTo(Lg*0.10, -Lg*0.20, -Lg*0.42, -Lg*0.07 + cola*Lg*0.05);
      g.lineTo(-Lg*0.62, -Lg*0.16 + cola*Lg*0.13);   // caudal
      g.lineTo(-Lg*0.52,  0      + cola*Lg*0.09);
      g.lineTo(-Lg*0.62,  Lg*0.16 + cola*Lg*0.13);
      g.lineTo(PANZA[0][0]*Lg, (PANZA[0][1] + cola*0.05)*Lg);
      g.quadraticCurveTo(PANZA[1][0]*Lg, PANZA[1][1]*Lg,
                         PANZA[2][0]*Lg, PANZA[2][1]*Lg);
      g.closePath();
      /* `cuerpo`, `blanco` y `canto` salen de la escena porque son el mando
         de lo NEGRO que se ve un pez: escritos a mano aquí no se pueden
         tocar sin abrir el catálogo. Los tres multiplican a `br`, que es la
         luz que de verdad le llega, así que a oscuras siguen sin encender
         nada.

         `cuerpo` es cuánto tinte coge el relleno —el degradado que va de
         `mid` en el morro a `glow` en la cola, o sea el color propio del
         pez. */
      const tin = opt(p.cuerpo, 1);
      const gb = g.createLinearGradient(Lg*0.5, 0, -Lg*0.6, 0);
      gb.addColorStop(0.00, rgba(z.c.mid,  Math.min(1, 0.42*br*tin)));
      gb.addColorStop(0.55, rgba(z.c.glow, Math.min(1, 0.20*br*tin)));
      gb.addColorStop(1.00, rgba(z.c.glow, Math.min(1, 0.04*br*tin)));
      g.fillStyle = gb; g.fill();
      /* Y `blanco` ES UN POCO DE `core` ENCIMA, plano y en una SEGUNDA
         pasada. Metido como un tramo más del degradado de arriba no vale:
         entre dos tramos el alfa interpola, así que un tramo claro entre
         dos oscuros deja una banda apagada cruzando el cuerpo. Sumando
         encima —el plano va en `lighter`— el cuerpo coge el blanco sin
         perder su tinte. El path sigue puesto de la pasada anterior, así
         que esto no vuelve a trazarlo.

         VA CON `propia` Y NO CON `br`, y ahí está la gracia: es la carne
         del bicho alumbrada por SUS PROPIOS FOTÓFOROS —que es lo que hace
         un mictófido de verdad, llevarlos en el vientre—, no luz que le
         llegue de fuera. Atado a `br` no servía para nada: en un pez al
         que no le da nada `br` vale 0,12, así que el blanco salía por
         debajo del ruido del dither y seguía viéndose negro, que era
         exactamente la queja. Con `propia` se ve siempre, y sólo sube un
         75 % cuando además lo alumbran.

         Una pasada de relleno más por pez: cronometrado con los 59 de la
         pecera, 0,13 ms de fotograma, o sea dos microsegundos por bicho.
         El path ya está trazado y es el gasto de rellenarlo otra vez. */
      const bl = opt(p.blanco, 0);
      if (bl > 0.002){
        g.fillStyle = rgba(z.c.core, Math.min(1, bl*propia));
        g.fill();
      }
      g.strokeStyle = rgba(z.c.core, Math.min(1, opt(p.canto, 0.34)*br*sh));
      g.lineWidth = Math.max(0.4, Lg*0.022);
      g.stroke();
      /* el ojo, desproporcionado como el de un mictófido de verdad */
      g.fillStyle = rgba(z.c.core, 0.70*br*sh);
      g.beginPath(); g.arc(Lg*0.33, -Lg*0.05, Math.max(0.6, Lg*0.055), 0, TAU); g.fill();
    }

    /* LOS FOTÓFOROS: esto sí se ve siempre, y es lo único que se ve de lejos.
       Una hilera en el vientre, con brillos desiguales. */
    const n = z.nFoto, bfo = propia;
    for (let i=0;i<n;i++){
      /* del morro a la cola, que es el orden en el que iban */
      const t = FOTO_T[1] - (FOTO_T[1]-FOTO_T[0])*reparte(i, n);
      const pz = panzaPez(t, Lg, cola);
      const fx = pz[0], fy = pz[1]*DENTRO;
      const pa = bfo * (0.55 + 0.45*Math.sin(M.t*1.7 + i*1.9 + z.fase));
      /* y el punto tampoco puede pasar del hueco que le queda hasta el
         canto, así que la hilera se afina hacia el morro y hacia la cola
         —que es como la lleva un mictófido de verdad. */
      const rr = Math.min(Lg*0.035, pz[1] - fy);
      pintaHalo(g, M, z.c, fx, fy, rr*5, pa*0.55);
      g.fillStyle = rgba(z.c.core, Math.min(1, pa));
      g.beginPath(); g.arc(fx, fy, rr, 0, TAU); g.fill();
    }
    g.restore();
  },
});
