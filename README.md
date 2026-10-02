# LESSAI · con Togo

App Android para conversar entre personas sordas y oyentes en El Salvador: lee la
**Lengua de Señas Salvadoreña (LESSA)** con la cámara, la dice en voz alta y muestra en
grande lo que se responde. Si alguien no habla, el teléfono habla por esa persona.
Funciona sin internet. Versión **Alfa 0.3**.

| Carpeta | Qué hay |
|---|---|
| [`LESSAI_MOVIL/`](LESSAI_MOVIL/README.md) | La app (Expo SDK 57 + módulo nativo Kotlin: CameraX + MediaPipe + TFLite). Docker: [`DOCKER.md`](LESSAI_MOVIL/DOCKER.md) |
| [`LESSAI_DATASET/`](LESSAI_DATASET/README.md) | Captura de videos y abecedario, extracción de puntos, entrenamiento y exportación del modelo |

Actualizar el modelo y la APK en un solo paso:

```bash
python LESSAI_DATASET/tools/actualizar_modelo.py --apk
```

**Equipo:** Elías Niriel López Casoverde · Diego Josué Elías López · Cesar Daniel Elías Villanueva ·
Victoria Rebeca Leiva Padilla · Andrea Sofia Argueta Dominguez

LESSAI™ · © 2026
