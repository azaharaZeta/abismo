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
   UNA FILA NO TRAE NINGÚN VALOR DE LA ESCENA, sólo la ruta hasta él y el
   recorrido del deslizador. La distinción es la que sostiene el panel:
   el valor y su porqué son de la pieza y viven en escena.js; hasta dónde
   llega un deslizador es del andamio y vive aquí. Un número de la escena
   tecleado en esta lista deja de reproducirla en cuanto alguien toca el
   otro, y nada lo avisa.

   Con `escala`, la ruta apunta a un ARRAY de la escena y el deslizador es
   un MULTIPLICADOR sobre lo que traía: a 1 la reproduce exacta y al
   moverlo conserva el reparto entre los extremos —es como se gobierna un
   `[min,max]` con un solo mando—. Los factores se leen de la escena al
   armar el panel (ver `arranque`). Los rangos de los eventos se siguen
   editando como JSON más abajo.

   Y sólo los que se pueden JUZGAR MIRANDO. Aquí no entra un parámetro
   que haya que medir —`cardumen.vista` se comprueba contando alineación,
   no arrastrando—, ni un multiplicador de otro que ya tiene mando
   —`brilloOjo` cuelga de `brillo`—, ni un detalle de dos píxeles como la
   pupila del rape. Para todo eso está el JSON del evento, y escena.js.

   `paso` TIENE QUE DIVIDIR al valor de la escena contando desde `min`: un
   `range` redondea el valor inicial al múltiplo más cercano, así que si
   no divide, el deslizador arranca en un sitio y la escena está en otro.
   No hay que acordarse —lo comprueba `revisa()` y sale en el panel.

   `aplica` dice qué hace falta después de cambiarlo:
     null    · surte efecto solo, el motor lo lee cada frame
     'calc'  · hay que recalcular (corriente, planos, tamaño del lienzo)
     'nueva' · hace falta población nueva                             */
