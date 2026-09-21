/* ══════════════════════════════════════════════════════════════════
   ANDAMIO — NO FORMA PARTE DE LA PIEZA. Borrable entero.

   Banco de pruebas del rape: la misma tubería de dibujo que
   bichos/rape-cuerpo.js, pero con la FORMA sacada a un objeto `D` para
   poder poner varios diseños uno al lado del otro. Lo que salga elegido
   se porta a rape-cuerpo.js a mano.
   ══════════════════════════════════════════════════════════════════ */
import { M } from '../motor.js';
const { rgba, clamp, opt, TAU } = M;
import { mancha, reparte } from '../bichos/comun.js';
import { enPez, aMundo, centro, volumen } from '../bichos/rape-cuerpo.js';

/* ── LUZ PLANA ──────────────────────────────────────────────────────
   Todos los degradados de este dibujo son radiales centrados en la esca
   y con radio atado a `dl`, así que un trozo que se aleja del señuelo se
   apaga. Es la regla de la casa y está bien, pero para juzgar una FORMA
   hace falta poder mirar el bicho entero: con `llano` los radios se van
   a ocho largos y todo queda alumbrado por igual. */
let LLANO = false, FOCO = 1;
const llano = v => { LLANO = v; };
/* ── Y EL SUELO DEL RADIO ───────────────────────────────────────────
   `dl` es lo lejos que está la esca del centro del cuerpo, y AL MORDER
   la esca se recoge al morro (`retrae` 0,95), así que `dl` se derrumba
   justo en el fotograma del bocado y con él el radio. Resultado: la
   boca abierta de par en par —lo único que el bocado existe para
   enseñar— cae fuera del foco y se dibuja negra. `foco` sube el suelo:
   con una mandíbula que baja casi un largo, 0,6 no llega. */
const radio = (Lg, dl, a, b) => LLANO ? Lg*8 : Math.max(Lg*a*FOCO, dl*b);

/* la flexión de nado, igual que en la pieza */
const flex = (u,f,t) => Math.sin(u*2.6 - t*f.velCola + f.fase)
                        * f.amplitudCola * Math.pow(u,1.6)
                        * (1 - 0.9*f.congela);

/* ── EL PERFIL ──────────────────────────────────────────────────────
   `sesgo` reparte las muestras: >1 las amontona en el morro, que es
   donde los diseños nuevos tienen la muesca de la mandíbula. */
function perfilPath(g, f, t, D){
  const N = D.N || 26, Lg = f.Lg, sg = D.sesgo || 1;
  const uu = i => Math.pow(i/N, sg);
  const C = D.crestas;
  g.beginPath();
  let ini = true;
  const pon = (x,y) => { if (ini){ g.moveTo(x,y); ini = false; } else g.lineTo(x,y); };
  for (let i=0;i<=N;i++){
    const u = uu(i);
    pon(u*Lg, (flex(u,f,t) - D.lomo(u))*Lg);
    /* ── LAS PÚAS DEL LOMO ──────────────────────────────────────
       Van DENTRO de la silueta y no dibujadas encima: así las traza el
       canto, que a oscuras es lo único que se ve de este bicho. Se
       insertan al cruzar su `u`, en orden de x, o el trazado se cruza
       consigo mismo. Se inclinan hacia la cola, y menos de medio ancho:
       pasado eso la punta adelanta a su propia base. */
    if (C && i < N){
      const uf = uu(i+1);
      for (let k=0;k<C.n;k++){
        const uc = C.u0 + (C.u1-C.u0)*reparte(k, C.n);
        if (uc < u || uc >= uf) continue;
        const h = C.alto*(0.55 + 0.45*Math.abs(Math.sin(k*2.3 + 1.1)));
        const yb = (flex(uc,f,t) - D.lomo(uc))*Lg;
        pon((uc - C.ancho*0.5)*Lg, yb);
        pon((uc + C.ancho*0.45)*Lg, yb - h*Lg);
        pon((uc + C.ancho*0.5)*Lg, yb);
      }
    }
  }
  const c = D.caudal, yc = flex(1,f,t)*Lg;
  g.lineTo(Lg*c.x, yc - Lg*c.y);
  g.lineTo(Lg*c.muesca, yc);
  g.lineTo(Lg*c.x, yc + Lg*c.y);
  for (let i=N;i>=0;i--){
    const u = uu(i);
    g.lineTo(u*Lg, (flex(u,f,t) + D.panza(u))*Lg);
  }
  g.closePath();
}

/* ── PIEL ───────────────────────────────────────────────────────────
   Rebanadas con sombreado de cilindro, calcadas de la pieza. */
