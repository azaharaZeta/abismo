/* ══════════════════════════════════════════════════════════════════
   PANEL DE PRUEBAS  ·  NO FORMA PARTE DE LA PIEZA

   Menú para lanzar eventos, tocar parámetros en caliente y repoblar sin
   recargar. Es un andamio: para quitarlo basta con borrar su <script> de
   index.html. Oculto por defecto; se abre con la tecla P o con ?pruebas.
   ══════════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const A = window.Acuario;
if (!A || !A.pruebas) return;            // motor viejo: no estorbar
const P = A.pruebas;

/* ── lo que se puede tocar en caliente ──────────────────────────────
   Escalares, y pares de escalares: una fila puede mover varias rutas a
   la vez con `ruta` como lista y un `factores` a juego (ver `rutasDe`),
   que es como se gobierna un `[min,max]` con un deslizador. Los rangos
   de los eventos se siguen editando como JSON más abajo.

   Y sólo los que se pueden JUZGAR MIRANDO. Aquí no entra un parámetro
   que haya que medir —`cardumen.vista` se comprueba contando alineación,
   no arrastrando—, ni un multiplicador de otro que ya tiene mando
   —`brilloOjo` cuelga de `brillo`—, ni un detalle de dos píxeles como la
   pupila del rape. Para todo eso está el JSON del evento, y escena.js.

   `aplica` dice qué hace falta después de cambiarlo:
     null    · surte efecto solo, el motor lo lee cada frame
     'calc'  · hay que recalcular (corriente, planos, tamaño del lienzo)
     'nueva' · hace falta población nueva                             */
const MANDOS = [
  /* EL AGUA. Los dos del velo están explicados en ABISMO.dispersion. */
  {nombre:'luz de fondo',   ruta:'agua.brillo',       min:0,   max:3,    paso:0.05, aplica:null},
  {nombre:'velo · fuerza',  ruta:'dispersion.fuerza', min:0,   max:2,    paso:0.05, aplica:null},
  {nombre:'velo · caída',   ruta:'dispersion.caida',  min:0.2, max:0.95, paso:0.02, aplica:null},
  {nombre:'corriente',      ruta:'corriente.amplitud',min:0,   max:0.8,  paso:0.02, aplica:'calc'},
  /* la ondulación de color del agua: a 0 vuelve a ser negro plano. `paso`
     0,02 y no 0,05 porque un range redondea el valor inicial al múltiplo
     de `paso`, y con 0,05 el 0,32 de la escena entra como 0,30. */
  {nombre:'ondulación',     ruta:'agua.ondulacion.fuerza', min:0, max:2, paso:0.02, aplica:null},
  /* cuánta luz del agua le quita un cuerpo: a 0, los eventos oscuros
     vuelven a depender sólo de las motas que faltan, y no basta */
  {nombre:'sombra en agua', ruta:'agua.sombra.fuerza', min:0, max:1, paso:0.05, aplica:null},
  /* y lo que emite el leviatán: a 0 sólo se le ve por el hueco */
  {nombre:'leviatán · luz', ruta:'eventos.@leviatan.brillo', min:0, max:0.8, paso:0.02, aplica:null},
  /* el tamaño de TODO: la unidad de escena sale de aquí */
  {nombre:'escala',         ruta:'escala',            min:10,  max:60,   paso:1,    aplica:'nueva'},

  /* LOS BICHOS. `cada` es área por mota, así que BAJARLO es más plancton. */
  {nombre:'plancton · área/mota', ruta:'bichos.@plancton.total.cada',
   min:500, max:3000, paso:50, aplica:'nueva'},
  /* ── EL BANCO: CUÁNTOS Y DE QUÉ TAMAÑO ──────────────────────────
     Los dos gobiernan un PAR de la escena con un solo deslizador (ver
     `rutasDe`), y cada uno por su motivo.

     CUÁNTOS escribe el `total` del banco, que es un número suelto: el
     conteo no pasa por el área, así que el mando dice «tantos peces» y
     vale igual en un móvil que en una pantalla grande. Puede quedarse a
     uno del pedido, que el total se reparte por planos con `reparto` y
     cada plano redondea por su cuenta.

     TAMAÑO es un MULTIPLICADOR sobre `largo`, no un largo: los factores
     son los dos extremos de la escena, así que a 1 la reproduce exacta y
     al moverlo el banco conserva su reparto de peces grandes y chicos.
     Puesto como largo absoluto habría que elegir uno de los dos extremos
     y el otro se despegaría. */
  {nombre:'peces · cuántos', ruta:'bichos.@pezlinterna.total',
   min:0, max:90, paso:1, aplica:'nueva'},
  {nombre:'peces · tamaño ×', ruta:['bichos.@pezlinterna.largo.0',
                                    'bichos.@pezlinterna.largo.1'],
   factores:[1.15, 1.92], min:0.2, max:4, paso:0.05, aplica:'nueva'},
  {nombre:'banco · desorden',  ruta:'bichos.@pezlinterna.desorden',
   min:0, max:0.6, paso:0.02, aplica:'nueva'},
  {nombre:'rape · cuerpo',     ruta:'bichos.@rape.cuerpo',    min:0, max:2,   paso:0.02, aplica:null},
];