const MANDOS = [
  /* EL AGUA. Los dos del velo están explicados en ABISMO.dispersion. */
  {nombre:'luz de fondo',   ruta:'agua.brillo',       min:0,   max:5,    paso:0.05, aplica:null},
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
  {nombre:'leviatán · luz', ruta:'eventos.@leviatan.brillo', min:0, max:0.8, paso:0.05, aplica:null},
  /* el tamaño de TODO: la unidad de escena sale de aquí */
  {nombre:'escala',         ruta:'escala',            min:10,  max:60,   paso:1,    aplica:'nueva'},

  /* LOS BICHOS. La nieve marina se cuenta en motas y no por área de
     pantalla: el cuadro enseña el mismo trozo de mar en cualquier
     aparato, así que SUBIRLO es más plancton, y son ésas en todas. */
  {nombre:'plancton · cuántas', ruta:'bichos.@plancton.total',
   min:0, max:2000, paso:25, aplica:'nueva'},
  /* ── EL BANCO: CUÁNTOS Y DE QUÉ TAMAÑO ──────────────────────────
     CUÁNTOS escribe el `total` del banco, que es un número suelto: el
     conteo no pasa por el área, así que el mando dice «tantos peces» y
     vale igual en un móvil que en una pantalla grande. Puede quedarse a
     uno del pedido, que el total se reparte por planos con `reparto` y
     cada plano redondea por su cuenta.

     TAMAÑO gobierna el PAR `largo` con `escala` (ver la cabecera): es un
     multiplicador y no un largo, así que al moverlo el banco conserva su
     reparto de peces grandes y chicos. Puesto como largo absoluto habría
     que elegir uno de los dos extremos y el otro se despegaría. */
  {nombre:'peces · cuántos', ruta:'bichos.@pezlinterna.total',
   min:0, max:90, paso:1, aplica:'nueva'},
  {nombre:'peces · tamaño ×', ruta:'bichos.@pezlinterna.largo', escala:true,
   min:0.2, max:4, paso:0.05, aplica:'nueva'},
  {nombre:'banco · desorden',  ruta:'bichos.@pezlinterna.desorden',
   min:0, max:0.6, paso:0.02, aplica:'nueva'},
  /* los dos del nado: cada cuánto se replantea el rumbo —el que decide si
     nada o corrige— y hasta qué giro acepta por seguir al grupo. A 0 el
     grupo no manda nunca. */
  {nombre:'peces · rumbo ×', ruta:'bichos.@pezlinterna.rumbo', escala:true,
   min:0.2, max:3, paso:0.1, aplica:null},
  {nombre:'banco · giro cómodo', ruta:'bichos.@pezlinterna.cardumen.comodo',
   min:0, max:3.2, paso:0.1, aplica:null},
  {nombre:'rape · cuerpo',     ruta:'bichos.@rape.cuerpo',    min:0, max:2,   paso:0.02, aplica:null},
  {nombre:'rape · media altura', ruta:'bichos.@rape.altura',
   min:0, max:0.5, paso:0.02, aplica:null},
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

/* ── UN DESLIZADOR, UN ESCALAR O UN ARRAY ───────────────────────────
   Con `escala`, la ruta apunta a un array de la escena y el deslizador es
   un multiplicador sobre él: los FACTORES son lo que la escena traía, se
   leen una vez al armar el panel y no se teclean en `MANDOS`. El número
   que se enseña sale del primer elemento dividido por el suyo.

   Se redondea al escribir porque 1,15·1,4 son 1,6099999999999999 y eso
   acaba en la escena. Un factor 0 no se puede dividir —sería un extremo
   que el mando no puede mover—, así que se guarda como 1 y ese elemento
   se queda quieto. */
function arranque(m){
  m.base = leer(m.ruta);
  if (m.escala) m.base = Array.isArray(m.base) ? m.base.slice() : null;
  return m;
}
const r4 = v => Math.round(v*1e4)/1e4;
const valorDe = m => m.escala ? leer(m.ruta + '.0') / (m.base[0] || 1)
                              : leer(m.ruta);
const ponValor = (m, v) => {
  if (!m.escala){ poner(m.ruta, v); return; }
  m.base.forEach((b, i) => poner(m.ruta + '.' + i, r4(v*b)));
};

/* ── LO QUE IMPIDE QUE UNA FILA MUERA EN SILENCIO ───────────────────
   Una ruta es una cadena y la escena es libre: basta que alguien cambie
   un convenio —el conteo del plancton pasó de área por mota a un total
   absoluto— para que la fila apunte a la nada. Descartándola sin más, el
   panel enseña un mando menos y nadie se entera; por eso se pinta ROTA y
   con su ruta a la vista. Las otras dos son de bulto pero se repiten:
   un `paso` que no divide al valor deja el deslizador en un sitio y la
   escena en otro, y un valor fuera de [min,max] lo clava en el canto. */
function revisa(m){
  /* antes de `valorDe`: sin base, dividir por `m.base[0]` revienta */
  if (m.escala && !m.base) return 'la ruta no es un array en la escena';
  const v = valorDe(m);
  if (typeof v !== 'number' || !isFinite(v)) return 'la escena no lo tiene';
  if (v < m.min || v > m.max) return 'vale ' + r4(v) + ', fuera de [' + m.min + ', ' + m.max + ']';
  /* en milésimas de paso: (0.55−0)/0.05 da 10.999999999999998 */
  const n = (v - m.min)/m.paso;
  if (Math.abs(n - Math.round(n)) > 1e-6)
    return 'paso ' + m.paso + ' no divide a ' + r4(v);
  return null;
}

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
#pr button[disabled]{opacity:.45;cursor:not-allowed}
#pr button[disabled]:hover{background:#0e2430;border-color:#1d4756}
#pr button.x{color:#d98a8a;border-color:#4a2028;padding:3px 6px}
#pr .anc{display:flex;gap:4px;margin:4px 0}
#pr .anc button{flex:1;text-align:center}
#pr textarea{width:100%;height:58px;background:#081820;color:#cfe6ef;
  border:1px solid #17394a;border-radius:4px;font:inherit;padding:4px;
  resize:vertical}
#pr .vivo{color:#7fd6a0}
/* un mando que no resuelve, o que arranca descolocado: rojo y con la
   ruta escrita. Descartarlo en silencio es lo que dejó al panel con una
   fila menos durante meses. */
#pr .roto{color:#d98a8a}
#pr .fila.roto label{color:#d98a8a}
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
/* y una nota ROTA sigue siendo roja. La regla de nota va DESPUÉS de la de
   roto y con la misma especificidad, así que ganaba el último y el motivo
   de un mando roto salía en gris: la fila en rojo y su porqué apagado. */
