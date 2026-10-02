# Retomar LESSAI en otra computadora

## 1. Instalar (una vez)

| Programa | Para qué |
|---|---|
| Git | Bajar el proyecto |
| Node.js 24 | La app |
| Python 3.12 | Dataset y entrenamiento |
| Android Studio (SDK) + JDK 21 | Compilar la APK |
| Docker Desktop (con WSL 2) | Solo para la versión web en contenedor |

## 2. Bajar y preparar

```bash
git clone https://github.com/NirielC/LESSAI_TOGO.git
```

```bash
cd LESSAI_TOGO/LESSAI_MOVIL && npm install
```

```bash
cd LESSAI_TOGO/LESSAI_DATASET && pip install -r requirements.txt
```

## 3. Lo que NO está en GitHub (copiarlo a mano)

| Qué | Dónde va |
|---|---|
| Videos de señas (4000, ~950 MB) | `LESSAI_DATASET/dataset/videos/<clase>/` |
| Puntos extraídos (opcional, se regeneran) | `LESSAI_DATASET/dataset/landmarks_v2/` |
| Fotos/clips del abecedario y videos v3 | `LESSAI_DATASET/dataset/abecedario/` y `dataset/videos_v3/` |
| Fotos del equipo | `LESSAI_MOVIL/assets/equipo/` + descomentar `foto` en `src/data/equipo.ts` |

Se regenera solo (no copiar): `node_modules/`, `android/`, `dist/`, `.expo/`.

## 4. Uso diario

| Tarea | Comando |
|---|---|
| Ver la interfaz (Expo Go, sin reconocimiento) | `cd LESSAI_MOVIL && npx expo start` |
| Compilar la APK (Windows) | `powershell -ExecutionPolicy Bypass -File LESSAI_MOVIL/build-apk.ps1` |
| Grabar señas | `python LESSAI_DATASET/tools/capture_videos.py` |
| Grabar abecedario | `python LESSAI_DATASET/tools/capture_abecedario.py` |
| Re-entrenar todo y sacar APK | `python LESSAI_DATASET/tools/actualizar_modelo.py --abecedario --apk` |
| Web en Docker | `cd LESSAI_MOVIL && docker build -t lessai . && docker run -it --rm -p 5173:5173 lessai` |

La APK queda en `LESSAI_MOVIL/dist/`.

## 5. Notas importantes

- **Versión del dataset:** `VERSION` en `LESSAI_DATASET/config.py`. `v2` = 4000 videos originales (30 cuadros,
  modelo actual). `v3` = videos nuevos de 2 s (40 cuadros). Señas y abecedario se entrenan con la misma versión.
- **Contrato del modelo:** `LESSAI_DATASET/lessai_features.py` y `LESSAI_MOVIL/modules/lessai-vision/.../Features.kt`
  deben calcular lo mismo. Si cambias uno, cambia el otro.
- **Seña nueva:** agregarla en `CLASSES` (config.py), grabar videos, poner su texto en
  `LESSAI_MOVIL/src/core/signs/vocabulary.ts` y correr `actualizar_modelo.py --apk`.
- **Windows, rutas largas:** `build-apk.ps1` ya compila desde una unidad corta (`L:`) y la quita al terminar.
- **Docker Desktop no arranca** ("The file cannot be accessed by the system"): ver el final de `LESSAI_MOVIL/DOCKER.md`.
- **Precisión real:** 97.8% en prueba, pero 68–88% con personas que el modelo no vio. Lo que más mejora:
  grabar a más personas y la clase `nada`.
- **Pendiente:** dataset v3, abecedario, fotos del equipo.
