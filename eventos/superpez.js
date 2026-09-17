import { M, evento } from '../motor.js';
const {clamp, rnd, rango, rangoE, suave, opt, TAU} = M;
import { giroCorto } from '../bichos/comun.js';
import { escQueCabe } from '../bichos/forma.js';

/* ── EL SUPERPEZ ────────────────────────────────────────────────────
   El banco, sin dejar de nadar cada uno a lo suyo, se encuentra un rato
   con forma de pez enorme, avanza, describe una curva y se deshace. Es
   mimetismo, y existe. No dibuja ni un píxel: lo único que hace es MANDAR
   un rato, y flojo, sobre una población que ya estaba ahí.

   Que parezca casualidad es todo el evento, y son tres decisiones de NO
   hacer algo:

   1 · SE FORMA DONDE YA ESTABAN Y HACIA DONDE YA IBAN. El centro sale del
       centro de masa del banco y el rumbo, de la media de sus rumbos
       (`M.cardumen`). Nadie se desplaza a una cita.
   2 · NADIE SE CUADRA. El tirón a su sitio va flojo y a cada pez le tira
       distinto, y ninguno deja de nadar por su cuenta. Lo que hace que la
       forma cuaje no es la fuerza, es el TIEMPO.
   3 · NO SE DISPERSA, SE DESHACE. Al soltar no se empuja nada: el campo
       baja, cada pez se descuelga en su umbral y las reglas del banco
       vuelven solas.

   Los parámetros —`largo`, `reparto`, `formaPega`, `formaError`,
   `formaDesorden`, `vel`, `giroMax`— están documentados en la escena. */
