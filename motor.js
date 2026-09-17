/* ══════════════════════════════════════════════════════════════════
   MOTOR DEL ABISMO · la fachada
   Lo único que ven las criaturas y el panel. El motor vive troceado en
   motor/, y esto dice qué parte de él es pública:

     motor/util.js      funciones puras, sin estado ni escena
     motor/color.js     espectro → paleta, y los halos cacheados
     motor/registro.js  los dos registros: especies y eventos
     motor/estado.js    `V` y las colecciones que comparte todo
     motor/agua.js      la tira, el grano, la ondulación y el velo
     motor/dedo.js      las ondas del contacto
     motor/api.js       campos, contención y el objeto `M`
     motor/bucle.js     población, eventos, calidad, setup y el fotograma

   La escena está en escena.js y el catálogo, en catalogo.js.
   ══════════════════════════════════════════════════════════════════ */
export { M } from './motor/api.js';
export { ESPECIES, EVENTOS, especie, evento } from './motor/registro.js';
export { arranca } from './motor/bucle.js';