/* Un tramo de ruta puede ser `@nombre`: busca en el array la entrada cuya
   `especie` o `evento` se llame así. Por índice funcionaría igual hasta
   que alguien reordene la lista, que en la escena es libre. */
const baja = (o, k) => {
  if (!o) return undefined;
  if (k[0] !== '@') return o[k];
  const n = k.slice(1);
  return Array.isArray(o) ? o.find(e => e.especie === n || e.evento === n)
                          : undefined;
};
const leer  = r => r.split('.').reduce(baja, P.escena);
const poner = (r, v) => {
  const ks = r.split('.'), ult = ks.pop();
  const o = ks.reduce(baja, P.escena);
  if (o) o[ult] = v;
};

/* ── UN DESLIZADOR, VARIAS RUTAS ────────────────────────────────────
   Una fila puede llevar `ruta` como lista y un `factores` a juego: el
   valor del deslizador se reparte por todas multiplicado por el suyo. Es
   lo que deja gobernar un PAR de la escena —un `[min,max]`, los dos
   extremos de un largo— con un solo mando, sin que el panel tenga que
   saber editar arrays.

   El número que se enseña sale de la PRIMERA ruta dividida por su factor,
   así que conviene poner delante la que manda. Se redondea al escribir
   porque 1,15·1,4 son 1,6099999999999999 y eso acaba en la escena. */
const rutasDe  = m => Array.isArray(m.ruta) ? m.ruta : [m.ruta];
const factorDe = (m, i) => (m.factores ? m.factores[i] : 1);
const valorDe  = m => leer(rutasDe(m)[0]) / factorDe(m, 0);
const ponValor = (m, v) => rutasDe(m).forEach(
  (r, i) => poner(r, Math.round(v*factorDe(m, i)*1e4)/1e4));

/* ── estilo ─────────────────────────────────────────────────────────
   Todo con el prefijo pr- para no chocar con la pieza. */
