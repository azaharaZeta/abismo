# Idea: los peces picotean el señuelo y el rape no responde

**Estado: ANALIZADA, sin implementar** — hay medida y hay opciones; falta
elegir. **Empezada:** 2026-09-19

> Lo pedido, literal: «a veces los peces se quedan picando el señuelo, pero
> el rape no les caza. imagino que no tiene hambre, pero queda feo, pensar
> en algo mejor».

---

## Qué pasa, exactamente

La caza entera está en `intentaMorder()`, en
[bichos/rape-caza.js](../../bichos/rape-caza.js). La primera línea del
cuerpo útil es:

```js
if (f.reposo > 0) return;
```

O sea que durante el reposo el rape **no mira**. No es que decida no
atacar: la presa no se evalúa. `reposo` se arma al morder —`[10, 24]` s si
acierta, `reposoFallo: [3, 7]` si falla— y mientras tanto la esca sigue
atrayendo con `atraccion: 4.5` U, que es un radio generoso a propósito
(«con un solo rape, un alcance corto deja la trampa sin clientes»).

La trampa sigue funcionando; el que está apagado es el cazador.

## La medida

Tres semillas de 600 s de escena, caja de móvil, contando fotogramas-rape:

| | sem. 11 | sem. 23 | sem. 37 |
|---|---|---|---|
| de reposo | 35,6 % | 37,0 % | 37,2 % |
| con presa dentro de `alcanceBoca` | 15,2 % | 9,2 % | 13,1 % |
| **presa a tiro y el rape de reposo** | **66,2 %** | **61,0 %** | **58,0 %** |
| …y con la esca encendida | 51 % | 83 % | 65 % |
| episodios · mediana · el más largo | 27 · 0,8 s · **13,6 s** | 26 · 0,5 s · 7,7 s | 19 · 0,6 s · **16,7 s** |

**Dos tercios de las veces que un pez llega a la boca, el rape lo ignora.**
La mediana del episodio es de medio segundo —eso no se ve—; lo que se ve es
la cola: episodios de 8 a 17 segundos con un pez pegado a un señuelo
encendido y nada ocurriendo. Y la esca está encendida en la mayoría de
ellos, que es lo que lo hace leer como avería y no como saciedad.

## El conflicto de diseño

`reposo` largo **es** el tema del bicho: «un rape que patrulla es un pez que
pasa; uno quieto veinte segundos con la esca colgando es una trampa
esperando». Bajarlo convierte al rape en una trituradora y se carga lo que
la escena llama, con razón, un cazador de emboscada. **La solución no puede
ser cazar más.**

Lo que falla no es el ritmo: es que durante el reposo el animal no hace
NADA distinto, así que no hay forma de leer por qué no ataca.

## Opciones

1. **Que la esca se apague mientras está saciado.** Ya existe el mecanismo
   —`trasComer: [7, 16]` la apaga tras tragar—, pero cubre menos que
   `reposo: [10, 24]`, así que queda una ventana con la trampa encendida y
   el cazador dormido. Atar los dos cierra la ventana: sin luz no hay
   atracción (`atraccion` se mide desde la esca), así que los peces dejan de
   acudir y el picoteo no llega a formarse. **Es la opción barata y la que
   no toca el ritmo de caza.** Riesgo: la esca es «el único punto de
   referencia que hay aquí abajo» y apagarla un tercio del tiempo puede
   dejar el cuadro sin ancla —hay que medir cuánto baja el tiempo con esca
   viva antes de decidir.

2. **Que se le note saciado.** Durante el reposo, la quijada trabaja despacio
   (ya existe `masticaRitmo`) o el ilicio se recoge hacia la boca (ya existe
   `retrae`/`masticaRetrae`). No quita el picoteo: lo explica. Se puede
   combinar con la 1.

3. **Amagar sin morder.** Con presa a tiro y reposo vivo, un tirón corto de
   quijada sin `acierto` y sin `tragando`: el pez se asusta y se va, el rape
   no come. Reutiliza `espanta`, `abertura` y `acometida`, que ya están.
   Es lo que hace un depredador saciado de verdad, y **quita el picoteo sin
   tocar `reposo`**. Riesgo: si amaga a menudo, la ráfaga deja de ser el
   acontecimiento que es hoy —habría que darle su propio umbral y su propio
   reloj, y eso es un mecanismo nuevo, no un parámetro.

4. **Que la presa se canse.** Un pez que lleva mucho junto a una esca sin que
   pase nada pierde el interés y se va. Es lo más realista y lo más caro:
   hace falta estado por pez (cuánto lleva) y un umbral, y toca el bicho que
   más gente mira.

## Siguiente acción

Medir la 1 —cuánto tiempo de escena queda sin ninguna esca encendida si
`trasComer` cubre todo el `reposo`— y decidir entre 1+2 (barato, explica) y
3 (quita el síntoma, mecanismo nuevo). La 4 queda para después.
