/* ══════════════════════════════════════════════════════════════════
   PLANCTON
   Deriva lenta y brillo base bajo. Cuando algo luminoso del mismo plano
   se acerca, sube rápido y baja despacio con el color de esa cosa. Es la
   única relación causal entre organismos.
   ══════════════════════════════════════════════════════════════════ */
import { M, especie } from '../motor.js';
const {rgba, rnd, rango, TAU} = M;
import { porReparto, pintaHalo, paso, silencio } from './comun.js';

especie('plancton', {
  conteo: porReparto,

  crear(M, L, p){
    const alto = Math.random() < p.destacadas;
    const c = (p.colorRaro && Math.random() < p.raro)
              ? p.colorRaro : M.color(p.paleta);
    return { c, alto,
      x: rnd(0,M.W), y: rnd(0,M.H),
      r: rango(p.radio)*M.U*Math.max(0.6, L.scale),
      a: alto ? rango(p.alfaAlto) : rango(p.alfa),
      ph: Math.random()*TAU, sp: rnd(0.25,0.8),
      glow: 0, lit: null, cal: 0, dedo: 0,
      /* ── CADA MOTA CAE A LO SUYO, Y ESO ES LO QUE LA REPARTE ─────
         `caida` es un RANGO por mota y `sentido` va sorteado, y las dos
         mitades hacen falta. Con una sola velocidad para todas y todas
         arrancando hacia abajo, la nieve marina no se reparte: rebota
         contra el cristal EN BLOQUE, como un pistón. MEDIDO en franjas
         horizontales sobre quince minutos de escena: al minuto el techo
         se quedaba al 0 % y el suelo al 19 %, a los seis minutos estaba
         al revés, y a los quince otra vez abajo. Con esto, ninguna franja
         se sale del 7-13 % en ningún momento.

         El sentido se invierte al topar, y entonces la nieve marina pasa a
         ser materia en suspensión circulando, que es lo que se ve en una
         caja de agua sin fondo por el que caerse. */
      caida: rango(p.caida),
      sentido: Math.random() < 0.5 ? 1 : -1 };
  },

  actualiza(m, M, L, p, dt){
    const t = M.t;
    m.glow *= Math.pow(p.apaga, dt);

    /* Se suma la luz de todo lo que la alcanza, pero tiñe la MÁS CERCANA:
       con la última de la lista, el color salía del orden del array y no de
       dónde está cada cosa. */
    let cerca = Infinity;
    for (const o of L.luces){
      const R = o.rLuz, dx = m.x-o.x, dy = m.y-o.y, d2 = dx*dx + dy*dy;
      if (d2 >= R*R) continue;
      m.glow = Math.min(1, m.glow + p.enciende*dt);
      if (d2 < cerca){ cerca = d2; m.lit = o.c; }
    }

    /* un evento también puede prenderlo, con el mismo mecanismo que un bicho
       luminoso: el contagio es una onda de encendido, no un fogonazo, y por
       eso el frente se ve cruzar el agua */
    const ce = M.campo('enciende', m.x, m.y);
    if (ce){
      /* se PONE, no se suma: sumando dependería de cuánto tiempo estuviera
         dentro del anillo, y las ondas rápidas pasarían sin prender nada */
      m.glow = Math.max(m.glow, ce.peso);
      if (ce.c) m.lit = ce.c;
    }
    /* y lo que pase por encima lo calla: el rastro se corta en seco. Se
       guarda en `cal` porque el dibujo necesita el mismo número, y cada
       consulta recorre los campos vivos: de plancton hay cientos. */
    const sl = m.cal = silencio(M, m.x, m.y, L);
    if (sl > 0.01) m.glow *= Math.pow(0.02, dt*sl);

    /* EL DEDO, y esto es TODO lo que le hace: el contacto no dibuja nada,
       así que el gesto existe sólo en las motas que enciende. Se encienden
       con su color PROPIO —nadie las está alumbrando—, y además crecen:
       `dedo` es esa hinchazón y se apaga por su cuenta, más rápido que
       `glow`, o el bulto se queda después del destello.

       Y NO SE APARTAN. La nieve marina está en suspensión: que salga huyendo
       del dedo la convierte en un bicho con opinión, y lo que tiene que
       hacer es encenderse y quedarse donde está. */
    const ld = M.luzDedo(m.x, m.y);
    if (ld > 0){
      /* `topeDedo` es hasta dónde puede subirle el brillo, y NO ES 1: con
         el brillo al máximo el punto y el halo se suman por encima de 255,
         el canal que satura primero se queda plano y la mota PIERDE SU
         COLOR —sale blanca—. Se queda por debajo, donde el tono aún se lee.
         Y nunca BAJA: si ya la alumbraba algo más fuerte, el dedo no le
         quita nada. */
      const sube = Math.min(p.topeDedo, m.glow + p.enciendeDedo*dt*ld);
      if (sube > m.glow) m.glow = sube;
      if (ld > m.dedo) m.dedo = ld;
      m.lit = m.c;
    }
    m.dedo *= Math.pow(p.apagaDedo, dt);

    /* Vaivén propio, y la caída de esta mota como sesgo vertical constante:
       0 deja la mota en suspensión, positivo la hace nieve marina.

       Va por `paso` y no por `avanza` porque la mota NO TIENE velocidad: al
       dedo se ENCIENDE, no se aparta, y nada más la empuja. El array que
       devuelve es compartido: se consume aquí. */
    const q = paso(M, L, dt, m.x, m.y,
                   Math.sin(m.ph + t*m.sp)*M.U*0.05,
                   Math.cos(m.ph*1.7 + t*m.sp)*M.U*0.05
                     + m.caida*M.U*m.sentido);
    m.x = q[0]; m.y = q[1];
    /* el plancton no llama a reaccionBorde: el cristal es lo único que lo
       retiene. La caída se invierte SÓLO si sigue empujando contra esa
       pared; invirtiendo en cada contacto, la mota queda clavada en el
       cristal y se reinvierte —medido, 2,3 veces por segundo y por mota. */
    const par = M.envuelve(m);
    if (par[1] && par[1]*m.sentido < 0) m.sentido = -m.sentido;
  },

  dibuja(m, M, L, p, g){
    const c = (m.glow > 0.05 && m.lit) ? m.lit : m.c;
    /* lo que tapa no se dibuja: se lee porque AQUÍ no se dibuja nada */
    const sil = 1 - m.cal;
    if (sil < 0.02) return;
    /* la hinchazón del dedo entra en las DOS: el halo y la mota. Sólo en
       la mota, lo que crece es un punto gordo y mate dentro de un halo que
       se ha quedado igual, y eso no es un destello. */
    const cd = m.dedo*p.creceDedo;
    const ha = (0.22*m.glow + 0.08*cd + (m.alto ? 0.15 : 0)) * sil;
    if (ha > 0.012){
      const R = m.r*(m.alto ? 5 : 0) + m.r*(10*m.glow + 4*cd);
      pintaHalo(g, M, c, m.x, m.y, R, ha);
    }
    /* LA MOTA. Un punto suave y no un disco: `M.punto` cae de `mid` a `glow`
       y muere en el canto, así que no hay borde y el color se enfría por
       fuera. El radio va por 2,2 porque el sprite es casi todo falda. */
    const R = m.r*(1 + m.glow*0.9 + cd)*2.2;
    g.globalAlpha = Math.min(1, (m.a + m.glow*0.85)*sil);
    g.drawImage(M.punto(c), m.x-R, m.y-R, R*2, R*2);
    g.globalAlpha = 1;
    /* Y EL NÚCLEO, sólo las `destacadas`: es la única mota que brilla por
       su cuenta, así que la única que puede tener un centro casi blanco.
       Va con su color PROPIO y no con el de la luz que la prende. */
    if (m.alto){
      const rn = m.r*(0.55 + 0.45*m.glow);
      g.fillStyle = rgba(m.c.core, Math.min(1, (0.35 + 0.65*m.glow)*m.a*2.4*sil));
      g.beginPath(); g.arc(m.x, m.y, rn, 0, TAU); g.fill();
    }
  },
});