const CSS = `
#pr{position:fixed;left:0;top:0;bottom:0;width:236px;z-index:50;
  background:rgba(4,10,16,.93);border-right:1px solid #16313d;
  color:#bcd8e4;font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;
  overflow-y:auto;overscroll-behavior:contain;touch-action:auto;
  padding:8px 10px 26px;backdrop-filter:blur(3px);
  transform:translateX(-100%);transition:transform .18s ease}
#pr.abierto{transform:none}
#pr h4{margin:12px 0 5px;font-size:10px;letter-spacing:.14em;color:#4e7f92;
  text-transform:uppercase;font-weight:600;border-bottom:1px solid #12293440;
  padding-bottom:3px}
#pr h4:first-child{margin-top:0}
#pr .fila{display:flex;align-items:center;gap:5px;margin:2px 0}
#pr .fila label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;
  white-space:nowrap;color:#9dc2d2}
#pr .val{width:46px;text-align:right;color:#e4f2f8;font-variant-numeric:tabular-nums}
#pr input[type=range]{width:100%;height:14px;margin:1px 0;accent-color:#3d8fa8}
#pr button{font:inherit;background:#0e2430;color:#bcd8e4;border:1px solid #1d4756;
  border-radius:4px;padding:3px 7px;cursor:pointer}
#pr button:hover{background:#15323f;border-color:#2b6b80}
#pr button.ev{flex:1;text-align:left}
#pr button.x{color:#d98a8a;border-color:#4a2028;padding:3px 6px}
#pr .anc{display:flex;gap:4px;margin:4px 0}
#pr .anc button{flex:1;text-align:center}
#pr textarea{width:100%;height:58px;background:#081820;color:#cfe6ef;
  border:1px solid #17394a;border-radius:4px;font:inherit;padding:4px;
  resize:vertical}
#pr .vivo{color:#7fd6a0}
/* la X: sticky y no absolute porque el panel scrollea y con absolute el
   botón se iría con el contenido. Flota para no gastar una fila entera
   encima del primer título. Sin comillas inversas aquí: esto va dentro
   de una plantilla. */
#pr-cerrar{position:sticky;top:0;float:right;z-index:2;
  background:rgba(4,10,16,.93);border:none;color:#4e7f92;
  font:13px/1 ui-monospace,monospace;padding:2px 3px;margin:-1px -4px 0 4px;
  cursor:pointer}
#pr-cerrar:hover{background:rgba(4,10,16,.93);border:none;color:#d98a8a}
#pr .nota{color:#3f6473;margin:5px 0 0;line-height:1.5}
/* el tirador es casi invisible hasta que te acercas: meter un botón a la
   vista en una escena que va de oscuridad la rompe */
#pr-tirador{position:fixed;left:0;top:50%;z-index:51;transform:translateY(-50%);
  writing-mode:vertical-rl;background:rgba(4,10,16,.55);color:#3f6473;
  border:1px solid #16313d;border-left:none;border-radius:0 4px 4px 0;
  padding:9px 3px;font:10px/1 ui-monospace,monospace;letter-spacing:.14em;
  cursor:pointer;user-select:none;opacity:.14;transition:opacity .3s ease}
#pr-tirador:hover{opacity:1;color:#8fd3e8}
@media (hover:none){#pr-tirador{opacity:.4}}
`;

const est = document.createElement('style');
est.textContent = CSS;
document.head.appendChild(est);

const caja = document.createElement('div');
caja.id = 'pr';
document.body.appendChild(caja);

/* Primer hijo del panel: flotando a la derecha se coloca en la línea del
   primer título sin empujarlo. */
const cerrar = document.createElement('button');
cerrar.id = 'pr-cerrar';
cerrar.textContent = '×';
cerrar.title = 'cerrar el panel (P)';
caja.appendChild(cerrar);

const tirador = document.createElement('div');
tirador.id = 'pr-tirador';
tirador.textContent = 'PRUEBAS · P';
document.body.appendChild(tirador);

const alterna = () => {
  const abierto = caja.classList.toggle('abierto');
  /* display y no opacity: fijarla en línea pisaría el :hover del CSS y al
     cerrar el tirador se quedaría a la vista para siempre */
  tirador.style.display = abierto ? 'none' : '';
};
tirador.addEventListener('click', alterna);
cerrar.addEventListener('click', alterna);
addEventListener('keydown', e => {
  if (e.key !== 'p' && e.key !== 'P') return;
  /* la P PELADA: ⌘P y Ctrl+P son «imprimir», y con ellos el panel se abría
     por debajo del diálogo del navegador */
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
  alterna();
});

/* ── armado ─────────────────────────────────────────────────────── */
const h = (tag, props, ...hijos) => {
  const n = document.createElement(tag);
  Object.assign(n, props || {});
  for (const c of hijos) n.appendChild(typeof c === 'string'
                                       ? document.createTextNode(c) : c);
  return n;
};
const titulo = t => caja.appendChild(h('h4', {textContent: t}));

/* PECERA */
titulo('pecera · ' + (P.escena.nombre || '?'));
{
  const anc = h('div', {className:'anc'});
  anc.appendChild(h('button', {textContent:'repoblar',
    onclick: () => { P.aplica(true); pinta(); }}));
  anc.appendChild(h('button', {textContent:'recalcular',
    onclick: () => { P.aplica(false); pinta(); }}));
  anc.appendChild(h('button', {textContent:'recargar',
    onclick: () => location.reload()}));
  caja.appendChild(anc);
}

