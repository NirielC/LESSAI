import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import { SettingsProvider } from './src/config/SettingsContext';
import { ConversationProvider } from './src/conversation/ConversationContext';

/**
 * Punto de entrada. Deliberadamente minimo: solo compone los proveedores de
 * estado y delega en el navegador. Ninguna logica de la app vive aqui.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ConversationProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </ConversationProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
