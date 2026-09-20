import { M, evento } from '../motor.js';
const {rgba, clamp, rango, rangoE, opt, TAU} = M;
import { pintaHalo, reparte } from '../bichos/comun.js';

/* ── LA CARROÑA ─────────────────────────────────────────────────────
   Algo muerto que se hunde, y el primer evento de la pieza que NO EMITE
   NADA: sólo existe mientras pasa por la luz de alguien y se apaga en
   cuanto sale. Pero SIEMPRE DEL MISMO COLOR: hueso. Cogiendo el color del
   foco que la alumbra, un esqueleto verde o rosa no se lee como esqueleto
   sino como otro bicho que brilla; lo que tiene que cambiar con la luz que
   le llega es CUÁNTO se ve y POR DÓNDE.

   Es la regla de la casa aplicada a un evento, y por eso hace falta
   `M.luces(plano)`: un evento no recibe `L`.

   Dos cosas más la convierten en un cuerpo y no en un dibujo:
     · TAPA. Un campo `tapa` por vértebra, así que la nieve marina de
       detrás se calla. El agua NO se oscurece bajo ella —eso lo hace
       `pintaSombras` y sólo con los campos `apaga`—, y está bien: un
       esqueleto no es una masa. A oscuras sigue tapando: se la encuentra
       por el hueco.
     · LA PRENDE. Un campo `enciende` flojo y ancho: la descomposición va
       encendiendo el plancton a su paso y le deja un rastro que tarda en
       borrarse. Muchas veces se la ve por eso antes que por ella.

   El dibujo es un esqueleto: espinazo, costillas que se abren, cráneo y
   un jirón de aleta caudal. Nada de carne —no hay con qué pintarla en
   aditivo— y no hace falta: lo que se reconoce de un cuerpo hundiéndose
   es la silueta de las costillas.                                    */

