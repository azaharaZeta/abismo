/* ══════════════════════════════════════════════════════════════════
   EL CUERPO DEL RAPE
   Los perfiles, el marco de coordenadas y las capas del dibujo: piel,
   volumen, vísceras, aletas, ojo, quijadas, dientes, barbilla y señuelo.
   Cada capa es un asunto suyo; todas reciben `gx` —el espejo ya saneado—
   y la luz que resuelve `dibuja`.
   ══════════════════════════════════════════════════════════════════ */
import { M } from '../motor.js';
const {rgba, opt, TAU} = M;
import { mancha, reparte } from './comun.js';

/* ══════════════════════════════════════════════════════════════════
   LAS DOS FORMAS
   La ANATOMÍA de un rape, que no es lo mismo que sus mandos: una parada
   de degradado o el sitio del ojo no son un deslizador, son el bicho. Lo
   que la escena elige es CUÁL de las dos, con `forma`; los números de
   cada una viven aquí.

   El contrato, en unidades de LARGO y con u=0 en el morro y u=1 en la
   base de la cola:

     lomo · panza   los dos perfiles
     N · sesgo      muestras del trazado; `sesgo`>1 las amontona en el
                    morro, que es donde una forma puede tener detalle
     caudal         {x, y, muesca, radios}
     aletas         de dónde a dónde va cada una y cuánto levanta
     brazo          la pectoral sobre un muñón carnoso; sin él, una pala
     crestas        las púas del lomo, DENTRO de la silueta
     espinulas      cuántas púas diminutas lleva la piel
     ojo            [x, y, radio] · `hueco` no rellena el globo,
                    `iris` pinta la cuenca y `pupila` la encoge
     diente         largo · `dienteAncho` grueso · `colmillo` gancho ·
                    `desigual` de dónde sale el largo (ver boca())
     barbaU         de qué punto cuelga la barbilla
     ilicioU        y de cuál arranca la caña

   Lo que NO está aquí y sigue en la escena: el largo de la boca, lo que
   abre, cuántos dientes, la barbilla y el color. Eso sí son mandos.

   Hoy hay UNA forma. Hubo dos —la cabezona de siempre y ésta— y la
   tabla se queda porque es donde va la anatomía, no por si vuelve la
   otra: la otra está en git.

   Campana asimétrica para los perfiles: los dos mandos que importan
   quedan sueltos —`up` es dónde cae el canto máximo y `r` lo empinada
   que va la subida, de donde sale la bajada y con ella el pedúnculo—. */
function campana(A, up, r){
  const s = r*(1-up)/up, mx = Math.pow(up,r)*Math.pow(1-up,s);
  return u => (u<=0||u>=1) ? 0 : A*Math.pow(u,r)*Math.pow(1-u,s)/mx;
}
const bulto = (u,c,w,h) => h*Math.exp(-Math.pow((u-c)/w,2));

/* EL DE GOTA. Apenas tiene frente: el lomo no sube en cúpula sobre el
   ojo, sube despacio y su máximo cae a MEDIO cuerpo; quien baja es la
   panza, y baja justo debajo de la boca. De ahí que la cara salga plana
   y el bicho se lea como una bolsa con dientes. */
const TI_LOMO = campana(0.345, 0.45, 1.20), TI_PANZA = campana(0.445, 0.32, 0.90);

