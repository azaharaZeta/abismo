import { ABISMO } from '../escena.js';
import { TAU, rgba, clamp, opt, rnd, suave, elige, mezcla, rango,
         rangoE } from './util.js';
import { V, campos, camposDe, MOD, PLANOS, flujoX, flujoY } from './estado.js';
import { eligeDePaleta, halo, punto } from './color.js';
import { empuje, luzDedo } from './dedo.js';

/* ── BORDES ─────────────────────────────────────────────────────────
   Empuje hacia dentro cerca del canto. Fuera del lienzo se satura en vez
   de crecer sin fin, o un bicho que se escapara por un empujón del dedo
   volvería disparado. Array compartido: consúmelo ya. */
const _bor = [0,0,0];
function borde(x, y){
  const m = ABISMO.borde.margen * Math.min(V.W, V.H), k = ABISMO.borde.fuerza * V.U;
  let fx = 0, fy = 0;
  if (x < m)        fx =  1 - x/m;
  else if (x > V.W-m) fx = -(1 - (V.W-x)/m);
  if (y < m)        fy =  1 - y/m;
  else if (y > V.H-m) fy = -(1 - (V.H-y)/m);
  fx = clamp(fx, -1.8, 1.8); fy = clamp(fy, -1.8, 1.8);
  _bor[0] = fx*k; _bor[1] = fy*k;
  /* el tercero es la intensidad sin escalar y saturada a 1: sirve para
     decidir cuánto caso hacerle sin conocer la fuerza de la escena */
  _bor[2] = Math.min(1, Math.hypot(fx, fy));
  return _bor;
}

/* ══════════════════════════════════════════════════════════════════
   API PÚBLICA
   ══════════════════════════════════════════════════════════════════ */

/* ── CONTENCIÓN ─────────────────────────────────────────────────────
   La pecera es una caja con cristal: nada sale por los cantos. Deja el
   SALTO [dx,dy] que hay que darle a (x,y) para meterlo dentro, y el
   sentido hacia dentro [cx,cy] de la pared tocada. Va aparte de
   envuelve() porque hay bichos hechos de varios puntos —el rape arrastra
   su esca, la medusa su nube— y todos tienen que saltar igual.

   `inset` es a qué distancia del canto está el cristal. */
const _sal = [0,0,0,0];
function salto(x, y, inset){
  _sal[0] = _sal[1] = _sal[2] = _sal[3] = 0;
  const d = inset > 0 ? inset : V.U*0.5;
  if      (x < d)   { _sal[0] = d - x;     _sal[2] =  1; }
  else if (x > V.W-d) { _sal[0] = V.W - d - x; _sal[2] = -1; }
  if      (y < d)   { _sal[1] = d - y;     _sal[3] =  1; }
  else if (y > V.H-d) { _sal[1] = V.H - d - y; _sal[3] = -1; }
  return _sal;
}
/* pared tocada por envuelve(), compartido igual que _bor y _emp */
const _enc = [0,0];
/* campo que más pesa en un punto. Compartido: consúmelo en el acto. */
const _cam = {peso:0, c:null, d:null, x:0, y:0};
/* lo que devuelve luzEn(). Compartido igual: consúmelo en el acto. */
const _luz = {total:0, x:0, y:0, c:null, vx:0, vy:0};
/* para M.luces de un plano que no existe: devolver null obligaría a cada
   consumidor a comprobarlo antes de recorrerlo */
const VACIO = [];

