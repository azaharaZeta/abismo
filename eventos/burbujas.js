import { M, evento } from '../motor.js';
const {rnd, rango, rangoE, opt, TAU} = M;
import { mancha } from '../bichos/comun.js';

/* ── LAS BURBUJAS ───────────────────────────────────────────────────
   Alguien ha soltado aire ahí abajo. Un racimo sube, se deshilacha por el
   camino y algunas revientan antes de llegar arriba.

   ── Y UNA BURBUJA NO EMITE, ASÍ QUE APENAS DIBUJA ───────────────────
   La regla de la casa vale también para esto: una pompa de aire no tiene
   luz propia, tiene una PELÍCULA que refleja la que le llega. De ahí que
   no se pinte un disco sino dos cosas, y las dos salen de `M.luzEn`:

     · EL ARO, el canto de la película, que es lo único que se ve de una
       burbuja de verdad —por el centro se ve el agua de detrás.
     · EL DESTELLO, un punto en el LADO QUE MIRA A LA LUZ. Sale del vector
       que devuelve `M.luzEn`, el mismo con el que el `cuerpo` decide por
       dónde se enciende su canto. Es lo que las convierte en esferas: sin
       él son anillos planos.

   O sea que en agua vacía casi no están, y cuando les pasa una medusa por
   debajo se encienden todas a la vez. Es la carroña aplicada a algo que
   sube.

   ── EL COLOR: UNO POR RACIMO Y NO POR BURBUJA ───────────────────────
   «Todas de un mismo rango de color cada vez.» La paleta que sale de un
   `espectro` ya viene ORDENADA por tono —`generaPaleta` reparte el tono a
   lo largo del rango—, así que un racimo es un TROZO CONTIGUO de ella: se
   sortea dónde empieza y cada burbuja coge una entrada de las `tramo`
   siguientes. Con el espectro entero da la vuelta al círculo, y dos
   racimos seguidos no se parecen.

   Se indexa a mano en vez de con `M.color()` a propósito: ahí está el
   punto, que NO sea un sorteo por toda la paleta. Por eso el espectro de
   la escena va sin `peso`, que aquí no lo miraría nadie.            */

/* el radio, la subida y el tamaño del destello de una burbuja. `y0` es
   la altura de SU erupción y no la del evento: con varias, medir lo
   subido contra un origen común revienta las de arriba nada más nacer. */
function nace(M, p, x, y, pal, i0, tramo, espera){
  const r = rango(p.radio) * M.U;
  /* la grande sube más: es la única física que se le pide, y sin ella el
     racimo asciende en bloque y se lee como una cortina */
  const u = (r/(M.U*p.radio[1]));
  return {
    x: x + rnd(-1, 1)*M.U*p.racimo,
    y: y + rnd(-1, 1)*M.U*p.racimo*0.5,
    r,
    sube: rango(p.sube) * M.U * (0.55 + 0.9*u),
    /* el serpenteo, que es lo que hace que suba una burbuja y no una
       pelota: cada una con su fase y su ritmo */
    amp:  rango(p.serpentea) * M.U,
    frec: rango(p.ritmo),
    fase: Math.random()*TAU,
    y0: y,
    espera: espera + rnd(0, rango(p.soltar)),
    /* ── Y ALGUNAS REFLEJAN MÁS ──────────────────────────────────
       No es que emitan —una pompa no emite, y ésa es la regla de la
       casa—: es que la película está limpia y devuelve casi toda la luz
       que le llega. A oscuras siguen sin estar, que es lo que lo
       distingue de subirle el brillo al evento. */
    refl: Math.random() < opt(p.raras, 0) ? rango(p.brillaRara) : 1,
    c: pal[Math.min(pal.length - 1, i0 + ((Math.random()*tramo)|0))],
    /* revienta o no, y se sortea AL NACER: decidirlo por el camino obliga
       a un reloj más y no se ve distinto */
    revienta: Math.random() < opt(p.estalla, 0)
              ? rnd(0.35, 0.95)        // a qué altura del recorrido, de 0 a 1
              : 0,
    rota: 0,                           // 0 a 1 mientras revienta; 1 = ya no está
  };
}

