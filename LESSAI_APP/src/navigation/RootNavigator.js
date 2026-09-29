import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LessaTabBar from './LessaTabBar';
import RecognitionScreen from '../screens/RecognitionScreen';
import LiveConversationScreen from '../screens/LiveConversationScreen';
import VoiceScreen from '../screens/VoiceScreen';
import HistoryScreen from '../screens/HistoryScreen';
import InfoScreen from '../screens/InfoScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../config/theme';
import { APP_MODE } from '../config/server.config';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

/**
 * Orden de las pestanas pensado para que LESSA quede fisicamente al centro:
 *   Voz · Historial · [LESSA] · Info
 * Ajustes no es pestana: es una pantalla modal del stack, accesible desde la
 * camara y desde Info.
 */
function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="LessaTab"
      tabBar={(props) => <LessaTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="VozTab" component={VoiceScreen} options={{ tabBarLabel: 'Voz' }} />
      <Tab.Screen name="HistorialTab" component={HistoryScreen} options={{ tabBarLabel: 'Historial' }} />
      <Tab.Screen
        name="LessaTab"
        component={APP_MODE === 'server' ? LiveConversationScreen : RecognitionScreen}
        options={{ tabBarLabel: 'LESSA' }}
      />
      <Tab.Screen name="InfoTab" component={InfoScreen} options={{ tabBarLabel: 'Ayuda' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