const REBANADAS = 26, VSTOPS = 9;
const PROA_U = [0, 0.20, 0.48, 1];
const _proaA = [0,0,0,0];
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
function piel(g, f, gx, t, col, br, proa, ladoY, D){
  const Lg = f.Lg, suelo = 1 - proa;
  const lz = 0.62, il = 1/Math.hypot(ladoY, lz);
  const pc = proaCoef(proa);
  enPez(g, f, gx, () => {
    const m = Lg*0.04;
    for (let i=0;i<REBANADAS;i++){
      const u0 = i/REBANADAS, u1 = (i+1)/REBANADAS, u = (u0+u1)*0.5;
      const alfa = (0.40*suelo + proaA(u/1.15, pc)) * br;
      if (alfa < 0.004) continue;
      const fl = flex(u,f,t);
      const yl = (fl - D.lomo(u))*Lg, yp = (fl + D.panza(u))*Lg;
      const gr = g.createLinearGradient(0, yl, 0, yp);
      for (let k=0;k<=VSTOPS;k++){
        const v = k/VSTOPS*2 - 1;
        const n = Math.sqrt(Math.max(0, 1 - v*v));
        const d = Math.max(0, (v*ladoY + n*lz)*il);
        gr.addColorStop(k/VSTOPS, rgba(col, alfa*(Math.pow(d, 1.7)*0.88 + 0.12)));
      }
      g.fillStyle = gr;
      g.fillRect(u0*Lg, yl - m, (u1-u0)*Lg, yp - yl + 2*m);
    }
  });
}

/* ── VÍSCERAS ───────────────────────────────────────────────────────
   Branquia, línea lateral, miómeros y —nuevo— las espínulas de la piel. */
