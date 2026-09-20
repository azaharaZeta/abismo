import { M, evento } from '../motor.js';

/* ══════════════════════════════════════════════════════════════════
   LA GEMACIÓN
   Una medusa echa una cría por el costado, se separan, y la cría se va
   haciendo pequeña mientras se aleja hasta que no está.

   NO NACE NADIE: la cría es la MISMA medusa pintada otra vez, más
   pequeña y más lejos, así que el motor no tiene que aprender a nacer ni
   a morir —la población se crea una vez, en `puebla()`—. Y encoger no es
   un truco para taparla: en esta pieza pequeño ES lejos, que es como
   codifican la distancia los tres planos.

   Y NO ES MITOSIS: una medusa no se parte en dos, y además sumando luz
   dos campanas solapadas se leen como una campana más brillante.

   ── NO DIBUJA NADA, Y TAMPOCO ELIGE ────────────────────────────────
   Empuja un campo `gema` sobre todo el cuadro —una orden en el agua— y
   se la queda UNA: el cupo viaja en el `d` del campo, así que quien lo
   coge lo descuenta y las demás ya no lo ven. Es la única forma de decir
   «una» sin que el evento sepa quién hay ni dónde; sólo la medusa lee
   `gema`.

   Y LA ELECCIÓN TARDA UN FOTOGRAMA a propósito: en el primero cada
   medusa apunta su radio y ninguna coge nada, y del segundo en adelante
   se la queda la de radio mayor, o sea la más CERCANA —el radio lleva
   dentro la escala de su plano—. Sin esa espera se la queda la primera
   que pregunta, y `pasoPlanos` recorre del fondo al frente: la más
   pequeña y borrosa de la pecera.

   Muere en cuanto alguien lo coge, o a los `espera` segundos si no hay
   quien. El resto de la maniobra lo lleva ella, en bichos/medusa.js.

   ── Y LAS TRES PARTES HACEN FALTA ──────────────────────────────────
   Parece mucha maquinaria para «que geme una». Cada pieza resuelve algo
   distinto y ninguna cubre a las otras:

     el TIPO de campo  es lo que dice «sólo una medusa», porque `gema` no
                       lo lee nadie más. No vale leer `M.luces()` y elegir
                       el foco mayor: medido, el de mayor `rLuz` es LA ESCA
                       DEL RAPE (247 contra 161 de la mejor medusa), y seis
                       peces linterna pasan por delante de la del plano de
                       en medio. Las luces no dicen de qué especie son, y
                       está bien que no lo digan.
     el CUPO           es lo que dice «una y sólo una», y por construcción.
                       Por geometría no se puede garantizar.
     la SUBASTA        es lo que dice «la más cercana». Sin ella se la
                       queda la primera que pregunta, y `pasoPlanos`
                       recorre del fondo al frente: la más pequeña y
                       borrosa de la pecera (medido: 0,43 U contra 1,16).
   ══════════════════════════════════════════════════════════════════ */
evento('gemacion', {
  arranca(){
    return { cupo: { quedan: 1, mejorR: 0, lista: false }, fot: 0 };
  },
  actualiza(e, M, p, dt){
    if (e.cupo.quedan <= 0) return false;      // alguien la ha cogido
    if (e.t > p.espera) return false;           // o no había quien
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
