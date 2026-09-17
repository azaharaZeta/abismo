# Idea: La caza

**Estado: IMPLEMENTADA** · procesada y archivada el 2026-09-17.

**Enunciado original (del índice), dos líneas que son la misma escena:**

> - Los peces tienen que huir del rape cuando éste caza una presa.
> - el rape se ilumina como dos veces cuando caza? revisar eso, tiene que iluminarse
>   como una ráfaga violenta en la caza, y oscurecerse rápido de vuelta. revisar uqe no
>   haya código espagueti ahí de pruebas pasadas.

---

## A · «Se ilumina como dos veces». Sí, se iluminaba dos veces

No era una impresión. La luz que el rape reparte salía de esta línea:

```js
f.luzI = f.brillo + f.fogonazo*p.fogonazo + f.mastEnv*opt(p.masticaLuz, 0);
```

Con los números de la escena, la cronología de un bocado acertado era:

| | | |
|---|---|---|
| t = 0 | `fogonazo = 1` y `ataque = 1` | la ráfaga: **11×**, restando `dt/0,55` |
| t = 0,55 | `ataque` llega a 0 → arranca `mastica` | la ráfaga se ha apagado… |
| t = 0,55 | `mastEnv` entra **a tope** (`suave(1) = 1`) | …y empieza la segunda: **2,4×**, latiendo a 4,6 rad/s |
| t = 0,75-0,93 | acaba de masticar | negro |

Dos encendidos pegados, y el segundo justo cuando el primero se apagaba. Y encima el
primero **restaba a ritmo constante**, así que no tenía forma de ráfaga: bajaba igual de
despacio al principio que al final y se leía como un foco que se enciende y se apaga.

### Lo que hay ahora: una envolvente y nada más

```js
f.fogonazo = Math.max(0, f.fogonazo - dt/p.fogonazoDura);
f.chispa = f.fogonazo ? Math.pow(f.fogonazo, opt(p.fogonazoCaida, 1)) : 0;
f.luzI = f.brillo + f.chispa*p.fogonazo;
```

- **`fogonazoCaida: 1.8`** convierte la fase en ráfaga: ataque en un fotograma y caída
  violenta.
- **`fogonazoDura: 0.55 → 0.9`**, que es el bocado *más* la masticación. No es que dure
  más luz: es que ahora es la única, y tiene que llegar de cola hasta que acaba de
  tragar.
- **La masticación ya no pone luz, pone movimiento** —la quijada trabajando y el ilicio
  recogido—. Se ve con la cola de la ráfaga.
- La esca visible (`ebr`, en `dibuja`) usa **la misma** `chispa`: antes tenía su propio
  `fogonazo*0.9 + mastEnv*masticaEsca`, o sea que el punto y lo que alumbraba se
  apagaban a ritmos distintos.

### Medido

Instrumentando `actualiza` del rape y registrando `luzI` fotograma a fotograma en un
bocado real:

| t (s) | luz |
|---|---|
| justo antes | 0,53 |
| +1 fotograma | **11,3** |
| 0,20 | 7,68 |
| 0,45 | 3,80 |
| 0,70 | 1,32 |
| 0,90 | 0,46 |

Y el dato que buscaba la idea: **cero subidas de luz después del fotograma del ataque**
(la única «subida» que detecta el test es la del ataque, +10,8). La masticación arranca
en t = 0,55 y no se nota en la curva. Una ráfaga, y a oscuras en 0,9 s.

### El código espagueti que había

Uno, y era justo el que sumaba al problema. En la rama del **fallo** de `caza()`:

```js
f.objBrillo = 1;
```

Sin comentario, sin rampa que lo bajara y sin tocar `proxBrillo`, así que **tras cada
fallo la esca se quedaba a tope hasta el siguiente parpadeo** —hasta 9 s—. Un tercer
encendido, y encima el que menos sentido tiene: el que falla no se anuncia. Borrado; el
parpadeo sigue su ciclo.

