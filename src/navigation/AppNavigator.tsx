import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/Theme';
import { MatrixScreen } from '@/screens/MatrixScreen';
import { ListScreen } from '@/screens/ListScreen';
import { FocusScreen } from '@/screens/FocusScreen';
import { StatsScreen } from '@/screens/StatsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { PremiumScreen } from '@/screens/PremiumScreen';
import { sp } from '@/utils/scale';
import { t } from '@/i18n';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_CONFIG = [
  { name: 'Matrix', labelKey: 'nav.matrix', icon: 'grid-outline', iconActive: 'grid' },
  { name: 'Focus', labelKey: 'nav.focus', icon: 'timer-outline', iconActive: 'timer' },
  { name: 'List', labelKey: 'nav.tasks', icon: 'list-outline', iconActive: 'list' },
  { name: 'Stats', labelKey: 'nav.stats', icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  { name: 'Settings', labelKey: 'nav.settings', icon: 'settings-outline', iconActive: 'settings' },
] as const;

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();

  const borderColor = mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const shadowStyle = Platform.OS === 'android'
    ? { elevation: 8 }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: mode === 'dark' ? 0.3 : 0.08,
        shadowRadius: 8,
      };

  return (
    <View
      style={[
        tabStyles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: borderColor,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        shadowStyle,
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const cfg = TAB_CONFIG[index];
        const label = t(cfg.labelKey as any);

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={tabStyles.tab}
            activeOpacity={0.7}
          >
            {isFocused ? (
              <View style={[tabStyles.pill, { backgroundColor: colors.primary }]}>
                <Ionicons name={cfg.iconActive as any} size={16} color="#FFFFFF" />
                <Text style={tabStyles.pillLabel} numberOfLines={1}>{label}</Text>
              </View>
            ) : (
              <Ionicons name={cfg.icon as any} size={22} color={colors.textTertiary} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillLabel: {
    color: '#FFFFFF',
    fontSize: sp(11),
    fontWeight: '700',
    letterSpacing: 0.1,
    flexShrink: 1,
  },
});

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Matrix" component={MatrixScreen} />
      <Tab.Screen name="Focus" component={FocusScreen} />
      <Tab.Screen name="List" component={ListScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, mode } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: mode === 'dark',
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.borderLight,
          notification: colors.primary,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="Premium"
          component={PremiumScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
