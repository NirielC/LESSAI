#include "Arduino.h"
#include "esp_http_server.h"
#include "esp_camera.h"

#include "board_config.h"

// ============================================================
// CONFIGURACIÓN DEL STREAM
// ============================================================

#define PART_BOUNDARY "123456789000000000000987654321"

static const char *STREAM_CONTENT_TYPE =
    "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;

static const char *STREAM_BOUNDARY =
    "\r\n--" PART_BOUNDARY "\r\n";

static const char *STREAM_PART =
    "Content-Type: image/jpeg\r\n"
    "Content-Length: %u\r\n"
    "\r\n";

// ============================================================
// SERVIDOR
// ============================================================

httpd_handle_t stream_httpd = NULL;

// ============================================================
// STREAM MJPEG
// ============================================================

static esp_err_t stream_handler(httpd_req_t *req)
{
    camera_fb_t *fb = NULL;

    esp_err_t res = ESP_OK;

    httpd_resp_set_type(
        req,
        STREAM_CONTENT_TYPE
    );

    if (res != ESP_OK) {
        return res;
    }

    httpd_resp_set_hdr(
        req,
        "Access-Control-Allow-Origin",
        "*"
    );

    while (true) {

        // Obtener frame más reciente
        fb = esp_camera_fb_get();

        if (!fb) {

            Serial.println(
                "[ERROR] Camera capture failed."
            );

            res = ESP_FAIL;
            break;
        }

        // LESSAI trabaja directamente en JPEG.
        if (fb->format != PIXFORMAT_JPEG) {

            Serial.println(
                "[ERROR] Frame no está en JPEG."
            );

            esp_camera_fb_return(fb);

            fb = NULL;

            res = ESP_FAIL;

            break;
        }

        // ----------------------------------------------------
        // Enviar separación entre frames
        // ----------------------------------------------------

        res = httpd_resp_send_chunk(
            req,
            STREAM_BOUNDARY,
            strlen(STREAM_BOUNDARY)
        );

        if (res != ESP_OK) {

            esp_camera_fb_return(fb);

            fb = NULL;

            break;
        }

        // ----------------------------------------------------
        // Header del JPEG
        // ----------------------------------------------------

        char part_buf[64];

        size_t header_len = snprintf(
            part_buf,
            sizeof(part_buf),
            STREAM_PART,
            fb->len
        );

        res = httpd_resp_send_chunk(
            req,
            part_buf,
            header_len
        );

        if (res != ESP_OK) {

            esp_camera_fb_return(fb);

            fb = NULL;

            break;
        }

        // ----------------------------------------------------
        // JPEG
        // ----------------------------------------------------

        res = httpd_resp_send_chunk(
            req,
            (const char *)fb->buf,
            fb->len
        );

        // ----------------------------------------------------
        // Liberar buffer
        // ----------------------------------------------------

        esp_camera_fb_return(fb);

        fb = NULL;

        if (res != ESP_OK) {

            break;
        }
    }

    return res;
}

// ============================================================
// INICIAR SERVIDOR
// ============================================================

void startCameraServer()
{
    httpd_config_t config =
        HTTPD_DEFAULT_CONFIG();

    // Solo necesitamos una ruta.
    config.max_uri_handlers = 1;

    // El stream estará en puerto 81.
    config.server_port = 81;

    Serial.println(
        "[INFO] Iniciando servidor de stream..."
    );

    if (
        httpd_start(
            &stream_httpd,
            &config
        ) == ESP_OK
    ) {

        httpd_uri_t stream_uri = {

            .uri = "/stream",

            .method = HTTP_GET,

            .handler = stream_handler,

            .user_ctx = NULL

        };

        httpd_register_uri_handler(
            stream_httpd,
            &stream_uri
        );

        Serial.println(
            "[OK] Stream iniciado."
        );

        Serial.println(
            "URL: http://192.168.4.1:81/stream"
        );

    } else {

        Serial.println(
            "[ERROR] No se pudo iniciar "
            "el servidor HTTP."
        );
    }
}