evento('superpez', {
  exclusivo: true,
  cada: [200, 440], primero: [70, 190],
  prueba: { largo: [0.40, 0.54], largoMin: 0.26, minimo: 12,
            superpeces: [1, 2], reparto: [0.55, 0.90], redondez: [0.70, 1.55],
            entra: [8, 14], nada: [7, 13], sale: [4, 7],
            vel: [0.25, 0.55], giroMax: 0.10, giroPaso: 0.035, vira: 2.8,
            alcance: 2.2, filo: 6.0, plano: 2 },
  arranca(M, p){
    const plano = opt(p.plano, 2);
    /* EL BANCO ENTERO, de los tres planos: el campo se pone en `plano` pero
       la guarda de profundidad sólo excluye a quien pregunta desde más
       cerca, así que se le apuntan también los de atrás. Contando sólo el
       plano de delante salían 29 candidatos de los 68 que de hecho entran,
       y el evento nunca llegaba a partirse en dos siluetas. */
    const cs = M.cardumen();
    /* ── QUIÉNES SE APUNTAN ──────────────────────────────────────
       No todos, y por travesía: `reparto` es la fracción del banco que
       entra y `apunta` el número que cada pez lleva de nacimiento. Se
       CUENTAN en vez de estimarlos, porque con sesenta y ocho peces el
       sorteo se desvía lo suyo de su media. Los que no entran siguen
       nadando a lo suyo, también por encima de la silueta: eso es la mitad
       de lo que hace que la forma parezca una casualidad. */
    const cupo = rango(p.reparto);
    const dentro = [];
    for (const z of cs) if (z.apunta < cupo) dentro.push(z);
    const min = opt(p.minimo, 1);
    if (dentro.length < min) return null;

    /* ── UNA SILUETA O DOS ───────────────────────────────────────
       Dos sólo si hay peces para las dos. Al partirse, el banco se parte
       por donde se partiría solo: por el costado, o sea por el signo de la
       perpendicular a su rumbo medio. Cada mitad saca su propio centro y
       rumbo, así que ninguna se coloca a mano. */
    let grupos = [dentro];
    if (rangoE(p.superpeces || 1) > 1 && dentro.length >= min*2){
      const m = mediasBanco(dentro);
      const ca = Math.cos(m.ang), sa = Math.sin(m.ang);
      const a = [], b = [];
      for (const z of dentro)
        ((z.x - m.cx)*(-sa) + (z.y - m.cy)*ca > 0 ? a : b).push(z);
      /* si el corte sale desigual no hay dos siluetas: una de cuatro peces
         no es una silueta, es cuatro peces */
      if (a.length >= min && b.length >= min) grupos = [a, b];
    }

    /* EL LARGO SE REPARTE. Dos siluetas se hacen con la mitad de peces
       cada una, así que si midieran lo mismo saldrían al doble de
       separación entre peces y el canto dejaría de cerrar. Por la raíz
       porque lo que hay que mantener es la densidad por PERÍMETRO. */
    const parte = 1/Math.sqrt(grupos.length);
    const formas = [];
    for (const g of grupos){
      const m = mediasBanco(g);
      const gordo = rango(p.redondez);
      const esc = escQueCabe(M, m.cx, m.cy, m.ang,
                             M.W * rango(p.largo) * parte, gordo);
      /* y si lo que cabe ya no es un SUPERpez, ésta no sale: media silueta
         asomando por un canto no se lee, y el evento es que se lea */
      if (esc < M.W * opt(p.largoMin, 0) * parte) continue;
      formas.push({
        cx: m.cx, cy: m.cy, ang: m.ang, esc,
        vel:  rango(p.vel) * M.U,
        giro: rnd(-1, 1) * opt(p.giroMax, 0),
        /* el `d` del campo se reutiliza: se empuja uno por fotograma y
           crearlo cada vez es basura por nada */
        d: {cx:0, cy:0, ang:0, esc:0, gordo, cupo},
      });
    }
    if (!formas.length) return null;
    return {
      plano, formas,
      e: rango(p.entra), n: rango(p.nada), s: rango(p.sale),
      u: 0,
      c: M.color(p.paleta),
    };
  },
  actualiza(e, M, p, dt){
    if (!e.formas) return false;
    const T = e.e + e.n + e.s;
    if (e.t > T) return false;
    /* `u` es cuánto manda la forma, y es también el peso del campo, o sea
       cuánto se deja llevar cada pez. Las dos rampas van con `suave`: una
       recta se nota al empezar y al acabar, y lo que se pide es que no se
       note ni una cosa ni la otra. */
    const t = e.t;
    e.u = t < e.e          ? suave(t/e.e)
        : t < e.e + e.n    ? 1
                           : suave(clamp(1 - (t - e.e - e.n)/e.s, 0, 1));

    const gMax = opt(p.giroMax, 0), gPaso = opt(p.giroPaso, 0);
    const filo = opt(p.filo, 1.4), alc = opt(p.alcance, 0.95);
    for (const f of e.formas){
      /* ── AVANZA Y GIRA ──────────────────────────────────────────
         El rumbo gira a una velocidad que camina despacio: con un giro
         fijo describe un arco de compás y con un rumbo objetivo que se
         sortea da tirones. Caminando, la curva se abre y se cierra sola.
         Cada silueta lleva el suyo, así que dos no van en paralelo. */
      f.giro = clamp(f.giro + rnd(-1, 1)*gPaso*dt*6, -gMax, gMax);
      f.ang += f.giro * dt;
      /* CONTENIDA POR EL CANTO, que es lo único que se le impone: cerca
         del borde el rumbo se tuerce hacia dentro. Sin esto la silueta se
         sale del cuadro justo cuando acaba de cuajar.

         Y SE MIDE EN EL MORRO, no en el centro. `M.borde` tiene un margen
         fijo y el morro de la silueta va medio largo por delante de su
         centro —con un tercio de pantalla de eslora, casi doscientos
         píxeles—, así que midiendo en el centro, cuando la silueta empieza
         a virar el morro lleva un rato fuera del cuadro.

         Es DE LEJOS lo que más hizo por que la silueta quepa, y bastante
         más que encogerla. Medido: la fracción del contorno que queda
         dentro del cuadro en el peor momento de cada travesía, de media,

           | como estaba (larga, y midiendo en el centro) | 0,73 |
           | sólo encogiéndola                            | 0,76 |
           | encogida y midiendo en el morro              | 0,89 |

         o sea que el tamaño explica tres centésimas y el punto de medida
         trece. Mirar también la cola no se distingue del ruido. */
      const mx = f.cx + Math.cos(f.ang)*f.esc*0.5;
      const my = f.cy + Math.sin(f.ang)*f.esc*0.5;
      const b = M.borde(mx, my);
      if (b[2] > 0.01){
        const dd = giroCorto(Math.atan2(b[1], b[0]), f.ang);
        f.ang += dd * Math.min(1, b[2]*opt(p.vira, 1.6)*dt);
      }
      f.cx += Math.cos(f.ang)*f.vel*dt;
      f.cy += Math.sin(f.ang)*f.vel*dt;

      const d = f.d;
      d.cx = f.cx; d.cy = f.cy; d.ang = f.ang; d.esc = f.esc;
      /* UN CAMPO POR SILUETA. Con dos, cada pez lee el que más le pesa, o
         sea el de la silueta a la que está más cerca: el reparto es
         espacial y no hace falta que nadie lleve apuntado a qué bando va.
         Y como las dos nacen sobre el centro de su propia mitad del banco,
         casi todos empiezan ya del lado que les toca. */
      M.campos.push({ tipo:'forma', plano: e.plano, x: f.cx, y: f.cy,
                      r: f.esc*alc, fuerza: e.u, filo, c: e.c, d });
    }
    return true;
  },
});

/* el centro y el rumbo medios de una lista de peces. El rumbo, como
   vectores: promediar radianes se rompe al cruzar el ±π —179° y −179°
   promedian 0°, o sea justo el contrario. */
function mediasBanco(lista){
  let cx = 0, cy = 0, sx = 0, sy = 0;
  for (const z of lista){
    cx += z.x; cy += z.y;
    sx += Math.cos(z.ang); sy += Math.sin(z.ang);
  }
  const n = lista.length;
  return { cx: cx/n, cy: cy/n,
           ang: (sx || sy) ? Math.atan2(sy, sx) : Math.random()*TAU };
}
