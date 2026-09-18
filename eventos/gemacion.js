import { M, evento } from '../motor.js';
const {opt} = M;

/* ══════════════════════════════════════════════════════════════════
   LA GEMACIÓN
   Una medusa echa una cría por el costado, se separan, y la cría se va
   haciendo pequeña mientras se aleja hasta que no está.

   NO NACE NADIE. La cría es la MISMA medusa pintada otra vez, más pequeña
   y más lejos, así que el motor no tiene que aprender a nacer ni a morir
   —hoy la población se crea una vez, en `puebla()`, y una especie no puede
   decir «me muero»—. Y que se vaya encogiendo no es un truco para taparla:
   en esta pieza pequeño ES lejos, porque así codifican la distancia los
   tres planos. La cría se va al fondo con la misma gramática que el resto.

   Y NO ES MITOSIS, es gemación: una medusa no se parte en dos —eso lo hace
   el pólipo, brotando—, y además partir la campana no saldría: sumando
   luz, dos campanas solapadas se leen como una campana más brillante.

   ── ESTE EVENTO NO DIBUJA NADA, Y TAMPOCO ELIGE ────────────────────
   Empuja un campo `gema` sobre todo el cuadro —una orden en el agua— y se
   la queda UNA: el cupo viaja en el `d` del campo, que el motor pasa tal
   cual, así que quien lo coge lo descuenta y las demás ya no lo ven. Es la
   única forma de decir «una» sin que el evento sepa quién hay ni dónde:
   `M.luces()` da todos los focos juntos y no puede distinguir una medusa de
   un pez, y sólo la medusa lee `gema`.

   Y LA ELECCIÓN TARDA UN FOTOGRAMA a propósito. En el primero cada medusa
   apunta su radio en el campo y ninguna coge nada; del segundo en adelante
   se lo queda la de radio mayor, que es la más CERCANA —el radio lleva
   dentro la escala de su plano—. Sin eso se la quedaba siempre la primera
   que pregunta, y ésa es del fondo: `pasoPlanos` recorre los planos del
   fondo al frente, así que gemaba la medusa más pequeña y más borrosa de
   la pecera.

   Se muere en cuanto alguien lo coge, o a los `espera` segundos si no hay
   ninguna que pueda cogerlo. El resto de la maniobra —quince o veinte
   segundos— la lleva ella sola, y está en bichos/medusa.js.
   ══════════════════════════════════════════════════════════════════ */
evento('gemacion', {
  exclusivo: false,
  cada: [150, 340], primero: [40, 110],
  prueba: { espera: 6 },
  arranca(){
    return { cupo: { quedan: 1, mejorR: 0, lista: false }, fot: 0 };
  },
  actualiza(e, M, p, dt){
    if (e.cupo.quedan <= 0) return false;      // alguien la ha cogido
    if (e.t > opt(p.espera, 6)) return false;  // o no había quien
    /* del segundo fotograma en adelante ya se puede coger: en el primero
       sólo se apuntan. Se cuentan fotogramas y no tiempo porque `e.t` ya
       viene sumado cuando llega aquí. */
    if (e.fot++ > 0) e.cupo.lista = true;
    /* SIN guarda de plano: una orden en el agua no está a una distancia. Y
       el radio pasa del cuadro para que a las medusas de las esquinas les
       llegue con peso de sobra —`M.campo` decae con la distancia al
       centro. */
    M.campos.push({ tipo:'gema', x: M.W*0.5, y: M.H*0.5,
                    r: Math.hypot(M.W, M.H)*1.2, fuerza: 1, filo: 1,
                    d: e.cupo });
    return true;
  },
});
