import { M, evento } from '../motor.js';
const {clamp, rnd, rango, rangoE, opt, TAU} = M;

/* ── EL GLITCH ──────────────────────────────────────────────────────
   Se rompe el DIBUJO DE UNA MEDUSA, no la pantalla. Uno o dos focos
   aparecen en sitios cualesquiera y a las medusas que caen dentro se les
   pinta el cuerpo cortado en BANDAS HORIZONTALES ESCALONADAS, cada una
   corrida lo suyo. Y la medusa no se enteró: la rotura la aplica el motor
   al pintarla, con el campo `tajo` (ver `pintaBicho` en motor/bucle.js).

   Es una avería del dibujante, no de la pantalla. Una franja negra a lo
   ancho o una línea desplazada son un fallo de la señal; que a una medusa
   se le desalinee la campana en escalera mientras la de al lado está
   perfecta es un fallo de quien la está pintando.

   SÓLO LAS MEDUSAS, y el evento no lo decide: lo declara la especie con
   `rompible`. Éste reparte campos y no sabe a quién le caen. Rompiendo a
   todo el mundo lo que más se ve es plancton desplazado, que es ruido: en
   una mota de tres píxeles la escalera no cabe.

   NO DIBUJA NADA. Es el único evento de la pieza que ni pinta ni apaga:
   sólo hace que otros se pinten mal.

   ── Y VA A PASITOS ─────────────────────────────────────────────────
   El foco se sortea UNA VEZ, al nacer, y de ahí en adelante cada tirón
   AVANZA un poco lo que ya había. Dos cosas avanzan, en incrementos
   pequeños:

     · `k`, cuánto está roto ahora mismo, que camina al azar entre casi
       nada y del todo. De él salen el desplazamiento de las bandas y la
       deformación, así que la rotura va y viene sin volver a empezar.
     · `giro`, la fase que recoloca las bandas. Sumada en el motor al seno
       de cada banda, las mueve a todas un poco y a cada una lo suyo.

   Sorteando el foco entero en cada tirón lo que se ve son SALTOS: la
   rotura desaparece y aparece otra distinta en otro sitio. Avanzando, se
   ve una sola avería dando pasos. El silencio entre tirones es lo que
   hace que los pasos se lean como pasos y no como una animación. */

evento('glitch', {
  /* no necesita exclusividad: no toca la escena entera, y que rompa el
     dibujo mientras pasa un leviatán es mejor que peor */
  exclusivo: false,
  cada: [200, 460], primero: [60, 170],
  prueba: { dura: [14, 24], saltos: [22, 40], salto: [0.22, 0.50],
            focos: [1, 2], radio: [0.30, 0.52],
            bandas: [8, 14], paso: [6, 13],
            sep: 34, estira: 0.85, avance: 0.14, giro: [0.20, 0.70],
            parte: 1, filo: 3 },
  arranca(M, p){
    const n = rangoE(p.focos);
    const lado = Math.min(M.W, M.H);
    const focos = [];
    for (let i=0;i<n;i++)
      focos.push({
        x: Math.random()*M.W, y: Math.random()*M.H,
        r: lado*rango(p.radio),
        /* `d` es el que lee el motor, y es el MISMO objeto toda la vida del
           evento: los pasos se dan mutándolo, no cambiándolo. */
        d: { bandas: rangoE(p.bandas), paso: rango(p.paso),
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
      const av = opt(p.avance, 0.15);
      for (const f of e.focos){
        /* camina al azar en incrementos cortos y con suelo: a 0 el foco se
           apaga del todo y el paso siguiente se lee como que ha vuelto a
           empezar, no como que sigue roto */
        f.k = clamp(f.k + rnd(-1, 1)*av, 0.10, 1);
        f.d.giro += rango(p.giro);
        /* del mismo `k` salen las dos: así la rotura es UNA cosa que crece
           y decrece, y no dos números sueltos que se pelean */
        f.d.sep    = opt(p.sep, 0) * f.k;
        f.d.estira = opt(p.estira, 0) * f.k;
      }
      e.roto = true;
      e.hasta = e.t + rango(p.salto);
      e.quedan--;
      /* y el silencio, corto: lo bastante para que el paso se lea como un
         paso, no tanto que el evento se quede en nada la mitad del rato */
      e.prox = e.hasta + rnd(0.05, 0.25);
    }
    /* el que manda es `dura`, y sólo él: quedarse sin `saltos` antes de
       tiempo deja al evento esperando y no lo mata —así el último paso no
       se corta a media rotura—. Aquí estuvo un `|| e.quedan > 0` que no
       hacía nada: la guarda de arriba lo mataba al fotograma siguiente. */
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
