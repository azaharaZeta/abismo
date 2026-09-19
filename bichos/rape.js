/* ══════════════════════════════════════════════════════════════════
   RAPE
   La esca va DELANTE del morro, que es para lo que sirve: atraer algo
   hacia la boca. Eso deja al pez a oscuras, porque su propia luz apunta
   al frente y no a él, y sólo se ve cuando algo lo alumbra —la esca de
   otro rape, o la suya cuando gira de golpe y el señuelo, que va con
   retardo, se le queda un momento encima. Ése es el mecanismo.

   El cuerpo se ilumina desde la posición real de la luz dominante.
   ══════════════════════════════════════════════════════════════════ */

import { M, especie } from '../motor.js';
const {rgba, clamp, rnd, rango, rangoE, suave, opt, TAU} = M;
import { porPlano, paso, reaccionBorde, hacia, gxSano,
         silencio } from './comun.js';
import { enPez, aMundo, centro, bocaLargo, adelante, cuerpoPath, piel,
         visceras, aletas, volumen, ojo, quijadas, bocaPath, boca,
         barbilla, senuelo } from './rape-cuerpo.js';
import { querencia, caza, camposRape, mirada,
         luzRecibida } from './rape-caza.js';


especie('rape', {
  luz: true,
  /* el cuerpo tapa y el bocado asusta: van en su propia pasada, antes de
     que se actualice nadie, o el plancton y el banco del fondo no los ven */
  campos: camposRape,
  conteo: porPlano,

  crear(M, L, p){
    const Lg = rango(p.largo) * M.U * L.scale;
    /* NACE YA EN SU SITIO si la escena le pide querencia de borde: con un
       crucero de centésimas de unidad por segundo tardaría minutos en llegar
       al canto, y ésos son justo los minutos que alguien está mirando. */
    let bx, by;
    if (p.querencia){
      const aro = p.aro;
      const lado = (Math.random()*4)|0, t = rnd(-aro, aro);
      const ex = lado === 0 ? -aro : lado === 1 ? aro : t;
      const ey = lado === 2 ? -aro : lado === 3 ? aro : t;
      bx = (1 + ex)*0.5*M.W; by = (1 + ey)*0.5*M.H;
    } else {
      bx = rango(p.banda)*M.W; by = rango(p.bandaY)*M.H;
    }
    /* de cara al centro: dir=1 mira a −x */
    const dir = p.miraAlCentro ? (bx > M.W*0.5 ? 1 : -1)
                               : (Math.random() < 0.5 ? 1 : -1);
    /* UN COLOR Y UNO SOLO, sorteado al nacer. Lo usan la esca, el cuerpo,
       la barbilla y la pupila: ningún componente tiene color propio, y lo
       que la luz de al lado decide es por dónde se enciende, no de qué
       color es. La diferencia entre el FOCO y el SUSURRO la sostienen
       sólo el alfa —`brillo` contra `cuerpo`— y el núcleo blanco de la
       esca; no hace falta una paleta por componente. */
    const f = {
      c: M.color(p.paleta),
      Lg, dir, gx: dir,
      bx, by,
      /* x,y son la esca: es lo que el motor reparte como luz, y no hay una
         segunda copia del mismo punto que mantener al día */
      x: bx, y: by, lvx: 0, lvy: 0,
      /* `rLuz` y `senuelo` los recalcula `actualiza()` con el brillo de
         cada fotograma; esto es sólo el valor con el que nace. */
      rLuz: Lg*p.alcanceLuz, rCuerpo: Lg*p.alcanceCuerpo, luzI: 0.6,
      vx: 0, vy: 0,
      fase: Math.random()*TAU,
      velCola: rango(p.velCola),
      amplitudCola: rango(p.cola),
      dientes: rangoE(p.dientes),
      /* el detalle que varía de uno a otro. Van a 0 si la escena no los pide,
         y entonces no se dibuja ninguno: la especie sigue sirviendo para un
         rape pequeño y esquemático al fondo. */
      barbas:    p.barba ? rangoE(p.barbas) : 0,
      miomeros:  rangoE(opt(p.miomeros, 0)),
      radios:    rangoE(opt(p.radios, 0)),
      brillo: rnd(0.45, 0.8), objBrillo: 0.6, proxBrillo: rnd(0.5, 4),
      /* acecho: quieto mucho rato, embestida corta de vez en cuando. Por
         rango() y no indexando p.acecho[1]: el convenio del motor es «número
         o par», y con un número suelto esto daba NaN. */
      espera: rnd(1, rango(p.acecho)),
      lanza: 0,
      giroProx: rango(p.giro),
      /* inclinación de nado: cruza en diagonal, no sólo en horizontal */
      ang: 0, angObj: rango(p.inclina), angProx: rango(p.cadaInclina),
      /* `senuelo` es CUÁNTO tira, de 0 a 1, no si es una trampa: lo
         recalcula actualiza() con el brillo. Nace a 1. */
      /* `fogonazo` es la fase de la ráfaga y `chispa` la luz que sale de
         ella; `espanta` es la fase del susto que reparte al morder. */
      ataque: 0, senuelo: 1, fogonazo: 0, chispa: 0, espanta: 0, digiere: 0,
      /* masticar: lo que queda, lo que duraba y lo que abre la quijada ahora
         mismo. `masticaPend` es lo ganado al acertar, que espera a que termine
         el bocado. */
      mastica: 0, masticaTotal: 1, masticaPend: 0, masticaAb: 0,
      alFrente: false,
      reposo: rnd(0, rango(p.reposo)),
      bocaX: bx, bocaY: by, tragando: null,
      sway: Math.random()*TAU,
      ilum: 0, luzX: bx, luzY: by,
      /* A DÓNDE MIRA, en mundo. Arranca en el morro y no en el cuerpo para que
         el primer fotograma no salga con el ojo en blanco. */
      miraX: bx, miraY: by,
      /* el bombeo de las branquias: fase y ritmo propios, o los diez rapes de
         una pecera grande respirarían al unísono */
      respFase: Math.random()*TAU,
      respVel:  rango(p.ritmoRespira),
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

    /* ── EL PARPADEO, Y LA TRAMPA APAGADA ─────────────────────────
       Mientras está SACIADO (`reposo > 0`) el parpadeo sigue, pero dentro
       de `escaSaciada` en vez de `intensidad`: la esca no se apaga —es el
       único punto de referencia que hay aquí abajo— pero deja de ser una
       trampa. Cubre todo el reposo y no sólo la digestión, que es la
       ventana por la que se colaba el picoteo. */
    f.proxBrillo -= dt;
    if (f.proxBrillo <= 0){
      f.objBrillo = rango(f.reposo > 0 ? p.escaSaciada : p.intensidad);
      f.proxBrillo = rango(p.parpadeo);
    }
    /* y si le entra el reposo a mitad de parpadeo, no espera al siguiente:
       lo que se tiene que ver es que se apaga AL tragar */
    if (f.reposo > 0 && f.objBrillo > p.escaSaciada[1])
      f.objBrillo = rango(p.escaSaciada);
    f.brillo = hacia(f.brillo, f.objBrillo, 1.6, dt);

    /* ── LO QUE LA ESCA TIRA Y HASTA DÓNDE ALCANZA ────────────────
       Las dos salen del brillo de AHORA, normalizado contra el suelo del
       parpadeo normal: a brillo de `intensidad` valen 1 y no cambia nada;
       apagada, caen con ella.

         `senuelo` es cuánto tira, y la presa multiplica su `atraccion` por
                   él (ver `cardumen` en pezlinterna). Sin esto, apagar la
                   esca es cosmético: el banco sigue acudiendo igual y el
                   picoteo no se arregla.
         `rLuz`    hasta dónde enciende plancton. Sin esto queda una nube
                   de motas prendidas alrededor de un señuelo oscuro, que
                   es peor que el problema que se venía a arreglar. */
    const tira = Math.min(1, f.brillo/p.intensidad[0]);
    f.senuelo = tira;
    f.rLuz = Lg*p.alcanceLuz*tira;
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
      ? Math.pow(0.5 + 0.5*Math.sin(t*p.masticaRitmo + f.fase), 1.6) : 0;
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

       No congela el bocado ni la embestida: en las dos ya está pasando
       algo. El umbral va a medio `techo`, así que se congela cuando está
       revelado y no cuando le roza un reflejo.                       */
    const cong = (f.ataque > 0 || f.mastica > 0 || f.lanza > 0.01) ? 0
      : opt(p.congela, 0)
        * suave(clamp(f.ilum/Math.max(0.001, p.techo*0.5), 0, 1));
    /* con rampa: congelarse de un fotograma al siguiente es un salto, y lo
       que tiene que parecer es que se ha quedado quieto */
    f.congela = hacia(f.congela, cong, 3.2, dt);
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
    f.ang = hacia(f.ang, f.angObj, p.velInclina, dt);

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
    /* EL DEDO NO LE HACE NADA, y es a propósito: un cazador de emboscada
       que sale de estampida porque le rozan la pantalla deja de ser una
       trampa esperando. Lo único que lo mueve de su sitio es el hambre. */

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
    f.gx = hacia(f.gx, f.dir, p.velGiro, dt);

    /* deriva de acecho: casi nada, más un vaivén largo —y también se calla
       al congelarse, que es lo único que queda moviéndolo */
    f.vy += Math.sin(t*0.13 + f.sway)*M.U*0.05*vivo*dt;
    const dr = Math.pow(p.arrastre, dt);
    f.vx *= dr; f.vy *= dr;
    /* el borde se mide en el centro del cuerpo, no en la esca: es el pez el
       que no cabe. `centro` devuelve un array compartido: se consume ya. */
    const bc = centro(f, f.gx);
    reaccionBorde(f, M, p, bc[0], bc[1], dt);

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
    const gx = gxSano(f.gx, 0.06);
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

       Y EL BICHO ES TRANSPARENTE A SÍ MISMO A PROPÓSITO: todo se suma en
       el mismo lienzo, así que una aleta de detrás se le suma encima. De
       un animal de agua negra no se ve un volumen macizo, se ve la suma
       de lo que en él tiene luz. A los DEMÁS sí los tapa, con el campo
       `tapa`: transparente a sí mismo, opaco a los otros. */
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