evento('carrona', {
  arranca(M, p, x, y){
    const Lg = M.U * rango(p.largo);
    /* UN SOLO SORTEO de vértebras: de aquí salen el contador Y el largo
       del array de luz. Sorteados por separado no coinciden, y entonces
       `e.luz[n-1]` es `undefined`, el alfa del jirón de la cola sale NaN y
       el navegador tira una excepción a mitad de fotograma. */
    const nv = Math.max(4, rangoE(p.vertebras)|0);
    const nc = rangoE(opt(p.costillas, 0))|0;
    return {
      x: opt(x, rango(p.banda)*M.W),
      /* arranca FUERA por arriba, y por su largo: entrando por el canto se
         la ve aparecer de la nada si justo la alumbra algo */
      y: opt(y, -Lg*0.6),
      Lg,
      vel:  rango(p.vel) * M.U,
      /* voltea, y despacio: una vuelta cada medio minuto o más. El signo
         se sortea, que si no todas caen girando igual. */
      ang:  Math.random()*TAU,
      vGiro: rango(opt(p.giro, 0)),
      /* se va de lado mientras baja, con su propia fase: la corriente la
         lleva, no cae a plomo */
      fase: Math.random()*TAU,
      vertebras: nv,
      costillas: nc,
      /* ── Y NO HAY DOS ESQUELETOS IGUALES ──────────────────────
         Lo que se sortea es la ANATOMÍA, que es lo que queda por sortear
         cuando el color ya es siempre hueso:

           `caja`    lo abombada que sale la caja torácica. Entra en
                     `carronaPerfil`, así que de ella salen también el
                     grosor de lo que TAPA y el largo de las costillas: la
                     que sale de pecho ancho lo es entera.
           `falta`   qué costillas no están. Dos bits por par —izquierda y
                     derecha por separado, que una jaula a la que le falta
                     un lado es más vieja que una simétrica— y sorteados
                     AQUÍ: por fotograma, los huesos irían y vendrían y eso
                     no es una jaula, es un parpadeo.
           `craneo`  si le queda cráneo. A veces el cuerpo baja descabezado
                     y entonces el espinazo empieza en seco, que es peor.
         Y `chevrones`, que va con `vertebras` y `costillas`: cuántas
         espinas hemales le quedan en la cola. */
      caja: rango(p.caja),
      chevrones: rangoE(opt(p.chevrones, 0))|0,
      falta: huecos(nc, opt(p.falta, 0)),
      craneo: Math.random() < opt(p.craneo, 1),
      /* HUESO, y de una vez por todas: se sortea al nacer y no lo vuelve a
         tocar nadie. `luz` decide cuánto se ve, no de qué color. */
      c: M.color(p.paleta),
      /* ── LA LUZ, HUESO A HUESO ────────────────────────────────
         Un número por vértebra y no uno para todo el cuerpo. No es un
         lujo: los radios con los que un bicho REVELA a otro son de
         decenas de píxeles —21 px un pez linterna del plano de en medio—
         y la carroña mide cientos de largo, así que medida desde su centro
         no se encendería jamás.

         Y además es lo que se quiere: se enciende el trozo por el que pasa
         la luz, así que aparece y desaparece A TROZOS mientras baja.
         `ilum` se queda con el máximo, sólo para decidir si hay algo que
         pintar. */
      luz: new Float32Array(nv),
      ilum: 0,
    };
  },
  actualiza(e, M, p, dt){
    e.y += e.vel * dt;
    e.ang += e.vGiro * dt;
    e.x += Math.sin(M.t*0.13 + e.fase) * opt(p.deriva, 0) * M.U * dt;
    if (e.y - e.Lg > M.H) return false;

    const plano = p.plano;
    /* ── CUÁNTA LUZ LE DA, Y DÓNDE ────────────────────────────────
       La misma idea que el cuerpo del rape —suma de los focos que
       alcanzan, `caida` alta es alcance corto y `ganancia` sube lo que
       pasa dentro— pero medida en cada vértebra por separado y con otra
       curva: aquí cada foco cae como pow(1 − d/r, caida) y se CORTA en
       `r`, mientras que `luzRecibida` usa pow(1/(1 + d²/r²), caida), que
       no llega a cero nunca. El corte es lo que hace falta para que la
       vértebra se apague de verdad al salir del foco, que es lo que se ve
       como aparecer y desaparecer a trozos.

       `alcance` agranda el radio con el que un foco la revela, y es la
       única licencia de todo esto. Sin ella no se enciende nunca.

       Aquí NO se mira de qué color es el foco: la carroña es hueso pase lo
       que pase y su color se sorteó al nacer. Lo que se lleva de cada luz
       es cuánta llega. */
    const n = e.vertebras;
    const ca = Math.cos(e.ang), sa = Math.sin(e.ang);
    const alc = opt(p.alcance, 1), caida = p.caida;
    const gan = p.ganancia, techo = p.techo;
    const base = opt(p.base, 0), k = Math.min(1, 7*dt);
    const luces = M.luces(plano);
    let pico = 0;
    for (let i=0;i<n;i++){
      const s = ((i+0.5)/n - 0.5)*e.Lg;
      const vx = e.x + s*ca, vy = e.y + s*sa;
      /* CON corte, que es lo que distingue a la carroña del rape y del
         cuerpo: pasado el radio del foco la vértebra se apaga DE VERDAD, y
         eso es lo que hace que aparezca y desaparezca a trozos mientras
         baja. `ganancia` y `techo` se componen abajo, no dentro. */
      const tot = M.luzEn(vx, vy, luces,
                          {alcance: alc, caida, corta: true}).total;
      const obj = Math.min(techo, tot*gan) + base;
      /* con rampa, o los huesos entran y salen a saltos cuando un banco le
         pasa por delante: lo que se pide es que asome y se vaya, no que
         parpadee */
      const v = e.luz[i] + (obj - e.luz[i])*k;
      e.luz[i] = v;
      if (v > pico) pico = v;
    }
    e.ilum = pico;

    /* ── LO QUE TAPA, Y LO QUE PRENDE ─────────────────────────────
       Los dos van SIEMPRE, también a oscuras: el cuerpo está ahí aunque
       no se vea, y es justo por esto por lo que se le encuentra. */
    const t = opt(p.tapa, 0);
    if (t > 0.004){
      const paso = e.Lg/n;
      for (let i=0;i<n;i++){
        const u = (i+0.5)/n;
        const s = (u - 0.5)*e.Lg;
        const gro = carronaPerfil(u, e.caja);
        M.campos.push({ tipo:'tapa', plano,
                        x: e.x + s*ca, y: e.y + s*sa,
                        r: paso*0.9, ky: Math.max(0.06, gro*e.Lg*0.16/(paso*0.9)),
                        rot: e.ang, filo: p.tapaFilo, fuerza: t });
      }
    }
    const en = opt(p.enciende, 0);
    if (en > 0.004)
      M.campos.push({ tipo:'enciende', plano,
                      x: e.x, y: e.y, r: e.Lg*0.75,
                      fuerza: en, filo: 2.0, c: e.c });
    return true;
  },
  dibuja(e, M, p, g){
    const br = e.ilum;
    if (br < 0.02) return;
    const c = e.c;
    const Lg = e.Lg, n = e.vertebras;
    const luzEn = u => e.luz[clamp((u*n)|0, 0, n-1)];
    g.save();
    g.translate(e.x, e.y);
    g.rotate(e.ang);

    /* ── EL ESPINAZO ──────────────────────────────────────────────
       Una cuenta por vértebra, cada una con SU luz —una pasada de relleno
       por hueso y no una para todas, que es el precio de que el cuerpo se
       encienda a trozos: son doce o dieciséis arcos—, Y EL HUESO QUE LAS
       UNE, que es lo que hacía falta: una fila de cuentas sueltas es un
       collar, y con el tramo entre vértebra y vértebra dibujado pasa a ser
       una columna. El tramo va al alfa del más apagado de sus dos
       extremos, así que la columna se enciende a trozos igual que las
       cuentas y no delata dónde acaba la luz. */
    const R = Math.max(0.5, Lg*0.012);
    g.lineWidth = Math.max(0.5, Lg*0.010);
    for (let i=0;i<n;i++){
      const v = e.luz[i];
      const u = (i+0.5)/n, s = (u-0.5)*Lg;
      if (i){
        const vv = Math.min(v, e.luz[i-1]);
        if (vv > 0.02){
          g.strokeStyle = rgba(c.mid, Math.min(1, 0.46*vv));
          g.beginPath();
          g.moveTo(s - Lg/n, 0); g.lineTo(s, 0);
          g.stroke();
        }
      }
      if (v < 0.02) continue;
      const r = R*(0.55 + 0.75*carronaPerfil(u, e.caja));
      g.fillStyle = rgba(c.core, Math.min(1, 0.55*v));
      g.beginPath(); g.arc(s, 0, r, 0, TAU); g.fill();
      /* y su propio halo, chico: es lo que hace que un trozo encendido se
         lea como masa y no como una cuenta de collar */
      const H = Lg*0.07*(1 + carronaPerfil(u, e.caja));
      pintaHalo(g, M, c, s, 0, H, 0.34*v);
    }

    /* ── LA JAULA ─────────────────────────────────────────────────
       Una jaula vacía es lo que dice que esto estuvo vivo y ya no, así
       que es la pieza que más tiene que leerse. Dos cosas la hacen jaula
       y no un peine:

       1 · EL LARGO DE CADA COSTILLA SALE DEL PERFIL DEL CUERPO
           (`carronaPerfil`) y no de un seno cualquiera: con el perfil las
           del centro de la caja son las largas y se acortan hacia los dos
           extremos, o sea silueta de tonel, que es lo que se reconoce. Al
           azar sale un peine desdentado.
       2 · LE FALTAN COSTILLAS, y por lados sueltos (ver `falta` en
           `arranca`). Una jaula completa y simétrica se lee como un
           dibujo; a la que le falta medio par se le lee la edad.

       Y va de 0,13 a 0,58 del cuerpo: la caja de un pez llega más atrás
       que su tercio delantero, y en un tramo más corto las costillas
       salen apiñadas junto al cráneo. */
    const nc = e.costillas;
    if (nc){
      g.lineWidth = Math.max(0.4, Lg*0.007);
      for (let i=0;i<nc;i++){
        const u = 0.13 + 0.45*reparte(i, nc);
        const v = luzEn(u);
        if (v < 0.03) continue;
        const s = (u-0.5)*Lg;
        /* 0,19 y no más: el perfil llega a 0,90 en el pecho, así que la
           costilla más larga queda en 0,17 del cuerpo. A 0,30 la caja
           mide media eslora de alto y se lee como un peine, no un
           tórax. */
        const h = Lg*0.19*carronaPerfil(u, e.caja);
        g.strokeStyle = rgba(c.mid, Math.min(1, 0.42*v));
        g.beginPath();
        let hay = false;
        for (const lado of [1,-1]){
          if (e.falta[i*2 + (lado > 0 ? 0 : 1)]) continue;
          hay = true;
          g.moveTo(s, 0);
          g.quadraticCurveTo(s + Lg*0.05, lado*h*0.8,
                             s + Lg*0.11, lado*h);
        }
        if (hay) g.stroke();
      }
    }

    /* ── LOS CHEVRONES DE LA COLA ─────────────────────────────────
       Detrás de la caja, el espinazo iba pelado y los dos tercios de
       atrás del bicho eran una fila de puntos. Las espinas hemales de un
       pez salen en V apuntando hacia el morro, y son cuatro trazos
       cortos: es lo que separa «esqueleto de pez» de «cadena de cuentas»
       en la mitad del cuerpo donde ya no hay costillas. */
    const nch = e.chevrones;
    if (nch){
      g.lineWidth = Math.max(0.35, Lg*0.005);
      for (let i=0;i<nch;i++){
        const u = 0.62 + 0.26*reparte(i, nch);
        const v = luzEn(u);
        if (v < 0.03) continue;
        const s = (u-0.5)*Lg;
        /* más cortos que una costilla, y por dos motivos: una espina
           hemal lo es, y ahí atrás el cuerpo ya no tiene grosor que las
           sostenga */
        const h = Lg*0.20*carronaPerfil(u, e.caja);
        g.strokeStyle = rgba(c.mid, Math.min(1, 0.34*v));
        g.beginPath();
        for (const lado of [1,-1]){
          g.moveTo(s, 0);
          g.lineTo(s - Lg*0.045, lado*h);       // apuntan hacia el morro
        }
        g.stroke();
      }
    }

    /* ── EL CRÁNEO ────────────────────────────────────────────────
       Era un punto gordo en la punta, o sea una cuenta más grande, y de
       ahí que el bicho se leyera como un collar con un nudo. Un cráneo
       necesita tres cosas y ninguna es tamaño: BÓVEDA —un arco cerrado—,
       ÓRBITA —el agujero, que en aditivo no se puede vaciar, así que se
       dibuja su borde— y QUIJADA, que es la que dice hacia dónde miraba.

       Y no siempre está: `craneo` lo sortea, y cuando falta el espinazo
       empieza en seco, que es bastante peor de ver. */
    const bc = e.luz[0], bt = e.luz[n-1];
    if (bc > 0.02 && e.craneo){
      const hx = -Lg*0.5, R1 = Lg*0.042;
      g.strokeStyle = rgba(c.core, Math.min(1, 0.62*bc));
      g.lineWidth = Math.max(0.4, Lg*0.008);
      g.beginPath();
      g.ellipse(hx + R1*0.55, 0, R1, R1*0.74, 0, 0, TAU);
      g.stroke();
      /* la órbita, y la quijada colgando por debajo */
      g.strokeStyle = rgba(c.mid, Math.min(1, 0.50*bc));
      g.lineWidth = Math.max(0.35, Lg*0.006);
      g.beginPath();
      g.ellipse(hx + R1*0.42, -R1*0.16, R1*0.30, R1*0.26, 0, 0, TAU);
      g.moveTo(hx + R1*0.10, R1*0.30);
      g.quadraticCurveTo(hx + R1*0.95, R1*1.05, hx + R1*1.85, R1*0.62);
      g.stroke();
      /* y un halo que lo ata al resto: sin él la cabeza se despega */
      pintaHalo(g, M, c, hx + R1*0.6, 0, Lg*0.055, 0.30*bc);
    }

    /* y el JIRÓN de la caudal al otro extremo, que se apaga antes de
       acabar: lo que queda de una aleta son dos radios sueltos. */
    const gr = g.createLinearGradient(Lg*0.42, 0, Lg*0.56, 0);
    gr.addColorStop(0, rgba(c.mid, Math.min(1, 0.30*bt)));
    gr.addColorStop(1, rgba(c.mid, 0));
    g.strokeStyle = gr;
    g.lineWidth = Math.max(0.4, Lg*0.006);
    g.beginPath();
    for (const lado of [1,-1]){
      g.moveTo(Lg*0.42, 0);
      g.lineTo(Lg*0.56, lado*Lg*0.07);
    }
    g.stroke();
    g.restore();
  },
});

