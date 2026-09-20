/* ══════════════════════════════════════════════════════════════════
   LO COMPARTIDO ENTRE EVENTOS
   Sólo entra aquí lo que ya estaba escrito DOS VECES. Hoy es una cosa:
   el anillo que se abre.
   ══════════════════════════════════════════════════════════════════ */
import { M } from '../motor.js';
const {rango, opt} = M;

/* ── EL ANILLO QUE SE ABRE ──────────────────────────────────────────
   Un frente circular que nace en un punto, crece y se va del cuadro
   empujando un campo en forma de aro. No dibuja nada: lo que se ve es lo
   que el aro enciende o tiñe a su paso, que es el motivo por el que los
   dos eventos que lo usan —`contagio` y `floracion`— son los que mejor
   explican por qué los buenos no pintan.

   Estaban escritos igual en los dos ficheros y sólo se diferenciaban en
   el TIPO de campo y en si llevaban color. Copiados, lo que se despega
   antes es el `ri`: el aro y su grosor son la misma cuenta hecha dos
   veces, y basta tocar una.

   El VOCABULARIO de la escena es, por tanto, común a los dos:
     `banda`    de qué franja del cuadro sale, en fracción, para x y para y
     `vel`      a cuánto crece el radio, en U/s
     `alcance`  hasta dónde llega, en diagonales de pantalla
     `salto`    el grosor del aro, en U — es lo que decide si al que pasa
                le da tiempo a reaccionar
     `filo`     el canto del campo; el neutro es 1 */
function ondaArranca(M, p, x, y){
  return {
    /* `opt` y no `||`: un contacto en el canto da un 0 legítimo. El
       sorteo se hace igual cuando llega (x,y) —un argumento no es
       perezoso—, y así el reparto de una pecera sembrada no depende de
       si tocaron la pantalla. */
    x: opt(x, rango(p.banda)*M.W),
    y: opt(y, rango(p.banda)*M.H),
    r: 0,
    vel:  rango(p.vel) * M.U,
    rmax: Math.hypot(M.W, M.H) * rango(p.alcance),
  };
}

/* Lo devuelve `actualiza()` tal cual: false cuando el aro entero —no su
   frente— ha salido del alcance. `c` es opcional; sin él, cada cuerpo se
   queda con su propio color. */
function ondaAnillo(e, M, p, dt, tipo, c){
  e.r += e.vel * dt;
  const ri = e.r - M.U*p.salto;
  if (ri > e.rmax) return false;
  M.campos.push({ tipo, x: e.x, y: e.y,
                  r: e.r, ri: Math.max(0.0001, ri),
                  fuerza: 1, filo: opt(p.filo, 1), c });
  return true;
}
export { ondaArranca, ondaAnillo };
