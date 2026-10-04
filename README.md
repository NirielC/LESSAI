# LESSAI · con Togo

App Android para conversar entre personas sordas y oyentes en El Salvador: lee la
**Lengua de Señas Salvadoreña (LESSA)** con la cámara, la dice en voz alta y muestra en
grande lo que se responde. Si alguien no habla, el teléfono habla por esa persona.
Funciona sin internet. Versión **Alfa 0.5**.

| Carpeta | Qué hay |
|---|---|
| [`LESSAI_MOVIL/`](LESSAI_MOVIL/README.md) | La app (Expo SDK 57 + módulo nativo Kotlin: CameraX + MediaPipe + TFLite). Docker: [`DOCKER.md`](LESSAI_MOVIL/DOCKER.md) |
| [`LESSAI_DATASET/`](LESSAI_DATASET/README.md) | Captura de videos y abecedario, extracción de puntos, entrenamiento y exportación del modelo |
| [`LESSAI_PANTALLA/`](LESSAI_PANTALLA/) | Pantalla decorativa animada para el monitor de la presentación |
| `LESSAI_MOVIL/dist/` | APK listas: `LESSAI-Alfa-0.5.apk` (modelo final) y `LESSAI-Alfa-0.5-modelo-anterior.apk` |

## Pantalla para el monitor (presentación)

Pantalla horizontal y animada, en bucle: **LESSAI** en grande arriba, Togo en su rama
saludando y hablando, un teléfono que lee una mano y arma una conversación, los tres pasos
de la app y una cinta con mensajes. Funciona **sin internet** (fuentes incluidas).

1. Abrir la carpeta `LESSAI_PANTALLA/`.
2. Doble clic en **`abrir.bat`**: se abre en Edge (o Chrome) a pantalla completa.
   - Otra forma: abrir `index.html` en el navegador y presionar **F11** (o doble clic en la página).
3. Para salir: **Alt+F4** (o F11 / Esc si se abrió en el navegador).

Se adapta sola a cualquier monitor horizontal (está hecha a 1920×1080 y se escala). Cada
cierto tiempo Togo se vuelve de 8 bits un momento. Los textos están al final de `index.html`
(`FRASES` = lo que dice Togo, `CHAT` = la conversación del teléfono, `CINTA` = la cinta de abajo).

Actualizar el modelo y la APK en un solo paso:

```bash
python LESSAI_DATASET/tools/actualizar_modelo.py --apk
```

**Equipo:** Elías Niriel López Casoverde · Diego Josué Elías López · Cesar Daniel Elías Villanueva ·
Victoria Rebeca Leiva Padilla · Andrea Sofia Argueta Dominguez

LESSAI™ · © 2026
