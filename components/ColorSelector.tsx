import { NOTE_COLORS, NoteColor } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ColorSelectorProps {
  selectedColor: NoteColor;
  onSelectColor: (color: NoteColor) => void;
  label?: string;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({
  selectedColor,
  onSelectColor,
  label = 'Color',
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.colorGrid}>
        {NOTE_COLORS.map((color) => (
          <TouchableOpacity
            key={color.name}
            style={[
              styles.colorOption,
              { backgroundColor: color.color },
              selectedColor.name === color.name && styles.colorOptionSelected,
            ]}
            onPress={() => onSelectColor(color)}
            activeOpacity={0.7}
          >
            {selectedColor.name === color.name && (
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark" size={24} color={color.dark} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  colorOptionSelected: {
    borderColor: '#333',
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  checkmarkContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});