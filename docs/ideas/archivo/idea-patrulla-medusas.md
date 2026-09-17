# Idea: Afinar la patrulla vertical de las medusas

**Estado: PROCESADA — SIN CAMBIOS** · archivada el 2026-09-15
**Enunciado original:** «Medusas: afinar `patrulla` para acercar el reparto vertical de
la pecera cerrada (desviación 8,9) al de la abierta (5,6); hoy usa el rango por
defecto.»

## Resultado: el valor por defecto ya era el mejor, y ahora se sabe por qué

Se probaron cuatro esquemas, 5 tiradas de 20 minutos simulados cada uno, midiendo la
desviación del reparto vertical respecto a un 10 % plano por franja:

| esquema | desviación |
|---|---|
| **A · extremos independientes (el actual)** | **6,6** |
| B · centro + amplitud | 9,3 |
| C · bandas modestas | 9,3 |
| D · bandas estrechas | 9,8 |
| *referencia: pecera abierta* | *5,6* |

El actual gana, y está a un paso de la pecera abierta. Se intentó cambiarlo a B y se
revirtió.

## Los dos hallazgos que lo explican

1. **La posición vertical de una medusa la manda la CORRIENTE, no su flotabilidad.**
   `flujoY` da hasta 1,8 px/s en esta pieza y la medusa se mueve por su cuenta a
   0,16 px/s: un factor de diez. Por eso el esquema de patrulla apenas mueve la aguja.
2. **Ensanchar la banda es contraproducente.** Alarga el viaje de ida y vuelta por
   encima de lo que dura una sesión (17–70 minutos), así que las medusas ni completan
   un ciclo y se quedan en el extremo al que iban. El esquema A gana precisamente
   porque algunas salen con bandas estrechas, que sí oscilan y pueblan el centro.

## Error de método que conviene recordar

La primera comparación se hizo **en la página del abismo**, cuya corriente es la mitad
de fuerte (`amplitud` 0,16 contra 0,30). Allí los cuatro esquemas empataban en 16–18,5
y la conclusión habría sido la contraria. Las medusas sólo existen en `medusas.html`:
es donde hay que medirlas.