function visceras(g, f, gx, t, col, br, sh, proa, D){
  const Lg = f.Lg;
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
  if (f.miomeros){
    g.strokeStyle = eje(0.085*br*sh);
    g.lineWidth = Math.max(0.4, Lg*0.008);
    for (let i=0;i<f.miomeros;i++){
      const u = 0.34 + 0.56*reparte(i, f.miomeros);
      enPez(g, f, gx, () => {
        g.beginPath();
        g.moveTo(u*Lg, (flex(u,f,t) - D.lomo(u)*0.74)*Lg);
        g.quadraticCurveTo((u - 0.05)*Lg, flex(u,f,t)*Lg,
                           u*Lg, (flex(u,f,t) + D.panza(u)*0.74)*Lg);
      });
      g.stroke();
    }
  }
  /* LAS ESPÍNULAS. La piel de un Melanocetus está sembrada de púas
     diminutas; a este tamaño se leen como grano y son lo que separa
     «bolsa lisa» de «cosa». Un solo trazado para todas. */
  if (D.espinulas){
    g.fillStyle = eje(0.28*br*sh);
    enPez(g, f, gx, () => {
      g.beginPath();
      let s = 1;
      const az = () => (s = (s*16807) % 2147483647) / 2147483647;
      for (let i=0;i<D.espinulas;i++){
        const u = 0.04 + 0.92*az();
        const v = az()*2 - 1;
        const fl = flex(u,f,t);
        const y = fl + (v < 0 ? v*D.lomo(u) : v*D.panza(u))*0.88;
        const r = Lg*0.0055*(0.6 + 0.8*az());
        g.moveTo(u*Lg + r, y*Lg);
        g.arc(u*Lg, y*Lg, r, 0, TAU);
      }
    });
    g.fill();
  }
  g.strokeStyle = eje(0.20*br*sh);
  g.lineWidth = Math.max(0.5, Lg*0.011);
  enPez(g, f, gx, () => {
    g.beginPath();
    g.moveTo(Lg*0.30, (flex(0.30,f,t)-D.lomo(0.30)*0.80)*Lg);
    g.quadraticCurveTo(Lg*0.23, flex(0.30,f,t)*Lg,
                       Lg*0.33, (flex(0.33,f,t)+D.panza(0.33)*0.82)*Lg);
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

/* ── ALETAS ─────────────────────────────────────────────────────────
   `D.aletas` dice de dónde a dónde va cada una y cuánto levanta;
   `D.brazo` pone la pectoral sobre un muñón carnoso —el «bracito» de
   los ceratioides— y `D.rayos`, los radios larguísimos de Caulophryne. */
function aletas(g, f, gx, t, col, br, dl, D){
  const Lg = f.Lg, A = D.aletas;
  const gf = g.createRadialGradient(f.luzX, f.luzY, 0, f.luzX, f.luzY,
                                    radio(Lg, dl, 0.7, 1.5));
  gf.addColorStop(0.00, rgba(col, 0.42*br));
  gf.addColorStop(0.45, rgba(col, 0.19*br));
  gf.addColorStop(1.00, rgba(col, 0));
  g.fillStyle = gf;
  enPez(g, f, gx, () => {                 // dorsal
    g.beginPath();
    g.moveTo(Lg*A.d0, (flex(A.d0,f,t)-D.lomo(A.d0))*Lg);
    const um = (A.d0+A.d1)/2;
    g.quadraticCurveTo(Lg*um, (flex(um,f,t)-D.lomo(um)-A.dAlto)*Lg,
                       Lg*A.d1, (flex(A.d1,f,t)-D.lomo(A.d1))*Lg);
    g.closePath();
  });
  g.fill();
  enPez(g, f, gx, () => {                 // anal
    g.beginPath();
    g.moveTo(Lg*A.a0, (flex(A.a0,f,t)+D.panza(A.a0))*Lg);
    const um = (A.a0+A.a1)/2;
    g.quadraticCurveTo(Lg*um, (flex(um,f,t)+D.panza(um)+A.aAlto)*Lg,
                       Lg*A.a1, (flex(A.a1,f,t)+D.panza(A.a1))*Lg);
    g.closePath();
  });
  g.fill();

  /* LA PECTORAL. `pala` es la de la pieza —una hoja pegada al costado—;
     `brazo` la pone en la punta de un muñón, que es como la lleva un
     ceratioide de verdad y lo que la convierte en una manita. */
  const ax = Lg*A.p0, ay = (flex(A.p0,f,t)+D.panza(A.p0)*A.pY)*Lg;
  const vai = 0.05*Math.sin(t*1.1 + f.fase);
  if (D.brazo){
    const bl = Lg*D.brazo, bg = Lg*0.042;
    const bax = ax + bl*0.92, bay = ay + bl*(0.34 + vai*2);
    enPez(g, f, gx, () => {               // el muñón
      g.beginPath();
      g.moveTo(ax, ay - bg);
      g.quadraticCurveTo(ax + bl*0.6, ay + bl*0.05, bax, bay - bg*0.7);
      g.lineTo(bax, bay + bg*0.7);
      g.quadraticCurveTo(ax + bl*0.5, ay + bl*0.22, ax, ay + bg);
      g.closePath();
    });
    g.fill();
    g.strokeStyle = gf;                   // y el abanico de radios
    g.lineWidth = Math.max(0.5, Lg*0.009);
    enPez(g, f, gx, () => {
      g.beginPath();
      for (let i=0;i<6;i++){
        const a = -0.25 + 1.15*reparte(i, 6) + vai;
        g.moveTo(bax, bay);
        g.lineTo(bax + Math.cos(a)*Lg*0.17, bay + Math.sin(a)*Lg*0.17);
      }
    });
    g.stroke();
  } else {
    enPez(g, f, gx, () => {
      const w = 0.14 + vai;
      g.beginPath();
      g.moveTo(ax, ay);
      g.quadraticCurveTo(ax+Lg*0.20, ay+Lg*w, ax+Lg*0.30, ay+Lg*(w*0.35));
      g.quadraticCurveTo(ax+Lg*0.18, ay+Lg*0.03, ax, ay);
      g.closePath();
    });
    g.fill();
  }

  g.strokeStyle = gf;                     // radios de la caudal
  g.lineWidth = Math.max(0.5, Lg*0.010);
  enPez(g, f, gx, () => {
    const yc = flex(1,f,t)*Lg, n = D.caudal.radios;
    g.beginPath();
    for (let i=0;i<n;i++){
      const s = reparte(i,n)*2 - 1;
      g.moveTo(Lg*1.00, yc + s*Lg*0.050);
      g.lineTo(Lg*(D.caudal.x - 0.01), yc + s*Lg*0.145);
    }
  });
  g.stroke();
  if (f.radios){
    g.lineWidth = Math.max(0.4, Lg*0.0065);
    const alto = (u, a, b, h) => h*Math.sin(Math.PI*(u-a)/(b-a));
    enPez(g, f, gx, () => {
      g.beginPath();
      for (let i=1;i<=f.radios;i++){
        const u = A.d0 + (A.d1-A.d0)*i/(f.radios+1);
        const y = (flex(u,f,t) - D.lomo(u))*Lg;
        g.moveTo(u*Lg, y);
        g.lineTo(u*Lg, y - alto(u, A.d0, A.d1, A.dAlto)*Lg);
      }
      for (let i=1;i<=f.radios;i++){
        const u = A.a0 + (A.a1-A.a0)*i/(f.radios+1);
        const y = (flex(u,f,t) + D.panza(u))*Lg;
        g.moveTo(u*Lg, y);
        g.lineTo(u*Lg, y + alto(u, A.a0, A.a1, A.aAlto)*Lg);
      }
    });
    g.stroke();
  }

  /* LOS RADIOS LARGOS. Caulophryne no tiene aleta: tiene una corona de
     filamentos sueltos, cada uno más largo que el cuerpo. Se trazan
     enteros y con su propio vaivén: es lo único que rompe del todo la
     silueta de hoja. */
  if (D.rayos){
    const R = D.rayos;
    g.strokeStyle = gf;
    g.lineWidth = Math.max(0.5, Lg*0.0075);
    enPez(g, f, gx, () => {
      g.beginPath();
      for (const lado of [-1, 1]){
        const u0 = lado < 0 ? R.d0 : R.a0, u1 = lado < 0 ? R.d1 : R.a1;
        for (let i=0;i<R.n;i++){
          const k = reparte(i, R.n), u = u0 + (u1-u0)*k;
          const y = (flex(u,f,t) + lado*(lado<0 ? D.lomo(u) : D.panza(u)))*Lg;
          /* largos desiguales y en abanico hacia atrás: parejos parecen
             un peine, y ése es justo el fallo que vienen a arreglar */
          const lar = Lg*R.largo*(0.55 + 0.45*Math.abs(Math.sin(i*2.1 + lado)));
          const ang = lado*(0.55 + 0.75*k) + (lado<0 ? -0.1 : 0.1);
          const on = Math.sin(t*0.8 + i*1.7 + f.sway)*R.onda;
          const cx = u*Lg + Math.cos(ang*0.4)*lar*0.5;
          const cy = y + Math.sin(ang*0.4)*lar*0.5 + lado*lar*on;
          g.moveTo(u*Lg, y);
          g.quadraticCurveTo(cx, cy,
                             u*Lg + Math.cos(ang)*lar*0.9,
                             y + Math.sin(ang)*lar + lado*lar*on*1.6);
        }
      }
    });
    g.stroke();
  }
}

/* ── LAS QUIJADAS ───────────────────────────────────────────────────
   Como en la pieza, más `D.morro`: dónde empieza la quijada de ARRIBA.
   Por delante de ahí sólo hay quijada de abajo, y eso es el prognatismo
   —la barbilla por delante del morro—, que es la mitad de la cara de un
   rape y hoy no está. */
function quijadas(f, p, D){
  const Lg = f.Lg;
  const jx = Lg*p.bocaLargo;
  /* LA LÍNEA DE LABIOS, tres puntos en vez de dos: `mY` en el morro,
     `cY` el arco de en medio y `jy` la charnela. Con `jy` NEGATIVA la
     charnela sube por encima del eje y la boca queda OBLICUA —la mueca
     de un rape de verdad—; con 0,10 se reproduce la de la pieza. */
  const G = D.gape || {};
  const jy = Lg*opt(G.jy, 0.10);
  const mY = Lg*opt(G.mY, 0);
  const cY = Lg*opt(G.cY, p.bocaHondo*0.5);
  const mo = Lg*(D.morro || 0);
  const bocaY = u => (1-u)*(1-u)*mY + 2*u*(1-u)*cY + u*u*jy;
  const ab = opt(p.entreabierta, 0)
           + Math.sin(Math.pow(Math.min(1, 1-f.ataque), 0.55)*Math.PI) * p.abertura
           + f.masticaAb + f.respAb;
  const arriba = opt(D.quijadaArriba, p.quijadaArriba);
  const giro = sg => sg > 0 ? 2*ab*arriba : -2*ab*(1 - arriba);
  /* la de arriba arranca en `mo`; la de abajo, en el morro del cuerpo */
  const x0 = sg => sg > 0 ? mo : 0;
  return { jx, jy, ab, giro, mo, bocaY,
    /* cualquier punto del pez girado con una de las dos quijadas: lo
       necesita la mandíbula, que no es una línea sino un cuerpo */
    rota(sg, x, y, o){
      const r = giro(sg), ca = Math.cos(r), sa = Math.sin(r);
      const dx = x - jx, dy = y - jy;
      o[0] = jx + dx*ca - dy*sa;
      o[1] = jy + dx*sa + dy*ca;
      return o;
    },
    punto(sg, u, o){
      const r = giro(sg), a0 = x0(sg);
      const dx = a0 + u*(jx-a0) - jx, dy = bocaY(u) - jy;
      const ca = Math.cos(r), sa = Math.sin(r);
      o[0] = jx + dx*ca - dy*sa;
      o[1] = jy + dx*sa + dy*ca;
      return o;
    } };
}

const _q = [0,0], _q2 = [0,0], _p0 = [0,0], _p1 = [0,0];
function bocaPath(g, q, D){
  /* La prolongación por delante del morro sólo tiene que limpiar la cuña
     de carne que las quijadas dejan atrás: a `jx*2` y con la boca abierta
     de par en par, el hueco se convierte en un abanico que se lleva media
     cabeza. */
  const N = 10, fuera = q.jx*(D && D.mandibula ? 0.9 : 2);
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

/* ── LA MANDÍBULA ───────────────────────────────────────────────────
   LA PIEZA QUE FALTA. Hoy la quijada de abajo es una LÍNEA con dientes
   y la carne que hay debajo no gira con ella, así que al abrir la boca
   no baja una barbilla: se abre un agujero en el sitio donde estaba la
   cara. Dibujada como cuerpo —labio arriba, canto de la quijada abajo,
   los dos girando sobre la charnela— el bocado se lee.

   El canto sale de la PANZA del cuerpo y se cierra contra la charnela,
   así que con la boca cerrada la mandíbula cae justo encima de la
   silueta y no se ve costura; lo que separa las dos líneas es el giro. */
function mandibula(g, f, gx, q, D, col, br, dl, gb, entre){
  const Lg = f.Lg, N = 16, bl = q.jx/Lg;
  /* EL CANTO ES LA PANZA DEL CUERPO hasta tres cuartos de quijada, y
     sólo en el último cuarto se cierra contra la charnela —el eje del
     giro tiene que caer EN la pieza o la quijada barre como un remo—.
     Cerrada la boca, la mandíbula cae así exactamente sobre la silueta
     y no se ve una segunda papada. */
  const ventral = (u, o) => {
    const k = u < 0.74 ? 0 : Math.pow((u-0.74)/0.26, 1.5);
    const y = (1-k)*D.panza(u*bl)*Lg + k*q.jy;
    return q.rota(-1, u*q.jx, y, o);
  };
  enPez(g, f, gx, () => {
    g.beginPath();
    for (let i=0;i<=N;i++){
      const pt = q.punto(-1, i/N, _q);
      i ? g.lineTo(pt[0], pt[1]) : g.moveTo(pt[0], pt[1]);
    }
    for (let i=N;i>=0;i--){
      const pt = ventral(i/N, _q);
      g.lineTo(pt[0], pt[1]);
    }
    g.closePath();
  });
  /* Y ENTRA CON LA ABERTURA. Cerrada no aporta nada —el canto del cuerpo
     ya traza esa línea— y lo único que hace es doblarla. */
  const ent = clamp((q.ab - entre)/0.25, 0, 1);
  if (ent <= 0) return;
  const gm = g.createRadialGradient(f.luzX, f.luzY, 0, f.luzX, f.luzY,
                                    radio(Lg, dl, 0.7, 1.5));
  gm.addColorStop(0.00, rgba(col, 0.30*br));
  gm.addColorStop(0.45, rgba(col, 0.13*br));
  gm.addColorStop(1.00, rgba(col, 0));
  g.globalAlpha = ent;
  g.fillStyle = gm;
  g.fill();
  g.strokeStyle = gb;
  g.lineWidth = Math.max(0.5, Lg*0.0075);
  g.stroke();
  g.globalAlpha = 1;
}

/* ── LA BOCA Y LOS DIENTES ──────────────────────────────────────────
   `D.colmillo` es lo que cambia: 0 son los triángulos de la pieza, 1 un
   colmillo GANCHUDO —base ancha, punta curvada hacia la garganta—, que
   es cómo son de verdad y lo que hace que la boca lea como trampa y no
   como sierra. `D.frente` alarga los de delante y encoge los de atrás:
   un Melanocetus lleva los colmillos largos en el morro.             */
function boca(g, f, gx, p, gb, q, D){
  const Lg = f.Lg;
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
  const nd = f.dientes, gan = D.colmillo || 0, fr = D.frente || 0;
  const dl = opt(D.diente, 1);        // lo largos que van, sobre el de la pieza
  const da = opt(D.dienteAncho, 1);   // y lo gruesos: aguja contra cuña
  const fila = (largo, ancho, dentro, alfa, hasta) => {
    g.fillStyle = gb;
    g.globalAlpha = alfa;
    enPez(g, f, gx, () => {
      g.beginPath();
      for (const sg of [-1, 1]){
        const r = q.giro(sg), ca = Math.cos(r), sa = Math.sin(r);
        for (let i=0;i<nd;i++){
          const u = dentro + (1-dentro)*(i+0.5)/nd;
          if (hasta && u > hasta) continue;
          const pt = q.punto(sg, u, _q), qx = pt[0], qy = pt[1];
          const irr = Math.abs(Math.sin(i*2.7 + 1.1 + (sg>0?0.7:0)));
          /* el reparto a lo largo de la quijada: `frente` convierte la
             cremallera pareja en cuatro colmillos delante y sierra detrás */
          const perfil = (1 - u*0.35) * (1 + fr*(Math.pow(1-u, 2.2)*1.25 - 0.30));
          /* ── LO DESIGUALES QUE VAN ──────────────────────────
             A `desigual` 0, el largo base más un poco de variación: una
             sierra pareja, que es lo que se lee como PEINE. A 1, casi
             todo el largo sale de la variación elevada, así que salen
             tres o cuatro colmillos largos entre muchos cortos —que es
             como están en los dos dibujos. */
          const mez = opt(D.desigual, 0);
          const alt = (0.055 + 0.075*irr)*(1-mez)
                    + (0.022 + 0.175*Math.pow(irr, 1.8))*mez;
          let alto = Lg*largo*alt*perfil*dl;
          let anc = Lg*ancho*0.024*(1-u*0.3)*da;
          const o = q.punto(-sg, u, _q2);
          const k = Math.min(1, Math.hypot(qx-o[0], qy-o[1])*0.62/alto);
          if (k < 0.06) continue;
          alto *= k; anc *= k;
          const pta = sg*alto, b = sg*anc;
          if (!gan){
            g.moveTo(qx - b*ca, qy - b*sa);
            g.lineTo(qx + b*ca, qy + b*sa);
            g.lineTo(qx + anc*0.3*ca - pta*sa, qy + anc*0.3*sa + pta*ca);
            g.closePath();
          } else {
            /* GANCHO. La punta se corre hacia la charnela y los dos
               costados son curvas: uno cóncavo y otro convexo, que es lo
               que da el colmillo curvado en vez de la cuña. */
            const cur = gan*alto*0.55;
            const tx = qx + anc*0.2*ca - pta*sa + cur*ca;
            const ty = qy + anc*0.2*sa + pta*ca + cur*sa;
            const bx0 = qx - b*ca, by0 = qy - b*sa;
            const bx1 = qx + b*ca, by1 = qy + b*sa;
            g.moveTo(bx0, by0);
            g.quadraticCurveTo(bx0 - pta*sa*0.55 + cur*ca*0.15,
                               by0 + pta*ca*0.55 + cur*sa*0.15, tx, ty);
            g.quadraticCurveTo(bx1 - pta*sa*0.40 + cur*ca*0.75,
                               by1 + pta*ca*0.40 + cur*sa*0.75, bx1, by1);
            g.closePath();
          }
        }
      }
    });
    g.fill();
    g.globalAlpha = 1;
  };
  /* Tres filas delante y una detrás, que es el reparto real: `vomer` es
     la tercera, corta y sólo en el tercio del morro. */
  if (D.vomer) fila(0.42, 0.62, 0.05, 0.40, 0.34);
  if (p.paladar) fila(0.58, 0.72, 0.30, 0.55);
  fila(1, 1, 0, 1);
}

/* ── EL OJO ─────────────────────────────────────────────────────────
   Igual que en la pieza, con el sitio y el tamaño sacados a `D`. */
function ojo(g, f, gx, col, nuc, br, sh, p, D){
  const Lg = f.Lg;
  const ox = Lg*D.ojo[0], oy = Lg*D.ojo[1], r = Math.max(0.8, Lg*D.ojo[2]);
  /* EL GLOBO, que sólo recoge. Con `ojoHueco` NO se rellena: un disco
     lleno se lee como una bola de luz, y lo que da miedo en las
     referencias es lo contrario —un ojo OSCURO con el borde claro—. En
     aditivo no se puede pintar el hueco, así que se pinta su canto y se
     deja el centro a lo que haya. */
  if (br > 0.004 && !D.ojoHueco){
    enPez(g, f, gx, () => { g.beginPath(); g.arc(ox, oy, r, 0, TAU); });
    g.fillStyle = rgba(col, Math.min(1, 0.55*br));
    g.fill();
  }
  /* EL ARO DEL IRIS. Un globo liso es un punto; lo que da miedo en las
     referencias es que el ojo tenga ESTRUCTURA —un anillo claro alrededor
     de una pupila que emite—. En aditivo no se puede oscurecer el centro,
     así que lo que se dibuja es el aro. */
  if (D.iris && br > 0.004){
    /* dos aros: el de la órbita, fino, y el del iris, gordo. Con uno
       solo el ojo es un anillo; con los dos es una CUENCA. */
    enPez(g, f, gx, () => { g.beginPath(); g.arc(ox, oy, r, 0, TAU); });
    g.strokeStyle = rgba(col, Math.min(1, 0.55*D.iris*br));
    g.lineWidth = Math.max(0.4, r*0.10);
    g.stroke();
    enPez(g, f, gx, () => { g.beginPath(); g.arc(ox, oy, r*0.74, 0, TAU); });
    g.strokeStyle = rgba(nuc, Math.min(1, D.iris*br));
    g.lineWidth = Math.max(0.5, r*0.20);
    g.stroke();
  }
  const eo = aMundo(f, gx, ox, oy), ex = eo[0], ey = eo[1];
  let dx = f.miraX - ex, dy = f.miraY - ey;
  const dl = Math.hypot(dx, dy);
  if (dl > 1e-4){ dx /= dl; dy /= dl; } else { dx = -gx; dy = 0; }
  const a = gx*f.ang, ca = Math.cos(a), sa = Math.sin(a);
  const k = r*p.pupila, mx = gx < 0 ? -1 : 1;
  const px = (dx*ca - dy*sa)*mx, py = dx*sa + dy*ca;
  const rx = f.luzX - ex, ry = f.luzY - ey;
  const rl = Math.hypot(rx, ry) || 1;
  const dest = Math.pow(Math.max(0, (dx*rx + dy*ry)/rl), 3);
  const fog = 1 + opt(p.destelloOjo, 0)*dest;
  const bp = Math.max(br, opt(p.ojoBrillo, 0));
  /* EL HALO NO CRECE CON EL OJO. Iba a `r*6`, y con un ojo grande eso es
     media cabeza de resplandor: la pupila deja de ser una pupila y el
     bicho lleva un faro. Se ata al LARGO y no al radio del ojo. */
  const rh = Math.min(r*6, Lg*0.30);
  if (bp > 0.004)
    mancha(g, ex, ey, rh, [
      [0.00, nuc, Math.min(1, 0.30*bp*fog)],
      [0.30, f.c.mid, 0.12*bp*fog],
      [1.00, f.c.glow, 0],
    ]);
  enPez(g, f, gx, () => {
    g.beginPath();
    g.arc(ox + px*k, oy + py*k,
          r*opt(D.pupila, 0.46)*(1 + 0.22*dest), 0, TAU);
  });
  g.fillStyle = rgba(nuc, Math.min(1, 1.25*bp*sh*fog));
  g.fill();
}

/* ── LA BARBILLA ────────────────────────────────────────────────────
   La de la pieza, con el número de ramas y el punto de arranque en `D`.
   `D.barbaRama` la hace ramificarse otra vez —Linophryne: el hiodo es
   un arbusto, no un flequillo. */
const _pta = [];
function barbilla(g, f, gx, p, t, ebr, D){
  const n = f.barbas;
  if (!n) return;
  const br = ebr * p.barbaBrillo;
  if (br < 0.004) return;
  const Lg = f.Lg, u0 = D.barbaU;
  const bx = Lg*u0, by = (flex(u0,f,t) + D.panza(u0)*0.92)*Lg;
  g.strokeStyle = rgba(f.c.mid, 0.34*br);
  g.lineWidth = Math.max(0.4, Lg*0.0085);
  let np = 0;
  enPez(g, f, gx, () => {
    g.beginPath();
    for (let i=0;i<n;i++){
      const sp   = reparte(i, n) - 0.5;
      const lar  = Lg*p.barba*(0.62 + 0.38*Math.abs(Math.sin(i*2.3 + 1.1 + f.sway)));
      const vai  = Math.sin(t*0.62 + i*1.9 + f.sway)*0.26;
      const ang  = 1.35 + sp*0.85 + vai;
      const tx = bx + Math.cos(ang)*lar, ty = by + Math.sin(ang)*lar;
      g.moveTo(bx, by);
      g.quadraticCurveTo(bx + Math.cos(ang - 0.5)*lar*0.62,
                         by + Math.sin(ang - 0.5)*lar*0.62, tx, ty);
      if (!D.barbaRama){ _pta[np*2] = tx; _pta[np*2+1] = ty; np++; continue; }
      /* la segunda horquilla: de la mitad de cada rama salen dos más
         cortas, y las puntas que encienden son las suyas */
      const mx = bx + Math.cos(ang - 0.5)*lar*0.62;
      const my = by + Math.sin(ang - 0.5)*lar*0.62;
      for (const s of [-1, 1]){
        const a2 = ang + s*(0.45 + 0.2*Math.sin(i*1.7)) + vai*0.5;
        const l2 = lar*D.barbaRama;
        const ex = mx + Math.cos(a2)*l2, ey = my + Math.sin(a2)*l2;
        g.moveTo(mx, my);
        g.quadraticCurveTo(mx + Math.cos(a2 - 0.4)*l2*0.6,
                           my + Math.sin(a2 - 0.4)*l2*0.6, ex, ey);
        _pta[np*2] = ex; _pta[np*2+1] = ey; np++;
      }
      _pta[np*2] = tx; _pta[np*2+1] = ty; np++;
    }
  });
  g.stroke();
  const pr = Math.max(0.6, Lg*0.012);
  g.fillStyle = rgba(f.c.core, Math.min(1, 0.72*br));
  enPez(g, f, gx, () => {
    g.beginPath();
    for (let i=0;i<np;i++){
      const tx = _pta[i*2], ty = _pta[i*2+1];
      g.moveTo(tx + pr, ty);
      g.arc(tx, ty, pr, 0, TAU);
    }
  });
  g.fill();
}

/* ── EL ILICIO Y LA ESCA ────────────────────────────────────────────
   Igual que en la pieza; `D.ilicioU` dice de dónde sale la caña. */
function senuelo(g, f, gx, p, ebr, D){
  const Lg = f.Lg, u0 = D.ilicioU;
  const bi = aMundo(f, gx, Lg*u0, -D.lomo(u0)*Lg);
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
  const glow = f.c.glow;
  mancha(g, f.x, f.y, Lg*p.halo, [
    [0.00, glow, 0.40*ebr], [0.13, glow, 0.17*ebr],
    [0.40, glow, 0.05*ebr], [1.00, glow, 0],
  ]);
  const re = Lg*p.esca, RG = re*p.difusion;
  mancha(g, f.x, f.y, RG, [
    [0.00, f.c.mid, Math.min(1, 0.68*ebr)],
    [0.22, f.c.mid, 0.44*ebr],
    [0.55, f.c.mid, 0.12*ebr],
    [1.00, f.c.mid, 0],
  ]);
  g.fillStyle = rgba(f.c.mid, Math.min(1, 0.50*ebr));
  g.beginPath(); g.arc(f.x, f.y, re, 0, TAU); g.fill();
  const nu = re*p.nucleo;
  if (nu > 0.1){
    g.fillStyle = 'rgba(255,255,255,'+Math.min(1, 0.95*ebr).toFixed(3)+')';
    g.beginPath(); g.arc(f.x, f.y, nu, 0, TAU); g.fill();
  }
}

/* ── LA TUBERÍA ENTERA, en el orden de rape.js ──────────────────── */
function pinta(g, f, p, D, W, H){
  const t = f.t, Lg = f.Lg, sh = 1, gx = f.gx;
  FOCO = D.foco || 1;
  const col = f.c.mid, nuc = f.c.core;
  const br = Math.min(p.techo, f.ilum + p.base) * p.cuerpo;
  const bc = centro(f, gx), bcx = bc[0], bcy = bc[1];
  if (br > 0.012){
    const q = quijadas(f, p, D);
    enPez(g, f, gx, () => perfilPath(g, f, t, D));
    g.save();
    g.clip();
    enPez(g, f, gx, () => { perfilPath(g, f, t, D); bocaPath(g, q, D); });
    g.clip('evenodd');
    const proa = opt(p.proa, 0);
    const dl = Math.hypot(f.luzX-bcx, f.luzY-bcy);
    const ladoY = clamp((f.luzY - bcy)/Lg, -1, 1);
    piel(g, f, gx, t, col, br, proa, ladoY, D);
    volumen(g, f, col, nuc, br, bcx, bcy, dl, ladoY);
    visceras(g, f, gx, t, col, br, sh, proa, D);
    g.restore();

    g.save();
    g.beginPath();
    g.rect(0, 0, W, H);
    enPez(g, f, gx, () => bocaPath(g, q, D));
    g.clip('evenodd');
    enPez(g, f, gx, () => perfilPath(g, f, t, D));
    var gb = g.createRadialGradient(f.luzX, f.luzY, 0, f.luzX, f.luzY,
                                    radio(Lg, dl, 0.6, 1.45));
    gb.addColorStop(0.00, rgba(nuc, 0.62*br*sh));
    gb.addColorStop(0.42, rgba(col, 0.26*br*sh));
    gb.addColorStop(1.00, rgba(col, 0));
    g.strokeStyle = gb;
    g.lineWidth = Math.max(0.5, Lg*0.0075);
    g.stroke();
    g.restore();

    aletas(g, f, gx, t, col, br, dl, D);
    /* la mandíbula antes de los dientes: son suyos y van encima */
    if (D.mandibula) mandibula(g, f, gx, q, D, col, br, dl, gb,
                               opt(p.entreabierta, 0));
    boca(g, f, gx, p, gb, q, D);
  }
  ojo(g, f, gx, col, nuc, br, sh, p, D);
  const ebr = (f.brillo + f.chispa*0.9) * p.brillo;
  if (ebr < 0.003) return;
  barbilla(g, f, gx, p, t, ebr, D);
  senuelo(g, f, gx, p, ebr, D);
}

export { pinta, flex, llano };