const FORMAS = {
  tinta: {
    /* el morro va ROMO —un bulto estrecho en el arranque de los dos
       perfiles—: en punta parece un pico, y aquí es una pared */
    lomo:  u => TI_LOMO(u)  + 0.028 + bulto(u, 0, 0.055, 0.042),
    panza: u => TI_PANZA(u) + 0.028 + bulto(u, 0, 0.055, 0.042),
    N: 34, sesgo: 1.15,
    caudal: {x:1.20, y:0.180, muesca:1.17, radios:9},
    aletas: {d0:0.66, d1:0.95, dAlto:0.13, a0:0.70, a1:0.95, aAlto:0.11,
             p0:0.50, pY:0.58},
    brazo: 0.12,
    crestas: {n:5, u0:0.34, u1:0.56, alto:0.078, ancho:0.044},
    espinulas: 95,
    /* ── HASTA DÓNDE SALTA EL OJO ───────────────────────────────
       Tiene un techo y un suelo, y ninguno es de gusto. ARRIBA: el borde
       del ojo no puede pasar del lomo. A −0,175 caía en 0,270 y el lomo
       a esa altura mide 0,219, o sea que asomaba 0,051 largos POR FUERA
       de la silueta —y eso no se lee como un ojo saltón, se lee como un
       ojo suelto—. A −0,152 asoma 0,021: se le nota el bulto y sigue
       dentro. ABAJO: la quijada de arriba, que al abrirse barre hacia
       atrás y se traga lo que pille; con la boca de esta forma su línea
       pasa por −0,023 a esta altura, así que quedan 0,041 de margen. */
    ojo: [0.165, -0.152, 0.088], hueco: true, iris: 1.0, pupila: 0.26,
    diente: 2.00, dienteAncho: 1.50, colmillo: 0.12, desigual: 0.95,
    barbaU: 0.32, ilicioU: 0.10,
  },
};
/* Flexión al nadar: nada en el morro, todo en la cola. `congela` la apaga,
   y va aquí dentro porque la piden veinte sitios y una cola congelada con
   las aletas ondeando es un bicho roto. Se escala la AMPLITUD y no la
   fase: la cola se estira hacia la recta en vez de pararse a media
   curva. */
