/* ══════════════════════════════════════════════════════════════════
   BICHOS
   El catálogo de criaturas del motor. Cada uno se registra con
   Acuario.especie() y recibe sus parámetros de la escena, así que el
   mismo bicho puede ser pálido y lento o nervioso y quemado sin tocar
   una línea de aquí. Los eventos van al final.
   ══════════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const A = window.Acuario;
const {rgba, clamp, rnd, rango, rangoE, suave, opt, TAU} = A.M;

/* ── CONTEO ─────────────────────────────────────────────────────────
   Cuenta a partir del área: {cada, min, max}. Un número suelto son ESE
   número y punto, que es como se pide «uno, y uno siempre»: un total de 1
   repartido en porcentajes se redondea a cero en los tres planos. */
const cuenta = (area, r) => typeof r === 'number' ? r
                          : Math.round(clamp(area/r.cada, r.min, r.max));
/* un total para toda la escena, repartido por planos en porcentajes */
const porReparto = (area, li, p) => Math.round(cuenta(area, p.total) * p.reparto[li]);
/* un conteo propio por plano: para los pocos y grandes, donde redondear
   un porcentaje deja planos vacíos */
const porPlano   = (area, li, p) => cuenta(area, p.por[li]);

/* ── FÍSICA COMPARTIDA ──────────────────────────────────────────────
   Las tres piezas de los que se mueven: apartarse del frente de la onda,
   resistirse al borde y dejarse llevar por la corriente. Se cogen por
   separado —el copépodo no usa la del dedo.

   Contrato de reaccionDedo: el objeto lleva vx, vy, fx, fy, huida y lag;
   la escena, fuerzaDedo. El `borde` de la escena es opcional. */

/* Empujón del frente de onda, con rampa: el bicho no salta, va cogiendo
   la fuerza según su `lag`. `e` es lo que devolvió M.empuje. */
function reaccionDedo(o, M, p, e, dt){
  const obj = M.U*p.fuerzaDedo*o.huida, k = Math.min(1, o.lag*dt);
  o.fx += (e[0]*obj - o.fx)*k;
  o.fy += (e[1]*obj - o.fy)*k;
}

/* Resistencia al canto, medida en (x,y) —que no siempre es la posición del
   objeto: el rape la mide en el centro del cuerpo. */
function reaccionBorde(o, M, p, x, y, dt){
  const bd = M.borde(x, y), k = opt(p.borde, 1)*dt;
  o.vx += bd[0]*k; o.vy += bd[1]*k;
}

/* El integrador de la casa: mueve un punto con la corriente y la
   atenuación del plano, y lo deja en un array compartido. Va suelto
   porque no todo el mundo vive en x,y: el rape nada con el cuerpo
   (bx,by) mientras x,y son su esca. */
const _av = [0,0];
function paso(M, L, dt, x, y, vx, vy){
  /* M.ritmo lo mueve un evento de modulación: es «todo se ralentiza» sin
     que ninguna especie sepa que hay un evento */
  const t = M.t, d = L.drift * M.ritmo;
  _av[0] = x + (vx + M.flujoX(y, t)) * dt * d;
  _av[1] = y + (vy + M.flujoY(_av[0], t)) * dt * d;
  return _av;
}
/* el caso de siempre: el bicho vive en x,y */
function avanza(o, M, L, dt, ax, ay){
  const q = paso(M, L, dt, o.x, o.y, o.vx + (ax||0), o.vy + (ay||0));
  o.x = q[0]; o.y = q[1];
}

/* Un degradado radial volcado con fillRect: más barato que un path.
   `stops` es [[parada, color, alfa], …] con el alfa ya multiplicado por
   el brillo del bicho. */
function mancha(g, x, y, R, stops, r0){
  const gr = g.createRadialGradient(x, y, r0||0, x, y, R);
  for (const s of stops) gr.addColorStop(s[0], rgba(s[1], s[2]));
  g.fillStyle = gr;
  g.fillRect(x-R, y-R, R*2, R*2);
}

/* El halo cacheado de `c`, de radio `R` y a alfa `a`: el hermano barato de
   `mancha` —un drawImage en vez de un degradado nuevo—, y por eso lo usa
   todo lo que tiene muchos puntos de luz. El alfa se satura aquí. */
function pintaHalo(g, M, c, x, y, R, a){
  if (!(a > 0) || !(R > 0)) return;
  g.globalAlpha = a < 1 ? a : 1;
  g.drawImage(M.halo(c), x-R, y-R, R*2, R*2);
  g.globalAlpha = 1;
}

/* posición de i dentro de una hilera de n, de 0 a 1. Con n=1 cae en el
   centro en vez de dar 0/0 = NaN, que borraba el bicho entero. */
const reparte = (i, n) => n > 1 ? i/(n-1) : 0.5;

/* ── ÁNGULOS ────────────────────────────────────────────────────────
   Las dos cuentas de los que giran, y las dos están aquí por lo mismo:
   escritas a mano se equivocan al cruzar el ±π. `giroCorto` es cuánto hay
   que girar de `desde` a `hasta` por el camino corto, con signo.
   `mezclaAng` promedia dos rumbos COMO VECTORES, que es la única forma
   que funciona —promediando radianes, 179° y −179° dan 0°—; `w` es cuánto
   pesa el segundo. */
const giroCorto = (hasta, desde) =>
  ((hasta - desde + Math.PI*3) % TAU) - Math.PI;
function mezclaAng(a, b, w){
  const x = Math.cos(a)*(1-w) + Math.cos(b)*w;
  const y = Math.sin(a)*(1-w) + Math.sin(b)*w;
  /* opuestos exactos y a medias se anulan: ahí no hay rumbo que devolver */
  return (x || y) ? Math.atan2(y, x) : a;
}

/* Cuánto SILENCIA este punto, 0 a 1. Es la única línea que cada especie
   necesita para que algo pueda apagarla, sin saber qué se lo apaga. Dos
   canales, y la diferencia está en quién los pone:

     · `apaga` son los eventos —el leviatán—. No tienen profundidad.
     · `tapa` son CUERPOS. En aditivo no hay «encima», así que la oclusión
       va por el único camino que queda: no se añade negro, se le QUITA la
       luz al que estaba detrás.

   Los `tapa` sólo se leen si se pasa `L`, y es a propósito: el rape llama
   sin él, así que no se tapa a sí mismo ni apaga su propia esca. Con `L`
   va además la guarda de profundidad. */
function silencio(M, x, y, L){
  const c = M.campo('apaga', x, y);
  let v = c ? c.peso : 0;
  if (L){
    const t = M.campo('tapa', x, y, L.i);
    if (t && t.peso > v) v = t.peso;
  }
  return v;
}

/* ══════════════════════════════════════════════════════════════════
   MEDUSA
   Pulso propio, tentáculos por historial y silueta paramétrica.
   ══════════════════════════════════════════════════════════════════ */
const HIST = 48;              // muestras del buffer circular
const SAMPLE = 1/26;          // intervalo fijo de muestreo
const TX = new Float32Array(HIST), TY = new Float32Array(HIST);

/* contracción rápida el primer 26% del ciclo, relajación larga */
const pulso = u => u < 0.26 ? Math.sin(u/0.26 * Math.PI/2)
                            : Math.pow(Math.cos((u-0.26)/0.74 * Math.PI/2), 1.6);

/* Semiancho de la campana en función de la altura: v=0 es el ápice, v=1
   el margen. El exponente cambia la silueta entera: 0,47 disco achatado
   de hombros cuadrados, 0,60 cúpula redonda, 0,82 campana alta. */
const bellW = (v, perfil) => Math.sin(Math.PI/2 * Math.pow(v, perfil));

/* Altura del margen festoneado, 0 en las puntas y colgando en medio.
   mBase cerca de 1 deja el margen liso; bajo, muy ondulado. */
const bellM = (t, j, skirt) =>
  skirt * Math.pow(Math.sin(Math.PI*t), j.mEnv)
        * (j.mBase + (1-j.mBase)*Math.cos(j.lobes*TAU*t));

function bellPath(g, j, rx, ry, skirt){
  const N = 22, NM = 30, pf = j.perfil;
  g.beginPath();
  for (let i=0;i<=N;i++){                     // flanco derecho
    const v = i/N, x = rx*bellW(v,pf), y = -ry*(1-v);
    i ? g.lineTo(x,y) : g.moveTo(x,y);
  }
  for (let i=1;i<NM;i++){                     // margen, derecha → izquierda
    const t = i/NM;
    g.lineTo(rx*(1-2*t), bellM(t, j, skirt));
  }
  for (let i=N;i>=0;i--){                     // flanco izquierdo
    const v = i/N;
    g.lineTo(-rx*bellW(v,pf), -ry*(1-v));
  }
  g.closePath();
}

function margenPath(g, j, rx, skirt){
  const NM = 34;
  g.beginPath();
  for (let i=0;i<=NM;i++){
    const t = i/NM;
    const x = rx*(1-2*t), y = bellM(t, j, skirt);
    i ? g.lineTo(x,y) : g.moveTo(x,y);
  }
}

/* ── LAS CINTAS ─────────────────────────────────────────────────────
   Tentáculo y brazo oral son lo mismo con otras medidas: una tira que
   sigue al historial de la campana, se separa del eje y cuelga con la
   edad. `cinta` deja los puntos en TX/TY —compartidos— y `trazaCinta` los
   pinta en dos pasadas: una ancha y difusa que es la difusión en el agua,
   otra fina que es el filamento. */
function cinta(j, n, lat, crece, ly0, cae, sway){
  const h = j.hist;
  for (let k=0;k<n;k++){
    const age = k/(n-1), i = ((j.head - k + HIST) % HIST)*3;
    const cs = Math.cos(h[i+2]), sn = Math.sin(h[i+2]);
    const lx = lat*(1 + age*crece) + sway(age);   // transversal al cuerpo
    const ly = ly0 + age*cae;                     // a lo largo del cuerpo
    TX[k] = h[i]   + lx*cs - ly*sn;
    TY[k] = h[i+1] + lx*sn + ly*cs;
  }
}
function trazaCinta(g, n, stops, ancho, aAncho, fino, aFino){
  const gr = g.createLinearGradient(TX[0], TY[0], TX[n-1], TY[n-1]);
  for (const st of stops) gr.addColorStop(st[0], st[1]);
  g.beginPath();
  g.moveTo(TX[0], TY[0]);
  for (let k=1;k<n;k++) g.lineTo(TX[k], TY[k]);
  g.strokeStyle = gr;
  g.lineWidth = ancho; g.globalAlpha = aAncho; g.stroke();
  g.lineWidth = fino;  g.globalAlpha = aFino;  g.stroke();
}

/* El buffer arranca lleno de una trayectoria plausible: vacío, el primer
   segundo se ve la nube brotando de la nada. */
function siembraHistorial(j){
  const sep = j.r*0.05;              // separación entre muestras
  for (let k=0;k<HIST;k++){
    const age = k/(HIST-1), i = ((HIST-1-k) % HIST)*3;
    j.hist[i]   = j.x + Math.sin(age*2.6 + j.tiltFase)*j.r*0.35*age;
    j.hist[i+1] = j.y + k*sep;
    j.hist[i+2] = 0;
  }
  j.head = HIST-1;
}

/* mueve la medusa y todo su historial de golpe: al topar, si sólo se
   mueve el cuerpo los tentáculos cruzan la escena */
function teleporta(j, dx, dy){
  j.x += dx; j.y += dy;
  for (let k=0;k<HIST;k++){ const i=k*3; j.hist[i]+=dx; j.hist[i+1]+=dy; }
}

/* CONTENCIÓN. Una medusa no sabe girar: su locomoción es el pulso por el
   eje del cuerpo más una flotabilidad constante. Lo que sí puede hacer es
   cambiar de idea sobre si sube o baja: `flota` se espeja alrededor de 1,
   así que un 0,5 boyante pasa a ser un 1,5 que se hunde. Invertir el
   signo de `hundimiento` la dejaría boyante Y con el pulso hacia arriba:
   saldría disparada contra el techo. */
function topa(j, M, p){
  /* El cristal, sólo como respaldo duro. El cálculo es el del motor;
     aplicarlo no puede, porque una medusa es la campana MÁS su historial
     y las dos cosas tienen que saltar juntas. El inset va a su propio
     radio: contenida por el centro, una campana grande se mete en la
     pared. */
  const s = M.salto(j.x, j.y, j.r*1.05);
  if (s[0] || s[1]){
    teleporta(j, s[0], s[1]);
    if (s[2] && s[2]*j.vx < 0) j.vx = -j.vx*0.45;
    if (s[3] && s[3]*j.vy < 0) j.vy = -j.vy*0.40;
  }

  /* MIGRACIÓN VERTICAL, y no un rebote contra el canto: cada medusa
     patrulla entre dos profundidades propias y da la vuelta al llegar.
     Esperando al canto se apelotonaban en dos capas de sedimento con el
     centro vacío —se mueven décimas de píxel por segundo y tardan minutos
     en cruzar el encuadre. */
  const yF = j.y / M.H;
  if ((j.flota < 1 && yF < j.zTop) || (j.flota > 1 && yF > j.zBot)){
    j.flota = clamp(2 - j.flota, 0.35, 1.8);
    j.hundimiento = (p.empuje/j.periodo) * j.flota;
  }
}

A.especie('medusa', {
  luz: true,
  /* Y SE LE PUEDE ROMPER EL DIBUJO: es el sprite más grande y el más
     lento, o sea el único en el que una escalera de bandas se ve y da
     tiempo a mirarla. La medusa no hace nada con esto —lo aplica el motor
     en pintaBicho()—, sólo declara que a ella se le puede hacer. */
  rompible: true,
  aligera(j){ j.nT = Math.max(6, Math.round(j.nT*0.6)); },
  conteo: porPlano,

  crear(M, L, p){
    const r = rango(p.radio) * M.U * L.scale;
    /* al fondo, la mitad de tentáculos: a un tercio de resolución no se
       resuelve uno de otro y lo que cuestan es relleno. Por `resDiv` y no
       por índice de plano, y con `>=` para que subirla a 4 no apague el
       recorte sin avisar. */
    const nT = Math.max(6, Math.round(clamp(r/2.1, p.nTent[0], p.nTent[1])
                                      * (L.resDiv >= 3 ? 0.5 : 1)));
    const per = rango(p.periodo), fl = rango(p.flota);
    const pat = p.patrulla || [0.05, 0.45];
    /* la proporción se normaliza por área: variar la forma no puede
       convertir a unas en el doble de grandes que otras */
    let an = rango(p.ancho), al = rango(p.alto);
    const nrm = 1/Math.sqrt(an*al); an *= nrm; al *= nrm;

    const j = {
      c: M.color(p.paleta), r, nT,
      x: rnd(0.04,0.96)*M.W, y: rnd(0.04,0.96)*M.H,
      periodo: per, fase: Math.random(), contract: 0, destello: 0,
      /* flotabilidad medida contra su propio periodo: el pulso da EMPUJE de
         golpe y esto acumula hundimiento·T. Bajo 1 sube, sobre 1 baja, y
         que unas suban y otras bajen mantiene el encuadre poblado. Se
         guarda aparte porque hay que poder darle la vuelta al topar. */
      flota: fl, hundimiento: (p.empuje/per) * fl,
      /* PATRULLA: entre qué dos alturas va y viene. Los extremos se sortean
         POR SEPARADO, que con centro más amplitud el reparto vertical sale
         peor. Manda la CORRIENTE y no su flotabilidad: `flujoY` da hasta
         1,8 px/s y ella se mueve a 0,16. */
      zTop: rango(pat), zBot: 1 - rango(pat),
      vigor: p.vigor[0] + (p.vigor[1]-p.vigor[0])*Math.pow(Math.random(), 0.45),
      vx:0, vy:0, fx:0, fy:0,
      huida: rango(p.huida), lag: rango(p.lag),
      /* casi verticales, pero no del todo: bascula despacio */
      tilt: 0, tiltAmp: rango(p.tilt), tiltRate: rango(p.tiltVel),
      tiltFase: Math.random()*TAU,
      lobes:  rangoE(p.lobulos),
      perfil: rango(p.perfil), ancho: an, alto: al,
      faldon: rango(p.faldon), mEnv: rango(p.mEnv), mBase: rango(p.mBase),
      nC: rangoE(p.canales), nA: rangoE(p.brazos),
      cX: rango(p.ensancha), cY: rango(p.achata),
      hist: new Float32Array(HIST*3), head: 0, acc: 0,
      tLen: new Int16Array(nT), tSeed: new Float32Array(nT),
      tAmp: new Float32Array(nT), tLat: new Float32Array(nT),
      /* CUÁNTO ALUMBRA, en dos alcances: `rLuz` a cuánto enciende plancton,
         generoso, y `rCuerpo` a cuánto REVELA otro cuerpo, corto a
         propósito —se mueve tan despacio que si alumbra lejos se le queda
         aparcada al lado a un rape y lo delata durante minutos—. `luzI` se
         declara porque quien no lo declara vale 1, o sea más que un pez
         linterna entero. */
      rLuz: r*p.alcanceLuz,
      rCuerpo: r*opt(p.alcanceCuerpo, 2.2),
      luzI: 0,
    };
    for (let t=0;t<nT;t++){
      /* la potencia sesga los largos hacia corto: muchos junto a la campana
         y unos pocos que se van lejos. Eso es una nube. */
      j.tLen[t]  = Math.max(5, Math.round(HIST*(0.16+0.84*Math.pow(Math.random(),1.9))*L.tScale));
      j.tSeed[t] = Math.random()*TAU;
      j.tAmp[t]  = rnd(0.5,1.7);
      j.tLat[t]  = reparte(t, nT) - 0.5 + rnd(-0.035,0.035);
    }
    j.contract = pulso(j.fase);
    siembraHistorial(j);
    return j;
  },

  actualiza(j, M, L, p, dt){
    const t = M.t;
    /* PULSO: al contraer, empujón; entre pulsos se hunde. Arrastre
       exponencial. Eso es toda la locomoción propia. */
    const f  = (t/j.periodo + j.fase) % 1;
    const f0 = ((t-dt)/j.periodo + j.fase) % 1;
    j.contract = pulso(f);
    const dC = (j.contract - pulso(f0)) / Math.max(dt, 1e-4);

    j.tilt = j.tiltAmp*Math.sin(t*j.tiltRate + j.tiltFase)
           + clamp(M.flujoX(j.y,t)*0.010, -0.09, 0.09);

    if (dC > 0){
      /* el empuje va por el eje del cuerpo: inclinada, avanza en diagonal, y
         sigue siendo sólo el pulso */
      const th = dC * j.r * p.empuje * dt;
      j.vx += Math.sin(j.tilt)*th;
      j.vy -= Math.cos(j.tilt)*th;
    }
    j.vy += j.r * j.hundimiento * dt;

    const drag = Math.pow(p.arrastre, dt);
    j.vx *= drag; j.vy *= drag;

    /* el dedo la enciende y la aparta */
    j.destello *= Math.pow(0.20, dt);
    const e = M.empuje(j.x, j.y, j.r*1.6);
    if (e[2] > 0) j.destello = Math.min(1, j.destello + 3.0*dt*e[2]);
    reaccionDedo(j, M, p, e, dt);
    j.vx += j.fx*dt; j.vy += j.fy*dt;

    reaccionBorde(j, M, p, j.x, j.y, dt);
    avanza(j, M, L, dt);
    topa(j, M, p);

    /* lo que alumbra va con el pulso, no fijo: así lo que la medusa revela
       de paso late con ella —un rape asomando al ritmo de una campana */
    j.luzI = (0.58 + 0.42*j.contract) * j.vigor * opt(p.emision, 0.55);

    /* HISTORIAL: buffer circular a intervalo fijo. Sin muelles, sin Verlet,
       sin física: sólo dónde estuvo la campana. */
    j.acc += dt;
    while (j.acc >= SAMPLE){
      j.acc -= SAMPLE;
      j.head = (j.head + 1) % HIST;
      const i = j.head*3;
      j.hist[i] = j.x; j.hist[i+1] = j.y; j.hist[i+2] = j.tilt;
    }
  },

  dibuja(j, M, L, p, g){
    const c = j.contract;
    const rx = j.r * j.ancho * (0.94 + j.cX*c);
    const ry = j.r * j.alto  * (1.10 - j.cY*c);
    const skirt = ry * j.faldon;
    const bright = (0.58 + 0.42*c) * j.vigor * (1 + 0.40*j.destello) * p.brillo
                 * (1 - silencio(M, j.x, j.y, L));
    if (bright < 0.004) return;
    const sh = L.sharp, S = L.scale;

    const glow = j.c.glow;
    mancha(g, j.x, j.y, j.r*4.0, [
      [0.00, glow, 0.50*bright],  [0.14, glow, 0.24*bright],
      [0.36, glow, 0.085*bright], [0.64, glow, 0.024*bright],
      [1.00, glow, 0],
    ], j.r*0.08);

    const bx = j.x + Math.sin(j.tilt)*ry*0.14;
    const by = j.y - Math.cos(j.tilt)*ry*0.14;
    mancha(g, bx, by, j.r*1.35, [
      [0.00, j.c.mid, 0.46*bright],
      [0.35, j.c.mid, 0.17*bright],
      [1.00, j.c.mid, 0],
    ], j.r*0.04);

    /* ── LA NUBE ──────────────────────────────────────────────────
       El historial da el retardo y el serpenteo; la caída con la edad da
       el largo, que el recorrido de dos segundos no daría.          */
    const HANG = ry*p.cuelga;
    const tent = [
      [0.00, rgba(j.c.core, 0.34*bright*sh)], [0.12, rgba(j.c.mid, 0.30*bright)],
      [0.42, rgba(j.c.mid,  0.10*bright)],    [0.74, rgba(j.c.mid, 0.028*bright)],
      [1.00, rgba(j.c.mid,  0)],
    ];
    for (let ti=0; ti<j.nT; ti++){
      const seed = j.tSeed[ti], amp = j.tAmp[ti];
      /* la onda que crece con la antigüedad: el historial de una medusa que
         sube casi recta no curva nada por sí solo */
      cinta(j, j.tLen[ti], j.tLat[ti]*rx*1.72, 0.70, ry*0.30, HANG,
            age => (Math.sin(age*2.9 + seed + M.t*1.3)*0.50
                  + Math.sin(age*9.1 + seed*1.7 + M.t*2.1)*0.13) * rx*amp*age);
      trazaCinta(g, j.tLen[ti], tent, 3.2*S, 0.34, 0.85*S, sh);
    }

    const aLen = Math.max(8, Math.round(HIST*0.34*L.tScale));
    const brazo = [
      [0.00, rgba(j.c.core, 0.52*bright)], [0.35, rgba(j.c.mid, 0.26*bright)],
      [1.00, rgba(j.c.mid,  0)],
    ];
    for (let ti=0; ti<j.nA; ti++){
      const seed = j.tiltFase*1.9 + ti*2.1;
      cinta(j, aLen, (reparte(ti, j.nA) - 0.5)*rx*0.60, 0.45, ry*0.20, HANG*0.55,
            age => Math.sin(age*3.0 + seed + M.t*1.1)*rx*0.26*age);
      trazaCinta(g, aLen, brazo, 6.0*S, 0.42, 1.9*S, sh);
    }
    g.globalAlpha = 1;

    /* ── LA CAMPANA ───────────────────────────────────────────── */
    g.save();
    g.translate(j.x, j.y);
    g.rotate(j.tilt);

    /* translúcida y encendida en todo su volumen. Un degradado vertical
       cubre la cúpula de lado a lado por igual; uno radial sería más
       brillante en el centro y dejaría los hombros apagados. */
    bellPath(g, j, rx, ry, skirt);
    const bg = g.createLinearGradient(0, -ry, 0, skirt);
    bg.addColorStop(0.00, rgba(j.c.core, 0.46*bright));
    bg.addColorStop(0.22, rgba(j.c.mid,  0.50*bright));
    bg.addColorStop(0.62, rgba(j.c.mid,  0.34*bright));
    bg.addColorStop(1.00, rgba(j.c.mid,  0.20*bright));
    g.fillStyle = bg;
    g.fill();

    /* el ápice concentra la luz. El radio va con el lado mayor y la caída es
       larga: si el degradado muere dentro de la campana se le ve el canto
       redondo y parece otra campana dentro. */
    const Ap = Math.max(rx, ry)*0.86;
    const ap = g.createRadialGradient(0, -ry*0.52, 0, 0, -ry*0.44, Ap);
    ap.addColorStop(0.00, rgba(j.c.core, 0.52*bright));
    ap.addColorStop(0.26, rgba(j.c.core, 0.16*bright));
    ap.addColorStop(0.60, rgba(j.c.core, 0.045*bright));
    ap.addColorStop(1.00, rgba(j.c.core, 0));
    g.fillStyle = ap;
    g.fill();

    bellPath(g, j, rx, ry, skirt);
    g.strokeStyle = rgba(j.c.mid,  0.40*bright);
    g.lineWidth = Math.max(1, j.r*0.19);
    g.stroke();
    g.strokeStyle = rgba(j.c.core, 0.44*bright*sh);
    g.lineWidth = Math.max(0.6, j.r*0.022);
    g.stroke();

    /* canales radiales: se apagan antes de llegar abajo; enteros, la campana
       parece el varillaje de un paraguas */
    const cg = g.createLinearGradient(0, -ry*0.78, 0, skirt*0.5);
    cg.addColorStop(0.00, rgba(j.c.core, 0.15*bright*sh));
    cg.addColorStop(0.45, rgba(j.c.core, 0.07*bright*sh));
    cg.addColorStop(1.00, rgba(j.c.core, 0));
    g.strokeStyle = cg;
    g.lineWidth = Math.max(0.5, j.r*0.024);
    for (let i=0;i<j.nC;i++){
      const t = (i+0.5)/j.nC, s = 1-2*t;
      g.beginPath();
      g.moveTo(rx*s*0.05, -ry*0.78);
      g.quadraticCurveTo(rx*s*0.55, -ry*0.46,
                         rx*s*bellW(0.97,j.perfil), bellM(t, j, skirt)*0.5);
      g.stroke();
    }

    margenPath(g, j, rx, skirt);
    g.strokeStyle = rgba(j.c.mid,  0.34*bright);
    g.lineWidth = Math.max(1.2, j.r*0.15);
    g.stroke();
    g.strokeStyle = rgba(j.c.core, 0.46*bright*sh);
    g.lineWidth = Math.max(0.7, j.r*0.030);
    g.stroke();

    g.restore();
  },
});

/* ══════════════════════════════════════════════════════════════════
   PLANCTON
   Deriva lenta y brillo base bajo. Cuando algo luminoso del mismo plano
   se acerca, sube rápido y baja despacio con el color de esa cosa. Es la
   única relación causal entre organismos.
   ══════════════════════════════════════════════════════════════════ */
