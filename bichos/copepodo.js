/* ══════════════════════════════════════════════════════════════════
   COPÉPODO
   Espera, da un tirón y frena enseguida. Aporta el tempo de décimas de
   segundo que las medusas no tienen.
   ══════════════════════════════════════════════════════════════════ */
import { M, especie } from '../motor.js';
const {rgba, clamp, rnd, rango, TAU} = M;
import { porReparto, reaccionBorde, avanza, silencio } from './comun.js';

/* Un tirón: el copépodo no acelera, se dispara en una dirección y frena.
   Hace falta en dos sitios: cuando le toca el reloj y cuando topa. */
function tiron(d, M, p, ang, escala){
  const s = rango(p.tiron)*M.U*escala;
  d.vx = Math.cos(ang)*s;
  d.vy = Math.sin(ang)*s*0.72;
  d.espera = rango(p.espera);
}

especie('copepodo', {
  escalaCalidad: true,
  conteo: porReparto,

  crear(M, L, p){
    return { c: M.color(p.paleta), x: rnd(0,M.W), y: rnd(0,M.H),
             /* la primera espera se acorta al azar para que no arranquen todos a la
                vez. Por rango() y no indexando p.espera: el convenio del motor es
                «número o par», y con un número suelto esto daría NaN. */
             vx:0, vy:0, espera: rnd(0, rango(p.espera)) };
  },

  actualiza(d, M, L, p, dt){
    d.espera -= dt;
    if (d.espera <= 0) tiron(d, M, p, Math.random()*TAU, 1);
    const fr = Math.pow(p.frena, dt);          // frena enseguida
    d.vx *= fr; d.vy *= fr;
    reaccionBorde(d, M, p, d.x, d.y, dt);
    avanza(d, M, L, dt);
    /* al topar gasta el tirón ahí mismo y sale hacia dentro: es el bicho de
       tempo más rápido de la escena, y esperar al siguiente se vería como
       quedarse pegado al cristal */
    const par = M.envuelve(d);
    if (par[0] || par[1])
      tiron(d, M, p,
            Math.atan2(par[1] || rnd(-0.6,0.6), par[0] || rnd(-0.6,0.6)), 0.7);
  },

  dibuja(d, M, L, p, g){
    const sp = Math.sqrt(d.vx*d.vx + d.vy*d.vy), S = L.scale;
    const sil = 1 - silencio(M, d.x, d.y, L);
    if (sil < 0.02) return;
    if (sp < M.U*0.06){                        // parado: apenas un punto
      g.fillStyle = rgba(d.c.mid, 0.11*sil);
      g.beginPath(); g.arc(d.x, d.y, 0.9*S, 0, TAU); g.fill();
      return;
    }
    /* trazo de la posición anterior a la actual, con brillo según la
       velocidad. La cola son 50 ms de recorrido: a 60 fps el paso de
       un solo frame sería un punto, no un trazo. */
    const a = clamp(0.10 + sp/(M.U*9), 0.10, 0.78)*sil, k = 0.05;
    g.strokeStyle = rgba(d.c.mid, a);
    g.lineWidth = 1.4*S;
    g.beginPath();
    g.moveTo(d.x - d.vx*k, d.y - d.vy*k);
    g.lineTo(d.x, d.y);
    g.stroke();
    g.fillStyle = rgba(d.c.core, a*0.7);
    g.beginPath(); g.arc(d.x, d.y, 1.3*S, 0, TAU); g.fill();
  },
});