#pr .nota.roto{color:#d98a8a}
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
  /* Los de la escena, y no hay otro sitio de donde sacarlos: un evento no
     lleva valores propios. Uno que la escena no configure no se puede
     lanzar —para probarlo se le añade con `cada: null` y queda dormido. */
  const paramsDe = n => {
    const conf = (P.escena.eventos || []).find(c => c.evento === n);
    if (!conf) return {};
    const p = Object.assign({}, conf.params || conf);
    delete p.evento; delete p.params;
    /* fuera las paletas ya resueltas: son decenas de tripletas de RGB
       que tapan los parámetros de verdad, y al relanzar se conservan
       igual porque dispara() FUSIONA lo que se escriba aquí encima de
       los que ya tenía el evento. El espectro que las genera sí se ve. */
    for (const k in p) if (k.indexOf('paleta') === 0) delete p[k];
    return p;
  };

  for (const n of nombres){
    const fila = h('div', {className:'fila'});
    const conf = (P.escena.eventos || []).find(c => c.evento === n);
    /* tres estados, y el del medio es el que hace falta para probar sin
       instalar: en la escena y despierto · en la escena y DORMIDO
       (`cada: null`, no sale solo) · registrado pero sin entrada, que no
       se puede lanzar porque sus parámetros viven en la escena. */
    const dormido = conf && (conf.params || conf).cada === null;
    fila.appendChild(h('button', {className: 'ev' + (conf ? '' : ' roto'),
      textContent: (conf ? (dormido ? '◌ ' : '▶ ') : '▷ ') + n,
      disabled: !conf,
      title: !conf ? 'no está en ABISMO.eventos: no hay parámetros que darle.'
                   + ' Añádelo con `cada: null` para poder lanzarlo sin que salga solo'
           : dormido ? 'dormido en la escena: sólo sale si lo lanzas'
                     : 'configurado en la escena',
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

/* SALUD DEL FOTOGRAMA
   Lo primero de todo porque es lo que explica por qué la pieza no es la
   que se dejó escrita: `degradar()` entra sola, no vuelve y recorta
   población, dither y velo. Sin esto, la única forma de notarlo era
   contar bichos —catorce peces que en un móvil salían siete. */
titulo('salud');
const salud = h('p', {className:'nota'});
caja.appendChild(salud);
function pintaSalud(){
  const s = P.salud;
  /* el panel no depende del motor: con uno viejo esta línea no sale y ya */
  if (!s){ salud.remove(); pintaSalud = () => {}; return; }
  const fps = s.ms > 0 ? Math.round(1000/s.ms) : 0;
  salud.className = 'nota' + (s.degradado ? ' roto' : '');
  salud.textContent = s.ms + ' ms · ' + fps + ' fps · ' + (s.degradado
    ? '⚠ DEGRADADO: población ×' + s.poblacion + ', sin dither, velo a '
      + s.niveles + ' niveles'
    : 'techo ' + s.techo + ' ms · ' + (s.lento > 0
        ? 'DEGRADANDO ' + s.lento + '/' + s.paciencia
        : 'entero'));
}

/* EN MARCHA */
titulo('en marcha');
const listaVivos = h('div', {});
caja.appendChild(listaVivos);

/* ESCENA */
titulo('escena');
const refrescos = [];
for (const m of MANDOS){
  arranque(m);
  const mal = revisa(m);
  if (mal){
    /* la fila rota se PINTA, con su ruta y el motivo: es lo único que
       distingue «este mando no existe» de «este mando no hace nada» */
    const fila = h('div', {className:'fila roto'});
    fila.appendChild(h('label', {textContent: '⚠ ' + (m.nombre || m.ruta),
                                 title: m.ruta + '\n' + mal}));
    caja.appendChild(fila);
    caja.appendChild(h('p', {className:'nota roto', textContent: m.ruta + ' · ' + mal}));
    console.warn('pruebas: mando «' + (m.nombre || m.ruta) + '» → ' + m.ruta + ': ' + mal);
    continue;
  }
  const v0 = valorDe(m);
  const fila = h('div', {className:'fila'});
  fila.appendChild(h('label', {textContent: m.nombre || m.ruta, title: m.ruta}));
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
  pintaSalud();
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
