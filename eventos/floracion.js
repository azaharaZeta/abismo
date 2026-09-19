import { M, evento } from '../motor.js';
const {rango, opt} = M;

/* ══════════════════════════════════════════════════════════════════
   LA FLORACIÓN
   Una onda de color. NO DIBUJA NADA —empuja un anillo `tinta` y lo que se
   ve es el banco dándolo todo al pasar—, que es lo mismo que hace el
   contagio con el plancton y por el mismo motivo: la luz que se ve tiene
   que salir de un cuerpo, no de la escena.

   Y NO TRAE COLOR. El campo va sin `c` a propósito: cada pez se lleva su
   propio núcleo hacia su propio tono, así que lo que cruza el cuadro es el
   moteado del banco subido de golpe y no una mancha de un color. Un color
   por onda haría lo contrario de lo que hace bonito al banco, que es estar
   moteado.

   VA MÁS DESPACIO QUE EL CONTAGIO, y eso es casi todo el evento: el
   plancton son cientos de motas y una onda rápida se lee igual, pero peces
   hay cuarenta en toda la pecera, así que si el frente cruza deprisa no se
   ve una ola —se ven peces sueltos cambiando—. El anillo va además ANCHO
   (`salto`), o el frente pasa por encima de un pez antes de que le suba el
   tinte.
   ══════════════════════════════════════════════════════════════════ */
evento('floracion', {
  exclusivo: false,
  arranca(M, p, x, y){
    return {
      x: opt(x, rango(p.banda)*M.W),
      y: opt(y, rango(p.banda)*M.H),
      r: 0,
      vel:  rango(p.vel) * M.U,
      rmax: Math.hypot(M.W, M.H) * rango(p.alcance),
    };
  },
  actualiza(e, M, p, dt){
    e.r += e.vel * dt;
    if (e.r - M.U*p.salto > e.rmax) return false;
    /* SIN `plano`: la onda es agua, no un cuerpo, así que no tiene
       profundidad y tiñe a los tres planos —igual que el contagio. */
    M.campos.push({ tipo:'tinta', x:e.x, y:e.y,
                    r: e.r, ri: Math.max(0.0001, e.r - M.U*p.salto),
                    fuerza: 1, filo: p.filo });
    return true;
  },
});
