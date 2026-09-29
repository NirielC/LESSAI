import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, typography } from '../config/theme';

/**
 * TAB BAR PROPIA.
 *
 * La pestana de LESSA es la central y va elevada sobre la barra: es la funcion
 * principal de la app y debe leerse como tal antes que como "una pestana mas".
 */

const ICONS = {
  VozTab: { off: 'mic-outline', on: 'mic' },
  HistorialTab: { off: 'chatbubbles-outline', on: 'chatbubbles' },
  LessaTab: { off: 'hand-left', on: 'hand-left' },
  InfoTab: { off: 'help-circle-outline', on: 'help-circle' },
};

export default function LessaTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? spacing.md : spacing.sm);

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? route.name;
        const isFocused = state.index === index;
        const isCenter = route.name === 'LessaTab';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isCenter) {
          return (
            <CenterTab key={route.key} label={label} focused={isFocused} onPress={onPress} />
          );
        }

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab} hitSlop={6}>
            <Ionicons
              name={isFocused ? ICONS[route.name].on : ICONS[route.name].off}
              size={22}
              color={isFocused ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
            {isFocused ? <View style={styles.activeDot} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function CenterTab({ label, focused, onPress }) {
  const lift = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(lift, {
      toValue: focused ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [focused, lift]);

  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const scale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <Pressable onPress={onPress} style={styles.centerTab}>
      <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
        <LinearGradient
          colors={focused ? ['#2C7BEE', '#1553B3'] : ['#5E7B9E', '#3E587A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.centerButton}
        >
          <Ionicons name="hand-left" size={26} color={colors.onDark} />
        </LinearGradient>
      </Animated.View>
      <Text style={[styles.label, styles.centerLabel, focused && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    ...shadow.tabbar,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  label: {
    ...typography.micro,
    fontSize: 10,
    letterSpacing: 0.2,
    color: colors.textMuted,
    marginTop: 4,
  },
  labelActive: { color: colors.primary },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
  },

  centerTab: { flex: 1.15, alignItems: 'center', marginTop: -26 },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    ...shadow.raised,
  },
  centerLabel: { marginTop: 5, fontSize: 10 },
});
