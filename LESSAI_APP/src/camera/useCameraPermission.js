import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Permisos de camara desacoplados de la pantalla.
 *
 * expo-camera se importa de forma perezosa para que la app siga arrancando en
 * entornos donde el modulo nativo no existe (web, snack, emulador sin camara).
 * En ese caso caemos a modo simulado en vez de romper.
 */
export function useCameraPermission() {
  const [status, setStatus] = useState('undetermined'); // undetermined | granted | denied | unavailable
  const [isRequesting, setIsRequesting] = useState(false);

  const request = useCallback(async () => {
    if (Platform.OS === 'web') {
      setStatus('unavailable');
      return 'unavailable';
    }
    setIsRequesting(true);
    try {
      const Camera = require('expo-camera');
      const api = Camera.Camera ?? Camera.CameraView ?? Camera;
      const fn =
        Camera.requestCameraPermissionsAsync ??
        api?.requestCameraPermissionsAsync;
      if (!fn) {
        setStatus('unavailable');
        return 'unavailable';
      }
      const res = await fn();
      const next = res?.granted ? 'granted' : 'denied';
      setStatus(next);
      return next;
    } catch (e) {
      setStatus('unavailable');
      return 'unavailable';
    } finally {
      setIsRequesting(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    if (Platform.OS === 'web') {
      setStatus('unavailable');
      return () => { alive = false; };
    }
    (async () => {
      try {
        const Camera = require('expo-camera');
        const fn = Camera.getCameraPermissionsAsync;
        if (!fn) {
          if (alive) setStatus('unavailable');
          return;
        }
        const res = await fn();
        if (!alive) return;
        setStatus(res?.granted ? 'granted' : res?.canAskAgain === false ? 'denied' : 'undetermined');
      } catch {
        if (alive) setStatus('unavailable');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return {
    status,
    isRequesting,
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    isUnavailable: status === 'unavailable',
    request,
  };
}

export default useCameraPermission;
