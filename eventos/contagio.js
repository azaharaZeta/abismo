import { M, evento } from '../motor.js';
const {rnd, rango, opt} = M;

/* ══════════════════════════════════════════════════════════════════
   EL CONTAGIO
   No un fogonazo simultáneo: una reacción en cadena. No dibuja NADA
   —empuja un anillo de encendido y la luz que se ve es el propio plancton
   prendiéndose—, así que la onda va por donde hay plancton y su frente se
   lee cruzando el agua. Es el evento más corto de la pieza y el que mejor
   explica por qué los buenos no dibujan.
   ══════════════════════════════════════════════════════════════════ */
evento('contagio', {
  exclusivo: false,
  cada: [50, 140], primero: [12, 45],
  prueba: { vel: [3.5, 7], salto: 4.5, alcance: [0.6, 1.1] },
  arranca(M, p, x, y){
    return {
      x: opt(x, rnd(0.12, 0.88)*M.W),
      y: opt(y, rnd(0.12, 0.88)*M.H),
      r: 0,
      vel:  rango(p.vel) * M.U,
      rmax: Math.hypot(M.W, M.H) * rango(p.alcance || [0.45, 1.05]),
      /* un color para toda la onda, o que cada mota conserve el suyo */
      c: p.suyo ? null : M.color(p.paleta),
    };
  },
  actualiza(e, M, p, dt){
    e.r += e.vel * dt;
    if (e.r - M.U*p.salto > e.rmax) return false;
    M.campos.push({ tipo:'enciende', x:e.x, y:e.y,
                    r: e.r, ri: Math.max(0.0001, e.r - M.U*p.salto),
                    fuerza: 1, filo: p.filo || 1, c: e.c });
    return true;
  },
});