const M = {
  get W(){ return V.W; }, get H(){ return V.H; },
  get U(){ return V.U; }, get t(){ return V.t; },
  empuje, luzDedo, borde, flujoX, flujoY, halo, punto,
  /* Un color de `pal` respetando pesos. Úsalo en vez de elige(pal) o los
     pesos no cuentan. La suma se cachea en el propio array.

     Y LA PALETA SE PIDE, NO SE HEREDA. Esto caía a `ABISMO.paleta` cuando
     no se le pasaba ninguna, y con eso el color del `contagio` y del
     `visitante` salía de una clave que sus entradas de escena no nombraban
     y que ningún barrido encontraba leída: un defecto silencioso es
     exactamente lo que esconde un acoplamiento. Quien la olvide se entera
     en el acto, que es lo que se pide. */
  color(pal){ return eligeDePaleta(pal); },
  rgba, clamp, rnd, rango, rangoE, elige, mezcla, suave, opt, TAU,
  /* ── LOS FOCOS DE UN PLANO ────────────────────────────────────────
     La MISMA lista que las especies reciben en `L.luces`, no una copia:
     se lee y no se toca. Está aquí porque un evento no recibe `L`, y sin
     ella no puede existir un evento que se vea SÓLO cuando algo lo
     alumbra.

     En un `dibuja` de evento la lista es la de este fotograma, porque los
     eventos se pintan después de los bichos; en un `actualiza` es la del
     anterior, que a la velocidad a la que se mueve esto da igual. */
  luces(plano){ const L = PLANOS[plano|0]; return L ? L.luces : VACIO; },
  /* ── CUÁNTA LUZ LE LLEGA A UN PUNTO ──────────────────────────────
     La regla de la casa —nadie está iluminado por la escena, cada cuerpo
     existe hasta donde llega la luz que le dan— se resuelve AQUÍ y en un
     solo sitio. Lo piden el cuerpo del rape, cada vértebra de la carroña y
     cada muestra del canto de un cuerpo.

     `luces` es la lista de focos: `L.luces` desde una especie,
     `M.luces(plano)` desde un evento. De cada foco se lee `rCuerpo || rLuz`
     como radio y `luzI` como cuánto emite (1 si no lo declara).

     DOS CURVAS, y la diferencia es de diseño:
       · SIN `corta`, pow(1/(1+d²/r²), caida). No llega a cero nunca, así
         que hay un hilo de luz a cualquier distancia que sube al
         acercarse. Es lo que necesita algo grande en agua vacía: con corte
         el canto de un cuerpo sale todo o nada.
       · CON `corta`, pow(1 − d/r, caida) y nada pasado `r`. El trozo se
         apaga DE VERDAD al salir del foco, que es lo que hace que una
         vértebra aparezca y desaparezca mientras baja.

     `propio` es el que pregunta, si está en la lista: su luz va penalizada
     por `autoLuz` —apunta al frente, no a él— y la penalización se disuelve
     si se le viene encima. Sólo tiene sentido sin `corta`.

     `umbral` es por debajo de cuánto un foco no se cuenta, y `ganancia`
     multiplica ANTES de ese descarte. `techo` y `base` no están aquí: son
     de quien pregunta, que es quien sabe con qué los compone.

     Devuelve un objeto COMPARTIDO —consúmelo en el acto—: `total` es la
     suma, `x`, `y` y `c` son de la que más pesa, y `vx, vy` la suma de las
     direcciones ponderada por peso, que es lo que deja encender sólo el
     lado que mira a la luz. */
  luzEn(x, y, luces, o){
    const alc = opt(o.alcance, 1), caida = opt(o.caida, 2);
    const gan = opt(o.ganancia, 1), umbral = opt(o.umbral, 0.004);
    const propio = o.propio, auto = opt(o.autoLuz, 1);
    let tot = 0, mejor = 0, vx = 0, vy = 0;
    _luz.x = 0; _luz.y = 0; _luz.c = null;
    for (const f of luces){
      const r = (f.rCuerpo || f.rLuz) * alc;
      if (!r) continue;
      const dx = f.x - x, dy = f.y - y, d2 = dx*dx + dy*dy;
      let w, d;
      if (o.corta){
        d = Math.hypot(dx, dy);
        if (d >= r) continue;
        w = opt(f.luzI, 1) * Math.pow(1 - d/r, caida) * gan;
      } else {
        const q = d2/(r*r);
        w = opt(f.luzI, 1) * Math.pow(1/(1+q), caida) * gan;
        if (f === propio) w *= auto + (1 - auto)*Math.exp(-q*3);
        d = Math.sqrt(d2);
      }
      if (w < umbral) continue;
      tot += w;
      const dd = d || 1e-4;
      vx += dx/dd*w; vy += dy/dd*w;
      if (w > mejor){ mejor = w; _luz.x = f.x; _luz.y = f.y; _luz.c = f.c; }
    }
    _luz.total = tot; _luz.vx = vx; _luz.vy = vy;
    return _luz;
  },
  /* lo que los eventos empujan y los bichos consultan */
  campos, get mod(){ return MOD; }, get ritmo(){ return MOD.ritmo; },
  /* El campo de ese `tipo` que más pesa sobre (x,y), con el peso en .peso y
     su color en .c, o null. El bicho no sabe qué lo puso.

     `ri` convierte el disco en anillo, `ky` lo achata, `rot` lo gira y
     `filo` define el canto. `plano` es la guarda de profundidad: con él,
     sólo actúa sobre quien pregunta desde ese plano o desde uno más
     lejano; sin él, sobre todos —un evento sin cuerpo no tiene
     profundidad. `c` y `d` viajan sin que el motor los mire: el color, y
     un dato cualquiera del que lo puso. */
  campo(tipo, x, y, plano){
    let vm = 0, mejor = null;
    /* sólo los de ese tipo: los agrupa `indexaCampos()` una vez por
       fotograma, así que aquí no se recorre lo que no puede valer */
    const lista = camposDe(tipo);
    for (let i=0;i<lista.length;i++){
      const c = lista[i];
      if (plano !== undefined && c.plano !== undefined && c.plano < plano)
        continue;
      let dx = x - c.x, dy = y - c.y;
      /* ── EL DESCARTE BARATO, Y ES LA MITAD DEL MOTOR ────────────
         Este bucle se recorre una vez por bicho, por tipo consultado y
         por campo vivo: con el evento `cuerpo` en marcha son unas 315.000
         pasadas por fotograma. Sin el descarte, con el seno, el coseno y
         la raíz dentro, son 4,9 ms de un fotograma de 16,7; con él, 1,6.

         Es EXACTO y no una aproximación: la elipse cabe siempre dentro
         del círculo de radio r·max(1,ky), girarla no la mueve de ahí, y
         u ≤ 0 equivale a d ≥ r. Lo que el descarte tira es lo mismo que
         tiraría el `continue` de abajo. */
      const ky = c.ky || 1;
      const rmax = ky > 1 ? c.r*ky : c.r;
      if (dx*dx + dy*dy > rmax*rmax) continue;
      if (c.rot){
        const cr = Math.cos(c.rot), sr = Math.sin(c.rot);
        const t = dx*cr + dy*sr;
        dy = dy*cr - dx*sr; dx = t;
      }
      dy /= ky;
      const d = Math.sqrt(dx*dx + dy*dy);
      let u;
      if (c.ri > 0){
        const m = (c.r + c.ri)/2, w = (c.r - c.ri)/2 || 1;
        u = 1 - Math.abs(d - m)/w;
      } else u = 1 - d/c.r;
      if (u <= 0) continue;
      const v = c.fuerza * Math.pow(u, 1/(c.filo || 1));
      if (v > vm){ vm = v; mejor = c; }
    }
    if (!mejor) return null;
    _cam.peso = vm > 1 ? 1 : vm; _cam.c = mejor.c || null;
    /* `d` es un dato libre del campo y el motor lo pasa tal cual: lo que
       quien lo pone necesite contar y no quepa en un peso y un centro,
       como el tamaño y el ángulo de una forma. */
    _cam.d = mejor.d || null;
    /* el centro, que un campo de empuje necesita para dar dirección */
    _cam.x = mejor.x; _cam.y = mejor.y;
    return _cam;
  },
  /* Mete al bicho dentro del cristal y le invierte la velocidad contra esa
     pared —invertida y no a cero, o se queda pegado mientras la corriente
     lo aprieta—. Devuelve [cx, cy] con el sentido HACIA DENTRO, o 0: las
     especies que lo leen aprovechan para cambiar de rumbo, y así parece
     una decisión y no un rebote de billar. */
  envuelve(o, inset){
    const s = salto(o.x, o.y, inset);
    o.x += s[0]; o.y += s[1];
    const cx = s[2], cy = s[3];
    if (cx && o.vx !== undefined && cx*o.vx < 0) o.vx = -o.vx*0.45;
    if (cy && o.vy !== undefined && cy*o.vy < 0) o.vy = -o.vy*0.45;
    _enc[0] = cx; _enc[1] = cy;
    return _enc;
  },
  /* el mismo cálculo sin mover nada, para los bichos hechos de varias
     piezas: rape y medusa lo reparten ellos */
  salto,
};
export { M };
