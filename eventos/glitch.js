import { M, evento } from '../motor.js';
const {clamp, rnd, rango, rangoE, opt, TAU} = M;

/* ── EL GLITCH ──────────────────────────────────────────────────────
   Se rompe el DIBUJO DE UNA MEDUSA, no la pantalla. Uno o dos focos caen
   en sitios cualesquiera y a las medusas de dentro se les pinta el cuerpo
   cortado en BANDAS HORIZONTALES ESCALONADAS, cada una corrida lo suyo.
   La medusa no se entera: lo aplica el motor al pintarla, con el campo
   `tajo` (ver `pintaBicho` en motor/bucle.js).

   Y ES UNA AVERÍA DEL DIBUJANTE, no de la señal: una franja negra a lo
   ancho sería un fallo de pantalla; que a una medusa se le desalinee la
   campana mientras la de al lado está perfecta es un fallo de quien la
   pinta.

   SÓLO LAS MEDUSAS, y no lo decide el evento: lo declara la especie con
   `rompible`. Éste reparte campos sin saber a quién le caen. En una mota
   de tres píxeles la escalera no cabe, y lo que se vería es ruido.

   NO DIBUJA NADA. Es el único evento que ni pinta ni apaga: sólo hace
   que otros se pinten mal.

   ── Y VA A PASITOS ─────────────────────────────────────────────────
   El foco se sortea UNA VEZ, al nacer, y cada tirón AVANZA lo que había.
   Avanzan dos cosas, a incrementos cortos:

     · `k`, cuánto está roto ahora mismo, que camina al azar entre casi
       nada y del todo. De él salen el desplazamiento de las bandas y la
       deformación, así que la rotura va y viene sin volver a empezar.
     · `giro`, la fase que recoloca las bandas: sumada en el motor al
       seno de cada banda, las mueve a todas un poco y a cada una lo suyo.

   Sorteando el foco entero en cada tirón se ven SALTOS —la rotura
   aparece en otro sitio—; avanzando se ve una sola avería dando pasos. El
   silencio entre tirones es lo que los hace leer como pasos. */

evento('glitch', {
  /* no necesita exclusividad: no toca la escena entera, y que rompa el
     dibujo mientras pasa un leviatán es mejor que peor */
  exclusivo: false,
  cada: [200, 460], primero: [60, 170],
  arranca(M, p){
    const n = rangoE(p.focos);
    const focos = [];
    for (let i=0;i<n;i++)
      focos.push({
        x: Math.random()*M.W, y: Math.random()*M.H,
        r: M.U*rango(p.radio),
        /* `d` es el que lee el motor, y es el MISMO objeto toda la vida del
           evento: los pasos se dan mutándolo, no cambiándolo. */
        d: { bandas: rangoE(p.bandas), paso: rango(p.paso)*M.U,
             parte: opt(p.parte, 1),
             giro: Math.random()*TAU, sep: 0, estira: 0 },
        /* cuánto está roto este foco ahora mismo. Arranca a medias: a 0 el
           primer tirón no se ve y lo que se lee es que el evento tardó en
           empezar. */
        k: rnd(0.35, 0.65),
      });
    return {
      focos,
      dura: rango(p.dura),
      quedan: rangoE(p.saltos),
      /* el primero cae casi enseguida: si el evento tarda en romper nada,
         lo que se ve es un hueco y luego un fallo, no un fallo */
      prox: rnd(0, 0.10),
      hasta: 0, roto: false,
    };
  },
  actualiza(e, M, p, dt){
    if (e.t > e.dura && !e.roto) return false;

    /* ¿toca dar un paso? Aquí NO se sortea el foco: se avanza. */
    if (!e.roto && e.quedan > 0 && e.t >= e.prox){
      const av = p.avance;
      for (const f of e.focos){
        /* camina al azar en incrementos cortos y con suelo: a 0 el foco se
           apaga del todo y el paso siguiente se lee como que ha vuelto a
           empezar, no como que sigue roto */
        f.k = clamp(f.k + rnd(-1, 1)*av, 0.10, 1);
        f.d.giro += rango(p.giro);
        /* del mismo `k` salen las dos: así la rotura es UNA cosa que crece
           y decrece, y no dos números sueltos que se pelean */
        f.d.sep    = opt(p.sep, 0) * M.U * f.k;
        f.d.estira = opt(p.estira, 0) * f.k;
      }
      e.roto = true;
      e.hasta = e.t + rango(p.salto);
      e.quedan--;
      /* y el silencio, corto: lo bastante para que el paso se lea como un
         paso, no tanto que el evento se quede en nada la mitad del rato */
      e.prox = e.hasta + rnd(0.05, 0.25);
    }
    /* el que manda es `dura`, y sólo él: quedarse sin `saltos` deja al
       evento esperando y no lo mata, así el último paso no se corta a
       media rotura. */
    if (e.roto && e.t > e.hasta){
      e.roto = false;
      return e.t <= e.dura;
    }
    if (!e.roto) return true;

    /* SIN GUARDA DE PLANO: una avería de dibujo no está a una distancia. */
    const filo = opt(p.filo, 1);
    for (const f of e.focos)
      M.campos.push({ tipo:'tajo', x: f.x, y: f.y, r: f.r,
                      fuerza: 1, filo, d: f.d });
    return true;
  },
});