/* el grosor del cuerpo a lo largo: cráneo, caja torácica y una cola que se
   queda en nada. `u` va de 0 en el morro a 1 en la punta de la cola, y
   `caja` es lo abombado del pecho, que lo sortea cada carroña. De aquí sale
   TODO lo que tiene que ver con el grosor —lo que tapa, el radio de las
   cuentas, el largo de las costillas y de los chevrones—, y por eso la que
   sale de pecho ancho lo es entera y no sólo por un sitio. */
function carronaPerfil(u, caja){
  const craneo = u < 0.10 ? 0.55 + 4.5*u : 1;
  const pecho  = 1 + caja*Math.exp(-Math.pow((u-0.30)/0.16, 2));
  const cola   = Math.pow(1-u, 0.7);
  return craneo*pecho*cola*0.62;
}

/* qué costillas le faltan a esta carroña: dos bits por par, izquierda y
   derecha por separado. Se sortea una vez y no se vuelve a tocar —los
   huesos no van y vienen— y va aquí y no dentro de `arranca` porque lo que
   hace no tiene nada que ver con una carroña: es un array de monedas. */
function huecos(n, q){
  const a = new Uint8Array(n*2);
  if (q > 0) for (let i=0;i<a.length;i++) a[i] = Math.random() < q ? 1 : 0;
  return a;
}