Con él se han ido `p.masticaLuz`, `p.masticaEsca` y el campo `f.mastEnv`, que ya no
tenían consumidor.

---

## B · Que el banco huya

El vocabulario de la pieza para que dos bichos se relacionen sin conocerse son los
**campos**. El catálogo de eventos ya tenía apuntado que a `E-06 La estampida` «le falta
un `asusta`»: aquí se estrena ese tipo.

- El rape marca `f.espanta = 1` al morder (**acierte o falle**: lo que ven los vecinos es
  el tirón y la ráfaga, que son los mismos en los dos casos) y lo va soltando en
  `espantaDura` segundos.
- Lo empuja en **`campos()`** y no en `actualiza()`, igual que el `tapa`: los campos se
  vacían al empezar el fotograma y esa pasada corre para los tres planos antes de que se
  mueva nadie, que es la única forma de que lo lea también un pez del fondo. Con guarda
  de plano, así que un rape de delante no asusta a un banco que está mucho más allá.
- El pez linterna lo lee, entra en el **`susto` que ya existía** —el del dedo y el del
  fallo: triplica el viraje, sube el nado a `velSusto`, suelta las dos reglas de grupo
  pero no la de no chocar— y saca el rumbo de huir del centro del campo.

Para esto se añadió a `espanto()` un compañero de `tapa()` y una función `camposRape()`
que llama a las dos, porque el contrato de especie sólo admite un `campos`.

### El error que costó la medición

La primera versión ponía el rumbo de huida **antes** de `cardumen()`, que es donde
parecía tocar. No funcionaba: medido, la distancia media del banco a la boca subía de
2,11 a 2,18 largos en dos segundos, o sea nada.

La causa está en `cardumen()`: `aparta` acumula **un vector por vecino** dentro del roce
y se suma sin normalizar, mientras que el rumbo que traiga el pez entra con peso
`propio` = 0,40. En un banco denso la separación le pasa por encima y el rumbo de huida
desaparecía.

Ahora se aplica **después**, y **mezclado** con lo que dijo el grupo en vez de
sustituirlo —como vectores, que promediar radianes se rompe al cruzar el ±π—, con peso
`panico*0.85`. Así el que tiene el campo encima huye casi en línea recta, el del canto
del radio apenas se desvía, y en ningún caso se apaga la separación del todo: el banco
se abre sin anudarse.

### Medido

Forzando un bocado en el rape del plano de delante (68 peces, lienzo de 2048 px,
`Lg` = 296 px, radio del susto 591 px = 29 % del ancho):

| t (s) | en pánico | dentro de 2 largos | distancia media (largos) |
|---|---|---|---|
| antes | 0 | 40 | 1,68 |
| 0,4 | **34** | 40 | 1,69 |
| 1,0 | 32 | 40 | 1,76 |
| 2,0 | 11 | 38 | 1,89 |
| 3,0 | 0 | 36 | 1,92 |
| 5,0 | 0 | 40 | 1,86 |

Se asusta **la mitad del banco** —el que está cerca—, el hueco alrededor de la boca se
abre durante unos tres segundos y **se cierra solo** al quinto. La distancia media se
mueve poco porque la métrica incluye a todo el banco hasta 8 largos; los números que
cuentan son los dos primeros.

### El radio, y por qué no puede ser generoso

`espanta` va en **largos del rape**, así que espanta más lejos cuanto más grande es el
animal y la escala se mantiene en cualquier pantalla. Se probó a **4,2** —el 61 % del
ancho del cuadro— y entraban en pánico **los 68 peces a la vez**: no quedaba nadie fuera
y el susto dejaba de ser local. A 2,0 (29 % del ancho) se asustan 34 de 68.

## Lo que deja pendiente

El tipo de campo `asusta` queda abierto y con un consumidor. **`E-06 La estampida`** del
catálogo de eventos era justo eso a escala de pecera: ya sólo le falta el registro del
evento, no el mecanismo. Anotado en el índice.