/* EVENTOS */
titulo('eventos');
let areaJSON = null, etiqJSON = null, elegido = null;
{
  const nombres = Object.keys(A.EVENTOS);
  /* los parámetros de la escena si los tiene, y si no los de prueba del
     propio evento: así se puede lanzar uno que la escena no usa */
  const paramsDe = n => {
    const conf = (P.escena.eventos || []).find(c => c.evento === n);
    if (conf){
      const p = Object.assign({}, conf.params || conf);
      delete p.evento; delete p.params;
      /* fuera las paletas ya resueltas: son decenas de tripletas de RGB
         que tapan los parámetros de verdad, y al relanzar se conservan
         igual porque dispara() FUSIONA lo que se escriba aquí encima de
         los que ya tenía el evento. El espectro que las genera sí se ve. */
      for (const k in p) if (k.indexOf('paleta') === 0) delete p[k];
      return p;
    }
    return Object.assign({}, A.EVENTOS[n].prueba || {});
  };

  for (const n of nombres){
    const fila = h('div', {className:'fila'});
    const usado = (P.escena.eventos || []).some(c => c.evento === n);
    fila.appendChild(h('button', {className:'ev',
      textContent: (usado ? '▶ ' : '▷ ') + n,
      title: usado ? 'configurado en la escena' : 'no está en la escena: usa sus valores de prueba',
      onclick: () => {
        let extra = null;
        if (elegido === n && areaJSON.value.trim()){
          try { extra = JSON.parse(areaJSON.value); }
          catch { areaJSON.style.borderColor = '#7a2e2e'; return; }
        }
        areaJSON.style.borderColor = '';
        P.dispara(n, extra);
        pinta();
      }}));
    fila.appendChild(h('button', {textContent:'≡', title:'editar sus parámetros',
      onclick: () => { elegido = n; areaJSON.value = JSON.stringify(paramsDe(n), null, 1);
                       etiqJSON.textContent = 'parámetros de ' + n; }}));
    caja.appendChild(fila);
  }

  const anc = h('div', {className:'anc'});
  anc.appendChild(h('button', {className:'x', textContent:'parar todo',
    onclick: () => { P.para(); pinta(); }}));
  caja.appendChild(anc);

  etiqJSON = h('p', {className:'nota', textContent:'pulsa ≡ para editar parámetros'});
  caja.appendChild(etiqJSON);
  areaJSON = h('textarea', {spellcheck:false,
    placeholder:'{"vel":[3,6]}  → pisa parámetros al lanzar'});
  caja.appendChild(areaJSON);
}

/* EN MARCHA */
titulo('en marcha');
const listaVivos = h('div', {});
caja.appendChild(listaVivos);

/* ESCENA */
titulo('escena');
const refrescos = [];
for (const m of MANDOS){
  const v0 = valorDe(m);
  if (typeof v0 !== 'number' || !isFinite(v0)) continue;   // la escena no lo usa
  const fila = h('div', {className:'fila'});
  const rutas = rutasDe(m).join('\n');
  fila.appendChild(h('label', {textContent: m.nombre || rutas, title: rutas}));
  const val = h('span', {className:'val', textContent:String(v0)});
  fila.appendChild(val);
  caja.appendChild(fila);
  const sl = h('input', {type:'range', min:m.min, max:m.max, step:m.paso, value:v0});
  sl.oninput = () => {
    const v = parseFloat(sl.value);
    ponValor(m, v);
    val.textContent = String(v);
    if (m.aplica === 'calc')  P.aplica(false);
    if (m.aplica === 'nueva') P.aplica(true);
  };
  caja.appendChild(sl);
  refrescos.push(() => { const v = valorDe(m);
                         sl.value = v; val.textContent = String(Math.round(v*1e3)/1e3); });
}

caja.appendChild(h('p', {className:'nota',
  textContent:'los rangos [min,max] no salen aquí: se tocan por JSON en el evento, o en ABISMO dentro de escena.js.'}));

/* ── refresco de lo que cambia solo ─────────────────────────────── */
function pinta(){
  const vivos = P.vivos;
  listaVivos.textContent = '';
  if (!vivos.length){
    listaVivos.appendChild(h('p', {className:'nota', textContent:'nada en marcha'}));
  } else {
    for (const v of vivos){
      const fila = h('div', {className:'fila'});
      fila.appendChild(h('label', {className:'vivo',
        textContent: v.nombre + (v.exclusivo ? ' ·excl' : '') + '  ' + v.t + 's'}));
      fila.appendChild(h('button', {className:'x', textContent:'■',
        onclick: () => { P.para(v.nombre); pinta(); }}));
      listaVivos.appendChild(fila);
    }
  }
  for (const f of refrescos) f();
}
pinta();
setInterval(() => { if (caja.classList.contains('abierto')) pinta(); }, 400);

if (/[?&]pruebas/.test(location.search)) alterna();
})();
