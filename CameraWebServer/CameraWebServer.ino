#include <Arduino.h>
#include "esp_camera.h"
#include <WiFi.h>

#include "board_config.h"

// ===========================
// LESSAI WiFi Access Point
// ===========================
const char *ssid = "LESSAI_NET";
const char *password = "A12345678a";

// ===========================
// LESSAI Network
// ===========================
IPAddress local_IP(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

// ===========================
// Camera server
// ===========================
void startCameraServer();

void setup() {

  Serial.begin(115200);
  Serial.println();

  // ===========================
  // Camera configuration
  // ===========================
  camera_config_t config;

  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;

  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;

  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;

  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 20000000;

  // ===========================
  // Image configuration
  // ===========================

  config.pixel_format = PIXFORMAT_JPEG;

  // Resolución utilizada por LESSAI
  config.frame_size = FRAMESIZE_QVGA;

  // 12 = menor tamaño de JPEG que calidad 10
  config.jpeg_quality = 12;

  // PSRAM
  config.fb_location = CAMERA_FB_IN_PSRAM;

  // Dos buffers para mantener el flujo continuo
  config.fb_count = 2;

  // Priorizar siempre el frame más reciente
  config.grab_mode = CAMERA_GRAB_LATEST;

  // ===========================
  // Initialize camera
  // ===========================

  esp_err_t err = esp_camera_init(&config);

  if (err != ESP_OK) {

    Serial.printf(
      "Camera init failed: 0x%x\n",
      err
    );

    return;
  }

  Serial.println("[OK] Camara inicializada.");

  // ===========================
  // Camera sensor
  // ===========================

  sensor_t *sensor = esp_camera_sensor_get();

  if (sensor == nullptr) {

    Serial.println(
      "[ERROR] No se pudo obtener el sensor."
    );

    return;
  }

  // ===========================
  // Sensor-specific configuration
  // ===========================

  if (sensor->id.PID == OV3660_PID) {

    sensor->set_vflip(sensor, 1);
    sensor->set_brightness(sensor, 1);
    sensor->set_saturation(sensor, -2);
  }

  // ===========================
  // Camera orientation
  // ===========================

#if defined(CAMERA_MODEL_M5STACK_WIDE) || \
    defined(CAMERA_MODEL_M5STACK_ESP32CAM)

  sensor->set_vflip(sensor, 1);
  sensor->set_hmirror(sensor, 1);

#endif

#if defined(CAMERA_MODEL_ESP32S3_EYE)

  sensor->set_vflip(sensor, 1);

#endif

  // ===========================
  // Configure WiFi AP
  // ===========================

  WiFi.mode(WIFI_AP);

  // Desactivar ahorro de energía WiFi
  // para reducir latencia del stream.
  WiFi.setSleep(false);

  if (!WiFi.softAPConfig(
        local_IP,
        gateway,
        subnet
      )) {

    Serial.println(
      "[ERROR] No se pudo configurar la IP del AP."
    );

    return;
  }

  // Canal 6
  // Máximo 4 dispositivos conectados
  WiFi.softAP(
    ssid,
    password,
    6,
    false,
    4
  );

  // ===========================
  // Network information
  // ===========================

  Serial.println();
  Serial.println("==============================");
  Serial.println("      LESSAI - ESP32-CAM");
  Serial.println("==============================");

  Serial.print("SSID: ");
  Serial.println(ssid);

  Serial.print("IP: ");
  Serial.println(WiFi.softAPIP());

  Serial.println("Stream: http://192.168.4.1:81/stream");

  Serial.println("==============================");

  // ===========================
  // Start camera server
  // ===========================

  startCameraServer();
}

void loop() {

  // El servidor trabaja en sus propias tareas.
  delay(10000);
}