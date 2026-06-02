import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  color: string;
  size?: number;
}

export function Checkbox({ checked, onToggle, color, size = 22 }: CheckboxProps) {
  function handlePress() {
    if (!checked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle();
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.box,
          { width: size, height: size, borderRadius: size / 2 },
          checked
            ? { backgroundColor: color, borderColor: color }
            : { backgroundColor: 'transparent', borderColor: color + '66' },
        ]}
      >
        {checked && (
          <Ionicons name="checkmark" size={size * 0.6} color="#FFFFFF" />
        )}
      </View>
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
