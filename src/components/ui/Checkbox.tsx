import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  color: string;
  size?: number;
}

export function Checkbox({ checked, onToggle, color, size = 22 }: CheckboxProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    if (!checked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSequence(
        withSpring(1.3, { damping: 5, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 300 })
      );
    } else {
      scale.value = withSpring(0.85, { damping: 10, stiffness: 300 });
      setTimeout(() => { scale.value = withSpring(1, { damping: 12 }); }, 120);
    }
    onToggle();
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.box,
          { width: size, height: size, borderRadius: size / 2 },
          checked
            ? { backgroundColor: color, borderColor: color }
            : { backgroundColor: 'transparent', borderColor: color + '66' },
          animStyle,
        ]}
      >
        {checked && (
          <Ionicons name="checkmark" size={size * 0.6} color="#FFFFFF" />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