A.especie('plancton', {
  escalaCalidad: true,
  conteo: porReparto,

  crear(M, L, p){
    const alto = Math.random() < p.destacadas;
    const c = (M.raro && Math.random() < p.raro) ? M.raro : M.color(p.paleta);
    return { c, alto,
      x: rnd(0,M.W), y: rnd(0,M.H),
      r: rango(p.radio)*Math.max(0.6, L.scale),
      a: alto ? rango(p.alfaAlto) : rango(p.alfa),
      ph: Math.random()*TAU, sp: rnd(0.25,0.8),
      glow: 0, lit: null, cal: 0,
      /* cada mota con su fuerza, su retardo y su frenada: si no, salen todas
         disparadas a la vez */
      vx:0, vy:0, fx:0, fy:0,
      /* sentido de la caída: se invierte al topar, y entonces la nieve marina
         pasa a ser materia en suspensión circulando, que es lo que se ve en
         una caja de agua sin fondo por el que caerse. */
      sentido: 1,
      huida: rango(p.huida), lag: rango(p.lag), fren: rango(p.frena) };
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

    /* el frente de la onda, no el dedo: el destello y el apartarse van
       detrás del gesto y no pegados a él */
    const e = M.empuje(m.x, m.y);
    if (e[2] > 0){
      m.glow = Math.min(1, m.glow + p.enciendeDedo*dt*e[2]);
      m.lit = m.c;                           // su propia luz
    }
    reaccionDedo(m, M, p, e, dt);
    /* la frenada se aplica al total: una mota no tiene inercia que defender,
       y así vuelve antes a la deriva */
    const fr = Math.pow(m.fren, dt);
    m.vx = (m.vx + m.fx*dt)*fr;
    m.vy = (m.vy + m.fy*dt)*fr;

    /* vaivén propio, y `caida` como sesgo vertical constante: 0 deja la mota
       en suspensión, positivo la hace nieve marina */
    avanza(m, M, L, dt,
           Math.sin(m.ph + t*m.sp)*M.U*0.05,
           Math.cos(m.ph*1.7 + t*m.sp)*M.U*0.05 + (p.caida||0)*M.U*m.sentido);
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
    const ha = (0.22*m.glow + (m.alto ? 0.15 : 0)) * sil;
    if (ha > 0.012){
      const R = m.r*(m.alto ? 5 : 0) + m.r*10*m.glow;
      pintaHalo(g, M, c, m.x, m.y, R, ha);
    }
    /* LA MOTA. Un punto suave y no un disco: `M.punto` cae de `mid` a `glow`
       y muere en el canto, así que no hay borde y el color se enfría por
       fuera. El radio va por 2,2 porque el sprite es casi todo falda. */
    const R = m.r*(1 + m.glow*0.9)*2.2;
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

/* ══════════════════════════════════════════════════════════════════
   COPÉPODO
   Espera, da un tirón y frena enseguida. Aporta el tempo de décimas de
   segundo que las medusas no tienen.
   ══════════════════════════════════════════════════════════════════ */
/* Un tirón: el copépodo no acelera, se dispara en una dirección y frena.
   Hace falta en dos sitios: cuando le toca el reloj y cuando topa. */
function tiron(d, M, p, ang, escala){
  const s = rango(p.tiron)*M.U*escala;
  d.vx = Math.cos(ang)*s;
  d.vy = Math.sin(ang)*s*0.72;
  d.espera = rango(p.espera);
}

A.especie('copepodo', {
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

/* ══════════════════════════════════════════════════════════════════
   RAPE
   La esca va DELANTE del morro, que es para lo que sirve: atraer algo
   hacia la boca. Eso deja al pez a oscuras, porque su propia luz apunta
   al frente y no a él, y sólo se ve cuando algo lo alumbra —la esca de
   otro rape, o la suya cuando gira de golpe y el señuelo, que va con
   retardo, se le queda un momento encima. Ése es el mecanismo.

   El cuerpo se ilumina desde la posición real de la luz dominante.
   ══════════════════════════════════════════════════════════════════ */

/* Perfiles en unidades de largo. u=0 es el morro, u=1 la base de la cola.
   La silueta es CABEZONA —un Melanocetus—: el máximo cae en el primer
   cuarto y de ahí atrás se estrecha rápido hasta un pedúnculo fino. */
const lomo  = u => 0.40*Math.pow(Math.sin(Math.PI*Math.pow(u,0.52)),1.25) + 0.030;
const panza = u => 0.34*Math.pow(Math.sin(Math.PI*Math.pow(u,0.60)),1.20) + 0.028;
/* Flexión al nadar: nada en el morro, todo en la cola. `congela` la apaga,
   y va aquí dentro porque la piden veinte sitios y una cola congelada con
   las aletas ondeando es un bicho roto. Se escala la AMPLITUD y no la
   fase: la cola se estira hacia la recta en vez de pararse a media
   curva. */
const flex = (u,f,t) => Math.sin(u*2.6 - t*f.velCola + f.fase)
                        * f.amplitudCola * Math.pow(u,1.6)
                        * (1 - 0.9*(f.congela || 0));

/* Construye un trazado en coordenadas del pez y lo deja vivo en
   coordenadas de mundo: los puntos se transforman al crearse, así que tras
   el restore() el path sigue donde se dibujó. Sirve para perfilar fuera de
   la escala, que si no deforma los grosores de línea. */
function enPez(g, f, gx, fn){
  g.save();
  g.translate(f.bx, f.by);
  g.rotate(-gx*f.ang);          // ang>0 es nadar hacia abajo, mire donde mire
  g.scale(gx, 1);
  fn();
  g.restore();
}

/* Pasa un punto del cuerpo a coordenadas de mundo: la esca, el arranque
   del ilicio y el centro del cuerpo viven fuera de la transformación y
   tienen que seguir al morro. Array compartido: consúmelo en el acto. */
const _pt = [0,0];
function aMundo(f, gx, lx, ly){
  const r = -gx*f.ang, cr = Math.cos(r), sr = Math.sin(r), sx = lx*gx;
  _pt[0] = f.bx + sx*cr - ly*sr;
  _pt[1] = f.by + sx*sr + ly*cr;
  return _pt;
}

/* El centro del cuerpo. Comparte el array de aMundo: consúmelo ya. */
const centro = (f, gx) => aMundo(f, gx, f.Lg*0.45, 0);
/* hasta dónde llega la charnela: cuánto del cuerpo ES boca */
const bocaLargo = p => opt(p.bocaLargo, 0.36);

/* punto de una quijada, en coordenadas del pez. También compartido. */
const _q = [0,0], _q2 = [0,0];

/* vector «adelante» en mundo: el morro está en x=0 y la cola en +Lg,
   así que adelante es −x del cuerpo */
const _ad = [0,0];
function adelante(f, gx){
  const r = -gx*f.ang;
  _ad[0] = -gx*Math.cos(r); _ad[1] = -gx*Math.sin(r);
  return _ad;
}

function cuerpoPath(g, f, t){
  const N = 26, Lg = f.Lg;
  g.beginPath();
  for (let i=0;i<=N;i++){                       // lomo: morro → cola
    const u = i/N, y = (flex(u,f,t) - lomo(u))*Lg;
    i ? g.lineTo(u*Lg, y) : g.moveTo(u*Lg, y);
  }
  /* caudal pequeña y poco horquillada, como la de un Melanocetus: con el
     cuerpo ya estrechado, una cola grande se lleva la mirada justo al lado
     contrario de donde está lo que hay que ver, que es la boca */
  const yc = flex(1,f,t)*Lg;                    // aleta caudal
  g.lineTo(Lg*1.15, yc - Lg*0.155);
  g.lineTo(Lg*1.07, yc);
  g.lineTo(Lg*1.15, yc + Lg*0.155);
  for (let i=N;i>=0;i--){                       // panza: cola → morro
    const u = i/N;
    g.lineTo(u*Lg, (flex(u,f,t) + panza(u))*Lg);
  }
  g.closePath();
}

/* ── LAS PIEZAS DEL DIBUJO ──────────────────────────────────────────
   El pez se pinta por capas y cada una es un asunto suyo: piel, volumen,
   vísceras, aletas, ojo, boca y señuelo. Todas reciben `gx` —el espejo ya
   saneado— y pintan con lo que les pasa dibuja(), que es quien resuelve
   de dónde viene la luz y cuánto hay.                               */

/* PIEL. El cuerpo es un CILINDRO, y esto es lo único que lo dice. Va en
   coordenadas del PEZ: la forma del volumen no cambia según de dónde
   venga la luz, sólo cuánto se enciende.

   Se pinta EN REBANADAS y cada una se sombrea con SU propia altura: `v`
   va de −1 en el lomo a +1 en la panza, la normal del cilindro ahí es
   (0, v, √(1−v²)) y el brillo es esa normal contra la luz. Así vale igual
   en el hombro que en el pedúnculo, porque se mide en la altura que hay
   allí y no en píxeles.

   Y lo que hace el volumen no es el brillo, es lo oscuro que se queda el
   otro lado: el término cae casi a cero en el borde de sombra, y entonces
   el canto —que sí rodea la silueta entera— se lee como el filo de algo
   redondo. El reparto a lo largo del eje lo decide `proa`. */
const REBANADAS = 26, VSTOPS = 9;
/* El término de proa, cuatro puntos de control interpolados. Los
   coeficientes se calculan una vez por pasada y no por rebanada —proaA
   se llama REBANADAS veces por rape y por fotograma. */
const PROA_U = [0, 0.20, 0.48, 1];
const _proaA = [0, 0, 0, 0];
function proaCoef(proa){
  _proaA[0] = 0.16 + 0.78*proa;
  _proaA[1] = 0.10 + 0.40*proa;
  _proaA[2] = 0.05 + 0.10*proa;
  return _proaA;
}
function proaA(x, a){
  if (x >= 1) return 0;
  for (let i=1;i<4;i++)
    if (x <= PROA_U[i])
      return a[i-1] + (a[i]-a[i-1])*(x-PROA_U[i-1])/(PROA_U[i]-PROA_U[i-1]);
  return 0;
}

function piel(g, f, gx, t, col, br, proa, ladoY){
  const Lg = f.Lg, suelo = 1 - proa;
  /* DE DÓNDE VIENE LA LUZ. `ladoY` es de qué lado —lomo o panza— y `lz`
     cuánto de frente. El término frontal no es un ajuste: sin él, con la
     luz en el eje del cuerpo el bicho entero se apagaría, porque ninguna
     normal miraría a la luz. */
  const lz = 0.62, il = 1/Math.hypot(ladoY, lz);
  const pc = proaCoef(proa);
  enPez(g, f, gx, () => {
    const m = Lg*0.04;                 // asoma un poco: lo recorta el clip
    for (let i=0;i<REBANADAS;i++){
      const u0 = i/REBANADAS, u1 = (i+1)/REBANADAS, u = (u0+u1)*0.5;
      const alfa = (0.40*suelo + proaA(u/1.15, pc)) * br;
      if (alfa < 0.004) continue;
      const fl = flex(u,f,t);
      const yl = (fl - lomo(u))*Lg, yp = (fl + panza(u))*Lg;
      const gr = g.createLinearGradient(0, yl, 0, yp);
      for (let k=0;k<=VSTOPS;k++){
        const v = k/VSTOPS*2 - 1;
        const n = Math.sqrt(Math.max(0, 1 - v*v));    // cara al espectador
        const d = Math.max(0, (v*ladoY + n*lz)*il);   // normal · luz
        /* La potencia acorta el borde de sombra: con caída lineal el
           cilindro se lee como una rampa y no como un tubo. Al cuadrado se
           come la luminancia media; a 1,7 con el suelo en 0,12 vuelve a su
           sitio sin tocar el pico. */
        gr.addColorStop(k/VSTOPS, rgba(col, alfa*(Math.pow(d, 1.7)*0.88 + 0.12)));
      }
      g.fillStyle = gr;
      /* las rebanadas se tocan sin solaparse: en aditivo dos bordes contiguos
         con media cobertura cada uno suman uno, así que no hay costura
         —solapándolas sí la habría, y en vertical. */
      g.fillRect(u0*Lg, yl - m, (u1-u0)*Lg, yp - yl + 2*m);
    }
  });
}

/* Branquia, línea lateral y miómeros: trazos internos que dicen que esto
   tiene dentro y no es una silueta. En aditivo, sumar poco a algo casi
   saturado no suma nada, así que las alfas van con la piel. */
function visceras(g, f, gx, t, col, br, sh, proa){
  const Lg = f.Lg;
  /* Se apagan hacia la cola con el mismo criterio que la piel: a alfa
     plana quedan dibujados sobre una cola ya apagada. El degradado va en
     coordenadas de MUNDO porque el trazo se pinta fuera de la
     transformación del pez. */
  const a0 = aMundo(f, gx, 0, 0), x0 = a0[0], y0 = a0[1];
  const a1 = aMundo(f, gx, Lg*1.12, 0), x1 = a1[0], y1 = a1[1];
  const eje = (alfa) => {
    const v = g.createLinearGradient(x0, y0, x1, y1);
    v.addColorStop(0.00, rgba(col, alfa));
    v.addColorStop(0.30, rgba(col, alfa*(1 - 0.55*proa)));
    v.addColorStop(0.72, rgba(col, alfa*(1 - 0.92*proa)));
    v.addColorStop(1.00, rgba(col, alfa*(1 - proa)*0.4));
    return v;
  };
  /* LOS MIÓMEROS, la serie de arcos que tiene un pez bajo la piel. A este
     tamaño hacen falta: un costado liso de ocho unidades se lee como una
     bolsa. Van lo primero y más flojo: son sombra, no trazos. */
  if (f.miomeros){
    g.strokeStyle = eje(0.085*br*sh);
    g.lineWidth = Math.max(0.4, Lg*0.008);
    for (let i=0;i<f.miomeros;i++){
      const u = 0.34 + 0.56*reparte(i, f.miomeros);
      enPez(g, f, gx, () => {
        g.beginPath();
        g.moveTo(u*Lg, (flex(u,f,t) - lomo(u)*0.74)*Lg);
        g.quadraticCurveTo((u - 0.05)*Lg, flex(u,f,t)*Lg,
                           u*Lg, (flex(u,f,t) + panza(u)*0.74)*Lg);
      });
      g.stroke();
    }
  }
  g.strokeStyle = eje(0.20*br*sh);
  g.lineWidth = Math.max(0.5, Lg*0.011);
  enPez(g, f, gx, () => {
    g.beginPath();
    g.moveTo(Lg*0.30, (flex(0.30,f,t)-lomo(0.30)*0.80)*Lg);
    g.quadraticCurveTo(Lg*0.23, flex(0.30,f,t)*Lg,
                       Lg*0.33, (flex(0.33,f,t)+panza(0.33)*0.82)*Lg);
  });
  g.stroke();
  enPez(g, f, gx, () => {
    g.beginPath();
    for (let i=0;i<=10;i++){
      const u = 0.34 + 0.62*i/10;
      const y = (flex(u,f,t) - 0.06 + 0.03*Math.sin(u*3))*Lg;
      i ? g.lineTo(u*Lg, y) : g.moveTo(u*Lg, y);
    }
  });
  g.stroke();
}

/* ALETAS. Dorsal, anal, pectoral y los radios de la caudal: rompen la
   silueta de hoja más que ninguna otra cosa. `dl` es a qué distancia
   está la luz dominante. */
function aletas(g, f, gx, t, col, br, dl){
  const Lg = f.Lg;
  const gf = g.createRadialGradient(f.luzX, f.luzY, 0, f.luzX, f.luzY,
                                    Math.max(Lg*0.7, dl*1.5));
  gf.addColorStop(0.00, rgba(col, 0.42*br));
  gf.addColorStop(0.45, rgba(col, 0.19*br));
  gf.addColorStop(1.00, rgba(col, 0));
  g.fillStyle = gf;
  enPez(g, f, gx, () => {                 // dorsal
    g.beginPath();
    g.moveTo(Lg*0.60, (flex(0.60,f,t)-lomo(0.60))*Lg);
    g.quadraticCurveTo(Lg*0.76, (flex(0.76,f,t)-lomo(0.76)-0.19)*Lg,
                       Lg*0.94, (flex(0.94,f,t)-lomo(0.94))*Lg);
    g.closePath();
  });
  g.fill();
  enPez(g, f, gx, () => {                 // anal
    g.beginPath();
    g.moveTo(Lg*0.64, (flex(0.64,f,t)+panza(0.64))*Lg);
    g.quadraticCurveTo(Lg*0.78, (flex(0.78,f,t)+panza(0.78)+0.15)*Lg,
                       Lg*0.94, (flex(0.94,f,t)+panza(0.94))*Lg);
    g.closePath();
  });
  g.fill();
  enPez(g, f, gx, () => {                 // pectoral
    const ax = Lg*0.42, ay = (flex(0.42,f,t)+panza(0.42)*0.55)*Lg;
    const w = 0.14 + 0.05*Math.sin(t*1.1 + f.fase);
    g.beginPath();
    g.moveTo(ax, ay);
    g.quadraticCurveTo(ax+Lg*0.20, ay+Lg*w, ax+Lg*0.30, ay+Lg*(w*0.35));
    g.quadraticCurveTo(ax+Lg*0.18, ay+Lg*0.03, ax, ay);
    g.closePath();
  });
  g.fill();
  g.strokeStyle = gf;                     // radios de la caudal
  g.lineWidth = Math.max(0.5, Lg*0.010);
  enPez(g, f, gx, () => {
    const yc = flex(1,f,t)*Lg;
    g.beginPath();
    for (let i=-2;i<=2;i++){
      g.moveTo(Lg*1.00, yc + i*Lg*0.025);
      g.lineTo(Lg*1.14, yc + i*Lg*0.072);
    }
  });
  g.stroke();
  /* los radios de la dorsal y la anal: rellenas y lisas se leen como dos
     palas pegadas al lomo. El alto de la aleta en cada punto sale del mismo
     seno con el que se trazó su curva, así que los radios acaban en el
     canto y no lo atraviesan. */
  if (f.radios){
    g.lineWidth = Math.max(0.4, Lg*0.0065);
    const alto = (u, a, b) => 0.19*Math.sin(Math.PI*(u-a)/(b-a));
    enPez(g, f, gx, () => {
      g.beginPath();
      for (let i=1;i<=f.radios;i++){
        const u = 0.60 + 0.34*i/(f.radios+1);
        const y = (flex(u,f,t) - lomo(u))*Lg;
        g.moveTo(u*Lg, y);
        g.lineTo(u*Lg, y - alto(u, 0.60, 0.94)*Lg);
      }
      for (let i=1;i<=f.radios;i++){
        const u = 0.64 + 0.30*i/(f.radios+1);
        const y = (flex(u,f,t) + panza(u))*Lg;
        g.moveTo(u*Lg, y);
        g.lineTo(u*Lg, y + alto(u, 0.64, 0.94)*0.79*Lg);
      }
    });
    g.stroke();
  }
}

/* VOLUMEN. Dos pases que sacan el cuerpo de la lámina: el direccional,
   que sale del sitio REAL de la luz, y el reflejo del costado, la banda
   que tiene un cuerpo redondo y no una hoja. Al direccional se le deja
   morir dentro del cuerpo: del cuarto de atrás se encarga el suelo de la
   piel. */
function volumen(g, f, col, nuc, br, bcx, bcy, dl, ladoY){
  const Lg = f.Lg;
  /* Va A LA MITAD, y es lo que deja ver el modelado: este pase es un disco
     centrado en la luz y rellena el cuerpo por igual de lomo a panza, así
     que a plena fuerza le tapa la sombra al cilindro y devuelve la lámina. */
  const RD = Math.max(Lg*0.78, dl*1.35);
  const gd = g.createRadialGradient(f.luzX, f.luzY, 0, f.luzX, f.luzY, RD);
  gd.addColorStop(0.00, rgba(col, 0.30*br));
  gd.addColorStop(0.40, rgba(col, 0.12*br));
  gd.addColorStop(1.00, rgba(col, 0.015*br));
  g.fillStyle = gd;
  g.fillRect(bcx-Lg*2, bcy-Lg*2, Lg*4, Lg*4);

  /* el reflejo se corre hacia el lado iluminado, así que al girar el pez le
     cruza el cuerpo en vez de quedarse pegado */
  g.save();
  g.translate(bcx, bcy);
  g.scale(1, 0.34);
  /* más corto y más vivo: con el cilindro debajo esto ya no tiene que
     modelar nada, es el brillo especular de una piel mojada */
  const rv = Lg*0.40, oy = ladoY*Lg*0.46;
  const gv = g.createRadialGradient(0, oy, 0, 0, oy, rv);
  gv.addColorStop(0.00, rgba(nuc, 0.22*br));
  gv.addColorStop(0.40, rgba(col, 0.08*br));
  gv.addColorStop(1.00, rgba(col, 0));
  g.fillStyle = gv;
  g.fillRect(-rv*1.8, -rv*2.4, rv*3.6, rv*4.8);
  g.restore();
}

/* ── EL OJO ─────────────────────────────────────────────────────────
   Pequeño, pero sin él no hay cara: un disco apagado —el globo, que sólo
   recoge la luz que haya— con la pupila encendida dentro, y la pupila es
   lo único que se MUEVE sin que el bicho se mueva. Se desplaza hacia
   DONDE MIRA, no hacia la luz: el espectador no lee un punto de luz
   desplazado, lee una dirección de atención.

   EL DESTELLO no es licencia: el ojo de un pez de esta profundidad lleva
   tapetum, y un tapetum retrorrefleja. Así que cuando la mirada apunta a
   lo que lo alumbra, el ojo se enciende de golpe.                   */
function ojo(g, f, gx, col, nuc, br, sh, p){
  const Lg = f.Lg;
  const ox = Lg*0.175, oy = -Lg*0.155, r = Math.max(0.8, Lg*0.042);
  /* EL GLOBO sólo recoge: sin luz que le dé, no está. */
  if (br > 0.004){
    enPez(g, f, gx, () => { g.beginPath(); g.arc(ox, oy, r, 0, TAU); });
    g.fillStyle = rgba(col, Math.min(1, 0.55*br));
    g.fill();
  }

  /* el ojo en mundo, desde donde se mide todo lo de abajo. Se copia YA:
     aMundo devuelve el array compartido. */
  const eo = aMundo(f, gx, ox, oy), ex = eo[0], ey = eo[1];
  /* hacia dónde mira, normalizado. Sin blanco todavía —primer fotograma de
     un bicho recién nacido— mira al frente. */
  let dx = f.miraX - ex, dy = f.miraY - ey;
  const dl = Math.hypot(dx, dy);
  if (dl > 1e-4){ dx /= dl; dy /= dl; } else { dx = -gx; dy = 0; }
  /* DEL MUNDO AL CUERPO, y aquí hay una trampa: el cuerpo se pinta con
     scale(gx,1), así que la inversa exacta divide la x por gx —y gx pasa
     por 0 cada vez que el bicho se gira—. No se divide: se deshace el
     giro, se deja la x sin escalar y se le pone SÓLO EL SIGNO de gx. Sin
     ese signo la mirada se INVIERTE al ponerse del otro lado. */
  const a = gx*f.ang, ca = Math.cos(a), sa = Math.sin(a);
  const k = r*opt(p.pupila, 0.40);
  const mx = gx < 0 ? -1 : 1;
  const px = (dx*ca - dy*sa)*mx, py = dx*sa + dy*ca;

  /* el destello: cuánto coincide la mirada con la dirección de la luz que
     más lo alumbra. Al cubo, para que sea un destello y no un degradado:
     mirar «hacia ahí» no cuenta, cuenta mirar AHÍ. */
  let rx = f.luzX - ex, ry = f.luzY - ey;
  const rl = Math.hypot(rx, ry) || 1;
  const retro = Math.max(0, (dx*rx + dy*ry)/rl);
  const dest = Math.pow(retro, 3);
  const fog = 1 + opt(p.destelloOjo, 0)*dest;

  /* LA PUPILA SÍ EMITE, y es la única excepción del bicho a la regla de la
     casa: `ojoBrillo` es su suelo, así que sigue ahí con el cuerpo a
     oscuras. El halo es lo que la hace legible —la pupila mide medio píxel
     en el plano de delante. */
  const bp = Math.max(br, opt(p.ojoBrillo, 0));
  if (bp > 0.004)
    mancha(g, ex, ey, r*6, [
      [0.00, nuc, Math.min(1, 0.30*bp*fog)],
      [0.30, f.c.mid, 0.12*bp*fog],
      [1.00, f.c.glow, 0],
    ]);
  enPez(g, f, gx, () => {
    g.beginPath();
    g.arc(ox + px*k, oy + py*k, r*0.46*(1 + 0.22*dest), 0, TAU);
  });
  g.fillStyle = rgba(nuc, Math.min(1, 1.25*bp*sh*fog));
  g.fill();
}

/* ── LAS QUIJADAS ───────────────────────────────────────────────────
   La boca es una charnela en (jx, jy) y dos quijadas que giran sobre ella:
   `sg` +1 la de arriba, −1 la de abajo. Cerrada, ambas coinciden y se ve
   una sola línea; abierta dejan un hueco.

   La geometría vive aparte de boca() porque ese hueco lo necesitan DOS:
   los dientes, que nacen en la línea y apuntan hacia él, y el recorte del
   cuerpo —el hueco de una boca abierta es agua, no carne.

   `bocaLargo` es cuánto del cuerpo ES boca: con una boca corta se dibuja
   un pez con dientes, y con una que se come media cabeza, una trampa. */
function quijadas(f, p){
  const Lg = f.Lg;
  const jx = Lg*bocaLargo(p), jy = Lg*0.10;
  const hondo = Lg*opt(p.bocaHondo, 0.19);
  const bocaY = u => u*u*jy + (1-u)*u*hondo;
  /* Abre de golpe y cierra más despacio: la potencia bajo el seno adelanta
     el máximo casi al principio. Y nunca cierra del todo
     —`entreabierta`—: una rendija con dientes a los dos lados se lee como
     una trampa ya abierta. */
  const ab = (p.entreabierta || 0)
           + Math.sin(Math.pow(Math.min(1, 1-f.ataque), 0.55)*Math.PI) * p.abertura
           /* y el trabajo de masticar, que es lo mismo pero pequeño y repetido: lo
              calcula actualiza() y lo deja puesto */
           + (f.masticaAb || 0)
           /* y el bombeo de las branquias, lo mismo otra vez pero minúsculo y
              constante. También lo deja puesto actualiza(). */
           + (f.respAb || 0);
  /* EL REPARTO DE LA ABERTURA. `quijadaArriba` es la parte que se lleva la
     de arriba y el resto lo baja la de abajo, así que la abertura total no
     cambia. Girando las dos por igual, a pleno bocado la de arriba le pasa
     POR ENCIMA AL OJO y el ojo se queda flotando dentro de la boca. */
  const arriba = opt(p.quijadaArriba, 0.30);
  const giro = sg => sg > 0 ? 2*ab*arriba : -2*ab*(1 - arriba);
  return { jx, jy, ab, giro,
    /* el punto `u` de una quijada, 0 en el morro y 1 en la charnela, ya
       girado. Array compartido: consúmelo en el acto. */
    punto(sg, u, o){
      const r = giro(sg);
      const dx = u*jx - jx, dy = bocaY(u) - jy;
      const ca = Math.cos(r), sa = Math.sin(r);
      o[0] = jx + dx*ca - dy*sa;
      o[1] = jy + dx*sa + dy*ca;
      return o;
    } };
}

/* EL HUECO DE LA BOCA, en coordenadas del pez: la quijada de arriba de la
   charnela al morro, el salto por delante de la cara, y la de abajo de
   vuelta. No abre trazado: se añade como subtrazado al del cuerpo para
   descontarlo con la regla par-impar.

   POR DELANTE DEL MORRO SE PROLONGA: la silueta es la de la boca CERRADA,
   así que cerrando el hueco de punta a punta queda por delante una cuña
   de carne que las quijadas ya han dejado atrás.                    */
const _p0 = [0,0], _p1 = [0,0];
function bocaPath(g, q){
  const N = 10, fuera = q.jx*2;
  /* la punta de una quijada, tirada hacia delante por su propia tangente:
     cerrada la boca las dos coinciden y el hueco se queda en un sliver de
     área cero, que es lo que tiene que pasar */
  const punta = sg => {
    const a = q.punto(sg, 0, _p0), ax = a[0], ay = a[1];
    const b = q.punto(sg, 0.15, _p1);
    const dx = ax - b[0], dy = ay - b[1], d = Math.hypot(dx, dy) || 1;
    _p0[0] = ax + dx/d*fuera; _p0[1] = ay + dy/d*fuera;
    return _p0;
  };
  for (let i=N;i>=0;i--){
    const pt = q.punto(1, i/N, _q);
    i === N ? g.moveTo(pt[0], pt[1]) : g.lineTo(pt[0], pt[1]);
  }
  let e = punta(1);  g.lineTo(e[0], e[1]);
  e = punta(-1);     g.lineTo(e[0], e[1]);
  for (let i=0;i<=N;i++){
    const pt = q.punto(-1, i/N, _q);
    g.lineTo(pt[0], pt[1]);
  }
  g.closePath();
}

/* LA BOCA. Se abre de verdad: dos quijadas que giran sobre la charnela de
   atrás. En el bocado se separan y el morro se convierte en una trampa
   con dientes arriba y abajo. `gb` es el degradado del canto, de donde
   sale también el color de los dientes. */
function boca(g, f, gx, p, gb, q){
  const Lg = f.Lg;
  /* la boca con su propio trazo, más fino: con el grosor del canto y
     la boca cerrada —las dos quijadas coinciden— lo que se ve es una
     sola barra doble de ancho cruzando la cara de lado a lado. */
  g.strokeStyle = gb;
  g.lineWidth = Math.max(0.6, Lg*0.0095);
  enPez(g, f, gx, () => {
    g.beginPath();
    for (const sg of [-1, 1])
      for (let i=0;i<=8;i++){
        const pt = q.punto(sg, i/8, _q);
        i ? g.lineTo(pt[0], pt[1]) : g.moveTo(pt[0], pt[1]);
      }
  });
  g.stroke();
  const nd = f.dientes;
  /* Las dos filas: la de fuera, que es la que se ve, y una interior más
     corta y metida hacia atrás —los dientes del paladar—. Lo que aporta es
     que la boca tenga FONDO: con una sola fila el morro es una sierra
     plana. */
  const fila = (largo, ancho, dentro, alfa) => {
    g.fillStyle = gb;
    g.globalAlpha = alfa;
    enPez(g, f, gx, () => {
      g.beginPath();
      for (const sg of [-1, 1]){
        const r = q.giro(sg), ca = Math.cos(r), sa = Math.sin(r);
        for (let i=0;i<nd;i++){
          const u = dentro + (1-dentro)*(i+0.5)/nd;
          const pt = q.punto(sg, u, _q), qx = pt[0], qy = pt[1];
          /* cada quijada apunta sus dientes hacia la otra, y de tamaños
             desiguales: una fila regular lee como cremallera */
          let alto = Lg*largo*(0.055 + 0.075*Math.abs(Math.sin(i*2.7 + 1.1 + (sg>0?0.7:0))))*(1-u*0.35);
          let anc = Lg*ancho*0.024*(1-u*0.3);
          /* NINGÚN DIENTE MÁS LARGO QUE EL HUECO QUE TIENE DELANTE. El
             hueco entre quijadas no es el mismo a lo largo de la cara: en
             el morro es toda la abertura y en la charnela es cero. A su
             largo entero el diente cruza la quijada de enfrente y se clava
             en el otro lado; recortado, las dos filas se engranan. */
          const o = q.punto(-sg, u, _q2);
          const k = Math.min(1, Math.hypot(qx-o[0], qy-o[1])*0.62/alto);
          if (k < 0.06) continue;          // en la charnela no cabe nada
          alto *= k; anc *= k;
          /* (−sa, ca) es la normal de la quijada hacia la PANZA, así que
             la de arriba crece hacia allí y la de abajo al contrario: el
             signo del diente ES `sg`. Invertido, el pez sale con los
             dientes clavados en su propia carne. */
          const pta = sg*alto;
          /* y la base se recorre en el sentido del diente: casi cerrada la boca
             las dos filas se cruzan, y con la regla nonzero dos triángulos de
             sentido contrario se RESTAN, o sea que el engranaje sale agujereado. */
          const b = sg*anc;
          g.moveTo(qx - b*ca, qy - b*sa);
          g.lineTo(qx + b*ca, qy + b*sa);
          g.lineTo(qx + anc*0.3*ca - pta*sa,
                   qy + anc*0.3*sa + pta*ca);
          g.closePath();
        }
      }
    });
    g.fill();
    g.globalAlpha = 1;
  };
  if (p.paladar) fila(0.58, 0.72, 0.30, 0.55);   // la de dentro, primero
  fila(1, 1, 0, 1);                              // la que se ve
}

/* LA BARBILLA. Un apéndice luminoso colgando de la quijada, con sus ramas
   —Linophryne lo lleva, no es licencia—. Lo que aporta son DOS luces
   separadas sin nada visible entre ellas: el hueco es lo que declara el
   tamaño de la cabeza. Va tenue: si alumbrase revelaría al bicho. */
const _pta = [];              // puntas de las ramas: x,y intercalados
function barbilla(g, f, gx, p, t, ebr){
  const n = f.barbas;
  if (!n) return;
  const br = ebr * opt(p.barbaBrillo, 0.45);
  if (br < 0.004) return;
  const Lg = f.Lg, u0 = 0.32;
  const bx = Lg*u0, by = (flex(u0,f,t) + panza(u0)*0.92)*Lg;
  /* Las ramas primero, y de paso se guardan las puntas: el trazo y la luz
     son dos pasadas distintas, y repetir la trigonometría en las dos es la
     forma segura de que se despeguen al tocar un número. */
  g.strokeStyle = rgba(f.c.mid, 0.34*br);
  g.lineWidth = Math.max(0.4, Lg*0.0085);
  enPez(g, f, gx, () => {
    g.beginPath();
    for (let i=0;i<n;i++){
      /* se abren hacia atrás y hacia abajo, y cada una con su vaivén: colgadas
         quietas y paralelas parecen un peine */
      const sp   = reparte(i, n) - 0.5;
      const lar  = Lg*p.barba*(0.62 + 0.38*Math.abs(Math.sin(i*2.3 + 1.1 + f.sway)));
      const vai  = Math.sin(t*0.62 + i*1.9 + f.sway)*0.26;
      const ang  = 1.35 + sp*0.85 + vai;        // ~77° = casi recto abajo
      const tx = bx + Math.cos(ang)*lar, ty = by + Math.sin(ang)*lar;
      _pta[i*2] = tx; _pta[i*2+1] = ty;
      g.moveTo(bx, by);
      g.quadraticCurveTo(bx + Math.cos(ang - 0.5)*lar*0.62,
                         by + Math.sin(ang - 0.5)*lar*0.62, tx, ty);
    }
  });
  g.stroke();
  /* y la punta de cada rama enciende: son fotóforos, igual que la esca. Se
     pintan aparte porque el trazo es la rama y esto es la luz. */
  const pr = Math.max(0.6, Lg*0.012);
  g.fillStyle = rgba(f.c.core, Math.min(1, 0.72*br));
  enPez(g, f, gx, () => {
    g.beginPath();
    for (let i=0;i<n;i++){
      const tx = _pta[i*2], ty = _pta[i*2+1];
      g.moveTo(tx + pr, ty);
      g.arc(tx, ty, pr, 0, TAU);
    }
  });
  g.fill();
}

/* EL ILICIO Y LA ESCA, en coordenadas de mundo porque la esca vive ahí.
   La caña arranca del lomo y va a buscar al señuelo esté donde esté. La
   esca va pequeña y quemada: el núcleo blanco es lo que hace que un punto
   diminuto se lea como intenso, y sin él hay que agrandarlo —y entonces
   deja de ser un señuelo y pasa a ser una farola. */
function senuelo(g, f, gx, p, ebr){
  const Lg = f.Lg;
  const bi = aMundo(f, gx, Lg*0.10, -lomo(0.10)*Lg);
  const bix = bi[0], biy = bi[1];
  const mx = (bix + f.x)/2;
  const my = (biy + f.y)/2 - Math.hypot(f.x-bix, f.y-biy)*0.34;
  const gi = g.createLinearGradient(bix, biy, f.x, f.y);
  gi.addColorStop(0.00, rgba(f.c.mid, 0.05*ebr));
  gi.addColorStop(0.65, rgba(f.c.mid, 0.15*ebr));
  gi.addColorStop(1.00, rgba(f.c.core, 0.34*ebr));
  g.strokeStyle = gi;
  g.lineWidth = Math.max(0.5, Lg*0.014);
  g.beginPath();
  g.moveTo(bix, biy);
  g.quadraticCurveTo(mx, my, f.x, f.y);
  g.stroke();

  const glow = f.c.glow;                  // halo de la esca en el agua
  mancha(g, f.x, f.y, Lg*p.halo, [
    [0.00, glow, 0.40*ebr], [0.13, glow, 0.17*ebr],
    [0.40, glow, 0.05*ebr], [1.00, glow, 0],
  ]);

  /* EL COLOR VA EN EL `mid` Y NO EN EL `core`: es aritmética aditiva. Dos
     capas de `core` a alfa alta suman por encima de 255 en los tres
     canales, clipan a blanco y el tono desaparece. Con el `mid` saturado
     el canal flojo sobrevive y el blanco se queda en el corazón. */
  const re = Lg*p.esca, RG = re*p.difusion;
  mancha(g, f.x, f.y, RG, [
    [0.00, f.c.mid, Math.min(1, 0.68*ebr)],
    [0.22, f.c.mid, 0.44*ebr],
    [0.55, f.c.mid, 0.12*ebr],
    [1.00, f.c.mid, 0],
  ]);
  g.fillStyle = rgba(f.c.mid, Math.min(1, 0.50*ebr));
  g.beginPath(); g.arc(f.x, f.y, re, 0, TAU); g.fill();
  /* EL PUNTO BLANCO: su tamaño decide si la esca se lee como color o como
     una bombilla. El blanco puro hace que un punto diminuto parezca
     intenso, pero si se come el radio entero se lleva el tono por delante. */
  const nu = re*opt(p.nucleo, 0.62);
  if (nu > 0.1){
    g.fillStyle = 'rgba(255,255,255,'+Math.min(1, 0.95*ebr).toFixed(3)+')';
    g.beginPath(); g.arc(f.x, f.y, nu, 0, TAU); g.fill();
  }
}

/* ── QUERENCIA DE BORDE ─────────────────────────────────────────────
   El rape no patrulla el centro: se arrima al canto y espera mirando
   hacia dentro. Va contra la tendencia de la casa —`M.borde` empuja hacia
   el centro—, y bajarle el `borde` no basta: eso lo deja a la deriva.

   La distancia al canto se mide por ejes y no radialmente: en un cuadro
   apaisado «al 80 % del radio» es el borde lateral pero todavía el centro
   por arriba, así que un empuje radial los amontona a los lados.

   `aro` es dónde se planta, y el empuje se apaga al llegar.         */
function querencia(f, M, p, dt){
  if (!p.querencia) return;
  const cx = M.W*0.5, cy = M.H*0.5;
  const ex = (f.bx - cx)/cx, ey = (f.by - cy)/cy;   // -1..1 por eje
  const falta = opt(p.aro, 0.80) - Math.max(Math.abs(ex), Math.abs(ey));
  if (falta <= 0) return;
  const d = Math.hypot(ex, ey);
  /* justo en el centro no hay «hacia fuera» que valga: se le da un lado y
     ya se encarga el resto */
  const nx = d > 1e-3 ? ex/d : (Math.random() < 0.5 ? 1 : -1);
  const ny = d > 1e-3 ? ey/d : 0;
  /* la rampa sube rápido: con `falta*2.5` el empuje se queda en un tercio
     a mitad de camino y la corriente —que aquí da más que el crucero del
     bicho— lo devuelve al centro; se plantaba en 0,69 y no en 0,84. */
  const k = p.querencia * M.U * Math.min(1, falta*6) * dt;
  f.vx += nx*k; f.vy += ny*k;
}

/* ── LA CAZA ────────────────────────────────────────────────────────
   El rape no persigue: espera a que algo se le ponga delante de la boca,
   que es justo donde cuelga la esca, y entonces da el bocado.

   Y después NO VUELVE A TIRAR EN UN RATO: eso es `reposo`. Con un banco
   entero entrando y saliendo del alcance, el rape muerde cada dos o tres
   segundos y el fogonazo pasa de acontecimiento a intermitente. Tras
   acertar tarda más que tras fallar: está tragando.                 */
/* la esca se apaga después de tragar, o sea después de masticar */
function apagaTrasComer(f){
  f.objBrillo = rnd(0.08, 0.22);
  f.proxBrillo = f.digiere;
  f.digiere = 0;
}

function caza(f, M, L, p, dt){
  if (f.reposo > 0) f.reposo -= dt;
  /* MASTICAR. No alarga el bocado —un cazador de emboscada tiene que
     seguir siendo un tirón—, añade lo de después: con la presa dentro se
     queda trabajando la quijada unos segundos y con el ilicio recogido
     junto a la boca, o sea con su propia luz encima. Ahí se le ve. */
  if (f.mastica > 0){
    f.mastica = Math.max(0, f.mastica - dt);
    if (f.mastica === 0 && f.digiere > 0) apagaTrasComer(f);
  }
  if (f.ataque > 0){
    f.ataque = Math.max(0, f.ataque - dt/p.bocado);
    /* la esca sólo se apaga CUANDO TERMINA el bocado. Apagarla al morder
       mataba justo el instante que hay que ver. */
    if (f.ataque === 0){
      /* si ha cazado algo, en vez de apagarse se pone a masticarlo; si ha
         fallado no hay nada que masticar y se apaga como antes */
      if (f.digiere > 0){
        if (f.masticaPend > 0){
          f.mastica = f.masticaTotal = f.masticaPend;
          f.masticaPend = 0;
        } else apagaTrasComer(f);
      }
      /* y se suelta la presa: el rape la sostiene mientras dura el bocado y no
         más. Normalmente ella se suelta antes, pero si deja de actualizarse a
         media boca (al degradar se recorta población) el enlace quedaría vivo
         para siempre, arrastrando un objeto que ya no está. */
      f.tragando = null;
    }
    return;
  }
  if (f.reposo > 0) return;
  const rb = f.Lg*p.alcanceBoca;
  for (const z of L.presas){
    if (z.tragado) continue;              // ése ya va camino de una boca
    const dx = z.x - f.x, dy = z.y - f.y;
    if (dx*dx + dy*dy > rb*rb) continue;
    f.ataque = 1;
    f.fogonazo = 1;
    /* Y EL BANCO SE ENTERA: se empuja un campo `asusta` y quien lo lea
       huye. También al FALLAR, y a propósito —lo que ven los vecinos es el
       tirón y la ráfaga, que son los mismos acierte o no. */
    f.espanta = 1;
    f.lanza = Math.max(f.lanza, rango(p.acometida)*M.U);
    if (Math.random() < p.acierto){
      /* no se esfuma en la esca: queda engarzado y la boca tira de él hasta
         dentro. Desaparecer donde cuelga el señuelo era perder justo lo que
         explica para qué sirve el señuelo. */
      z.tragado = f; z.trago = 0;
      f.tragando = z;
      f.digiere = rango(p.trasComer);     // se apagará al acabar
      f.masticaPend = rango(p.mastica || 0);
      f.reposo  = rango(p.reposo);
    } else {
      /* falló, y la presa sale disparada HACIA FUERA: el rumbo se le da desde
         la esca hacia él, y se le alarga el temporizador para que no sortee
         otro antes de haber escapado. Subiéndole sólo la velocidad, aceleraba
         con el rumbo que traía —que apuntaba al señuelo— y volvía a la boca. */
      z.susto = 1.6;
      z.angObj = Math.atan2(z.y - f.y, z.x - f.x);
      z.prox = Math.max(z.prox, 1.8);
      /* y aquí NO se le sube el brillo a la esca. Estaba `f.objBrillo = 1`,
         sin comentario y sin rampa que lo bajara: tras cada fallo la esca se
         quedaba a tope hasta el siguiente parpadeo, o sea un segundo
         encendido detrás de la ráfaga. El parpadeo sigue su ciclo. */
      f.reposo = rango(opt(p.reposoFallo, p.reposo));
    }
    return;
  }
}

/* ── LO QUE TAPA ────────────────────────────────────────────────────
   El cuerpo del rape, puesto en el campo `tapa` para que lo que esté
   detrás deje de dibujarse ahí. `M.campo` no sabe de siluetas, pero para
   un cuerpo casi horizontal la elipse acierta: lo que hay que tapar es la
   masa del tronco, no el filo de la cola.

   Tapa SIEMPRE, también negro sobre negro: se le encuentra por la
   AUSENCIA de motas. Para que a oscuras no esté, escalar `fuerza` con la
   luz recibida: suave(clamp(f.ilum/(p.techo*0.18), 0, 1)).

   Se llama desde la pasada de campos, o sea ANTES de que el bicho se
   actualice, así que la postura que lee es la del fotograma anterior: da
   igual por los píxeles que se mueve en 16 ms, y la alternativa es que el
   plancton del fondo no vea el campo nunca. */
/* EL PERFIL, en dos elipses y no en una: un rape es gordo y corto por
   delante y fino y largo por detrás, así que una sola o se pasa del morro
   o deja la cola destapada. `M.campo` se queda con el que más pesa, así
   que la unión sale sola.
   [u del centro, semieje mayor en largos, proporción del eje corto] */
const TAPAS = [[0.32, 0.36, 1.06],      // el tronco
               [0.76, 0.28, 0.46]];     // la cola

function tapa(f, M, L, p){
  const k = opt(p.tapa, 0);
  if (k < 0.004) return;
  /* EL CANTO VA DURO: la materia tiene canto, y el desvanecido largo es
     para los eventos. El reglaje está en la escena, en motor.js. */
  const Lg = f.Lg, rot = -f.gx*f.ang;   // el mismo giro que enPez()
  const filo = opt(p.tapaFilo, 28);
  for (const T of TAPAS){
    const c = aMundo(f, f.gx, Lg*T[0], 0);
    M.campos.push({ tipo:'tapa', plano: L.i, x: c[0], y: c[1],
                    r: Lg*T[1], ky: T[2], rot, filo, fuerza: k });
  }
}

/* ── LO QUE REPARTE AL MORDER ───────────────────────────────────────
   Un campo `asusta` centrado en la boca. El rape no le habla a nadie: lo
   empuja y quien lo lea huye, que es todo el vocabulario que tiene la
   pieza —el mismo que usa para taparle la luz a los de detrás.

   Va en `campos()` y NO en `actualiza()`, como el `tapa`: los campos se
   vacían al empezar el fotograma y esta pasada corre para los tres planos
   antes de que se mueva nadie, que es la única forma de que lo lea también
   un pez del fondo.

   Con guarda de plano: un rape del plano de delante no asusta a un banco
   que está treinta metros más allá.                                 */
function espanto(f, M, L, p){
  const r = opt(p.espanta, 0);
  if (!(r > 0) || !(f.espanta > 0.01)) return;
  M.campos.push({ tipo:'asusta', plano: L.i, x: f.bocaX, y: f.bocaY,
                  r: f.Lg*r, fuerza: f.espanta,
                  filo: opt(p.espantaFilo, 1) });
}

/* los dos campos que pone el rape, en una sola función porque el contrato
   de especie sólo admite un `campos` */
function camposRape(f, M, L, p){
  tapa(f, M, L, p);
  espanto(f, M, L, p);
}

/* ── LA MIRADA ──────────────────────────────────────────────────────
   A QUÉ está atento. Sólo mantiene un punto en el mundo; la pupila la
   coloca ojo() y el destello sale de comparar este punto con el de la luz.
   Por orden: la presa más cercana dentro de `vigila`; si no hay, lo que lo
   esté ALUMBRANDO —el dedo no tiene caso especial: sale de que el dedo
   enciende cosas—; y si no, su propia esca. O sea que el ojo está
   normalmente al frente, y por eso cualquier desvío se lee.

   Llega TARDE a propósito: `velMira` bajo es la diferencia entre un
   reflejo y una decisión. Subirlo deja una torreta.                 */
function mirada(f, M, L, p, dt){
  const R = f.Lg*opt(p.vigila, 0);
  let d2m = R*R, presa = null;
  const cen = centro(f, f.gx), cx = cen[0], cy = cen[1];
  for (const z of L.presas){
    /* la que ya va camino de una boca, no: el ojo se quedaba mirando lo que
       el propio bicho tiene dentro */
    if (z.tragado) continue;
    const dx = z.x - cx, dy = z.y - cy, d2 = dx*dx + dy*dy;
    if (d2 < d2m){ d2m = d2; presa = z; }
  }
  let tx, ty;
  if (presa)              { tx = presa.x; ty = presa.y; }
  else if (f.ilum > 0.02) { tx = f.luzX;  ty = f.luzY;  }
  else                    { tx = f.x;     ty = f.y;     }
  const k = Math.min(1, opt(p.velMira, 2.4)*dt);
  f.miraX += (tx - f.miraX)*k;
  f.miraY += (ty - f.miraY)*k;
}

/* ── LUZ RECIBIDA ───────────────────────────────────────────────────
   Se suma la de todas las escas del plano, y se guarda de dónde viene la
   que más pesa: el dibujo enciende el cuerpo desde ahí. La propia va
   penalizada porque apunta al frente y no al dueño.                 */
function luzRecibida(f, M, L, p, dt){
  const Lg = f.Lg;
  /* el centro del cuerpo otra vez, ya movido: medirlo contra el de antes de
     integrar dejaba la iluminación un frame por detrás */
  const cen = centro(f, f.gx);
  const cx = cen[0], cy = cen[1];
  let tot = 0, mejor = 0;
  for (const o of L.luces){
    const R = o.rCuerpo || o.rLuz || Lg;
    const dx = o.x - cx, dy = o.y - cy;
    const q = (dx*dx + dy*dy)/(R*R);
    /* caida alta = alcance corto; ganancia alta = mucho de cerca. Juntas son
       lo que hace que un rape sea difícil de ver pero se vea bien cuando se ve. */
    let w = opt(o.luzI, 1) * Math.pow(1/(1+q), p.caida) * p.ganancia;
    if (o === f){
      /* La penalización de la luz propia se disuelve cuando la esca se le viene
         encima: a distancia apunta al frente y no le da, pero si el giro se la
         trae al cuerpo le alumbra de lleno. Un autoLuz fijo obliga a elegir
         entre invisible siempre o visible siempre. */
      w *= p.autoLuz + (1 - p.autoLuz)*Math.exp(-q*3);
    }
    if (w < 0.004) continue;
    tot += w;
    /* de la luz dominante se guarda DÓNDE está, no de qué color es: el lado
       por el que se enciende es suyo, el tono es del bicho */
    if (w > mejor){ mejor = w; f.luzX = o.x; f.luzY = o.y; }
  }
  f.ilum += (tot - f.ilum) * Math.min(1, 9*dt);     // sin parpadeos duros
}

A.especie('rape', {
  luz: true,
  /* el cuerpo tapa y el bocado asusta: van en su propia pasada, antes de
     que se actualice nadie, o el plancton y el banco del fondo no los ven */
  campos: camposRape,
  aligera(f){ f.dientes = Math.max(4, (f.dientes*0.6)|0); },
  conteo: porPlano,

  crear(M, L, p){
    const Lg = rango(p.largo) * M.U * L.scale;
    /* NACE YA EN SU SITIO si la escena le pide querencia de borde: con un
       crucero de centésimas de unidad por segundo tardaría minutos en llegar
       al canto, y ésos son justo los minutos que alguien está mirando. */
    let bx, by;
    if (p.querencia){
      const aro = opt(p.aro, 0.80);
      const lado = (Math.random()*4)|0, t = rnd(-aro, aro);
      const ex = lado === 0 ? -aro : lado === 1 ? aro : t;
      const ey = lado === 2 ? -aro : lado === 3 ? aro : t;
      bx = (1 + ex)*0.5*M.W; by = (1 + ey)*0.5*M.H;
    } else {
      bx = rnd(0.08,0.92)*M.W; by = rnd(0.10,0.90)*M.H;
    }
    /* de cara al centro: dir=1 mira a −x */
    const dir = p.miraAlCentro ? (bx > M.W*0.5 ? 1 : -1)
                               : (Math.random() < 0.5 ? 1 : -1);
    /* UN COLOR Y UNO SOLO, sorteado al nacer. Lo usan la esca, el cuerpo,
       la barbilla y la pupila: ningún componente tiene color propio, y lo
       que la luz de al lado decide es por dónde se enciende, no de qué
       color es.

       Hubo dos paletas atadas por índice, una para la lámpara y otra para
       el animal. La diferencia entre el foco y el susurro la sostienen
       ahora sólo el alfa —`brillo` contra `cuerpo`— y el núcleo blanco de
       la esca, que es donde de verdad estaba. */
    const f = {
      c: M.color(p.paleta),
      Lg, dir, gx: dir,
      bx, by,
      /* x,y son la esca: es lo que el motor reparte como luz, y no hay una
         segunda copia del mismo punto que mantener al día */
      x: bx, y: by, lvx: 0, lvy: 0,
      rLuz: Lg*p.alcanceLuz, rCuerpo: Lg*p.alcanceCuerpo, luzI: 0.6,
      vx: 0, vy: 0, fx: 0, fy: 0,
      fase: Math.random()*TAU,
      velCola: rango(p.velCola),
      amplitudCola: rango(p.cola),
      dientes: rangoE(p.dientes),
      /* el detalle que varía de uno a otro. Van a 0 si la escena no los pide,
         y entonces no se dibuja ninguno: la especie sigue sirviendo para un
         rape pequeño y esquemático al fondo. */
      barbas:    p.barba ? rangoE(p.barbas || [3, 5]) : 0,
      miomeros:  rangoE(p.miomeros || 0),
      radios:    rangoE(p.radios || 0),
      brillo: rnd(0.45, 0.8), objBrillo: 0.6, proxBrillo: rnd(0.5, 4),
      /* acecho: quieto mucho rato, embestida corta de vez en cuando. Por
         rango() y no indexando p.acecho[1]: el convenio del motor es «número
         o par», y con un número suelto esto daba NaN. */
      espera: rnd(1, rango(p.acecho)),
      lanza: 0,
      giroProx: rango(p.giro),
      /* inclinación de nado: cruza en diagonal, no sólo en horizontal */
      ang: 0, angObj: rango(p.inclina), angProx: rango(p.cadaInclina),
      /* senuelo: es la bandera que las presas buscan en L.luces */
      /* `fogonazo` es la fase de la ráfaga y `chispa` la luz que sale de
         ella; `espanta` es la fase del susto que reparte al morder. */
      ataque: 0, senuelo: true, fogonazo: 0, chispa: 0, espanta: 0, digiere: 0,
      /* masticar: lo que queda, lo que duraba y lo que abre la quijada ahora
         mismo. `masticaPend` es lo ganado al acertar, que espera a que termine
         el bocado. */
      mastica: 0, masticaTotal: 1, masticaPend: 0, masticaAb: 0,
      alFrente: false,
      reposo: rnd(0, rango(p.reposo || 1)),
      bocaX: bx, bocaY: by, tragando: null,
      huida: rango(p.huida), lag: rango(p.lag),
      sway: Math.random()*TAU,
      ilum: 0, luzX: bx, luzY: by,
      /* A DÓNDE MIRA, en mundo. Arranca en el morro y no en el cuerpo para que
         el primer fotograma no salga con el ojo en blanco. */
      miraX: bx, miraY: by,
      /* el bombeo de las branquias: fase y ritmo propios, o los diez rapes de
         una pecera grande respirarían al unísono */
      respFase: Math.random()*TAU,
      respVel:  rango(p.ritmoRespira || [1.7, 2.7]),
      respAb: 0,
      /* cuánto está congelado ahora mismo: 0 nada, 1 clavado */
      congela: 0,
    };
    /* LA ESCA NACE EN SU SITIO, no encima del cuerpo. Arrancando en
       (bx,by) el modelo de luz propia la ve a distancia cero —y con q=0 la
       penalización de `autoLuz` se disuelve entera—, así que todos los
       rapes aparecen encendidos las décimas que tarda el muelle en
       colocarla: un fogonazo al cargar la pieza. */
    const ini = aMundo(f, f.gx, -Lg*p.delante, -Lg*p.encima);
    f.x = f.luzX = ini[0];
    f.y = f.luzY = ini[1];
    return f;
  },

  actualiza(f, M, L, p, dt){
    const t = M.t, Lg = f.Lg;

    f.proxBrillo -= dt;
    if (f.proxBrillo <= 0){
      f.objBrillo = rango(p.intensidad);
      f.proxBrillo = rango(p.parpadeo);
    }
    f.brillo += (f.objBrillo - f.brillo) * Math.min(1, 1.6*dt);
    /* ── LA RÁFAGA, Y NO HAY MÁS QUE UNA ──────────────────────────
       El bocado no enciende una luz aparte: es la esca, que durante un
       instante emite mucho más, y el cuerpo se enciende por el mismo
       modelo de luz recibida que usa el resto.

       `fogonazo` es una FASE de 1 a 0 y `chispa` la luz que sale de
       elevarla: con `fogonazoCaida` por encima de 1 el ataque es
       instantáneo y la caída violenta. Con exponente 1 la ráfaga baja a
       ritmo constante y se lee como un foco que se enciende.

       Y la masticación NO SUMA luz: con una envolvente propia encima, un
       bocado se ve como DOS encendidos seguidos. La ráfaga es una sola y
       cubre bocado y masticación, así que mientras trabaja la quijada lo
       que hay es su cola. `chispa` se guarda porque la usan el cuerpo y
       la propia esca: calcularla dos veces es la forma de que se
       despeguen. */
    f.fogonazo = Math.max(0, f.fogonazo - dt/p.fogonazoDura);
    f.chispa = f.fogonazo ? Math.pow(f.fogonazo, opt(p.fogonazoCaida, 1)) : 0;
    /* el susto que reparte dura más que la ráfaga: el banco tarda en
       rehacerse, y si se apaga con la luz el pánico no se llega a ver */
    f.espanta = Math.max(0, f.espanta - dt/opt(p.espantaDura, 1));
    f.luzI = f.brillo + f.chispa*p.fogonazo;
    /* La envolvente de masticar: ya no es luz, es MOVIMIENTO —el trabajo de
       la quijada y lo recogido que va el ilicio—. Entra de golpe y se va en
       el último tercio. */
    const mast = f.mastica > 0
      ? suave(Math.min(1, f.mastica/Math.max(0.001, f.masticaTotal*0.35))) : 0;
    /* la dentellada: más tiempo cerrada que abierta, que es como se mastica;
       un seno pelado se lee como jadeo */
    const champ = mast
      ? Math.pow(0.5 + 0.5*Math.sin(t*opt(p.masticaRitmo, 6.5) + f.fase), 1.6) : 0;
    f.masticaAb = mast * opt(p.masticaAbre, 0) * champ;

    /* ── RESPIRA ──────────────────────────────────────────────────
       La quijada se mueve un poco, siempre, también clavado y a oscuras.
       Son centésimas de radián para que no se lea como un gesto sino como
       que esa cosa está VIVA. Se calla mientras muerde y mientras mastica:
       ahí la quijada ya está haciendo algo. */
    f.respAb = opt(p.respira, 0)
             * Math.pow(0.5 + 0.5*Math.sin(t*f.respVel + f.respFase), 2.2)
             * (1 - Math.max(f.ataque, mast));

    /* ── SE QUEDA QUIETO CUANDO LO MIRAN ─────────────────────────
       Lo contrario de lo que hace un animal: uno que se sobresalta al
       recibir luz es un pez, y uno que se queda igual de quieto —ni cola,
       ni crucero, ni vaivén— es una cosa que ya te había visto. Lo que se
       mueve es la pupila y nada más.

       No congela el bocado, ni la embestida, ni la huida del dedo: en las
       tres ya está pasando algo. El umbral va a medio `techo`, así que se
       congela cuando está revelado y no cuando le roza un reflejo.   */
    const cong = (f.ataque > 0 || f.mastica > 0 || f.lanza > 0.01) ? 0
      : opt(p.congela, 0)
        * suave(clamp(f.ilum/Math.max(0.001, p.techo*0.5), 0, 1));
    /* con rampa: congelarse de un fotograma al siguiente es un salto, y lo
       que tiene que parecer es que se ha quedado quieto */
    f.congela += (cong - f.congela) * Math.min(1, 3.2*dt);
    const vivo = 1 - f.congela;

    /* acecho y embestida; adelante es −dir (ver `adelante`) */
    f.espera -= dt;
    if (f.espera <= 0){
      f.lanza = rango(p.embestida)*M.U;
      f.espera = rango(p.acecho);
    }
    /* inclinación: deriva despacio hacia un objetivo nuevo cada tantos
       segundos, y eso es lo que le hace cruzar en diagonal */
    f.angProx -= dt;
    if (f.angProx <= 0){
      /* además de la velocidad, el borde le tuerce el rumbo: cerca del canto
         elige ángulos que apuntan hacia dentro. Así no parece que rebote,
         parece que decide. */
      const bb = M.borde(f.bx, f.by);
      const h = Math.hypot(bb[0], bb[1]) || 1;
      f.angObj = clamp(rango(p.inclina) + (bb[1]/h)*bb[2]*1.1*p.topeInclina,
                       -p.topeInclina, p.topeInclina);
      f.angProx = rango(p.cadaInclina);
    }
    f.ang += (f.angObj - f.ang) * Math.min(1, p.velInclina*dt);

    const ad = adelante(f, f.gx);
    /* crucero: un empuje continuo y pequeño, o entre tirón y tirón se queda
       clavado. Por `vivo` porque es lo primero que hay que quitar para que
       quedarse quieto se note: una cola parada sobre un cuerpo que sigue
       avanzando se lee como un bicho a la deriva. */
    f.vx += ad[0] * M.U * p.crucero * vivo * dt;
    f.vy += ad[1] * M.U * p.crucero * vivo * dt;
    if (f.lanza > 0.01){
      f.vx += ad[0] * f.lanza * 4 * dt;
      f.vy += ad[1] * f.lanza * 4 * dt;
      f.lanza *= Math.pow(0.06, dt);
    }
    querencia(f, M, p, dt);

    /* EL DEDO. Al alcanzarle la onda se gira en redondo para huir y
       sale de estampida. Girar de golpe es lo que descoloca la esca:
       el señuelo va con retardo y se le queda encima del cuerpo unos
       instantes. Ahí es cuando se le ve. */
    const bc = centro(f, f.gx);
    const bcx = bc[0], bcy = bc[1];
    const e = M.empuje(bcx, bcy, Lg*0.9);
    if (e[2] > p.umbralHuida){
      f.dir = e[0] > 0 ? -1 : 1;              // de espaldas a la onda
      f.lanza = Math.max(f.lanza, rango(p.estampida)*M.U*e[2]);
      f.angObj = clamp(e[1]*1.3, -p.topeInclina, p.topeInclina);
      f.angProx = rango(p.cadaInclina);
      f.objBrillo = Math.min(1, f.objBrillo + 0.9*e[2]);
    }
    reaccionDedo(f, M, p, e, dt);
    f.vx += f.fx*dt; f.vy += f.fy*dt;

    /* Se replantea de tanto en tanto hacia dónde mira. Con `miraAlCentro` no
       alterna: se vuelve a poner de cara al centro, que es de donde tiene
       que venir lo que pique. Si ya mira bien se queda quieto, que es justo
       lo que hace un cazador de emboscada. */
    f.giroProx -= dt;
    if (f.giroProx <= 0 && Math.abs(f.vx) < M.U*0.15){
      f.dir = p.miraAlCentro ? (f.bx > M.W*0.5 ? 1 : -1) : -f.dir;
      f.giroProx = rango(p.giro);
    }
    /* el giro se anima pasando por cero: el pez queda de perfil un instante,
       que es como gira un pez. Un espejo instantáneo salta. */
    f.gx += (f.dir - f.gx) * Math.min(1, p.velGiro*dt);

    /* deriva de acecho: casi nada, más un vaivén largo —y también se calla
       al congelarse, que es lo único que queda moviéndolo */
    f.vy += Math.sin(t*0.13 + f.sway)*M.U*0.05*vivo*dt;
    const dr = Math.pow(p.arrastre, dt);
    f.vx *= dr; f.vy *= dr;
    /* el borde se mide en el centro del cuerpo, no en la esca: es el pez el
       que no cabe */
    reaccionBorde(f, M, p, bcx, bcy, dt);

    /* El cuerpo se integra en bx,by porque x,y son la esca. Es el integrador
       de siempre, que por eso vive suelto en `paso`: la corriente y el ritmo
       valen igual para un pez que para una mota. */
    const q = paso(M, L, dt, f.bx, f.by, f.vx, f.vy);
    f.bx = q[0]; f.by = q[1];
    /* Contención medida en el CUERPO y no en el morro. El salto lo
       calcula el motor y aquí sólo se reparte, porque un rape son tres
       cosas a la vez —cuerpo, señuelo y lo que lleve en la boca— y o
       saltan las tres o el ilicio se estira de un canto al otro.

       «EL CUERPO» es `bx,by` y NO el centro geométrico de centro(): con el
       centro clavado en el cristal, el morro sale del cuadro. Medido, con
       `bx,by` asoma la cola hasta 24 px y con centro() la CARA hasta 201,
       que es lo único que hay que ver de este bicho.                */
    const sal = M.salto(f.bx, f.by);
    const sx = sal[0], sy = sal[1], px = sal[2], py = sal[3];
    if (px || py){
      /* pared vertical: cambia de cara. Techo o suelo: invierte la diagonal. Y
         se le corta la embestida, o vuelve a empujar contra el cristal al
         fotograma siguiente. */
      if (px) f.dir = -px;
      if (py){
        f.angObj = clamp(-f.ang*1.2, -p.topeInclina, p.topeInclina);
        f.angProx = rango(p.cadaInclina);
        f.vy = -f.vy*0.4;
      }
      f.lanza = 0;
    }
    if (sx || sy){
      f.bx += sx; f.by += sy; f.x += sx; f.y += sy;
      /* y lo que tenga en la boca: si no, la presa se queda al otro lado de la
         pantalla y cruza en línea recta para alcanzarla */
      if (f.tragando){ f.tragando.x += sx; f.tragando.y += sy; }
    }

    /* LA ESCA, en coordenadas de mundo: que viva en mundo y no en el cuerpo
       es lo que permite que se retrase al girar.

       Al morder recoge el ilicio y el objetivo se viene al morro, que es lo
       que pone la luz encima de la cara justo cuando se abre; y se queda casi
       igual de recogido mientras mastica, porque si se estira otra vez la luz
       se va del cuerpo y el bicho se apaga justo cuando había que mirarlo. */
    const rec = 1 - p.retrae*Math.max(f.ataque, mast*opt(p.masticaRetrae, 0));
    const ob = aMundo(f, f.gx, -Lg*(p.delante*rec + 0.05*Math.sin(t*0.5 + f.fase)),
                               -Lg*(p.encima*rec + 0.07*Math.sin(t*0.37 + f.sway)));
    /* EL OBJETIVO DE LA ESCA, DENTRO DEL CRISTAL. Se recorta el objetivo y
       no la esca: recortando la esca, el muelle seguiría tirando hacia
       fuera y el señuelo se quedaría temblando contra el canto. Con el
       cuerpo arrimado al borde el muelle apunta fuera de cuadro uno de
       cada nueve fotogramas. */
    const rec2 = M.salto(ob[0], ob[1], M.U*0.9);
    const tx = ob[0] + rec2[0], ty = ob[1] + rec2[1];
    f.lvx += ((tx - f.x)*p.muelle - f.lvx*p.freno) * dt;
    f.lvy += ((ty - f.y)*p.muelle - f.lvy*p.freno) * dt;
    f.x += f.lvx*dt; f.y += f.lvy*dt;

    /* LA BOCA en coordenadas de mundo: es a donde va lo que se traga. El
       punto va sobre la propia línea de la boca y hacia el fondo del hueco,
       así que la presa entra ENTRE las dos filas de dientes, que es lo único
       que hace que se lea como tragar. */
    const bo = aMundo(f, f.gx, Lg*bocaLargo(p)*0.66, Lg*0.075);
    f.bocaX = bo[0]; f.bocaY = bo[1];

    caza(f, M, L, p, dt);
    luzRecibida(f, M, L, p, dt);
    /* después de la luz: la mirada de fondo es la luz que lo alumbra, y
       medirla contra la del fotograma anterior deja el ojo un paso por detrás */
    mirada(f, M, L, p, dt);
    /* mientras muerde y mientras mastica, delante de todo: es el único rato
       en que se le ve entero y no puede tocarle quedarse detrás de una nube
       de plancton */
    f.alFrente = f.ataque > 0 || f.mastica > 0;
  },

  dibuja(f, M, L, p, g){
    const t = M.t, Lg = f.Lg, sh = L.sharp;
    /* de perfil puro el pez no existe, pero el trazado no puede degenerar */
    const gx = Math.abs(f.gx) < 0.06 ? (f.gx < 0 ? -0.06 : 0.06) : f.gx;
    const col = f.c.mid, nuc = f.c.core;
    const sil = 1 - silencio(M, f.bx, f.by);
    /* DOS BRILLOS DISTINTOS: `brillo` es el del señuelo —el foco, lo único
       que tiene que quemar— y `cuerpo` el del animal, que se queda en un
       susurro. Con un solo número no se puede pedir «un foco de color encima
       de algo que casi no está». `techo` recorta antes de escalar. */
    const br = Math.min(p.techo, f.ilum + p.base) * opt(p.cuerpo, p.brillo) * sil;
    const bc = centro(f, gx);
    const bcx = bc[0], bcy = bc[1];

    /* ── EL CUERPO ────────────────────────────────────────────────
       El trazado se construye dentro de la escala del pez y se pinta
       fuera: así los degradados se centran en la luz real, en coordenadas
       de mundo, y los grosores de línea no se deforman.

       Y EL BICHO ES TRANSPARENTE A SÍ MISMO A PROPÓSITO. Todo se suma en
       el mismo lienzo y en aditivo, así que una aleta que está detrás del
       cuerpo se le suma encima. En un motor con orden de profundidad sería
       un fallo; aquí es el diseño: de un animal de agua negra no se ve un
       volumen macizo sino la suma de lo que en él tiene luz.

       Que se vieran OTROS bichos a través de él sí era un fallo, y lo tapa
       el campo `tapa`: transparente a sí mismo, opaco a los demás.   */
    if (br > 0.012){
      const q = quijadas(f, p);
      /* EL CUERPO, MENOS EL HUECO DE LA BOCA. Dos recortes que se cruzan:
         el primero deja el cuerpo; el segundo, par-impar sobre cuerpo +
         hueco, deja lo que está en uno y no en el otro. La intersección es
         el cuerpo SIN el hueco: una boca abierta no tiene carne dentro.

         Se RECORTA y no se borra: borrando se llevaría por delante lo que
         ya hubiera pintado detrás en este plano, y lo que tiene que pasar
         es lo contrario —que por el hueco se vea el agua.            */
      enPez(g, f, gx, () => cuerpoPath(g, f, t));
      g.save();
      g.clip();
      enPez(g, f, gx, () => { cuerpoPath(g, f, t); bocaPath(g, q); });
      g.clip('evenodd');

      const proa = opt(p.proa, 0);
      const dl = Math.hypot(f.luzX-bcx, f.luzY-bcy);
      const ladoY = clamp((f.luzY - bcy)/Lg, -1, 1);
      piel(g, f, gx, t, col, br, proa, ladoY);
      volumen(g, f, col, nuc, br, bcx, bcy, dl, ladoY);
      visceras(g, f, gx, t, col, br, sh, proa);

      g.restore();                       // fin del recorte

      /* EL CANTO, y también se calla dentro del hueco. La silueta del
         cuerpo es la de la boca CERRADA —por delante de la charnela, la
         línea de la panza ES la quijada de abajo—, así que sin descontar
         el hueco el canto cruzaría el vacío de la boca. El recorte es
         «todo menos el hueco»: limitado al cuerpo, el trazo perdería su
         mitad de fuera. */
      g.save();
      g.beginPath();
      g.rect(0, 0, M.W, M.H);
      enPez(g, f, gx, () => bocaPath(g, q));
      g.clip('evenodd');

      /* el borde recoge más luz que la piel. El trazado se rehace a propósito:
         restore() devuelve el recorte pero NO el camino vivo, y ahí seguía el
         de la línea lateral. Sin esta línea lo que se traza es ésa —dos veces
         y en claro— y la silueta se queda sin canto. */
      enPez(g, f, gx, () => cuerpoPath(g, f, t));
      const gb = g.createRadialGradient(f.luzX, f.luzY, 0, f.luzX, f.luzY,
                                        Math.max(Lg*0.6, dl*1.45));
      /* alfas y grosor a la baja: con la piel rellenando el cuerpo el canto ya
         no tiene que dibujar la silueta él solo, y a `br` alto un 0,95 de
         núcleo saturaba a blanco y florecía. */
      gb.addColorStop(0.00, rgba(nuc, 0.62*br*sh));
      gb.addColorStop(0.42, rgba(col, 0.26*br*sh));
      gb.addColorStop(1.00, rgba(col, 0));
      g.strokeStyle = gb;
      g.lineWidth = Math.max(0.5, Lg*0.0075);
      g.stroke();
      g.restore();                       // fin del «todo menos el hueco»

      aletas(g, f, gx, t, col, br, dl);
      boca(g, f, gx, p, gb, q);
    }
    /* el ojo va FUERA del bloque del cuerpo: la pupila emite por su cuenta,
       así que tiene que pintarse también cuando no hay cuerpo que pintar */
    ojo(g, f, gx, col, nuc, br, sh, p);

    /* la esca también se calla: es lo único que se ve de un rape, así que
       un cuerpo que pase por delante y no la apague no tapa nada.

       La ráfaga entra con la MISMA envolvente que usa el cuerpo (`chispa`),
       o el punto y lo que alumbra se apagarían a ritmos distintos. Mientras
       mastica no se le añade nada: va recogida junto a la boca y se ve con
       lo que queda de la cola de la ráfaga. */
    const ebr = (f.brillo + f.chispa*0.9) * p.brillo * sil;
    if (ebr < 0.003) return;
    /* la barbilla cuelga del cuerpo pero se enciende con el sistema de la
       esca, así que va aquí y no dentro del bloque del cuerpo: tiene que
       verse también cuando el bicho está a oscuras, que es casi siempre */
    barbilla(g, f, gx, p, t, ebr);
    senuelo(g, f, gx, p, ebr);
  },
});
/* ══════════════════════════════════════════════════════════════════
   PEZ LINTERNA
   La presa, y lo que come un rape de verdad. Lleva una hilera de
   fotóforos en el vientre, así que en lo oscuro se lee como una fila de
   puntitos que avanza —distinto del plancton, que es un punto suelto, y
   del copépodo, que es un trazo. Vaga a tirones hasta que ve una esca; se
   descuelga del banco y se va acercando, cada vez más visible porque la
   propia esca lo va alumbrando.
   ══════════════════════════════════════════════════════════════════ */
/* ── EL CARDUMEN ────────────────────────────────────────────────────
   Tres reglas y ninguna más: no chocar, ir a la par y no quedarse solo.
   No hay líder, y ningún pez sabe dónde está el banco ni cuántos son:
   cada uno mira a los que tiene al lado.

   No manda, SUGIERE: lo que sale de aquí se suma al rumbo que el pez ya
   llevaba —el peso `propio`— y después su `vira` dibuja la curva, así que
   el banco se dobla en vez de quebrarse.

   `libre` es si el pez está a lo suyo. Cuando NO lo está —va a una esca, o
   huye— se le quitan las dos reglas de grupo, pero NO la de no chocar: con
   la separación apagada, la mitad de los cebados acaba con otro encima.

   ── POR QUÉ NINGUNO LO CONSIGUE ────────────────────────────────────
   Un banco en el que cada pez ve a todos sus vecinos, todo el rato y sin
   error, CONVERGE: llegan a un rumbo común y a partir de ahí se trasladan
   como una pieza —medido, 0,84 de alineación, o sea cada pez a diecisiete
   grados del rumbo medio de sus vecinos—. Bajar los pesos no lo arregla:
   el efecto no sale del ruido de la medida (está en
   docs/ideas/archivo/idea-cardumen-desorden.md). Lo que lo arregla es que
   la información les llegue MAL, y hay dos formas que además son las de
   un pez de verdad:

     · `reacciona` · NO MIRA TODO EL RATO, y es el que hace el trabajo.
       Mira, decide, y va con esa idea unas décimas de segundo; cuando
       vuelve a mirar, el grupo ya no está donde estaba, así que corrige
       hacia un sitio equivocado. Cuanto más rápido se mueva el grupo, más
       se equivoca. Medido: la alineación baja de 0,84 a 0,51 y el ángulo
       entre un pez y sus vecinos pasa de 17° a 42°.
     · `ciego` · NO VE HACIA ATRÁS. Rompe la reciprocidad: si A se alinea
       con B y B con A, los dos convergen. El golpe sí se siente por
       detrás, que la separación no mira el cono.

       OJO CON ÉSTE: a solas NO HACE NADA —0,88 contra 0,84, dentro del
       ruido—; lo que hace es bajar de 0,51 a 0,42 ENCIMA de `reacciona`.
       Con información al día da igual perder a los de atrás, porque los
       de delante ya traen el acuerdo; con información vieja, el de atrás
       era un canal de corrección más. Se queda por la medida.

   Ninguno de los dos cambia la FORMA del banco: la elongación se queda en
   1,9 con ellos y sin ellos. Lo que arreglan es la sincronía.

   `mira` es si a este pez le toca mirar en este fotograma. Cuando no le
   toca, la separación se aplica igual —esquivar es un reflejo, no una
   decisión— y las dos reglas de grupo se quedan con la idea de antes.

   Es todos contra todos dentro del plano: con las docenas que puebla la
   escena son unos cientos de comparaciones por plano y fotograma. El día
   que haya cientos de peces, aquí entra una rejilla.                */
function cardumen(z, M, L, p, libre, mira){
  const C = p.cardumen;
  if (!C) return;
  const vista = C.vista*M.U, v2 = vista*vista;
  const roce  = (C.roce || 0)*M.U, r2 = roce*roce;
  /* el cono ciego, como coseno y al cuadrado: así el reparto de vecinos se
     hace sin una sola raíz cuadrada, que en un bucle de todos contra todos
     es lo que importa */
  const cc = Math.cos(opt(C.ciego, 0)*0.5), cc2 = cc*cc;
  const vx = Math.cos(z.ang), vy = Math.sin(z.ang);
  let n = 0, jx = 0, jy = 0, ax = 0, ay = 0, ex = 0, ey = 0;
  for (const o of L.cardumen){
    if (o === z) continue;
    const dx = o.x - z.x, dy = o.y - z.y, d2 = dx*dx + dy*dy;
    if (d2 > v2) continue;
    /* NO CHOCAR, y esto va SIEMPRE: sólo con los de dentro del roce, y el
       peso crece como 1/d, no como (1 − d/roce). Con la caída lineal, en un
       grupo denso los vecinos están casi todos dentro del roce y sus
       vectores se anulan entre ellos: la separación desaparece justo cuando
       más falta hace. Con 1/d manda el más cercano, que es lo que hace un
       pez de verdad. */
    if (d2 < r2){
      const d = Math.sqrt(d2) || 1e-4;
      const q = Math.min(8, roce/d - 1);
      ex -= dx/d*q; ey -= dy/d*q;
    }
    if (!mira) continue;
    /* y a éste, ¿lo ve? El de detrás del cono ciego no cuenta para las dos
       reglas de grupo. `proy` es el producto escalar con su rumbo, y
       compararlo al cuadrado contra `cc2*d2` es lo mismo que comparar el
       coseno del rumbo relativo con el del cono, sin la raíz. */
    const proy = dx*vx + dy*vy;
    if (proy < 0 && proy*proy > cc2*d2) continue;
    n++;
    /* JUNTARSE: hacia el centro del grupo, acumulando el vector relativo
       —luego sólo importa la dirección, así que dividir por n sobra—. PERO NO
       CUENTAN LOS QUE ESTÁN DENTRO DEL ROCE: a distancia casi cero el vecino
       ES el centro del grupo, así que la cohesión apunta derecha a él y
       cancela a la separación. La regla buena es «voy hacia el grupo que
       veo, esquivo al que estoy tocando». */
    if (d2 >= r2){ jx += dx; jy += dy; }
    /* IR A LA PAR: la media de los rumbos, como vectores. Promediar los
       ángulos en radianes se rompe al cruzar el ±π —179° y −179° promedian
       0°, o sea justo el contrario. */
    ax += Math.cos(o.ang); ay += Math.sin(o.ang);
  }
  /* Las dos de grupo se normalizan porque lo que aportan es un RUMBO: da
     igual si el centro está a dos cuerpos o a diez. La separación NO,
     porque aporta una URGENCIA: normalizada, la cohesión gana siempre de
     cerca y el banco se cierra en un nudo que deja de ir a la par. */
  let sx = Math.cos(z.angObj)*C.propio, sy = Math.sin(z.angObj)*C.propio;
  if (libre && n){
    /* los pesos van por pez: un banco en el que todos hacen el mismo caso a
       sus vecinos converge a un solo rumbo y deja de fluir */
    const jl = Math.hypot(jx, jy);
    if (jl > 1e-4){ const w = C.junta*(z.kJunta || 1);
                    sx += jx/jl*w;  sy += jy/jl*w; }
    const al = Math.hypot(ax, ay);
    if (al > 1e-4){ const w = C.alinea*(z.kAlinea || 1);
                    sx += ax/al*w; sy += ay/al*w; }
  }
  sx += ex*C.aparta; sy += ey*C.aparta;
  if (sx || sy) z.angObj = Math.atan2(sy, sx);
}

/* LA PANZA, como los tres puntos de la curva que la dibuja. La hilera de
   fotóforos sale de aquí y no de una fórmula suya: escritas por separado se
   despegan en cuanto se toca un número, y es justo lo que pasaba —la hilera
   iba por debajo del canto y los puntos se veían fuera del pez.
   `t` va de 0 en la cola a 1 en el morro; la flexión de la cola entra en el
   primer punto, que es el único que se mueve. */
const PANZA = [[-0.42, 0.07], [0.10, 0.20], [0.50, 0.00]];
const _pz = [0,0];
/* el sitio que le toca a un pez dentro de una silueta impuesta, y con qué
   rumbo. Compartido y consumido en el acto, como los demás de la casa. */
const _fo = [0,0,0];
function panzaPez(t, Lg, cola){
  const mt = 1-t, a = mt*mt, b = 2*mt*t, c = t*t;
  _pz[0] = (a*PANZA[0][0] + b*PANZA[1][0] + c*PANZA[2][0]) * Lg;
  _pz[1] = (a*(PANZA[0][1] + cola*0.05) + b*PANZA[1][1] + c*PANZA[2][1]) * Lg;
  return _pz;
}
/* Dentro del canto, no encima: el punto tiene radio y la panza es fina, así
   que la hilera se mete a `DENTRO` de su profundidad y se queda en el tramo
   donde el cuerpo tiene grosor —en el morro y en la cola no cabe nada. */
const DENTRO = 0.72, FOTO_T = [0.12, 0.88];

A.especie('pezlinterna', {
  luz: true,                    // sus fotóforos también encienden plancton
  presa: true,
  cardumen: true,               // y hace banco con los suyos
  escalaCalidad: true,
  conteo: porReparto,

  /* ── LOS TONOS QUE MANDAN ─────────────────────────────────────
     Uno o dos por pecera, y en `crear` la mayoría se apunta a ellos: con
     un tono por pez y el círculo entero de la paleta salen los cuarenta a
     la vez y el banco se lee como confeti.

     Va en `siembra` y no en `crear` porque el banco se reparte en los
     tres planos y es UN banco: sorteándolo por plano saldrían hasta seis
     tonos mandando.

     Y se sortea cada vez que se puebla en vez de escribirlo en la escena:
     un dominante escrito a mano sería el mismo en todas las sesiones, y
     lo que se pide es una tendencia, no una identidad. */
  siembra(M, p){
    const n = rangoE(opt(p.dominantes, 0));
    if (!(n > 0) || !p.paleta){ p.mandan = null; return; }
    p.mandan = [];
    for (let i=0;i<n;i++) p.mandan.push(M.color(p.paleta));
  },

  crear(M, L, p){
    const Lg = rango(p.largo) * M.U * L.scale;
    const dso = opt(p.desorden, 0);
    /* el desorden de la formación va aparte del del banco: son dos cosas
       distintas —una es cómo nadan solos y otra cómo obedecen— */
    const fdo = opt(p.formaDesorden, 0), fer = opt(p.formaError, 0);
    /* su intervalo entre miradas, sorteado UNA vez: la primera mirada sale
       de él, así que tiene que ser el mismo número */
    const rea = rango((p.cardumen && p.cardumen.reacciona) || 0);
    return {
      /* TENDENCIA, no regla: el resto sigue sorteando de la paleta entera,
         así que entre los dominantes siguen cruzándose peces sueltos de
         cualquier tono. Sin ese resto el banco es monocromo y pierde el
         moteado, que es lo que lo hacía bonito. */
      c: (p.mandan && Math.random() < opt(p.tendencia, 0))
         ? M.elige(p.mandan) : M.color(p.paleta),
      Lg,
      x: rnd(0,M.W), y: rnd(0,M.H),
      /* como emisor es débil y NO es un señuelo: los demás peces linterna no
         deben perseguirse entre ellos */
      rLuz: Lg*p.alcanceLuz, luzI: p.emision, senuelo: false,
      rCuerpo: Lg*opt(p.alcanceCuerpo, 0.7),
      ang: Math.random()*TAU, angObj: Math.random()*TAU,
      vel: 0, prox: rnd(0.5, 4),
      vira: rango(p.vira),
      /* CADA PEZ, UN POCO DISTINTO. Sin esto todos nadan a la misma velocidad
         EXACTA y con los mismos pesos, y entonces el banco se traslada como
         un sólido: la forma que tenga se queda congelada. Lo que deshace eso
         es la cizalla —que unos vayan más rápidos que sus vecinos—, no más
         ruido en el rumbo. `desorden` es cuánto se abre cada número. */
      brio:    1 + rnd(-dso, dso),
      kAlinea: 1 + rnd(-dso, dso)*1.5,
      kJunta:  1 + rnd(-dso, dso)*1.5,
      /* CADA CUÁNTO MIRA A SUS VECINOS, y cuándo le toca la próxima. El
         segundo arranca sorteado dentro del primero y no a 0: naciendo
         todos a cero, los sesenta y ocho miran el mismo fotograma y el
         retraso deja de ser un retraso —vuelve a haber un banco que
         decide a la vez, sólo que a tirones. */
      reacciona: rea,
      proxMira:  Math.random()*rea,
      fase: Math.random()*TAU,
      nFoto: rangoE(p.fotoforos),
      ilum: 0, cebada: false,
      vx:0, vy:0, fx:0, fy:0,
      huida: rango(p.huida), lag: rango(p.lag),
      comido: false, susto: 0,
      /* el pánico de este fotograma y hacia dónde huye: los pone el campo
         `asusta` y los consume el rumbo, después del cardumen */
      panico: 0, huye: 0,
      /* ── SU SITIO SI ALGUIEN LOS FORMA ────────────────────────
         `orden` es un número que NO CAMBIA en toda su vida, y de él sale su
         puesto dentro de una silueta: así el reparto es estable y la forma
         no hierve. Sorteándolo por fotograma, cada uno es un reparto nuevo
         y lo que sale es una nube agitándose. `oy` es el lado que le toca
         si le cae relleno y no contorno. */
      orden: Math.random(), oy: rnd(-1, 1),
      forma: 0, realce: 0,
      /* ── Y LO QUE LE HACE NO IR COMO UN REMACHE ───────────────
         Con el puesto a secas, los sesenta y ocho peces tiran a su casilla
         con la misma fuerza y con el morro clavado en la tangente, y eso
         no es un banco imitando a un pez: es una plantilla. Cinco números
         por pez, sorteados al nacer y suyos para siempre:

           `kPega`  con cuánta gana tira a su sitio: unos llegan enseguida
                    y otros van rezagados todo el rato.
           `errL`   cuánto se equivoca de puesto A LO LARGO del cuerpo:
                    adelantado o retrasado.
           `errT`   y a lo ancho, que va a la mitad —el error transversal
                    desdibuja el contorno mucho más que el longitudinal.
           `errA`   cuánto lleva el morro desviado de la tangente.
           `suelta` a partir de qué fuerza de campo se apunta, y por debajo
                    de qué se suelta. Es lo que hace que ni se formen ni se
                    deshagan todos a la vez, y tiene que llegar ALTO: con
                    un tope de 0,35 la silueta aguanta con los 68 hasta el
                    último segundo de la rampa y luego cae de golpe; con
                    0,77 se descuelgan repartidos. Al que le sale alto sólo
                    se apunta en lo más alto del campo, o sea que participa
                    poco: también eso es un banco.

         Y el error VAGA, no está congelado: con `errVel` y `errFase` cada
         uno recorre despacio una elipse alrededor de su puesto. Congelado,
         la silueta sale con sus defectos clavados y vuelve a parecer
         dibujada, sólo que peor dibujada. */
      /* `apunta` decide si a este pez le toca entrar en una silueta: cada
         travesía sortea un cupo y entran los que lo traen por debajo. Es
         de nacimiento, así que no cambia a medio evento —y los que quedan
         fuera siguen nadando a lo suyo por encima de la forma, que es la
         mitad de lo que la hace parecer una casualidad. */
      apunta:  Math.random(),
      kPega:   1 + rnd(-1, 1)*fdo*0.8,
      errL:    rnd(-1, 1)*fer,
      errT:    rnd(-1, 1)*fer*0.55,
      errA:    rnd(-1, 1)*fdo*0.5,
      errVel:  rnd(0.25, 0.75),
      errFase: Math.random()*TAU,
      suelta:  Math.random()*fdo*1.1,
      tiron: 0, proxNerv: rnd(0, rango(p.cadaNervio || 1)),
      /* tragado: el rape que lo tiene, cuánto lleva dentro y cuánto queda de
         él. mengua 1 es entero, 0 es ya no está. */
      tragado: null, trago: 0, mengua: 1,
    };
  },

  actualiza(z, M, L, p, dt){
    const Lg = z.Lg;

    /* ── TRAGADO ──────────────────────────────────────────────────
       Ya no nada: de él tira la boca. El tirón acelera con el trayecto, el
       bicho se encoge y las quijadas se cierran encima. El destino se lee
       cada frame porque el rape se está lanzando al mismo tiempo. Nunca
       dura más que el bocado.                                       */
    if (z.tragado){
      const f = z.tragado, T = p.trago || 0.45;
      z.trago += dt;
      const u = clamp(z.trago/T, 0, 1);
      const k = Math.min(1, (4 + 14*u)*dt);
      z.x += (f.bocaX - z.x)*k;
      z.y += (f.bocaY - z.y)*k;
      const dm = giroCorto(Math.atan2(f.bocaY - z.y, f.bocaX - z.x), z.ang);
      z.ang += clamp(dm, -9*dt, 9*dt);
      /* cuadrática y no lineal: llega entero y desaparece dentro. Con 1−u
         empezaba a encogerse antes de haber entrado, y entonces no se leía
         tragado, se leía disuelto. */
      z.mengua = 1 - u*u;
      /* y se le sube la luz: dentro de esa boca están la esca recogida y el
         fogonazo, lo más brillante de la pieza. Sin esto la iluminación se
         congelaba en la del último frame libre y el bicho entraba a oscuras. */
      z.ilum += (1.1 - z.ilum) * Math.min(1, 8*dt);
      if (u < 1 && f.ataque > 0) return;   // ni busca, ni huye, ni deriva
      z.tragado = null; f.tragando = null;
      z.comido = true;
    }

    /* se lo han comido: reaparece lejos en vez de borrarlo del array, que
       obligaría al motor a repoblar a media escena */
    if (z.comido){
      z.comido = false; z.mengua = 1; z.trago = 0;
      /* En una caja no hay fuera del que volver: reapareciendo junto al canto,
         el cristal lo pegaba a la pared al fotograma siguiente y el bicho salía
         de la nada a la vista. Dentro y en el cuadrante opuesto: sale a oscuras
         y para cuando se le ve ya está nadando. */
      z.x = z.x < M.W*0.5 ? rnd(M.W*0.55, M.W*0.95) : rnd(M.W*0.05, M.W*0.45);
      z.y = z.y < M.H*0.5 ? rnd(M.H*0.55, M.H*0.95) : rnd(M.H*0.05, M.H*0.45);
      z.vx = z.vy = z.fx = z.fy = 0; z.vel = 0; z.ilum = 0; z.susto = 0;
      z.ang = z.angObj = Math.random()*TAU;
    }

    /* ── EL PÁNICO ────────────────────────────────────────────────
       Alguien ha mordido aquí al lado. No hace falta saber quién: el campo
       trae su centro, así que el rumbo sale de huir de ahí, y ni el pez
       sabe que existen los rapes ni el rape que existe el banco.

       Se LEE aquí, antes de mirar si hay una esca a la vista —`cebada` se
       apaga con el susto, y lo que se tiene que ver es el banco soltando
       la trampa—, pero el rumbo de huida se aplica DESPUÉS del cardumen.
       Ver más abajo: puesto aquí no llegaba a ninguna parte. */
    const sus = M.campo('asusta', z.x, z.y, L.i);
    z.panico = sus ? sus.peso : 0;
    if (z.panico > 0.04){
      z.susto = Math.max(z.susto, z.panico * opt(p.panico, 1.4));
      z.huye  = Math.atan2(z.y - sus.y, z.x - sus.x);
      z.prox  = Math.max(z.prox, 1.6);
    } else z.panico = 0;

    /* ── LE ESTÁN DANDO FORMA ─────────────────────────────────────
       Un campo `forma` trae en `d` el centro, el ángulo y la escala de una
       silueta, y el pez saca SU sitio de su `orden`. No sabe qué silueta
       es ni quién la pone.

       Y va con TIRÓN DE POSICIÓN y no sólo de rumbo. Con rumbo solo la
       forma no cuaja: un pez que vira a 3 rad/s y nada a 0,66 U/s describe
       una órbita alrededor de su sitio, no llega a él, y sesenta órbitas
       son una nube. El tirón es un lerp cuya fuerza sube con el peso del
       campo, así que la silueta cuaja desde el centro hacia fuera. A cambio
       se le baja el nado propio —si no, se pasa de largo. */
    const fm = M.campo('forma', z.x, z.y, L.i);
    /* `cupo` es la fracción del banco que esta travesía admite: al que no
       le toca, el campo no le dice nada */
    z.forma = (fm && fm.d && z.apunta < fm.d.cupo) ? fm.peso : 0;
    /* NI SE APUNTAN NI SE SUELTAN TODOS A LA VEZ. `suelta` es el umbral de
       cada pez, así que al subir el campo se van sumando de uno en uno y al
       bajar se van descolgando igual. Es una línea y es lo que quita de en
       medio los dos momentos más forzados del evento: el banco cuadrándose
       en bloque y la silueta desapareciendo de golpe. */
    if (z.forma > 0.02 + z.suelta){
      const d = fm.d;
      formaObjetivo(d, z, _fo);
      /* EL ERROR DE PUESTO, y vagando. `w` recorre despacio la elipse que
         cada pez describe alrededor de su casilla: longitudinal y
         transversal en contrafase, así que no es un temblor sino una
         deriva. Sin esto los peces se clavan en su sitio exacto y lo que se
         ve es una plantilla; con esto, unos van adelantados, otros
         retrasados, y ninguno está donde «debería». */
      const w = Math.sin(M.t*z.errVel + z.errFase);
      const ca = Math.cos(d.ang), sa = Math.sin(d.ang);
      const eL = z.errL * d.esc * (0.55 + 0.45*w);
      const eT = z.errT * d.esc * (0.55 - 0.45*w);
      const tx = _fo[0] + eL*ca - eT*sa;
      const ty = _fo[1] + eL*sa + eT*ca;
      /* ── HACIA DÓNDE MIRA, Y ESTO ES LO QUE LO HACE CASUAL ───
         De lejos, HACIA SU SITIO: un pez que nada de lado mientras se
         coloca se ve teledirigido, y lo que se tiene que ver es un pez
         yendo a donde va, que resulta que es ahí.

         De cerca, A LO LARGO DEL CONTORNO —es lo que cierra la silueta—, o
         al rumbo si le cayó relleno. Mirando a su sitio también de cerca,
         al llegar se queda sin destino y gira sobre sí mismo.

         Se mezcla entre los dos según lo que le falte (`mezclaAng`).
         `formaCerca` es a qué distancia —en largos de la silueta— se
         considera que ya ha llegado. Y encima, su desvío: una fila de
         peces perfectamente paralelos es lo que más delata la plantilla. */
      const fx = tx - z.x, fy = ty - z.y;
      const fd = Math.hypot(fx, fy) / d.esc;
      const cerca = 1 - clamp(fd/opt(p.formaCerca, 0.2), 0, 1);
      const av = Math.atan2(fy, fx);           // hacia su sitio
      z.angObj = mezclaAng(av, _fo[2], cerca) + z.errA*(0.4 + 0.6*w);
      z.prox = Math.max(z.prox, 0.5);
      /* y cada uno con SU gana, y flojo: lo que cuaja la silueta es el
         tiempo, no la fuerza. Unos llegan enseguida y otros van rezagados
         toda la maniobra. */
      const k = Math.min(1, z.forma*opt(p.formaPega, 2.2)*z.kPega*dt);
      z.x += (tx - z.x)*k;
      z.y += (ty - z.y)*k;
      /* y COGE MÁS COLOR: no cambia de tono —eso daría un salto—, sube lo
         que emite. Se guarda porque lo consume `dibuja`. */
      z.realce = z.forma;
    } else {
      /* fuera de la formación no manda nadie, aunque el campo siga ahí: al
         bajar, cada pez se descuelga en su umbral y las reglas del banco
         vuelven solas. */
      z.forma = 0;
      if (z.realce > 0) z.realce = Math.max(0, z.realce - dt*1.2);
    }

    /* ¿hay una esca a la vista? Sólo señuelos: un pez linterna no persigue a
       otro pez linterna. */
    let cebo = null, md2 = Infinity;
    const R = p.atraccion*M.U;
    for (const o of L.luces){
      if (!o.senuelo) continue;
      const dx = o.x - z.x, dy = o.y - z.y, d2 = dx*dx + dy*dy;
      if (d2 < R*R && d2 < md2){ md2 = d2; cebo = o; }
    }
    z.cebada = !!cebo && !z.susto;

    z.prox -= dt;
    if (z.cebada){
      /* el rumbo apunta al cebo pero el viraje es lento: describe una
         curva, no una recta */
      z.angObj = Math.atan2(cebo.y - z.y, cebo.x - z.x);
    } else if (z.prox <= 0){
      /* cerca del canto el rumbo nuevo se sortea alrededor de «hacia dentro» en
         vez de al azar puro */
      const bb = M.borde(z.x, z.y);
      z.angObj = bb[2] > 0.02
        ? Math.atan2(bb[1], bb[0]) + rnd(-1.1, 1.1)*(1 - bb[2]*0.5)
        : Math.random()*TAU;
      z.prox = rango(p.rumbo);
    }
    /* El banco. Una esca a la vista o un susto lo rompen, pero ni así
       puede atravesar a los demás: se llama siempre y es `cardumen` quien
       decide qué reglas le tocan. Mientras la forma manda, el banco no
       —las tres reglas y una silueta impuesta se pelean y gana el grupo—;
       por debajo de 0,3 vuelve, y es lo que hace que deshacerse se vea.

       `mira` es si le toca replantearse el grupo en este fotograma. Se
       llama IGUAL cuando no le toca: esquivar al de al lado no es una
       decisión que se pueda posponer. */
    z.proxMira -= dt;
    const mira = z.proxMira <= 0;
    if (mira) z.proxMira = z.reacciona;
    if (z.forma < 0.3) cardumen(z, M, L, p, !z.cebada && !z.susto, mira);

    /* ── Y AHORA SÍ, HUIR ─────────────────────────────────────────
       Después del cardumen y no antes: `aparta` acumula un vector por
       vecino dentro del roce, y en un banco denso le pasa por encima a
       cualquier rumbo puesto antes.

       Se MEZCLA con lo que dijo el grupo en vez de sustituirlo. Así el que
       tiene el campo encima huye casi en línea recta y el del canto del
       radio apenas se desvía, y en ningún caso se apaga la separación: el
       banco se abre sin anudarse. */
    if (z.panico > 0.04) z.angObj = mezclaAng(z.angObj, z.huye, z.panico*0.85);

    /* ── NERVIO ───────────────────────────────────────────────────
       El crucero va suavizado —rampa de casi medio segundo—, así que un
       tirón metido por ahí sale blando. Éste se suma aparte y se apaga
       solo, y de paso tuerce el rumbo: un pez pequeño no es que se mueva
       más rápido, es que cambia de idea más veces.

       EN FORMACIÓN NO SE CALLA, SE BAJA: apagado del todo los peces quedan
       clavados como remaches. Con `formaCalma` queda un resto y la silueta
       TIEMBLA. */
    if (p.nervio){
      const cal = 1 - z.forma*opt(p.formaCalma, 1);
      z.proxNerv -= dt;
      if (z.proxNerv <= 0){
        z.proxNerv = rango(p.cadaNervio || 1);
        z.tiron = rango(p.nervio)*M.U*cal;
        z.angObj += rnd(-1,1)*(p.desvio || 0)*cal;
      }
      z.tiron *= Math.pow(0.03, dt);
    }

    const dd = giroCorto(z.angObj, z.ang);
    const giro = z.vira * (z.susto ? 3 : 1) * dt;
    z.ang += clamp(dd, -giro, giro);

    z.susto = Math.max(0, z.susto - dt);
    const objVel = M.U * (z.susto ? p.velSusto
                                  : (z.cebada ? p.velCebada : p.vel) * (z.brio || 1))
                  /* y NO dejan de nadar: al 85 % de amortiguación se
                     quedaban colgados de su casilla como boyas. Con 0,55
                     siguen empujando a lo suyo y el tirón sólo los sesga,
                     que es lo que hace que parezcan nadando por su cuenta
                     y coincidiendo. */
                  * (1 - z.forma*0.55);
    z.vel += (objVel - z.vel) * Math.min(1, 2.4*dt);

    const e = M.empuje(z.x, z.y, Lg*0.9);
    if (e[2] > 0.3){ z.susto = Math.max(z.susto, 1.2); z.angObj = Math.atan2(e[1], e[0]); }
    reaccionDedo(z, M, p, e, dt);
    /* vx,vy es sólo el empujón del dedo y se frena rápido: el nado va aparte,
       por z.ang y z.vel, y no debe heredar esa frenada */
    const fr = Math.pow(0.12, dt);
    z.vx = (z.vx + z.fx*dt)*fr;
    z.vy = (z.vy + z.fy*dt)*fr;
    reaccionBorde(z, M, p, z.x, z.y, dt);

    const nado = z.vel + z.tiron;
    avanza(z, M, L, dt, Math.cos(z.ang)*nado, Math.sin(z.ang)*nado);
    /* éste sí sabe girar: se le pone el rumbo hacia dentro y su `vira` dibuja
       la curva, así que la media vuelta se ve como una decisión */
    const par = M.envuelve(z);
    if (par[0] || par[1]){
      z.angObj = Math.atan2(par[1] || Math.sin(z.ang), par[0] || Math.cos(z.ang));
      z.prox = rango(p.rumbo);
    }

    /* cuanto más cerca del cebo, más se le ve: la propia trampa lo va sacando
       de la oscuridad */
    const ob = cebo
      ? clamp(1.25/(1 + (Math.sqrt(md2)/(M.U*p.revelado))**2), 0, 1) : 0;
    z.ilum += (ob - z.ilum) * Math.min(1, 7*dt);
  },

  dibuja(z, M, L, p, g){
    const Lg = z.Lg, sh = L.sharp;
    /* mengua < 1 sólo mientras lo están tragando: se encoge hacia la boca y
       pierde luz, pero no del todo —apagándose antes de entrar no se ve
       entrar. */
    const men = z.mengua, apaga = (0.35 + 0.65*men)*(1 - silencio(M, z.x, z.y, L));
    if (apaga < 0.02) return;
    /* `realce` es lo que le sube el evento que lo ordena: el banco formado
       no cambia de color —eso daría un salto de tono— sino que emite más */
    const rl = 1 + z.realce*opt(p.formaBrillo, 0);
    const br = (p.base + z.ilum) * p.brillo * apaga * rl;
    /* LO QUE EMITE ÉL, que no es lo mismo que lo que le llega. `br` es la
       luz recibida y va de 0,12 a 1,5 según lo que tenga al lado —trece
       veces—; esto es su hilera de fotóforos, que está encendida igual
       cuando no le da nada. La diferencia era justo el problema del que se
       quejaba el cuerpo negro: los fotóforos se ven siempre y el cuerpo
       sólo cuando algo lo alumbraba, así que un pez a solas era una fila
       de puntos sobre nada. */
    const propia = p.foto * (0.75 + 0.45*z.ilum) * apaga * rl;
    const cola = Math.sin(M.t*p.aleteo + z.fase);

    g.save();
    g.translate(z.x, z.y);
    g.rotate(z.ang);            // +x es hacia donde nada
    if (men < 1) g.scale(Math.max(0.06, men), Math.max(0.06, men));

    /* El cuerpo. Se pinta siempre que haya ALGO que pintar, y ahora eso
       incluye su propio blanco: con la guarda en `br` a solas, un pez al
       que no le da nada se saltaba el bloque entero y no había forma de
       que se le viera la silueta. */
    if (br > 0.02 || opt(p.blanco, 0)*propia > 0.004){
      g.beginPath();
      g.moveTo(Lg*0.50, 0);
      g.quadraticCurveTo(Lg*0.10, -Lg*0.20, -Lg*0.42, -Lg*0.07 + cola*Lg*0.05);
      g.lineTo(-Lg*0.62, -Lg*0.16 + cola*Lg*0.13);   // caudal
      g.lineTo(-Lg*0.52,  0      + cola*Lg*0.09);
      g.lineTo(-Lg*0.62,  Lg*0.16 + cola*Lg*0.13);
      g.lineTo(PANZA[0][0]*Lg, (PANZA[0][1] + cola*0.05)*Lg);
      g.quadraticCurveTo(PANZA[1][0]*Lg, PANZA[1][1]*Lg,
                         PANZA[2][0]*Lg, PANZA[2][1]*Lg);
      g.closePath();
      /* `cuerpo`, `blanco` y `canto` salen de la escena porque son el mando
         de lo NEGRO que se ve un pez: escritos a mano aquí no se pueden
         tocar sin abrir el catálogo. Los tres multiplican a `br`, que es la
         luz que de verdad le llega, así que a oscuras siguen sin encender
         nada.

         `cuerpo` es cuánto tinte coge el relleno —el degradado que va de
         `mid` en el morro a `glow` en la cola, o sea el color propio del
         pez. */
      const tin = opt(p.cuerpo, 1);
      const gb = g.createLinearGradient(Lg*0.5, 0, -Lg*0.6, 0);
      gb.addColorStop(0.00, rgba(z.c.mid,  Math.min(1, 0.42*br*tin)));
      gb.addColorStop(0.55, rgba(z.c.glow, Math.min(1, 0.20*br*tin)));
      gb.addColorStop(1.00, rgba(z.c.glow, Math.min(1, 0.04*br*tin)));
      g.fillStyle = gb; g.fill();
      /* Y `blanco` ES UN POCO DE `core` ENCIMA, plano y en una SEGUNDA
         pasada. Metido como un tramo más del degradado de arriba no vale:
         entre dos tramos el alfa interpola, así que un tramo claro entre
         dos oscuros deja una banda apagada cruzando el cuerpo. Sumando
         encima —el plano va en `lighter`— el cuerpo coge el blanco sin
         perder su tinte. El path sigue puesto de la pasada anterior, así
         que esto no vuelve a trazarlo.

         VA CON `propia` Y NO CON `br`, y ahí está la gracia: es la carne
         del bicho alumbrada por SUS PROPIOS FOTÓFOROS —que es lo que hace
         un mictófido de verdad, llevarlos en el vientre—, no luz que le
         llegue de fuera. Atado a `br` no servía para nada: en un pez al
         que no le da nada `br` vale 0,12, así que el blanco salía por
         debajo del ruido del dither y seguía viéndose negro, que era
         exactamente la queja. Con `propia` se ve siempre, y sólo sube un
         75 % cuando además lo alumbran.

         Una pasada de relleno más por pez: cronometrado con los 59 de la
         pecera, 0,13 ms de fotograma, o sea dos microsegundos por bicho.
         El path ya está trazado y es el gasto de rellenarlo otra vez. */
      const bl = opt(p.blanco, 0);
      if (bl > 0.002){
        g.fillStyle = rgba(z.c.core, Math.min(1, bl*propia));
        g.fill();
      }
      g.strokeStyle = rgba(z.c.core, Math.min(1, opt(p.canto, 0.34)*br*sh));
      g.lineWidth = Math.max(0.4, Lg*0.022);
      g.stroke();
      /* el ojo, desproporcionado como el de un mictófido de verdad */
      g.fillStyle = rgba(z.c.core, 0.70*br*sh);
      g.beginPath(); g.arc(Lg*0.33, -Lg*0.05, Math.max(0.6, Lg*0.055), 0, TAU); g.fill();
    }

    /* LOS FOTÓFOROS: esto sí se ve siempre, y es lo único que se ve de lejos.
       Una hilera en el vientre, con brillos desiguales. */
    const n = z.nFoto, bfo = propia;
    for (let i=0;i<n;i++){
      /* del morro a la cola, que es el orden en el que iban */
      const t = FOTO_T[1] - (FOTO_T[1]-FOTO_T[0])*reparte(i, n);
      const pz = panzaPez(t, Lg, cola);
      const fx = pz[0], fy = pz[1]*DENTRO;
      const pa = bfo * (0.55 + 0.45*Math.sin(M.t*1.7 + i*1.9 + z.fase));
      /* y el punto tampoco puede pasar del hueco que le queda hasta el
         canto, así que la hilera se afina hacia el morro y hacia la cola
         —que es como la lleva un mictófido de verdad. */
      const rr = Math.min(Lg*0.035, pz[1] - fy);
      pintaHalo(g, M, z.c, fx, fy, rr*5, pa*0.55);
      g.fillStyle = rgba(z.c.core, Math.min(1, pa));
      g.beginPath(); g.arc(fx, fy, rr, 0, TAU); g.fill();
    }
    g.restore();
  },
});

/* ══════════════════════════════════════════════════════════════════
   EVENTOS
   Lo que le pasa a la escena cada tanto. Viven aquí y no en un archivo
   aparte para reutilizar `mancha`, `rgba` y los rangos.

   Los buenos apenas dibujan: en una escena aditiva no se puede pintar una
   masa oscura —sumar nunca oscurece—, así que un cuerpo enorme es una
   región donde lo que había se calla. Se lee el volumen por el hueco.
   ══════════════════════════════════════════════════════════════════ */

/* ── EL CONTAGIO ────────────────────────────────────────────────────
   No un fogonazo simultáneo: una reacción en cadena. El evento no dibuja
   NADA —empuja un anillo de encendido y la luz que se ve es el propio
   plancton prendiéndose, así que la onda va por donde hay plancton y su
   frente se lee cruzando el agua.                                   */
A.evento('contagio', {
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

/* ── EL VISITANTE ───────────────────────────────────────────────────
   Algo grande cruza el plano del fondo y no vuelve. No emerge de nada, no
   persigue nada y no reacciona a nada: eso es un evento y no un bicho.

   Es un poliqueto: una cadena de cuentas con halo por el lomo —el halo
   tiene que ser bastante más ancho que la separación o se cuentan una a
   una y parece un collar— más lo que lo saca de ser un gusano de bolitas:
   el espinazo que las une, un par de parapodios por segmento que remando
   van una fase por detrás de la ondulación del cuerpo, dos antenas y un
   filamento de cola. Todo son puntos y trazos de luz, que es el único
   vocabulario que tiene esta pieza.

   ── Y NO PASA DOS VECES EL MISMO ────────────────────────────────────
   Lo que se sortea por travesía no es sólo el tamaño, son las
   PROPORCIONES, que es lo que hace que parezca otro animal y no el mismo
   más grande: ver `merma`, `panza`, `cuentas` y `variedad` en la escena. */
/* la gana con la que sale un apéndice en ESTA travesía. Asimétrico a
   propósito, porque lo que hace falta es que con `variedad` alta alguna
   travesía se quede a 0: un poliqueto sin parapodios ya es otro animal. */
const apendice = v => Math.max(0, 1 + rnd(-1.4, 1)*(v || 0));

/* un punto del cuerpo, su normal y las dos puntas de las antenas. Fuera
   del `dibuja` como el resto de los del fichero. */
const _vsP = [0,0], _vsN = [0,0], _ant = [0,0,0,0];

A.evento('visitante', {
  exclusivo: false,
  cada: [45, 110], primero: [15, 40],
  prueba: { cruce: [22, 34], cuentas: [18, 40], largo: [0.30, 0.55],
            onda: [0.045, 0.115], grosor: [0.40, 0.78], brillo: 0.30,
            merma: [0.18, 0.70], panza: [0, 0.42], variedad: 0.75, plano: 0,
            patas: 0.9, antenas: 1.5, cola: 1.6 },
  arranca(M, p){
    const v = opt(p.variedad, 0);
    return {
      dir: Math.random() < 0.5 ? 1 : -1,
      dur:   rango(p.cruce),
      y:     rnd(M.H*0.22, M.H*0.80),
      amp:   M.H*rango(p.onda),
      largo: M.W*rango(p.largo),
      nOnda: rnd(2.6, 4.2), vel: rnd(0.45, 0.70),
      /* `n` se sortea aquí y no en la escena a secas porque con el largo ya
         sorteado lo que cambia es la SEPARACIÓN entre cuentas. Tope por
         abajo a 6, que con menos no hay cadena. */
      n:     Math.max(6, rangoE(p.cuentas)|0),
      base:  M.U*rango(p.grosor),
      merma: rango(p.merma || 0.5),
      panza: rango(p.panza || 0),
      kPatas: apendice(v), kAntenas: apendice(v), kCola: apendice(v),
      c: M.color(p.paleta),
    };
  },
  actualiza(e, M, p){ return e.t < e.dur; },
  dibuja(e, M, p, g){
    const u = e.t/e.dur;
    const N = e.n, span = M.W + e.largo*2;
    const headX = e.dir > 0 ? -e.largo + u*span : M.W + e.largo - u*span;
    const fade = Math.sin(u*Math.PI);          // entra y sale con un seno
    const base = e.base;
    const br = p.brillo*fade;
    if (br < 0.004) return;
    /* la gana de cada apéndice EN ESTA TRAVESÍA: la de la escena es el
       tope, y `variedad` es lo que la abre bicho a bicho */
    const gPatas   = p.patas   * e.kPatas;
    const gAntenas = p.antenas * e.kAntenas;
    const gCola    = p.cola    * e.kCola;

    /* el punto `s` del cuerpo, 0 en la cabeza y 1 en la cola. La ondulación
       crece hacia atrás: la cabeza marca el rumbo y la cola lo obedece. */
    const pt = (s) => {
      _vsP[0] = headX - e.dir*s*e.largo;
      _vsP[1] = e.y + Math.sin(s*e.nOnda + e.t*e.vel)*e.amp*(0.35 + s*0.65);
      return _vsP;
    };
    /* la normal del cuerpo en `s`, por diferencias finales: la analítica de
       esta curva es fácil de escribir y fácil de desincronizar del `pt` de
       arriba, y entonces las patas salen del sitio equivocado. */
    const nrm = (s) => {
      const h = 0.01;
      const a = pt(Math.max(0, s-h)), ax = a[0], ay = a[1];
      const b = pt(Math.min(1, s+h)), bx = b[0], by = b[1];
      const dx = bx-ax, dy = by-ay, d = Math.hypot(dx, dy) || 1;
      _vsN[0] = -dy/d; _vsN[1] = dx/d;
      return _vsN;
    };
    /* EL PERFIL, y es lo que de verdad cambia de bicho a bicho. `merma`
       adelgaza hacia la cola —a 0,18 es un tubo, a 0,70 un cono— y `panza`
       le mete un bulto con el máximo a un 37 % del morro, que es donde lo
       tiene un huso. Con `panza` a 0 sale el cono de siempre. De aquí salen
       también el radio de las cuentas y el largo de los parapodios, así que
       el bicho engorda entero y no sólo por el espinazo. */
    const grosor = s => base * (1 - s*e.merma)
                        * (1 + e.panza*Math.sin(Math.PI*Math.pow(s, 0.7)));

    /* EL ESPINAZO, primero y flojo: es lo que hace que la fila de cuentas
       se lea como un cuerpo y no como un collar. */
    g.strokeStyle = rgba(e.c.mid, Math.min(1, 0.22*br));
    g.lineWidth = base*0.9;
    g.beginPath();
    for (let i=0;i<N;i++){
      const q = pt(i/(N-1));
      i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]);
    }
    g.stroke();

    /* LOS PARAPODIOS. Un par por segmento, y van UNA FASE POR DETRÁS de la
       ondulación del cuerpo: es lo que se lee como remar en vez de como
       flecos pegados. Se saltan la cabeza y la punta de la cola, donde un
       poliqueto no los tiene. */
    if (gPatas > 0.01){
      g.strokeStyle = rgba(e.c.mid, Math.min(1, 0.30*br));
      g.lineWidth = Math.max(0.5, base*0.30);
      g.beginPath();
      for (let i=0;i<N;i++){
        const s = i/(N-1);
        if (s < 0.06 || s > 0.94) continue;
        const q = pt(s), qx = q[0], qy = q[1];
        const n = nrm(s), nx = n[0], ny = n[1];
        /* el remo: la fase retrasada da el barrido, y el largo sigue al
           grosor del cuerpo, así que se acortan hacia la cola */
        const rem = Math.sin(s*e.nOnda + e.t*e.vel - 0.9);
        const l = grosor(s)*gPatas*(1.7 + 0.9*rem);
        const sesgo = -e.dir*grosor(s)*0.5*rem;   // se echan hacia atrás
        for (const lado of [1, -1]){
          g.moveTo(qx, qy);
          g.lineTo(qx + nx*l*lado + sesgo, qy + ny*l*lado);
        }
      }
      g.stroke();
    }

    /* LAS CUENTAS, que es lo que de verdad se ve de lejos */
    for (let i=0;i<N;i++){
      const s = i/(N-1);
      const q = pt(s), x = q[0], y = q[1];
      const r = grosor(s);
      /* las impares un poco más chicas: el cuerpo se lee segmentado en vez
         de como un tubo de cuentas iguales */
      const seg = (i & 1) ? 0.72 : 1;
      const R = r*6.5*seg, cola = 1 - s*0.45;
      pintaHalo(g, M, e.c, x, y, R, br*cola*seg);
      g.fillStyle = rgba(e.c.core, Math.min(1, br*0.70*cola*seg));
      g.beginPath(); g.arc(x, y, r*0.42*seg, 0, TAU); g.fill();
    }

    /* LA CABEZA: dos antenas por delante del morro, abiertas en V. Es lo
       único que declara por dónde va, y sin ellas el bicho es reversible. */
    if (gAntenas > 0.01){
      const q = pt(0), hx = q[0], hy = q[1];
      const n = nrm(0), nx = n[0], ny = n[1];
      const l = base*gAntenas*2.2;
      const vai = Math.sin(e.t*e.vel*1.7)*0.30;
      g.strokeStyle = rgba(e.c.mid, Math.min(1, 0.34*br));
      g.lineWidth = Math.max(0.5, base*0.26);
      /* la punta de cada antena se calcula UNA vez y se guarda: la quieren
         el trazo y el punto de luz de abajo, y tener la fórmula escrita
         dos veces es la manera de que un día se despeguen y la luz deje de
         estar en la punta de la antena. */
      g.beginPath();
      for (let k=0;k<2;k++){
        const lado = k ? -1 : 1;
        _ant[k*2]   = hx - e.dir*l*0.85 + nx*l*0.45*lado;
        _ant[k*2+1] = hy + ny*l*0.45*lado + vai*l*0.25*lado;
        g.moveTo(hx, hy);
        g.quadraticCurveTo(hx - e.dir*l*0.5, hy + ny*l*0.18*lado,
                           _ant[k*2], _ant[k*2+1]);
      }
      g.stroke();
      /* y la punta de cada antena enciende, como la barbilla del rape */
      const pr = Math.max(0.6, base*0.34);
      g.fillStyle = rgba(e.c.core, Math.min(1, 0.55*br));
      g.beginPath();
      for (let k=0;k<2;k++){
        const ex = _ant[k*2], ey = _ant[k*2+1];
        g.moveTo(ex + pr, ey);
        g.arc(ex, ey, pr, 0, TAU);
      }
      g.fill();
    }

    /* Y EL FILAMENTO DE LA COLA, que se apaga antes de acabar: un cuerpo
       que termina en seco se lee cortado. */
    if (gCola > 0.01){
      const q = pt(1), tx = q[0], ty = q[1];
      const n = nrm(1), nx = n[0], ny = n[1];
      const l = base*gCola*4;
      const cx = tx + e.dir*l*0.45 + nx*l*0.5;
      const cy = ty + ny*l*0.5;
      const fx = tx + e.dir*l, fy = ty + Math.sin(e.t*e.vel*1.3)*l*0.35;
      const gr = g.createLinearGradient(tx, ty, fx, fy);
      gr.addColorStop(0.00, rgba(e.c.mid, Math.min(1, 0.26*br)));
      gr.addColorStop(1.00, rgba(e.c.mid, 0));
      g.strokeStyle = gr;
      g.lineWidth = Math.max(0.4, base*0.22);
      g.beginPath();
      g.moveTo(tx, ty);
      g.quadraticCurveTo(cx, cy, fx, fy);
      g.stroke();
    }
  },
});


/* ── EL LEVIATÁN ────────────────────────────────────────────────────
   Enorme y LEJOS, que no es lo mismo que grande en pantalla: el tamaño no
   lo da el encuadre, lo da la distancia —difuso, lento y con más detalle
   del que se llega a resolver.

   NO SE DIBUJA: se calla lo que hay. El cuerpo es una fila de campos
   `apaga` con el perfil de un animal, y un campo `apaga` además oscurece
   el agua (ver pintaSombras en motor.js), que es lo único que hace que una
   masa oscura se pueda leer en una escena aditiva.

   Lo que lo hace amenazante no es el tamaño, son tres cosas:

   1 · ES LARGO Y DELGADO, no una ballena: el alto que ocupa lo llena la
       ONDULACIÓN y no el grosor, y lo que barre esa banda es el latigazo.
   2 · LA ONDA VIAJA. La fase avanza con el tiempo, así que recorre el
       cuerpo de la cabeza a la cola. Fijándola al nacer, el cuerpo es una
       banana rígida deslizándose de lado.
   3 · LA CABEZA MANDA Y NO ONDULA. La onda se amortigua hacia el morro,
       así que el cráneo va estable mientras el cuerpo late detrás, y
       avanza a EMBESTIDAS, con el empuje sincronizado con el coletazo.

   El perfil: morro romo, cráneo ancho, estrangulación de cuello, hombros y
   una cola que se afila hasta casi nada. La cresta dorsal va en campos
   aparte, por encima del lomo, así que sierra el canto de arriba sin tocar
   la panza. Sus medidas están en la escena. */
const _lvQ = [0,0];
A.evento('leviatan', {
  exclusivo: true,
  cada: [150, 330], primero: [45, 120],
  prueba: { largo: [0.72, 0.86], grosor: [0.086, 0.108], onda: [0.155, 0.185],
            ondas: [1.6, 2.4], velOnda: [0.45, 0.75], embestida: 0.55,
            vel: [0.5, 0.9], banda: [0.12, 0.88],
            rumbo: [-0.22, 0.22], cadaRumbo: [9, 20], velRumbo: 0.25,
            hondura: [0.94, 1.0], filo: 2.2, penumbra: 1.3, segmentos: 22,
            espinas: 10, cresta: 0.55,
            brillo: 0.32, fotoforos: 11, brilloOjo: 2.0,
            brilloLomo: 0.35, brilloEspinas: 1.4, plano: 0 },
  arranca(M, p){
    const dir = Math.random() < 0.5 ? 1 : -1;
    /* EL RUMBO. `base` es el lado por el que cruza y `ang` el rumbo real,
       que se va apartando de la horizontal muy poco y muy despacio. El
       cuerpo se orienta con él —no sólo el avance—, así que el bicho cruza
       de verdad en diagonal en vez de deslizarse de lado. */
    const base = dir > 0 ? 0 : Math.PI;
    const ang = base + rango(p.rumbo || 0);
    return {
      dir, base, ang, angObj: ang,
      angProx: rango(p.cadaRumbo || [10, 20]),
      largo:  M.W * rango(p.largo),
      /* `grosor` es el SEMIgrosor del cuerpo y `onda` la amplitud de la
         ondulación: entre los dos salen el tercio de alto que ocupa */
      grosor: M.H * rango(p.grosor),
      onda:   M.H * rango(p.onda),
      k:      TAU * rango(p.ondas),
      vOnda:  rango(p.velOnda),
      /* EL MORRO ARRANCA EN EL CANTO: `x` es el morro y el cuerpo va
         DETRÁS, así que arrancarlo a un largo de distancia mete un cuerpo
         entero de espera muerta antes de que asome nada. */
      x:      dir > 0 ? -M.U : M.W + M.U,
      /* la franja por la que nada: la declara la escena y la usan los DOS
         sitios que la necesitan —el sorteo de aquí y el tope de más
         abajo—, así que no se pueden desalinear. */
      y:      rango(p.banda || [0.12, 0.88]) * M.H,
      vel:    rango(p.vel) * M.U,
      hondura: rango(p.hondura),
      fase:   Math.random()*TAU,
      /* UN COLOR POR TRAVESÍA, y lo usa TODO lo que emite: el ojo, el hilo
         de la cresta, los fotóforos y el filo de la caudal. La escena le da
         su propio espectro —rojo o morado—, así que la bestia no comparte
         paleta con el agua: es lo único que no es de aquí. */
      c:      M.color(p.paleta),
    };
  },
  actualiza(e, M, p, dt){
    /* LA ONDA VIAJA: esto es lo que separa un bicho de un recorte */
    e.fase += e.vOnda * dt;
    /* el rumbo se replantea cada tantos segundos alrededor de la
       horizontal, así que a lo largo de la travesía se compensa: una
       diagonal sostenida se saldría del cuadro antes de cruzar. */
    e.angProx -= dt;
    if (e.angProx <= 0){
      e.angObj  = e.base + rango(p.rumbo || 0);
      e.angProx = rango(p.cadaRumbo || [10, 20]);
    }
    e.ang += (e.angObj - e.ang) * Math.min(1, opt(p.velRumbo, 0.25)*dt);
    const ca = Math.cos(e.ang), sa = Math.sin(e.ang);
    /* y empuja: el avance late con el coletazo en vez de ser constante */
    const coletazo = Math.pow(Math.max(0, Math.sin(e.fase)), 2);
    const v = e.vel * (1 + opt(p.embestida, 0)*coletazo);
    e.x += ca * v * dt;
    /* la vertical, contenida a la misma franja: el cuerpo ondula ±`onda`
       alrededor de `y`, así que si `y` se va al canto media bestia se sale
       del cuadro */
    const bd = p.banda || [0.12, 0.88];
    e.y = clamp(e.y + sa*v*dt, M.H*bd[0], M.H*bd[1]);
    /* se va cuando ha salido la COLA, que va a un largo por detrás del
       morro EN EL SENTIDO DEL RUMBO */
    const colaX = e.x - e.largo*ca;
    if (ca > 0 ? colaX > M.W : colaX < 0) return false;

    const n = Math.max(6, p.segmentos|0);
    const plano = opt(p.plano, 0);
    const filo = p.filo || 1;
    /* `penumbra` agranda la elipse: su máximo cae en el espinazo, así que
       sin agrandarla la silueta de verdad queda donde el apagado ya se
       desvanece. */
    const pen = opt(p.penumbra, 1);
    const paso = e.largo/n;

    /* EL CUERPO */
    for (let i=0;i<n;i++){
      const s = (i+0.5)/n;
      const q = levPunto(e, s, _lvQ);
      const semi = e.grosor*levPerfil(s);
      const r = paso*1.25*pen;
      M.campos.push({ tipo:'apaga', plano, x:q[0], y:q[1],
                      r, ky: Math.max(0.05, semi*pen/r), rot: levAngulo(e, s),
                      fuerza: e.hondura, filo });
    }
    /* LA CRESTA. Espinas por encima del lomo, en campos aparte para que
       sierren el canto de arriba y dejen la panza lisa. Desiguales: una
       sierra regular se lee como decoración. Dónde va cada una lo dicen
       `levEspina` y `levAlta`, que comparte con `dibuja`. */
    const ne = p.espinas|0;
    for (let i=0;i<ne;i++){
      const s = levEspina(i, ne);
      const q = levPunto(e, s, _lvQ), ang = levAngulo(e, s);
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      const semi = e.grosor*levPerfil(s);
      const alta = levAlta(i) * opt(p.cresta, 0);
      const h = semi*(1 + alta);
      M.campos.push({ tipo:'apaga', plano,
                      x: q[0] - nx*h*0.55, y: q[1] - ny*h*0.55,
                      r: paso*0.55*pen, ky: Math.max(0.05, h*0.9*pen/(paso*0.55*pen)),
                      rot: ang, fuerza: e.hondura*0.9, filo });
    }
    /* LA QUIJADA, un lóbulo bajo el cráneo: es lo que convierte el morro
       en una cabeza con boca y no en una punta. */
    const qj = levPunto(e, 0.085, _lvQ), aj = levAngulo(e, 0.085);
    const semiJ = e.grosor*levPerfil(0.085);
    M.campos.push({ tipo:'apaga', plano,
                    x: qj[0] + Math.sin(aj)*semiJ*0.75,
                    y: qj[1] - Math.cos(aj)*semiJ*0.75,
                    r: e.largo*0.055*pen, ky: 0.85,
                    rot: aj + e.dir*0.25, fuerza: e.hondura, filo });
    /* Y LA CAUDAL, ahorquillada: dos lóbulos altos al final */
    const qc = levPunto(e, 0.985, _lvQ), ac = levAngulo(e, 0.985);
    const nxc = -Math.sin(ac), nyc = Math.cos(ac);
    for (const lado of [1, -1])
      M.campos.push({ tipo:'apaga', plano,
                      x: qc[0] + nxc*e.onda*0.30*lado,
                      y: qc[1] + nyc*e.onda*0.30*lado,
                      r: e.largo*0.045*pen, ky: 2.6,
                      rot: ac + 0.35*lado, fuerza: e.hondura*0.85, filo });
    return true;
  },
  dibuja(e, M, p, g){
    const br = p.brillo;
    if (!(br > 0.002)) return;
    const N = 40;

    /* ── EL HILO DE LA PANZA ──────────────────────────────────────
       EL CANTO DE ABAJO, y no el de arriba: el hilo va por el lado
       +normal del eje y las espinas del campo por el −normal, o sea que lo
       encendido es la panza y lo serrado y oscuro es el lomo.

       Es el detalle de color que mejor funciona de la bestia —un filo de
       luz por debajo hace que el hueco se lea como un cuerpo con panza y
       no como una mancha— y se apaga en los dos extremos, así que no se ve
       dónde empieza ni acaba. Sin `pico` porque la panza es LISA: serrar
       los dos cantos deja al bicho con forma de hoja de sierra. */
    const bx = [], by = [];
    for (let i=0;i<=N;i++){
      const s = i/N, q = levPunto(e, s, _lvQ), a = levAngulo(e, s);
      const semi = e.grosor*levPerfil(s);
      bx.push(q[0] - Math.sin(a)*semi);
      by.push(q[1] + Math.cos(a)*semi);
    }
    const gr = g.createLinearGradient(bx[0], by[0], bx[N], by[N]);
    gr.addColorStop(0.00, rgba(e.c.mid, 0));
    gr.addColorStop(0.18, rgba(e.c.mid, 0.55*br));
    gr.addColorStop(0.66, rgba(e.c.mid, 0.26*br));
    gr.addColorStop(1.00, rgba(e.c.mid, 0));
    g.strokeStyle = gr;
    g.lineWidth = Math.max(0.8, M.U*0.05);
    g.beginPath();
    for (let i=0;i<=N;i++) i ? g.lineTo(bx[i], by[i]) : g.moveTo(bx[i], by[i]);
    g.stroke();

    /* ── Y EL LOMO, QUE ES EL OTRO CANTO ─────────────────────────
       El de arriba no tenía nada de color: sólo la sierra oscura de los
       campos. Dos cosas, las dos flojas —lo que se pide es que la bestia
       siga siendo un hueco, no que se le dibuje el lomo—:

       1 · UN VELO ANCHO siguiendo el diente de sierra, en `glow`, que es
           el color más hondo de la entrada de paleta. Trazo gordo y alfa a
           la quinta parte del hilo de la panza: no es un filo, es que por
           encima del lomo el agua tiene un color que no es el suyo.
       2 · LA PUNTA DE CADA ESPINA encendida, y en las espinas DE VERDAD
           —las de `levEspina` y `levAlta`, las mismas que ponen los
           campos—. El halo va más chico que el de un fotóforo.

       Los dos multiplican a `brillo`, así que el mando de «leviatán · luz»
       a 0 los apaga con todo lo demás. */
    const ne = p.espinas|0, cre = opt(p.cresta, 0);
    const bl = br * opt(p.brilloLomo, 0);
    if (bl > 0.002){
      const lx = [], ly = [];
      for (let i=0;i<=N;i++){
        const s = i/N, q = levPunto(e, s, _lvQ), a = levAngulo(e, s);
        const semi = e.grosor*levPerfil(s)*levCresta(s, ne, cre);
        lx.push(q[0] + Math.sin(a)*semi);
        ly.push(q[1] - Math.cos(a)*semi);
      }
      const gl = g.createLinearGradient(lx[0], ly[0], lx[N], ly[N]);
      gl.addColorStop(0.00, rgba(e.c.glow, 0));
      gl.addColorStop(0.24, rgba(e.c.glow, 0.30*bl));
      gl.addColorStop(0.70, rgba(e.c.glow, 0.16*bl));
      gl.addColorStop(1.00, rgba(e.c.glow, 0));
      g.strokeStyle = gl;
      g.lineWidth = Math.max(1.2, M.U*0.30);
      g.beginPath();
      for (let i=0;i<=N;i++) i ? g.lineTo(lx[i], ly[i]) : g.moveTo(lx[i], ly[i]);
      g.stroke();
    }
    const be = br * opt(p.brilloEspinas, 0);
    if (be > 0.004)
      for (let i=0;i<ne;i++){
        const s = levEspina(i, ne);
        const q = levPunto(e, s, _lvQ), a = levAngulo(e, s);
        const h = e.grosor*levPerfil(s)*(1 + levAlta(i)*cre);
        const x = q[0] + Math.sin(a)*h, y = q[1] - Math.cos(a)*h;
        /* desacompasadas entre ellas y con el coletazo, como los fotóforos:
           una hilera de puntos a alfa fijo se lee como una costura */
        const pa = be*(0.35 + 0.65*Math.abs(Math.sin(M.t*0.38 + i*2.1 + e.fase)));
        pintaHalo(g, M, e.c, x, y, M.U*0.17, pa*0.26);
      }

    /* DOS HILERAS DE FOTÓFOROS por el costado, no una nube: es lo que
       apunta que hay un cuerpo con lados. El halo va chico —solapados se
       funden en un tubo luminoso, que es lo contrario de una sombra. */
    const nf = p.fotoforos|0;
    for (let i=0;i<nf;i++){
      const s = 0.12 + 0.74*reparte(i, nf);
      const q = levPunto(e, s, _lvQ), a = levAngulo(e, s);
      const semi = e.grosor*levPerfil(s);
      const lado = (i & 1) ? 0.55 : -0.42;
      const x = q[0] - Math.sin(a)*semi*lado, y = q[1] + Math.cos(a)*semi*lado;
      const pa = br*(0.28 + 0.72*Math.abs(Math.sin(M.t*0.5 + i*1.7 + e.fase)));
      pintaHalo(g, M, e.c, x, y, M.U*0.24, pa*0.30);
    }

    /* EL OJO, junto al cráneo. Un punto basta para que el resto del hueco
       se lea como cabeza, y es lo único que dice hacia dónde mira.

       Del mismo color que el resto de lo que emite pero con su propio
       brillo: es el punto que tiene que verse, así que hay que poder
       subirlo sin encender la cresta con él. `brilloOjo` multiplica al
       `brillo` general y no lo sustituye, para que el mando de «leviatán ·
       luz» a 0 lo apague también. */
    const bo = br * opt(p.brilloOjo, 0);
    if (bo > 0.004){
      const qo = levPunto(e, 0.075, _lvQ), ao = levAngulo(e, 0.075);
      const semiO = e.grosor*levPerfil(0.075);
      const ox = qo[0] - Math.sin(ao)*semiO*0.42;
      const oy = qo[1] + Math.cos(ao)*semiO*0.42;
      /* LATE, muy despacio y desacompasado del coletazo: un punto de alfa
         constante se lee como un píxel muerto y no como un ojo. */
      const lat = 0.70 + 0.30*Math.sin(M.t*0.42 + e.fase);
      pintaHalo(g, M, e.c, ox, oy, M.U*0.38, bo*lat);
      /* y el corazón, chico y quemado. Es lo mismo que hace la esca del
         rape: lo que convierte una mancha de color en un punto INTENSO es
         el núcleo, no el radio. */
      mancha(g, ox, oy, M.U*0.11, [
        [0.00, e.c.core, Math.min(1, 0.80*bo*lat)],
        [0.34, e.c.mid,  0.50*bo*lat],
        [1.00, e.c.mid,  0],
      ]);
    }

    const qc = levPunto(e, 0.99, _lvQ), ac = levAngulo(e, 0.99);
    const nxc = -Math.sin(ac), nyc = Math.cos(ac);
    g.strokeStyle = rgba(e.c.mid, Math.min(1, 0.30*br));
    g.lineWidth = Math.max(0.6, M.U*0.04);
    g.beginPath();
    for (const lado of [1, -1]){
      g.moveTo(qc[0] + nxc*e.onda*0.10*lado, qc[1] + nyc*e.onda*0.10*lado);
      g.lineTo(qc[0] + nxc*e.onda*0.52*lado, qc[1] + nyc*e.onda*0.52*lado);
    }
    g.stroke();
  },
});

/* La geometría del leviatán, fuera del evento porque la usan su `actualiza`
   —que coloca los campos— y su `dibuja` —que traza la cresta—, y escritas
   por separado se despegan. `s` va de 0 en el morro a 1 en la punta de la
   cola.

   `levPunto` escribe en el array que se le pasa y NO en uno compartido, que
   es el convenio de las quijadas del rape: `levAngulo` llama a `levPunto`
   dos veces, así que con un array común se pisaba el punto que acababa de
   pedir quien llamaba.

   LA ONDA VIAJA HACIA ATRÁS: el término es `s*k - fase` con `fase`
   creciendo, así que la cresta recorre el cuerpo del morro a la cola. Y se
   amortigua hacia la cabeza —el factor `(0.12 + 0.88*s²)`— porque un
   depredador lleva el cráneo estable y late con el cuerpo.

   EL CUERPO VA ORIENTADO CON EL RUMBO: el eje corre hacia atrás en el
   sentido contrario a `ang` y la ondulación es perpendicular a él. Con el
   eje clavado en la horizontal —como estaba— el bicho podía subir mientras
   cruzaba, pero seguía apuntando de lado. */
function levPunto(e, s, o){
  const ca = Math.cos(e.ang), sa = Math.sin(e.ang);
  const a = -s*e.largo;                    // hacia la cola
  const b = Math.sin(s*e.k - e.fase) * e.onda * (0.12 + 0.88*s*s);
  o[0] = e.x + a*ca - b*sa;
  o[1] = e.y + a*sa + b*ca;
  return o;
}
/* semigrosor del cuerpo en `s`, con el perfil descrito arriba */
function levPerfil(s){
  const morro  = s < 0.06 ? 0.45 + 0.55*(s/0.06) : 1;
  const cuerpo = Math.pow(1-s, 0.55);
  const cuello = 1 - 0.30*Math.exp(-Math.pow((s-0.19)/0.075, 2));
  const cola   = 1 - 0.55*Math.pow(Math.max(0, (s-0.62)/0.38), 1.6);
  return morro*cuerpo*cuello*cola;
}
/* ── LA CRESTA, EN UN SOLO SITIO ────────────────────────────────────
   Dónde va la espina `i` de las `n` y cuánto se levanta sobre el lomo. Lo
   comparten su `actualiza` —que pone los campos oscuros que sierran el
   canto— y su `dibuja` —que le enciende la punta a cada diente—, y por eso
   están aquí: escritas por separado se despegan y no coinciden ni en el
   número de dientes.

   `levCresta` es lo mismo pero muestreado en un `s` cualquiera, que es lo
   que hace falta para trazar el canto de arriba: el diente más cercano y
   su caída lineal hasta el valle. Cuesta `n` cuentas por muestra, o sea
   unas cuatrocientas por fotograma y sólo mientras hay un leviatán. */
const levEspina = (i, n) => 0.14 + 0.62*reparte(i, n);
const levAlta = i => 0.55 + 0.45*Math.abs(Math.sin(i*2.3 + 1.1));
function levCresta(s, n, cresta){
  if (!(n > 0) || !(cresta > 0)) return 1;
  const media = 0.62/n;
  let pico = 0;
  for (let i=0;i<n;i++){
    const d = Math.abs(s - levEspina(i, n))/media;
    if (d < 1) pico = Math.max(pico, levAlta(i)*(1 - d));
  }
  return 1 + cresta*pico;
}

const _lvA = [0,0], _lvB = [0,0];
function levAngulo(e, s){
  const h = 0.004;
  const a = levPunto(e, Math.max(0, s-h), _lvA);
  const b = levPunto(e, Math.min(1, s+h), _lvB);
  return Math.atan2(b[1]-a[1], b[0]-a[0]);
}

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
       detrás se calla y el agua se oscurece bajo ella. A oscuras sigue
       ahí: se la encuentra por el hueco.
     · LA PRENDE. Un campo `enciende` flojo y ancho: la descomposición va
       encendiendo el plancton a su paso y le deja un rastro que tarda en
       borrarse. Muchas veces se la ve por eso antes que por ella.

   El dibujo es un esqueleto: espinazo, costillas que se abren, cráneo y
   un jirón de aleta caudal. Nada de carne —no hay con qué pintarla en
   aditivo— y no hace falta: lo que se reconoce de un cuerpo hundiéndose
   es la silueta de las costillas.                                    */
A.evento('carrona', {
  exclusivo: false,
  cada: [120, 260], primero: [30, 90],
  prueba: { vel: [0.55, 0.95], largo: [0.14, 0.24], vertebras: 13,
            giro: [-0.10, 0.10], deriva: 0.25, costillas: 7,
            caja: [0.30, 0.90], falta: 0.18, chevrones: [3, 6], craneo: 0.85,
            alcance: 3.0, caida: 2.2, ganancia: 1.9, techo: 1.5, base: 0.03,
            tapa: 0.85, tapaFilo: 6, enciende: 0.55, plano: 1,
            espectro: { tono: [30, 48], tramos: 4,
                        sat: [0.10, 0.20], luz: [0.80, 0.90],
                        satGlow: [0.14, 0.26], luzGlow: [0.26, 0.36],
                        luzCore: [0.93, 0.98], giroGlow: 4 } },
  arranca(M, p, x, y){
    const Lg = Math.max(M.W, M.H) * rango(p.largo);
    /* UN SOLO SORTEO de vértebras: de aquí salen el contador Y el largo
       del array de luz. Sorteados por separado no coinciden, y entonces
       `e.luz[n-1]` es `undefined`, el alfa del jirón de la cola sale NaN y
       el navegador tira una excepción a mitad de fotograma. */
    const nv = Math.max(4, rangoE(p.vertebras)|0);
    const nc = rangoE(p.costillas || 0)|0;
    return {
      x: opt(x, rnd(0.14, 0.86)*M.W),
      /* arranca FUERA por arriba, y por su largo: entrando por el canto se
         la ve aparecer de la nada si justo la alumbra algo */
      y: opt(y, -Lg*0.6),
      Lg,
      vel:  rango(p.vel) * M.U,
      /* voltea, y despacio: una vuelta cada medio minuto o más. El signo
         se sortea, que si no todas caen girando igual. */
      ang:  Math.random()*TAU,
      vGiro: rango(p.giro || 0),
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
      caja: rango(p.caja || 0.55),
      chevrones: rangoE(p.chevrones || 0)|0,
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

    const plano = opt(p.plano, 1);
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
    const alc = opt(p.alcance, 1), caida = opt(p.caida, 2.2);
    const gan = opt(p.ganancia, 1.9), techo = opt(p.techo, 1.5);
    const base = opt(p.base, 0), k = Math.min(1, 7*dt);
    let pico = 0;
    for (let i=0;i<n;i++){
      const s = ((i+0.5)/n - 0.5)*e.Lg;
      const vx = e.x + s*ca, vy = e.y + s*sa;
      let tot = 0;
      for (const o of M.luces(plano)){
        const r = (o.rCuerpo || o.rLuz) * alc;
        if (!r) continue;
        const d = Math.hypot(o.x - vx, o.y - vy);
        if (d >= r) continue;
        const w = (o.luzI || 1) * Math.pow(1 - d/r, caida);
        if (w < 0.004) continue;
        tot += w;
      }
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
                        rot: e.ang, filo: opt(p.tapaFilo, 6), fuerza: t });
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
           (`carronaPerfil`) y no de un seno cualquiera. Con el seno las
           costillas salían desiguales pero al azar, y lo que se veía era
           un peine desdentado; con el perfil, las del centro de la caja
           son las largas y se acortan hacia los dos extremos, o sea que
           el conjunto tiene silueta de tonel. Eso es lo que se reconoce.
       2 · LE FALTAN COSTILLAS, y por lados sueltos (ver `falta` en
           `arranca`). Una jaula completa y simétrica se lee como un
           dibujo; a la que le falta medio par se le lee la edad.

       Y va de 0,13 a 0,58 del cuerpo —antes 0,16 a 0,50—: la caja de un
       pez llega más atrás que su tercio delantero, y con el tramo corto
       las costillas salían apiñadas junto al cráneo. */
    const nc = e.costillas;
    if (nc){
      g.lineWidth = Math.max(0.4, Lg*0.007);
      for (let i=0;i<nc;i++){
        const u = 0.13 + 0.45*reparte(i, nc);
        const v = luzEn(u);
        if (v < 0.03) continue;
        const s = (u-0.5)*Lg;
        /* 0,19 y no más: el perfil vale hasta 0,90 en el pecho, así que
           esto pone la costilla más larga en 0,17 del cuerpo, que es lo
           que medía la más larga de antes. A 0,30 —el primer valor que se
           probó— la caja medía media eslora de alto y lo que se veía era
           un peine, no un tórax. */
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
  const pecho  = 1 + opt(caja, 0.55)*Math.exp(-Math.pow((u-0.30)/0.16, 2));
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

/* ── EL CUERPO ──────────────────────────────────────────────────────
   Un cuerpo humano bajando. NO SE DIBUJA NADA: la silueta está hecha de
   campos `apaga`, igual que el leviatán, así que lo que cruza la pantalla
   es una región donde la nieve marina se calla y el agua se oscurece. Es
   la única forma de que aquí haya algo oscuro —sumar no oscurece— y
   además es la buena: no se ve un cuerpo, se ve el hueco de un cuerpo, y
   el que mira lo reconoce sin que se lo dibujen.

   Es E-04 llevado al sitio donde de verdad duele. La carroña es un
   esqueleto de pez y se ilumina; esto no emite ni un fotón y no hace
   falta: lo que lo hace insoportable es que la silueta es humana.

   LA POSTURA es la del ahogado: brazos arriba y hacia fuera, cabeza
   colgando, piernas juntas y algo dobladas. No es licencia —un cuerpo en
   el agua flota así— y es lo que hace que se reconozca de perfil, de
   frente y girado, que es importante porque va volteando muy despacio.

   Va MÁS LENTO que la carroña y con menos volteo: lo que se pide es que
   tarde tanto en cruzar que dé tiempo a dudar de lo que se está viendo.
   Cuatro cosas lo hacen BLANDO y CONTINUO, y sin ellas se reconoce el
   cuerpo pero no se cree:

     1 · NO HAY UNA ELIPSE POR HUESO. Se recorren dos perfiles —el del
         tronco (`CUERPO_PERFIL`) y el de cada miembro— dejando campos
         solapados con el grosor interpolado, y la unión es una manga
         continua. Con una elipse por pieza se ve LA PIEZA: una elipse se
         afila en sus dos puntas, así que cada junta deja un pellizco y el
         cuerpo se lee como óvalos ensartados con los miembros despegados
         del tronco. Esto es lo que lo arregla y lo demás se apoya en ello.
     2 · EL ESPINAZO SE DOBLA (`arqueo`, `onda`). El eje no es recto: se
         arquea lo suyo por cuerpo y encima le recorre una onda muy lenta.
         La flexión se aplica CAMPO A CAMPO, así que arrastra todo lo que
         cuelga del eje —miembros incluidos— sin partirlo.
     3 · LOS MIEMBROS CUELGAN DE SU HUECO y no giran sobre su propio
         centro. Un brazo con el centro por pivote es un aspa; con el
         hombro por pivote es un brazo suelto en el agua. Y son dos
         eslabones en cadena: el antebrazo se mueve con el brazo.
     4 · CADA UNO FLOTA A LO SUYO. Cada eslabón lleva su fase y su
         velocidad, sorteadas al nacer, así que no hay dos acompasados.
         Con un seno único los cuatro miembros suben y bajan juntos y eso
         se lee como un mecanismo.

   Y CAEN DE UNO A TRES, desfasados (`cuantos`, `retraso`): el segundo
   entra cuando el primero lleva medio cuadro bajado. A la vez serían una
   formación; escalonados, es que hay más de uno. */

/* ── EL PERFIL DEL TRONCO ────────────────────────────────────────────
   El semiancho a cada altura, en fracciones del ALTO del cuerpo y con el
   origen en el ombligo. Puntos de control y no una fórmula: lo que se
   reconoce de un cuerpo es la PROPORCIÓN —la cabeza es un séptimo, los
   hombros dos cabezas, la cintura más estrecha que hombros y caderas—, y
   eso no sale de una curva.

   Se muestrea a pasos cortos con los campos solapados, por el motivo del
   punto 1 de arriba: cinco elipses sueltas dejan la silueta como una pila
   de óvalos con un cinturón oscuro en la cintura.

   Los dos extremos van a casi CERO de ancho a propósito: el campo del
   final de una cadena tiene que sobresalir del rango —si no sobresale, no
   solapa con el anterior—, y a dos milésimas lo que asoma es un pelo. Con
   el ancho de la coronilla de verdad asoma un pico sobre la cabeza. */
const CUERPO_PERFIL = [
  [-0.512, 0.004],
  [-0.502, 0.030],        // la coronilla: sube de golpe, que un cráneo es redondo
  [-0.486, 0.048],        //   y no un cono
  [-0.466, 0.057],
  [-0.438, 0.062],        // la cabeza, por donde es más ancha
  [-0.400, 0.053],
  [-0.366, 0.031],        // el cuello: la estrangulación que dice que hay cabeza
  [-0.334, 0.060],
  [-0.298, 0.097],        // los hombros
  [-0.260, 0.105],
  [-0.208, 0.087],
  [-0.158, 0.074],        // la cintura
  [-0.098, 0.081],
  [-0.040, 0.094],        // las caderas
  [ 0.014, 0.085],
  [ 0.052, 0.040],
  [ 0.072, 0.004],        // y de aquí abajo ya son las piernas
];

/* el semiancho del tronco a una altura cualquiera. Con interpolación
   lineal se le ven los vértices al perfil en el canto de la silueta, así
   que se suaviza: `u²(3−2u)` entra y sale con pendiente cero, y entonces
   el canto no tiene esquinas. */
function cuerpoAncho(ly){
  const T = CUERPO_PERFIL, n = T.length;
  if (ly <= T[0][0]) return T[0][1];
  if (ly >= T[n-1][0]) return T[n-1][1];
  let i = 1;
  while (i < n-1 && T[i][0] < ly) i++;
  const a = T[i-1], b = T[i];
  const u = (ly - a[0])/(b[0] - a[0]);
  return a[1] + (b[1] - a[1])*(u*u*(3 - 2*u));
}

/* ── LOS MIEMBROS ───────────────────────────────────────────────────
   Un miembro es un HUECO del que salen dos eslabones en cadena, y se
   describe así y no como dos centros con sus ángulos porque lo que hay
   que poder mover es el ángulo de cada eslabón: con el centro por pivote,
   un brazo que flota es un aspa.

   `anchos` es el semiancho en la RAÍZ, en la junta de en medio y en la
   PUNTA, y es la otra mitad del arreglo de los óvalos: interpolado a lo
   largo del miembro, un brazo va de grueso a fino de un tirón en vez de
   ser dos lentejas pegadas por el codo. La punta va casi a cero por lo
   mismo que la coronilla del perfil, y de paso lo que asoma se lee como
   dedos. Y la raíz va bastante gorda para que el primer campo entre DENTRO
   del tronco: el hueco del hombro cae a 0,062 del eje y ahí el tronco mide
   0,105, así que el brazo nace por debajo del canto y no pegado a él.

   LOS ÁNGULOS SE MIDEN DESDE «HACIA LOS PIES» y abriendo hacia fuera, que
   es como se piensa una postura: 0 es un miembro colgando recto y π uno
   estirado hacia arriba. El del segundo eslabón es RELATIVO al primero, o
   sea que es el codo o la rodilla y no una orientación absoluta, y por eso
   mover el brazo arrastra el antebrazo. `largos` son largos enteros.   */
const CUERPO_MIEMBROS = [
  /* los brazos, ARRIBA y hacia fuera, que es como flota un ahogado */
  { x:-0.062, y:-0.256, lado:-1,
    largos: [0.200, 0.184], angulos: [2.30, -0.42],
    anchos: [0.040, 0.027, 0.012], fuerzas: [0.82, 0.70] },
  { x: 0.062, y:-0.256, lado: 1,
    largos: [0.200, 0.184], angulos: [2.30, -0.42],
    anchos: [0.040, 0.027, 0.012], fuerzas: [0.82, 0.70] },
  /* y las piernas, juntas y algo dobladas */
  /* y las piernas, juntas y algo dobladas. El hueco de la cadera va a
     0,046 del eje y el muslo mide 0,050, o sea que las dos piernas se
     tocan justo en el eje y de ahí para abajo se separan: con el muslo a
     0,058 se cruzaban y las dos piernas salían fundidas en una columna,
     que es lo que se leía como cola. Y la rodilla dobla POCO —0,11— porque
     en una silueta plana no hay más plano que éste: doblarla como se
     dobla de verdad sale de lado, y a 0,34 el cuerpo bajaba haciendo un
     compás. */
  { x:-0.046, y:-0.026, lado:-1,
    largos: [0.244, 0.224], angulos: [0.09, 0.13],
    anchos: [0.050, 0.036, 0.016], fuerzas: [0.92, 0.80] },
  { x: 0.046, y:-0.026, lado: 1,
    largos: [0.244, 0.224], angulos: [0.09, 0.13],
    anchos: [0.050, 0.036, 0.016], fuerzas: [0.92, 0.80] },
];

/* CADA CUÁNTO SE DEJA UN CAMPO, en fracciones del alto, y cuánto mide de
   largo el que se deja —el factor sobre el paso—.

   El factor sale de una cuenta: dos elipses iguales de semieje `a`
   separadas `s` dejan la unión, justo en medio, a `sqrt(1 − (s/2a)²)` de
   su ancho. Con el semieje igual al paso eso es el 87 % y el pellizco se
   ve; con 1,35 es el 93 % y no. Subirlo más no arregla nada y hace que
   asome más por las puntas.

   ── Y POR QUÉ EL TRONCO VA MÁS FINO QUE LOS MIEMBROS ────────────────
   Porque el paso es también el TAMAÑO DEL DETALLE MÁS PEQUEÑO que se
   puede resolver: dos campos consecutivos se solapan a propósito, así que
   cualquier estrechamiento más corto que el paso lo rellenan entre ellos.

   El tronco tiene uno que no se puede perder —el CUELLO, que mide unas
   tres centésimas del alto—, y con el paso a 0,072 los campos de la
   cabeza y de los hombros se daban la mano por encima de él: salía un
   cuerpo sin cabeza, un bulto puntiagudo. A 0,030 el cuello se resuelve y
   hay cabeza. Los miembros no tienen ningún detalle así —son conos
   lisos—, y ahí lo único que hacía falta era que no pellizcaran en el codo
   y la rodilla.

   ── LO QUE CUESTA, Y DÓNDE SE VA ────────────────────────────────────
   41 campos por cuerpo: 19 del tronco, 5 por brazo y 6 por pierna. Eran
   13. Cronometrado en el navegador con la población ENTERA —59 peces, sin
   que haya entrado `degradar()`— y con los cuerpos parados, para que la
   medida no dependa de por dónde vayan:

     | sin evento                    |   4 campos |  2,4 ms |
     | un cuerpo                     |  45 campos |  3,1 ms |
     | tres cuerpos (el peor caso)   | 127 campos |  4,4 ms |

   Unos 0,017 ms por campo, o sea dos milisegundos en el peor caso de
   todos. Y el gasto NO está en dibujar: apagando `pintaSombras` entera
   —`agua.sombra.fuerza` a 0— la diferencia es de 0,02 ms, o sea ninguna.
   Está TODO en `M.campo()`, que es un recorrido lineal del array de
   campos y al que el plancton llama por mota: setecientas motas por dos
   consultas por ciento veintisiete campos son ciento setenta mil
   comparaciones por fotograma.

   Eso es lo que pone el tope al paso, y no el número de elipses. Si algún
   día hace falta bajarlo más, lo que hay que arreglar antes es la
   consulta —una rejilla— y no este evento.                           */
const PASO_TRONCO = 0.030, PASO_MIEMBRO = 0.075, LARGO_CAMPO = 1.35;

/* CUÁNTAS MUESTRAS SALEN DE ESO, contadas una sola vez y aquí: las usan el
   bucle que pone los campos y el que pinta el borde, y sobre todo el array
   donde el primero le deja al segundo por dónde va el canto. Calculadas de
   los mismos pasos y perfiles, así que no hay forma de que se
   desincronicen de lo que de verdad se dibuja. */
const N_TRONCO = Math.max(4, Math.round(
  (CUERPO_PERFIL[CUERPO_PERFIL.length-1][0] - CUERPO_PERFIL[0][0]) / PASO_TRONCO));
const N_MIEMBRO = CUERPO_MIEMBROS.map(
  Mi => Math.max(3, Math.round((Mi.largos[0] + Mi.largos[1]) / PASO_MIEMBRO)));
const N_PIEL = N_TRONCO + N_MIEMBRO.reduce((a, b) => a + b, 0);

function cuerpoFlexion(b, ly, t){
  const peso = Math.min(1, Math.abs(ly)/0.40);
  return peso * (b.arqueo + b.onda*Math.sin(ly*b.k + b.fase + t*b.vOnda));
}

/* un cuerpo nuevo: su tamaño, su rumbo, su postura y su flotación. `espera`
   son los segundos que tarda en asomar, que es lo que los desacompasa. */
function cuerpoNuevo(M, p, x, y, espera){
  const h = M.H * rango(p.alto);
  const b = {
    x: opt(x, rnd(0.16, 0.84)*M.W),
    /* entra por arriba y desde fuera, por su altura entera: el cuerpo
       cuelga del punto (x,y), así que si arranca en el canto asoman los
       pies antes que la cabeza */
    y: opt(y, -h*0.75),
    h, espera,
    vel:   rango(p.vel) * M.U,
    ang:   rnd(-0.25, 0.25),
    vGiro: rango(p.giro || 0),
    fase:  Math.random()*TAU,
    hondura: rango(p.hondura),
    deriva: Math.random()*TAU,
    /* LA POSTURA: no otra anatomía, los mismos huesos con los ángulos
       abiertos de otra manera. `abre` multiplica el del HOMBRO y la CADERA,
       `dobla` el del CODO y la RODILLA. */
    abre:  rango(p.abre || 1),
    dobla: rango(p.dobla || 1),
    /* `arqueo` con signo sorteado: uno baja recogido hacia delante y el
       siguiente arqueado hacia atrás. */
    arqueo: rango(p.arqueo || 0) * (Math.random() < 0.5 ? 1 : -1),
    onda:   rango(p.onda || 0),
    k:      TAU * rango(p.ondas || 0.5),
    vOnda:  rango(p.velOnda || 0.2),
    /* UNA FASE Y UNA VELOCIDAD POR ESLABÓN. Ocho números por cuerpo y
       sorteados una vez: es lo que impide que los cuatro miembros suban y
       bajen a la par, que es lo que más delataba el maniquí. */
    fasesM: new Float32Array(CUERPO_MIEMBROS.length*2),
    velesM: new Float32Array(CUERPO_MIEMBROS.length*2),
    /* ── POR DÓNDE VA SU CANTO ────────────────────────────────────
       Cinco números por muestra —x, y, el ángulo del eje ahí, el semiancho
       y el semieje a lo largo—, en coordenadas del MUNDO y rellenados por
       el mismo bucle que pone los campos. El semieje a lo largo va porque
       de él sale cuánto mide el trazo del borde: el paso del tronco y el de
       un miembro no son el mismo.

       Se guarda en vez de recalcularlo en `dibuja` porque los campos se
       ponen en `actualiza` y el dibujo va en otra fase del fotograma: dos
       recorridos separados se despegan, y despegados el borde se pinta
       donde el cuerpo no está. */
    piel: new Float32Array(N_PIEL*5),
    hecho: false,
  };
  for (let i=0;i<b.fasesM.length;i++){
    b.fasesM[i] = Math.random()*TAU;
    b.velesM[i] = rnd(0.45, 1.15);
  }
  return b;
}

A.evento('cuerpo', {
  exclusivo: true,
  cada: [320, 660], primero: [80, 200],
  prueba: { alto: [0.30, 0.42], vel: [0.30, 0.55], giro: [-0.055, 0.055],
            deriva: 0.22, vaiven: 0.30, hondura: [0.92, 1.0],
            cuantos: [1, 3], retraso: [10, 30],
            abre: [0.70, 1.22], dobla: [0.3, 1.8],
            arqueo: [0.04, 0.13], onda: [0.02, 0.055],
            ondas: [0.35, 0.8], velOnda: [0.10, 0.26],
            filo: 1.8, penumbra: 1.25, plano: 1,
            borde: 2.2, bordeAlcance: 4.2, bordeCaida: 2.0, bordeTecho: 0.09,
            bordeGrosor: 0.05, bordeTono: [182, 196, 204],
            bordeTinte: 0.22, bordeTapado: 0.25 },
  arranca(M, p){
    /* el primero entra ya; los demás esperan lo suyo. El contacto no le
       pasa un sitio a ninguno: un cuerpo que sale del dedo se lee como
       que el dedo lo ha hecho, y este evento va de encontrárselo. */
    const n = Math.max(1, rangoE(p.cuantos || 1)|0);
    const cuerpos = [];
    let espera = 0;
    for (let i=0;i<n;i++){
      cuerpos.push(cuerpoNuevo(M, p, undefined, undefined, espera));
      espera += rango(p.retraso || 0);
    }
    return { cuerpos };
  },
  actualiza(e, M, p, dt){
    const plano = opt(p.plano, 1);
    const filo = opt(p.filo, 1.8);
    /* `penumbra` agranda cada elipse por encima del cuerpo, igual que en el
       leviatán: el máximo de un campo cae en su centro, así que sin esto la
       silueta de verdad cae donde el apagado ya se está desvaneciendo y no
       hay masa oscura, sólo un degradado. */
    const pen = opt(p.penumbra, 1);
    const vai = opt(p.vaiven, 0);
    let quedan = 0;

    for (const b of e.cuerpos){
      if (b.hecho) continue;
      quedan++;
      if (b.espera > 0){ b.espera -= dt; continue; }
      b.y += b.vel * dt;
      b.ang += b.vGiro * dt;
      b.x += Math.sin(M.t*0.11 + b.deriva) * opt(p.deriva, 0) * M.U * dt;
      if (b.y - b.h*0.6 > M.H){ b.hecho = true; quedan--; continue; }
      cuerpoCampos(b, M, plano, pen, filo, vai);
    }
    return quedan > 0;
  },
  /* Y SÍ DIBUJA, aunque poco: el canto encendido por lo que le pasa cerca.
     Ver `pintaBordeCuerpo`. El cuerpo sigue siendo un hueco —no emite
     nada—; lo que se pinta es la luz de otro rebotando en él. */
  dibuja(e, M, p, g){
    const plano = opt(p.plano, 1);
    for (const b of e.cuerpos)
      if (!b.hecho && b.espera <= 0) pintaBordeCuerpo(b, M, p, g, plano);
  },
});

/* ── DEL CUERPO AL MUNDO ────────────────────────────────────────────
   Empuja los campos de un cuerpo. Va fuera del evento porque lo que hace
   es geometría y no reloj, y porque así el bucle de arriba se lee: mover
   los cuerpos es una cosa y armar la silueta es otra.

   Se recorren los DOS perfiles —el del tronco a lo alto y el de cada
   miembro de la raíz a la punta— dejando campos solapados con el grosor
   interpolado. La unión de todos es una manga continua, y eso es lo que
   quita de en medio los dos defectos que tenía la silueta: el óvalo por
   hueso y el pellizco en cada junta.

   Y LA FLEXIÓN SE APLICA CAMPO A CAMPO, no pieza a pieza. Es lo que hace
   que el cuerpo se DOBLE en vez de partirse: desplazando cada elipse en
   bloque por la flexión de su centro, el muslo y la espinilla —con los
   centros a un tercio de altura de diferencia— se van a un lado distinto y
   la rodilla abre un hueco de veinte píxeles. Con un campo cada 0,072 el
   desplazamiento cambia poco de uno al siguiente y sale una curva. */
function cuerpoCampos(b, M, plano, pen, filo, vai){
  const t = M.t;
  const ca = Math.cos(b.ang), sa = Math.sin(b.ang);
  /* deja un campo en el punto (lx, ly) del cuerpo. `r` es el semieje a lo
     largo y `ancho` el semiancho ya en píxeles; `f` es la flexión a esa
     altura, que la calcula quien llama porque el tronco además la
     necesita para el giro. */
  let k = 0;
  const pon = (lx, ly, f, r, ancho, rot, fuerza) => {
    const gx = (lx + f)*b.h, gy = ly*b.h;
    const x = b.x + gx*ca - gy*sa, y = b.y + gx*sa + gy*ca;
    const rt = b.ang + rot;
    M.campos.push({ tipo:'apaga', plano, x, y,
                    r, ky: Math.max(0.04, ancho/r),
                    rot: rt, fuerza: b.hondura*fuerza, filo });
    /* y de paso, por dónde va el canto aquí: lo consume `dibuja` para el
       borde. Se apunta en el mismo sitio en que se pone el campo, que es la
       única forma de que el borde caiga donde el cuerpo está. */
    const j = k++*5;
    b.piel[j] = x; b.piel[j+1] = y; b.piel[j+2] = rt;
    b.piel[j+3] = ancho; b.piel[j+4] = r;
  };
  /* el semieje a lo largo NO lleva `pen` y el ancho SÍ. La penumbra está
     para que la silueta de verdad caiga dentro de la zona llena del campo,
     y eso es un problema del lado FINO: a lo largo ya solapan entre ellos.
     Agrandándolo también a lo largo, lo único que crecía era el pelo que
     asoma por la coronilla y por los dedos. */

  /* EL TRONCO, de la coronilla a donde arrancan las piernas. `+π/2` porque
     el perfil está escrito a lo ALTO y el semieje `r` de un campo es el
     horizontal. */
  const P = CUERPO_PERFIL;
  const y0 = P[0][0], y1 = P[P.length-1][0];
  const nT = N_TRONCO;
  const pasoT = (y1-y0)/nT, rT = pasoT*LARGO_CAMPO*b.h;
  let fAnt = null;
  for (let i=0;i<nT;i++){
    const ly = y0 + (i+0.5)*pasoT;
    const f = cuerpoFlexion(b, ly, t);
    /* el canto sigue el arco: el giro de cada campo sale de cuánto se ha
       apartado respecto del ANTERIOR. Así no hay que derivar la flexión ni
       hay dos fórmulas que se puedan desincronizar —el problema de siempre
       en esta casa—, y el tronco arqueado sale como una curva y no como
       una escalera de elipses verticales. */
    const tg = fAnt === null ? 0 : Math.atan((f - fAnt)/pasoT);
    fAnt = f;
    pon(0, ly, f, rT, cuerpoAncho(ly)*b.h*pen, Math.PI*0.5 + tg, 1);
  }

  /* LOS MIEMBROS, de la raíz a la punta */
  for (let m=0;m<CUERPO_MIEMBROS.length;m++){
    const Mi = CUERPO_MIEMBROS[m];
    const L1 = Mi.largos[0], L2 = Mi.largos[1], total = L1 + L2;
    /* la postura dice dónde reposa cada junta —`abre` el hombro y la
       cadera, `dobla` el codo y la rodilla— y `vaiven` cuánto se va de
       ahí, con la fase y la velocidad propias de ese eslabón: por eso no
       hay dos miembros acompasados. */
    const a1 = Mi.angulos[0]*b.abre
             + vai*Math.sin(t*b.velesM[m*2] + b.fasesM[m*2]);
    const a2 = a1 + Mi.angulos[1]*b.dobla
             + vai*Math.sin(t*b.velesM[m*2+1] + b.fasesM[m*2+1]);
    const d1x = Math.sin(a1)*Mi.lado, d1y = Math.cos(a1);
    const d2x = Math.sin(a2)*Mi.lado, d2y = Math.cos(a2);
    const rot1 = Math.atan2(d1y, d1x), rot2 = Math.atan2(d2y, d2x);
    /* el codo o la rodilla */
    const jx = Mi.x + d1x*L1, jy = Mi.y + d1y*L1;
    const n = N_MIEMBRO[m];
    const paso = total/n, r = paso*LARGO_CAMPO*b.h;
    const A = Mi.anchos, F = Mi.fuerzas;
    for (let i=0;i<n;i++){
      const s = (i+0.5)*paso;
      const dentro = s <= L1;
      const u = dentro ? s/L1 : (s-L1)/L2;
      const ancho = dentro ? A[0] + (A[1]-A[0])*u : A[1] + (A[2]-A[1])*u;
      const fz    = dentro ? F[0] + (F[1]-F[0])*u : F[1];
      const lx = dentro ? Mi.x + d1x*s : jx + d2x*(s-L1);
      const ly = dentro ? Mi.y + d1y*s : jy + d2y*(s-L1);
      pon(lx, ly, cuerpoFlexion(b, ly, t), r, ancho*b.h*pen,
          dentro ? rot1 : rot2, fz);
    }
  }
}

/* ── EL BORDE ───────────────────────────────────────────────────────
   Lo ÚNICO que dibuja este evento. Sin él, en la mitad de abajo del
   cuadro —donde el agua ya es casi negra, [0,1,3] contra [4,13,21] del
   techo— un hueco negro sobre agua negra no se lee y el cuerpo se pierde
   justo cuando más cerca está de pasar por delante de algo.

   Y NO SE ILUMINA DESDE LA ESCENA. Un borde fijo por el canto de arriba
   —como si cayera luz de la superficie— va contra la regla de la casa, y
   además aquí no llega el sol. Lo que se enciende es lo que un foco de
   verdad alcanza: se recorre el canto que ya dejó apuntado
   `cuerpoCampos`, se mira qué luz le llega de `M.luces(plano)` y se
   enciende SÓLO el lado que mira a esa luz. Es lo mismo que hace la
   carroña, con dos diferencias:

     · Aquí la luz tiene DIRECCIÓN. La carroña se pregunta cuánta luz le
       llega a cada vértebra; un borde necesita además de dónde viene, o se
       enciende el contorno entero y el cuerpo pasa de hueco a muñeco
       recortado. Se acumula como VECTOR y el canto se enciende por
       `dot(normal, luz)`: el lado de sombra se queda negro, que es la
       mitad del efecto.
     · Es GRIS y no del color del foco: lo que se quiere leer es carne
       mojada, y para eso el tono tiene que ser casi neutro. Coge un poco
       del color de quien lo alumbra —`tinte`— y nada más.

   Se salta los trozos de canto que caen DENTRO de otra parte del cuerpo
   —el brazo por donde cruza el hombro— preguntándole al motor por su
   propio campo `apaga`: en el canto, el campo de esa misma muestra vale
   cero, así que lo que devuelva viene de otra parte. Sin esto salen rayas
   por dentro de la masa oscura y el cuerpo se lee como un despiece. */
function pintaBordeCuerpo(b, M, p, g, plano){
  const gan = opt(p.borde, 0);
  if (!(gan > 0)) return;
  const luces = M.luces(plano);
  if (!luces.length) return;
  const alc = opt(p.bordeAlcance, 1), caida = opt(p.bordeCaida, 2);
  const techo = opt(p.bordeTecho, 1);
  const T = p.bordeTono || [180, 196, 206], tinte = opt(p.bordeTinte, 0);
  const grosor = Math.max(0.5, M.U*opt(p.bordeGrosor, 0.05));
  g.lineCap = 'round';
  g.lineWidth = grosor;
  for (let i=0;i<N_PIEL;i++){
    const j = i*5;
    const x = b.piel[j], y = b.piel[j+1], rot = b.piel[j+2];
    const anc = b.piel[j+3], rl = b.piel[j+4];
    if (!(anc > 0)) continue;
    /* LA CURVA es la de `luzRecibida` —pow(1/(1+d²/r²), caida)— y NO la de
       la carroña, que se corta en `r`: los radios de esta escena van de 16
       px a 125 y un cuerpo baja por agua vacía, así que con corte el canto
       sale todo o nada (medido: `alcance` 9 daba el 0 % de los fotogramas
       con algo encendido y 13 el 100 %). Sin corte hay un hilo de luz a
       cualquier distancia y sube cuando algo se acerca. */
    let lx = 0, ly = 0, mejor = 0, cm = null;
    for (const o of luces){
      const r = (o.rCuerpo || o.rLuz) * alc;
      if (!r) continue;
      const dx = o.x - x, dy = o.y - y, d2 = dx*dx + dy*dy;
      const q = d2/(r*r);
      const w = (o.luzI || 1) * Math.pow(1/(1 + q), caida);
      if (w < 0.002) continue;
      const d = Math.sqrt(d2) || 1e-4;
      lx += dx/d*w; ly += dy/d*w;
      if (w > mejor){ mejor = w; cm = o.c; }
    }
    if (Math.hypot(lx, ly) < 0.004) continue;
    /* UN PUNTO DEL COLOR DE QUIEN LO ALUMBRA, y poco: con el gris a secas
       el cuerpo se despega de la escena —sería lo único que no comparte
       tono con nada— y teñido del todo vuelve a parecer otro bicho que
       brilla. El tinte es del foco que más pesa EN ESTA MUESTRA, así que
       un cuerpo entre dos medusas de colores distintos se tiñe distinto
       de cada lado. */
    let R = T[0], G = T[1], B = T[2];
    if (tinte > 0 && cm && cm.mid){
      R += (cm.mid[0] - R)*tinte;
      G += (cm.mid[1] - G)*tinte;
      B += (cm.mid[2] - B)*tinte;
    }
    const col = (R|0)+','+(G|0)+','+(B|0)+',';
    /* el eje de la muestra y su normal: el canto está a `anc` de ahí, a un
       lado y al otro */
    const ex = Math.cos(rot), ey = Math.sin(rot);
    const nx = -ey, ny = ex;
    /* EL TRAZO MIDE EL PASO, no el ancho del cuerpo. Con el ancho, en el
       tronco sobra —26 px de trazo para 7 de paso— y en los miembros falta
       —7 para 18—: el canto de un brazo sale a rayitas. El paso es
       `paso·LARGO_CAMPO`, y se estira un 30 % para que dos trazos seguidos
       se pisen con la punta redonda. */
    const largo = rl/LARGO_CAMPO*1.3;
    for (let lado=-1;lado<=1;lado+=2){
      /* ¿mira este lado a la luz? `cara` sale ya con la intensidad dentro.
         La única puerta aquí es el signo —de espaldas no se enciende—; lo
         flojo lo corta el alfa más abajo. Con una puerta en 0,01 se pierde
         el caso normal: por agua vacía la luz que le llega vale unas cinco
         milésimas, así que las dos caras la fallan y el cuerpo se queda
         negro entero. */
      const cara = nx*lado*lx + ny*lado*ly;
      if (cara <= 0) continue;
      /* JUSTO POR FUERA de la masa y no en el canto exacto. Un cuerpo
         mojado tiene el reflejo en el borde, no dentro, y además es lo que
         descuenta los falsos positivos de la prueba de abajo: en el canto
         exacto, el trozo donde un brazo sale del hombro está medio
         enterrado en el tronco y se descarta. Medido: de 82 trozos, 43 dan
         la espalda a la luz —eso es lo que se quiere— y 15 salen
         enterrados; un pelo por fuera, la mayoría de esos 15 son canto de
         verdad. */
      const fuera = anc + grosor*0.7;
      const bx = x + nx*lado*fuera, by = y + ny*lado*fuera;
      /* y si este trozo sigue enterrado en otra parte del cuerpo, no es
         canto: es una raya por dentro de la masa oscura, y con ellas el
         cuerpo se lee como un despiece */
      const dentro = M.campo('apaga', bx, by, plano);
      if (dentro && dentro.peso > opt(p.bordeTapado, 0.25)) continue;
      /* EL TECHO, con rodilla blanda en vez de recorte. La luz que le llega
         tiene un rango enorme —de 0,02 sin nada cerca a más de 1 con una
         medusa al costado—, así que sin esto el canto se clava en alfa 1 y
         el cuerpo pasa de hueco a figura recortada en blanco.
         `cara/(1 + cara/techo)` sube recto al principio y se acerca al
         techo sin llegar, así que siempre queda margen para ponerse más
         vivo. */
      const a = gan*cara/(1 + cara/techo);
      if (a < 0.004) continue;
      g.strokeStyle = 'rgba('+col+a.toFixed(3)+')';
      g.beginPath();
      g.moveTo(bx - ex*largo*0.5, by - ey*largo*0.5);
      g.lineTo(bx + ex*largo*0.5, by + ey*largo*0.5);
      g.stroke();
    }
  }
}

/* ── EL GLITCH ──────────────────────────────────────────────────────
   Se rompe el DIBUJO DE UNA MEDUSA, no la pantalla. Uno o dos focos
   aparecen en sitios cualesquiera y a las medusas que caen dentro se les
   pinta el cuerpo cortado en BANDAS HORIZONTALES ESCALONADAS, cada una
   corrida lo suyo. Y la medusa no se enteró: la rotura la aplica el motor
   al pintarla, con el campo `tajo` (ver `pintaBicho` en motor.js).

   Es una avería del dibujante, no de la pantalla. Una franja negra a lo
   ancho o una línea desplazada son un fallo de la señal; que a una medusa
   se le desalinee la campana en escalera mientras la de al lado está
   perfecta es un fallo de quien la está pintando.

   SÓLO LAS MEDUSAS, y el evento no lo decide: lo declara la especie con
   `rompible`. Éste reparte campos y no sabe a quién le caen. Rompiendo a
   todo el mundo lo que más se ve es plancton desplazado, que es ruido: en
   una mota de tres píxeles la escalera no cabe.

   NO DIBUJA NADA. Es el único evento de la pieza que ni pinta ni apaga:
   sólo hace que otros se pinten mal.

   ── Y VA A PASITOS ─────────────────────────────────────────────────
   El foco se sortea UNA VEZ, al nacer, y de ahí en adelante cada tirón
   AVANZA un poco lo que ya había. Dos cosas avanzan, en incrementos
   pequeños:

     · `k`, cuánto está roto ahora mismo, que camina al azar entre casi
       nada y del todo. De él salen el desplazamiento de las bandas y la
       deformación, así que la rotura va y viene sin volver a empezar.
     · `giro`, la fase que recoloca las bandas. Sumada en el motor al seno
       de cada banda, las mueve a todas un poco y a cada una lo suyo.

   Sorteando el foco entero en cada tirón lo que se ve son SALTOS: la
   rotura desaparece y aparece otra distinta en otro sitio. Avanzando, se
   ve una sola avería dando pasos. El silencio entre tirones es lo que
   hace que los pasos se lean como pasos y no como una animación. */
A.evento('glitch', {
  /* no necesita exclusividad: no toca la escena entera, y que rompa el
     dibujo mientras pasa un leviatán es mejor que peor */
  exclusivo: false,
  cada: [200, 460], primero: [60, 170],
  prueba: { dura: [14, 24], saltos: [22, 40], salto: [0.22, 0.50],
            focos: [1, 2], radio: [0.30, 0.52],
            bandas: [8, 14], paso: [6, 13],
            sep: 34, estira: 0.85, avance: 0.14, giro: [0.20, 0.70],
            parte: 1, filo: 3 },
  arranca(M, p){
    const n = rangoE(p.focos);
    const lado = Math.min(M.W, M.H);
    const focos = [];
    for (let i=0;i<n;i++)
      focos.push({
        x: Math.random()*M.W, y: Math.random()*M.H,
        r: lado*rango(p.radio),
        /* `d` es el que lee el motor, y es el MISMO objeto toda la vida del
           evento: los pasos se dan mutándolo, no cambiándolo. */
        d: { bandas: rangoE(p.bandas), paso: rango(p.paso),
             parte: opt(p.parte, 1),
             giro: Math.random()*TAU, sep: 0, estira: 0 },
        /* cuánto está roto este foco ahora mismo. Arranca a medias: a 0 el
           primer tirón no se ve y lo que se lee es que el evento tardó en
           empezar. */
        k: rnd(0.35, 0.65),
      });
    return {
      focos,
      dura: rango(p.dura),
      quedan: rangoE(p.saltos),
      /* el primero cae casi enseguida: si el evento tarda en romper nada,
         lo que se ve es un hueco y luego un fallo, no un fallo */
      prox: rnd(0, 0.10),
      hasta: 0, roto: false,
    };
  },
  actualiza(e, M, p, dt){
    if (e.t > e.dura && !e.roto) return false;

    /* ¿toca dar un paso? Aquí NO se sortea el foco: se avanza. */
    if (!e.roto && e.quedan > 0 && e.t >= e.prox){
      const av = opt(p.avance, 0.15);
      for (const f of e.focos){
        /* camina al azar en incrementos cortos y con suelo: a 0 el foco se
           apaga del todo y el paso siguiente se lee como que ha vuelto a
           empezar, no como que sigue roto */
        f.k = clamp(f.k + rnd(-1, 1)*av, 0.10, 1);
        f.d.giro += rango(p.giro);
        /* del mismo `k` salen las dos: así la rotura es UNA cosa que crece
           y decrece, y no dos números sueltos que se pelean */
        f.d.sep    = opt(p.sep, 0) * f.k;
        f.d.estira = opt(p.estira, 0) * f.k;
      }
      e.roto = true;
      e.hasta = e.t + rango(p.salto);
      e.quedan--;
      /* y el silencio, corto: lo bastante para que el paso se lea como un
         paso, no tanto que el evento se quede en nada la mitad del rato */
      e.prox = e.hasta + rnd(0.05, 0.25);
    }
    /* el que manda es `dura`, y sólo él: quedarse sin `saltos` antes de
       tiempo deja al evento esperando y no lo mata —así el último paso no
       se corta a media rotura—. Aquí estuvo un `|| e.quedan > 0` que no
       hacía nada: la guarda de arriba lo mataba al fotograma siguiente. */
    if (e.roto && e.t > e.hasta){
      e.roto = false;
      return e.t <= e.dura;
    }
    if (!e.roto) return true;

    /* SIN GUARDA DE PLANO: una avería de dibujo no está a una distancia. */
    const filo = opt(p.filo, 1);
    for (const f of e.focos)
      M.campos.push({ tipo:'tajo', x: f.x, y: f.y, r: f.r,
                      fuerza: 1, filo, d: f.d });
    return true;
  },
});

/* ── EL SUPERPEZ ────────────────────────────────────────────────────
   El banco, sin dejar de nadar cada uno a lo suyo, se encuentra un rato
   con forma de pez enorme, avanza, describe una curva y se deshace. Es
   mimetismo, y existe. No dibuja ni un píxel: lo único que hace es MANDAR
   un rato, y flojo, sobre una población que ya estaba ahí.

   Que parezca casualidad es todo el evento, y son tres decisiones de NO
   hacer algo:

   1 · SE FORMA DONDE YA ESTABAN Y HACIA DONDE YA IBAN. El centro sale del
       centro de masa del banco y el rumbo, de la media de sus rumbos
       (`M.cardumen`). Nadie se desplaza a una cita.
   2 · NADIE SE CUADRA. El tirón a su sitio va flojo y a cada pez le tira
       distinto, y ninguno deja de nadar por su cuenta. Lo que hace que la
       forma cuaje no es la fuerza, es el TIEMPO.
   3 · NO SE DISPERSA, SE DESHACE. Al soltar no se empuja nada: el campo
       baja, cada pez se descuelga en su umbral y las reglas del banco
       vuelven solas.

   Los parámetros —`largo`, `reparto`, `formaPega`, `formaError`,
   `formaDesorden`, `vel`, `giroMax`— están documentados en la escena. */
A.evento('superpez', {
  exclusivo: true,
  cada: [200, 440], primero: [70, 190],
  prueba: { largo: [0.40, 0.54], largoMin: 0.26, minimo: 12,
            superpeces: [1, 2], reparto: [0.55, 0.90], redondez: [0.70, 1.55],
            entra: [8, 14], nada: [7, 13], sale: [4, 7],
            vel: [0.25, 0.55], giroMax: 0.10, giroPaso: 0.035, vira: 2.8,
            alcance: 2.2, filo: 6.0, plano: 2 },
  arranca(M, p){
    const plano = opt(p.plano, 2);
    /* EL BANCO ENTERO, de los tres planos: el campo se pone en `plano` pero
       la guarda de profundidad sólo excluye a quien pregunta desde más
       cerca, así que se le apuntan también los de atrás. Contando sólo el
       plano de delante salían 29 candidatos de los 68 que de hecho entran,
       y el evento nunca llegaba a partirse en dos siluetas. */
    const cs = M.cardumen();
    /* ── QUIÉNES SE APUNTAN ──────────────────────────────────────
       No todos, y por travesía: `reparto` es la fracción del banco que
       entra y `apunta` el número que cada pez lleva de nacimiento. Se
       CUENTAN en vez de estimarlos, porque con sesenta y ocho peces el
       sorteo se desvía lo suyo de su media. Los que no entran siguen
       nadando a lo suyo, también por encima de la silueta: eso es la mitad
       de lo que hace que la forma parezca una casualidad. */
    const cupo = rango(p.reparto);
    const dentro = [];
    for (const z of cs) if (z.apunta < cupo) dentro.push(z);
    const min = opt(p.minimo, 1);
    if (dentro.length < min) return null;

    /* ── UNA SILUETA O DOS ───────────────────────────────────────
       Dos sólo si hay peces para las dos. Al partirse, el banco se parte
       por donde se partiría solo: por el costado, o sea por el signo de la
       perpendicular a su rumbo medio. Cada mitad saca su propio centro y
       rumbo, así que ninguna se coloca a mano. */
    let grupos = [dentro];
    if (rangoE(p.superpeces || 1) > 1 && dentro.length >= min*2){
      const m = mediasBanco(dentro);
      const ca = Math.cos(m.ang), sa = Math.sin(m.ang);
      const a = [], b = [];
      for (const z of dentro)
        ((z.x - m.cx)*(-sa) + (z.y - m.cy)*ca > 0 ? a : b).push(z);
      /* si el corte sale desigual no hay dos siluetas: una de cuatro peces
         no es una silueta, es cuatro peces */
      if (a.length >= min && b.length >= min) grupos = [a, b];
    }

    /* EL LARGO SE REPARTE. Dos siluetas se hacen con la mitad de peces
       cada una, así que si midieran lo mismo saldrían al doble de
       separación entre peces y el canto dejaría de cerrar. Por la raíz
       porque lo que hay que mantener es la densidad por PERÍMETRO. */
    const parte = 1/Math.sqrt(grupos.length);
    const formas = [];
    for (const g of grupos){
      const m = mediasBanco(g);
      const gordo = rango(p.redondez);
      const esc = escQueCabe(M, m.cx, m.cy, m.ang,
                             M.W * rango(p.largo) * parte, gordo);
      /* y si lo que cabe ya no es un SUPERpez, ésta no sale: media silueta
         asomando por un canto no se lee, y el evento es que se lea */
      if (esc < M.W * opt(p.largoMin, 0) * parte) continue;
      formas.push({
        cx: m.cx, cy: m.cy, ang: m.ang, esc,
        vel:  rango(p.vel) * M.U,
        giro: rnd(-1, 1) * opt(p.giroMax, 0),
        /* el `d` del campo se reutiliza: se empuja uno por fotograma y
           crearlo cada vez es basura por nada */
        d: {cx:0, cy:0, ang:0, esc:0, gordo, cupo},
      });
    }
    if (!formas.length) return null;
    return {
      plano, formas,
      e: rango(p.entra), n: rango(p.nada), s: rango(p.sale),
      u: 0,
      c: M.color(p.paleta),
    };
  },
  actualiza(e, M, p, dt){
    if (!e.formas) return false;
    const T = e.e + e.n + e.s;
    if (e.t > T) return false;
    /* `u` es cuánto manda la forma, y es también el peso del campo, o sea
       cuánto se deja llevar cada pez. Las dos rampas van con `suave`: una
       recta se nota al empezar y al acabar, y lo que se pide es que no se
       note ni una cosa ni la otra. */
    const t = e.t;
    e.u = t < e.e          ? suave(t/e.e)
        : t < e.e + e.n    ? 1
                           : suave(clamp(1 - (t - e.e - e.n)/e.s, 0, 1));

    const gMax = opt(p.giroMax, 0), gPaso = opt(p.giroPaso, 0);
    const filo = opt(p.filo, 1.4), alc = opt(p.alcance, 0.95);
    for (const f of e.formas){
      /* ── AVANZA Y GIRA ──────────────────────────────────────────
         El rumbo gira a una velocidad que camina despacio: con un giro
         fijo describe un arco de compás y con un rumbo objetivo que se
         sortea da tirones. Caminando, la curva se abre y se cierra sola.
         Cada silueta lleva el suyo, así que dos no van en paralelo. */
      f.giro = clamp(f.giro + rnd(-1, 1)*gPaso*dt*6, -gMax, gMax);
      f.ang += f.giro * dt;
      /* CONTENIDA POR EL CANTO, que es lo único que se le impone: cerca
         del borde el rumbo se tuerce hacia dentro. Sin esto la silueta se
         sale del cuadro justo cuando acaba de cuajar.

         Y SE MIDE EN EL MORRO, no en el centro. `M.borde` tiene un margen
         fijo y el morro de la silueta va medio largo por delante de su
         centro —con un tercio de pantalla de eslora, casi doscientos
         píxeles—, así que midiendo en el centro, cuando la silueta empieza
         a virar el morro lleva un rato fuera del cuadro.

         Es DE LEJOS lo que más hizo por que la silueta quepa, y bastante
         más que encogerla. Medido: la fracción del contorno que queda
         dentro del cuadro en el peor momento de cada travesía, de media,

           | como estaba (larga, y midiendo en el centro) | 0,73 |
           | sólo encogiéndola                            | 0,76 |
           | encogida y midiendo en el morro              | 0,89 |

         o sea que el tamaño explica tres centésimas y el punto de medida
         trece. Mirar también la cola no se distingue del ruido. */
      const mx = f.cx + Math.cos(f.ang)*f.esc*0.5;
      const my = f.cy + Math.sin(f.ang)*f.esc*0.5;
      const b = M.borde(mx, my);
      if (b[2] > 0.01){
        const dd = giroCorto(Math.atan2(b[1], b[0]), f.ang);
        f.ang += dd * Math.min(1, b[2]*opt(p.vira, 1.6)*dt);
      }
      f.cx += Math.cos(f.ang)*f.vel*dt;
      f.cy += Math.sin(f.ang)*f.vel*dt;

      const d = f.d;
      d.cx = f.cx; d.cy = f.cy; d.ang = f.ang; d.esc = f.esc;
      /* UN CAMPO POR SILUETA. Con dos, cada pez lee el que más le pesa, o
         sea el de la silueta a la que está más cerca: el reparto es
         espacial y no hace falta que nadie lleve apuntado a qué bando va.
         Y como las dos nacen sobre el centro de su propia mitad del banco,
         casi todos empiezan ya del lado que les toca. */
      M.campos.push({ tipo:'forma', plano: e.plano, x: f.cx, y: f.cy,
                      r: f.esc*alc, fuerza: e.u, filo, c: e.c, d });
    }
    return true;
  },
});

/* el centro y el rumbo medios de una lista de peces. El rumbo, como
   vectores: promediar radianes se rompe al cruzar el ±π —179° y −179°
   promedian 0°, o sea justo el contrario. */
function mediasBanco(lista){
  let cx = 0, cy = 0, sx = 0, sy = 0;
  for (const z of lista){
    cx += z.x; cy += z.y;
    sx += Math.cos(z.ang); sy += Math.sin(z.ang);
  }
  const n = lista.length;
  return { cx: cx/n, cy: cy/n,
           ang: (sx || sy) ? Math.atan2(sy, sx) : Math.random()*TAU };
}

/* ── LA SILUETA ─────────────────────────────────────────────────────
   Un pez, en coordenadas propias: el morro en x = −0,5, la base de la cola
   en x = +0,5 y la horquilla por detrás. `anchoPez` es el semiancho, y el
   exponente 0,62 pone el máximo a un tercio del morro —que es donde un pez
   es más ancho—: con `sin(π·s)` pelado cae en el centro y sale un puro. */
/* `gordo` es lo redonda que sale ESTA silueta, y lo sortea cada superpez.
   Multiplica al semiancho y nada más, así que el morro, la cintura y la
   cola siguen donde estaban. */
const anchoPez = (s, gordo) =>
  0.30*(gordo || 1)*Math.pow(Math.sin(Math.PI*Math.pow(clamp(s,0,1),0.62)), 0.85);

/* El contorno recorrido: `u` de 0 a 1 da la vuelta entera. Los tramos son
   canto de arriba (42 %), horquilla de la cola (16 %) y canto de abajo
   (42 %) —el reparto es el que hace que la cola tenga peces suficientes
   para leerse: a menos del 15 % la horquilla se queda en dos puntos. */
function contornoPez(u, o, gordo){
  if (u < 0.42){
    const s = u/0.42;
    o[0] = -0.5 + s; o[1] = -anchoPez(s, gordo);
  } else if (u < 0.58){
    /* la horquilla, en tres tramos rectos: punta de arriba, muesca del
       centro y punta de abajo */
    /* la horquilla crece con el cuerpo: una cola de pez plano es ancha */
    const h = 0.27*(0.55 + 0.45*(gordo || 1));
    const v = (u - 0.42)/0.16;
    if (v < 0.34){ const k = v/0.34;
      o[0] = 0.5 + 0.20*k; o[1] = -h*k; }
    else if (v < 0.66){ const k = (v-0.34)/0.32;
      /* pasa por la muesca, que es lo que la hace horquilla y no abanico */
      const mx = 0.56, my = 0;
      o[0] = k < 0.5 ? 0.70 + (mx-0.70)*(k/0.5) : mx + (0.70-mx)*((k-0.5)/0.5);
      o[1] = k < 0.5 ? -h + (my+h)*(k/0.5) : my + h*((k-0.5)/0.5); }
    else { const k = (v-0.66)/0.34;
      o[0] = 0.70 - 0.20*k; o[1] = h*(1-k); }
  } else {
    const s = 1 - (u - 0.58)/0.42;
    o[0] = -0.5 + s; o[1] = anchoPez(s, gordo);
  }
  return o;
}

/* El sitio de ESTE pez dentro de la silueta, en mundo. Sale de su `orden`,
   que no cambia nunca, así que el reparto es estable y la forma no hierve.

   El 88 % va al CONTORNO y el resto al relleno: un contorno pelado de
   sesenta peces se lee como un alambre, y relleno del todo se lee como una
   mancha. El relleno usa el `oy` del bicho para el lado, así que tampoco
   se alinean en fila.                                                */
const _cp = [0,0], _cq = [0,0];
const CONTORNO = 0.88;          // qué parte del banco va al canto
function formaObjetivo(d, z, o){
  const t = z.orden;
  let lx, ly, tg;
  if (t < CONTORNO){
    const u = t/CONTORNO;
    contornoPez(u, _cp, d.gordo);
    lx = _cp[0]; ly = _cp[1];
    /* LA TANGENTE DEL CANTO, por diferencias. Es lo que de verdad hace que
       la silueta se lea: con todos los peces paralelos al rumbo, un canto
       hecho de rayitas de 40 px se lee como una fila de guiones y no como
       una línea. Puestos A LO LARGO del canto, el contorno se cierra. */
    contornoPez((u + 0.012) % 1, _cq, d.gordo);
    tg = Math.atan2(_cq[1] - _cp[1], -(_cq[0] - _cp[0]));
  } else {
    /* el relleno: un punto estable dentro del cuerpo, y de morro al rumbo
       como el resto del banco */
    const s = 0.10 + 0.74*((t - CONTORNO)/(1 - CONTORNO));
    lx = -0.5 + s; ly = z.oy*anchoPez(s, d.gordo)*0.80;
    tg = 0;
  }
  /* EL MORRO VA DELANTE. `contornoPez` está escrito con el morro en el
     local −0,5 porque es como se lee una silueta de izquierda a derecha,
     pero el eje +x del bicho es su rumbo: sin este signo el pez nadaba de
     espaldas, con la cola por delante y el morro arrastrando. */
  lx = -lx;
  const ca = Math.cos(d.ang), sa = Math.sin(d.ang);
  o[0] = d.cx + (lx*ca - ly*sa)*d.esc;
  o[1] = d.cy + (lx*sa + ly*ca)*d.esc;
  o[2] = d.ang + tg;
  return o;
}

/* EL LARGO QUE CABE. Se prueban escalas de mayor a menor y se devuelve la
   primera en la que al menos el 87 % de una muestra del contorno cae dentro
   del cuadro. El resto que se admite fuera es a propósito: un pez al que no
   se le ve la punta de la cola sigue siendo un pez, y exigir el 100 % lo
   dejaba siempre en el mínimo.

   Se mide por muestreo y no con geometría porque el contorno no es una
   elipse y el ángulo es cualquiera: probar 24 puntos es más corto de
   escribir, más corto de leer y no se equivoca. */
function escQueCabe(M, cx, cy, ang, quiere, gordo){
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (let k=0;k<7;k++){
    const esc = quiere*(1 - k*0.09);
    let dentro = 0;
    for (let i=0;i<24;i++){
      contornoPez(i/24, _cp, gordo);
      const lx = -_cp[0], ly = _cp[1];
      const x = cx + (lx*ca - ly*sa)*esc, y = cy + (lx*sa + ly*ca)*esc;
      if (x > 0 && x < M.W && y > 0 && y < M.H) dentro++;
    }
    if (dentro >= 21) return esc;       // 21 de 24 es el 87 %
  }
  return quiere*0.46;
}

})();