evento('burbujas', {
  arranca(M, p, x, y){
    const pal = p.paleta;
    const tramo = Math.max(1, Math.min(pal.length, rangoE(p.tramo)|0));
    const i0 = (Math.random()*(pal.length - tramo + 1))|0;
    /* ── VARIAS ERUPCIONES, NO UNA ───────────────────────────────
       El fondo no suelta el aire de golpe ni por un solo agujero. Cada
       erupción tiene su sitio y su momento; la PRIMERA va siempre a
       tiempo cero, o el evento arranca con el cuadro vacío.

       Se reparten alrededor de un punto y no por todo el ancho: lo que
       se lee entonces es una zona del fondo ventilando, que es lo que
       es. Si el evento se lanza a mano con (x,y), ése es el punto. */
    const cx = opt(x, rango(p.banda)*M.W);
    const ne = Math.max(1, rangoE(p.erupciones)|0);
    const bs = [];
    let espera = 0;
    for (let k=0;k<ne;k++){
      const bx = cx + (k ? rnd(-1, 1)*M.U*opt(p.separa, 0) : 0);
      const by = opt(y, rango(p.hondo)*M.H);
      const n = Math.max(2, rangoE(p.cuantas)|0);
      for (let i=0;i<n;i++) bs.push(nace(M, p, bx, by, pal, i0, tramo, espera));
      espera += rango(p.escalona);
    }
    return { bs };
  },

  actualiza(e, M, p, dt){
    const arr = opt(p.arrastra, 0);
    let vivas = 0;
    for (const b of e.bs){
      if (b.rota >= 1) continue;
      if (b.espera > 0){ b.espera -= dt; vivas++; continue; }
      vivas++;
      if (b.rota > 0){
        /* ya reventó: el aro se abre y se va en un suspiro */
        b.rota = Math.min(1, b.rota + dt/p.vidaEstalla);
        continue;
      }
      /* el serpenteo va en la POSICIÓN y no en la velocidad: integrado se
         acumula y la burbuja se va de lado sin volver */
      const t = M.t;
      b.y -= b.sube * dt;
      b.x += (Math.cos(t*b.frec + b.fase) * b.amp * b.frec
              + M.flujoX(b.x, b.y, t) * arr) * dt;
      b.y += M.flujoY(b.x, b.y, t) * arr * dt;
      /* revienta al llegar a su altura, o cuando se sale por arriba */
      const subido = (b.y0 - b.y) / Math.max(1, b.y0);
      if (b.revienta > 0 && subido >= b.revienta) b.rota = 1e-4;
      else if (b.y + b.r < 0) b.rota = 1;
    }
    return vivas > 0;
  },

  dibuja(e, M, p, g){
    const luces = M.luces(p.plano);
    const base = opt(p.base, 0), brillo = p.brillo;
    const alc = opt(p.alcance, 1), caida = p.caida;
    for (const b of e.bs){
      if (b.rota >= 1 || b.espera > 0) continue;
      /* CUÁNTA LE LLEGA Y DE DÓNDE. `vx,vy` es la suma de las direcciones
         hacia los focos, ponderada: de ahí sale el lado que se enciende. */
      const luz = M.luzEn(b.x, b.y, luces, {alcance: alc, caida, umbral: 0.003});
      let br = (base + luz.total) * brillo * b.refl;
      let R = b.r;
      if (b.rota > 0){
        /* reventada: crece y se apaga al cuadrado, que es lo que se lee
           como un estallido y no como un desvanecido */
        R = b.r * (1 + opt(p.creceEstalla, 0)*b.rota);
        br *= (1 - b.rota)*(1 - b.rota);
      }
      if (br < 0.006 || !(R > 0)) continue;
      const c = b.c;
      /* EL ARO. `mancha` con `r0` deja el centro vacío, que es lo que tiene
         una burbuja: por el medio se ve el agua. */
      mancha(g, b.x, b.y, R*1.12, [
        [0.00, c.mid,  0.05*br],
        [0.62, c.mid,  0.16*br],
        [0.90, c.core, Math.min(1, 0.52*br)],
        [1.00, c.glow, 0],
      ], R*0.34);
      if (b.rota > 0) continue;            // reventada ya no refleja nada
      /* EL DESTELLO, en el lado que mira a la luz. Sin nada que lo alumbre
         el vector es cero y no se pinta: la burbuja se queda en su aro. */
      const m = Math.hypot(luz.vx, luz.vy);
      if (m < 1e-4) continue;
      const dx = luz.vx/m, dy = luz.vy/m;
      const rd = R*opt(p.destello, 0);
      if (rd < 0.2) continue;
      g.globalAlpha = Math.min(1, 0.85*br);
      g.drawImage(M.punto(c), b.x + dx*R*0.52 - rd, b.y + dy*R*0.52 - rd, rd*2, rd*2);
      g.globalAlpha = 1;
    }
  },
});