const flex = (u,f,t) => Math.sin(u*2.6 - t*f.velCola + f.fase)
                        * f.amplitudCola * Math.pow(u,1.6)
                        * (1 - 0.9*f.congela);

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
  const F = f.F, N = F.N, Lg = f.Lg, C = F.crestas;
  const uu = i => F.sesgo === 1 ? i/N : Math.pow(i/N, F.sesgo);
  g.beginPath();
  let ini = true;
  const pon = (x,y) => { if (ini){ g.moveTo(x,y); ini = false; } else g.lineTo(x,y); };
  for (let i=0;i<=N;i++){                       // lomo: morro → cola
    const u = uu(i);
    pon(u*Lg, (flex(u,f,t) - F.lomo(u))*Lg);
    /* ── LAS PÚAS DEL LOMO ──────────────────────────────────────
       Van DENTRO de la silueta y no dibujadas encima: así las traza el
       canto, que a oscuras es lo único que se ve de este bicho. Se
       insertan al cruzar su `u`, en orden de x, o el trazado se cruza
       consigo mismo; y se inclinan hacia la cola menos de medio ancho,
       porque pasado eso la punta adelanta a su propia base. */
    if (C && i < N){
      const uf = uu(i+1);
      for (let k=0;k<C.n;k++){
        const uc = C.u0 + (C.u1-C.u0)*reparte(k, C.n);
        if (uc < u || uc >= uf) continue;
        const h = C.alto*(0.55 + 0.45*Math.abs(Math.sin(k*2.3 + 1.1)));
        const yb = (flex(uc,f,t) - F.lomo(uc))*Lg;
        pon((uc - C.ancho*0.5)*Lg, yb);
        pon((uc + C.ancho*0.45)*Lg, yb - h*Lg);
        pon((uc + C.ancho*0.5)*Lg, yb);
      }
    }
  }
  /* la caudal, de la forma: pequeña y horquillada en el clásico, ancha y
     redondeada en el de gota. Grande se lleva la mirada justo al lado
     contrario de donde está lo que hay que ver, que es la boca. */
  const cd = F.caudal, yc = flex(1,f,t)*Lg;
  g.lineTo(Lg*cd.x, yc - Lg*cd.y);
  g.lineTo(Lg*cd.muesca, yc);
  g.lineTo(Lg*cd.x, yc + Lg*cd.y);
  for (let i=N;i>=0;i--){                       // panza: cola → morro
    const u = uu(i);
    g.lineTo(u*Lg, (flex(u,f,t) + F.panza(u))*Lg);
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
  const F = f.F, Lg = f.Lg, suelo = 1 - proa;
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
      const yl = (fl - F.lomo(u))*Lg, yp = (fl + F.panza(u))*Lg;
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
  const F = f.F, Lg = f.Lg;
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
        g.moveTo(u*Lg, (flex(u,f,t) - F.lomo(u)*0.74)*Lg);
        g.quadraticCurveTo((u - 0.05)*Lg, flex(u,f,t)*Lg,
                           u*Lg, (flex(u,f,t) + F.panza(u)*0.74)*Lg);
      });
      g.stroke();
    }
  }
  /* ── LAS ESPÍNULAS ──────────────────────────────────────────────
     La piel de un ceratioide está sembrada de púas diminutas, y a este
     tamaño se leen como grano: es lo que separa «bolsa lisa» de «cosa».
     Un solo trazado para todas, y con su propio sorteo determinista —si
     se repartieran con Math.random() hervirían de un fotograma a otro. */
  if (F.espinulas){
    g.fillStyle = eje(0.28*br*sh);
    enPez(g, f, gx, () => {
      g.beginPath();
      let sem = 1;
      const az = () => (sem = (sem*16807) % 2147483647) / 2147483647;
      for (let i=0;i<F.espinulas;i++){
        const u = 0.04 + 0.92*az(), v = az()*2 - 1;
        const fl = flex(u,f,t);
        const y = fl + (v < 0 ? v*F.lomo(u) : v*F.panza(u))*0.88;
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
    g.moveTo(Lg*0.30, (flex(0.30,f,t)-F.lomo(0.30)*0.80)*Lg);
    g.quadraticCurveTo(Lg*0.23, flex(0.30,f,t)*Lg,
                       Lg*0.33, (flex(0.33,f,t)+F.panza(0.33)*0.82)*Lg);
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
  const F = f.F, Lg = f.Lg, A = F.aletas;
  const gf = g.createRadialGradient(f.luzX, f.luzY, 0, f.luzX, f.luzY,
                                    Math.max(Lg*0.7, dl*1.5));
  gf.addColorStop(0.00, rgba(col, 0.42*br));
  gf.addColorStop(0.45, rgba(col, 0.19*br));
  gf.addColorStop(1.00, rgba(col, 0));
  g.fillStyle = gf;
  enPez(g, f, gx, () => {                 // dorsal
    const um = (A.d0+A.d1)*0.5;
    g.beginPath();
    g.moveTo(Lg*A.d0, (flex(A.d0,f,t)-F.lomo(A.d0))*Lg);
    g.quadraticCurveTo(Lg*um, (flex(um,f,t)-F.lomo(um)-A.dAlto)*Lg,
                       Lg*A.d1, (flex(A.d1,f,t)-F.lomo(A.d1))*Lg);
    g.closePath();
  });
  g.fill();
  enPez(g, f, gx, () => {                 // anal
    const um = (A.a0+A.a1)*0.5;
    g.beginPath();
    g.moveTo(Lg*A.a0, (flex(A.a0,f,t)+F.panza(A.a0))*Lg);
    g.quadraticCurveTo(Lg*um, (flex(um,f,t)+F.panza(um)+A.aAlto)*Lg,
                       Lg*A.a1, (flex(A.a1,f,t)+F.panza(A.a1))*Lg);
    g.closePath();
  });
  g.fill();
  /* LA PECTORAL. Una pala pegada al costado, o —con `brazo`— en la punta
     de un muñón carnoso, que es como la lleva un ceratioide de verdad y
     lo que la convierte en una manita. */
  const ax = Lg*A.p0, ay = (flex(A.p0,f,t)+F.panza(A.p0)*A.pY)*Lg;
  const vai = 0.05*Math.sin(t*1.1 + f.fase);
  if (F.brazo){
    const bl = Lg*F.brazo, bg = Lg*0.042;
    const bax = ax + bl*0.92, bay = ay + bl*(0.34 + vai*2);
    enPez(g, f, gx, () => {
      g.beginPath();
      g.moveTo(ax, ay - bg);
      g.quadraticCurveTo(ax + bl*0.6, ay + bl*0.05, bax, bay - bg*0.7);
      g.lineTo(bax, bay + bg*0.7);
      g.quadraticCurveTo(ax + bl*0.5, ay + bl*0.22, ax, ay + bg);
      g.closePath();
    });
    g.fill();
    g.strokeStyle = gf;
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
    const yc = flex(1,f,t)*Lg, cd = F.caudal, n = cd.radios;
    g.beginPath();
    for (let i=0;i<n;i++){
      const sg = reparte(i,n)*2 - 1;
      g.moveTo(Lg*1.00, yc + sg*Lg*0.050);
      g.lineTo(Lg*(cd.x - 0.01), yc + sg*Lg*(cd.y*0.93));
    }
  });
  g.stroke();
  /* los radios de la dorsal y la anal: rellenas y lisas se leen como dos
     palas pegadas al lomo. El alto de la aleta en cada punto sale del mismo
     seno con el que se trazó su curva, así que los radios acaban en el
     canto y no lo atraviesan. */
  if (f.radios){
    g.lineWidth = Math.max(0.4, Lg*0.0065);
    const alto = (u, a, b, h) => h*Math.sin(Math.PI*(u-a)/(b-a));
    enPez(g, f, gx, () => {
      g.beginPath();
      for (let i=1;i<=f.radios;i++){
        const u = A.d0 + (A.d1-A.d0)*i/(f.radios+1);
        const y = (flex(u,f,t) - F.lomo(u))*Lg;
        g.moveTo(u*Lg, y);
        g.lineTo(u*Lg, y - alto(u, A.d0, A.d1, A.dAlto)*Lg);
      }
      for (let i=1;i<=f.radios;i++){
        const u = A.a0 + (A.a1-A.a0)*i/(f.radios+1);
        const y = (flex(u,f,t) + F.panza(u))*Lg;
        g.moveTo(u*Lg, y);
        g.lineTo(u*Lg, y + alto(u, A.a0, A.a1, A.aAlto)*Lg);
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
  const F = f.F, Lg = f.Lg;
  /* ── DÓNDE VA, Y NO ES LIBRE ──────────────────────────────────────
     Atrás y arriba: un depredador lleva el ojo en el tercio alto del
     cráneo y no pegado al morro. Pero además hay una COTA DURA, y es la
     boca: la quijada de arriba gira sobre la charnela y al abrirse barre
     hacia atrás, y el hueco que abre se le RESTA al cuerpo (ver
     `bocaPath`), así que un ojo dentro de ese barrido se queda flotando
     fuera de la silueta.

     MEDIDO punto en polígono contra el hueco, en veinticinco posturas de
     `ataque`: con la boca de hoy (`bocaLargo` 0,47 · `abertura` 0,52)
     cualquier sitio vale. Con una boca mayor —0,56 y 0,70— el ojo en
     0,175/−0,155 se lo traga la boca a partir de `ataque` 0,44, y aquí,
     en 0,22/−0,20, queda LIBRE en todo el bocado con 0,175 de largo de
     margen hasta el lomo. Lo que NO se puede subir es `quijadaArriba`:
     a 0,34 vuelve a chocar, y a 0,42 choca esté el ojo donde esté. */
  const ox = Lg*F.ojo[0], oy = Lg*F.ojo[1], r = Math.max(0.8, Lg*F.ojo[2]);
  /* EL GLOBO sólo recoge: sin luz que le dé, no está. Y con `hueco` NO
     se rellena: un disco lleno se lee como una bola de luz, y lo que da
     miedo es lo contrario —un ojo oscuro con el borde claro—. En aditivo
     no se puede pintar el hueco, así que se pinta su canto y el centro
     se queda con lo que haya. */
  if (br > 0.004 && !F.hueco){
    enPez(g, f, gx, () => { g.beginPath(); g.arc(ox, oy, r, 0, TAU); });
    g.fillStyle = rgba(col, Math.min(1, 0.55*br));
    g.fill();
  }
  /* LA CUENCA, y son DOS aros: la órbita fina y el iris gordo. Con uno
     solo el ojo es un anillo; con los dos es una cuenca. */
  if (F.iris && br > 0.004){
    enPez(g, f, gx, () => { g.beginPath(); g.arc(ox, oy, r, 0, TAU); });
    g.strokeStyle = rgba(col, Math.min(1, 0.55*F.iris*br));
    g.lineWidth = Math.max(0.4, r*0.10);
    g.stroke();
    enPez(g, f, gx, () => { g.beginPath(); g.arc(ox, oy, r*0.74, 0, TAU); });
    g.strokeStyle = rgba(nuc, Math.min(1, F.iris*br));
    g.lineWidth = Math.max(0.5, r*0.20);
    g.stroke();
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
  const k = r*p.pupila;
  const mx = gx < 0 ? -1 : 1;
  const px = (dx*ca - dy*sa)*mx, py = dx*sa + dy*ca;

  /* el destello: cuánto coincide la mirada con la dirección de la luz que
     más lo alumbra. Al cubo, para que sea un destello y no un degradado:
     mirar «hacia ahí» no cuenta, cuenta mirar AHÍ. */
  const rx = f.luzX - ex, ry = f.luzY - ey;
  const rl = Math.hypot(rx, ry) || 1;
  const retro = Math.max(0, (dx*rx + dy*ry)/rl);
  const dest = Math.pow(retro, 3);
  const fog = 1 + opt(p.destelloOjo, 0)*dest;

  /* LA PUPILA SÍ EMITE, y es la única excepción del bicho a la regla de la
     casa: `ojoBrillo` es su suelo, así que sigue ahí con el cuerpo a
     oscuras. El halo es lo que la hace legible —la pupila mide medio píxel
     en el plano de delante. */
  const bp = Math.max(br, opt(p.ojoBrillo, 0));
  /* EL HALO NO CRECE CON EL OJO. Iba a `r*6`, y con un ojo grande eso es
     media cabeza de resplandor: la pupila deja de ser una pupila y el
     bicho lleva un faro. Se ata al LARGO y no al radio del ojo. */
  if (bp > 0.004)
    mancha(g, ex, ey, Math.min(r*6, Lg*0.30), [
      [0.00, nuc, Math.min(1, 0.30*bp*fog)],
      [0.30, f.c.mid, 0.12*bp*fog],
      [1.00, f.c.glow, 0],
    ]);
  enPez(g, f, gx, () => {
    g.beginPath();
    g.arc(ox + px*k, oy + py*k,
          r*opt(F.pupila, 0.46)*(1 + 0.22*dest), 0, TAU);
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
  /* LA LÍNEA DE LABIOS, tres puntos: el morro, la comba de en medio y la
     charnela. `bocaHondo` es el punto de CONTROL, así que es cuánto
     comba: la línea se hunde la mitad de él respecto de la recta que une
     los extremos. Con la comba pequeña la mordida se lee recta. */
  const jx = Lg*p.bocaLargo, jy = Lg*p.bocaCharnela;
  const mY = Lg*p.bocaMorro, cY = Lg*p.bocaHondo;
  const bocaY = u => (1-u)*(1-u)*mY + 2*u*(1-u)*cY + u*u*jy;
  /* Abre de golpe y cierra más despacio: la potencia bajo el seno adelanta
     el máximo casi al principio. Y nunca cierra del todo
     —`entreabierta`—: una rendija con dientes a los dos lados se lee como
     una trampa ya abierta. */
  const ab = (opt(p.entreabierta, 0))
           + Math.sin(Math.pow(Math.min(1, 1-f.ataque), 0.55)*Math.PI) * p.abertura
           /* y el trabajo de masticar, que es lo mismo pero pequeño y repetido: lo
              calcula actualiza() y lo deja puesto */
           + f.masticaAb
           /* y el bombeo de las branquias, lo mismo otra vez pero minúsculo y
              constante. También lo deja puesto actualiza(). */
           + f.respAb;
  /* EL REPARTO DE LA ABERTURA. `quijadaArriba` es la parte que se lleva la
     de arriba y el resto lo baja la de abajo, así que la abertura total no
     cambia. Girando las dos por igual, a pleno bocado la de arriba le pasa
     POR ENCIMA AL OJO y el ojo se queda flotando dentro de la boca. */
  const arriba = p.quijadaArriba;
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
  const F = f.F, nd = f.dientes;
  const dLar = F.diente, dAnc = F.dienteAncho, gan = F.colmillo;
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
          const irr = Math.abs(Math.sin(i*2.7 + 1.1 + (sg>0?0.7:0)));
          /* ── LO DESIGUALES QUE VAN ──────────────────────────
             A `desigual` 0, un largo base más un poco de variación: una
             sierra pareja, que es lo que se lee como PEINE. A 1, casi
             todo el largo sale de la variación ELEVADA, así que salen
             tres o cuatro colmillos largos entre muchos cortos. */
          const alt = (0.055 + 0.075*irr)*(1 - F.desigual)
                    + (0.022 + 0.175*Math.pow(irr, 1.8))*F.desigual;
          let alto = Lg*largo*alt*(1-u*0.35)*dLar;
          let anc = Lg*ancho*0.024*(1-u*0.3)*dAnc;
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
          if (!gan){
            g.moveTo(qx - b*ca, qy - b*sa);
            g.lineTo(qx + b*ca, qy + b*sa);
            g.lineTo(qx + anc*0.3*ca - pta*sa,
                     qy + anc*0.3*sa + pta*ca);
            g.closePath();
          } else {
            /* EL GANCHO. La punta se corre hacia la charnela y los dos
               costados son curvas —una cóncava y otra convexa—, que es lo
               que da el colmillo curvado en vez de la cuña. */
            const cur = gan*alto*0.55;
            const tx = qx + anc*0.2*ca - pta*sa + cur*ca;
            const ty = qy + anc*0.2*sa + pta*ca + cur*sa;
            const b0x = qx - b*ca, b0y = qy - b*sa;
            const b1x = qx + b*ca, b1y = qy + b*sa;
            g.moveTo(b0x, b0y);
            g.quadraticCurveTo(b0x - pta*sa*0.55 + cur*ca*0.15,
                               b0y + pta*ca*0.55 + cur*sa*0.15, tx, ty);
            g.quadraticCurveTo(b1x - pta*sa*0.40 + cur*ca*0.75,
                               b1y + pta*ca*0.40 + cur*sa*0.75, b1x, b1y);
            g.closePath();
          }
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
  const br = ebr * p.barbaBrillo;
  if (br < 0.004) return;
  const Lg = f.Lg, u0 = f.F.barbaU;
  const bx = Lg*u0, by = (flex(u0,f,t) + f.F.panza(u0)*0.92)*Lg;
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
  const Lg = f.Lg, u0 = f.F.ilicioU;
  const bi = aMundo(f, gx, Lg*u0, -f.F.lomo(u0)*Lg);
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
  const nu = re*p.nucleo;
  if (nu > 0.1){
    g.fillStyle = 'rgba(255,255,255,'+Math.min(1, 0.95*ebr).toFixed(3)+')';
    g.beginPath(); g.arc(f.x, f.y, nu, 0, TAU); g.fill();
  }
}
export { FORMAS, enPez, aMundo, centro, adelante,
         cuerpoPath, piel, visceras, aletas, volumen, ojo, quijadas,
         bocaPath, boca, barbilla, senuelo };
