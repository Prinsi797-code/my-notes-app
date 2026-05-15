import { useLanguage } from '@/contexts/LanguageContext';
import { TextStyle } from '@/types/Note';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TextFormatterProps {
  textStyle: TextStyle;
  onToggle: (key: keyof TextStyle) => void;
  label?: string;
}

export const TextFormatter: React.FC<TextFormatterProps> = ({
  textStyle,
  onToggle,
  label = 'Text Style',
}) => {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.toolbar}>
        {/* Bold */}
        <TouchableOpacity
          style={[styles.button, textStyle.bold && styles.buttonActive]}
          onPress={() => onToggle('bold')}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, textStyle.bold && styles.buttonTextActive]}>
            B
          </Text>
        </TouchableOpacity>

        {/* Italic */}
        <TouchableOpacity
          style={[styles.button, textStyle.italic && styles.buttonActive]}
          onPress={() => onToggle('italic')}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { fontStyle: 'italic' }, textStyle.italic && styles.buttonTextActive]}>
            I
          </Text>
        </TouchableOpacity>

        {/* Underline */}
        <TouchableOpacity
          style={[styles.button, textStyle.underline && styles.buttonActive]}
          onPress={() => onToggle('underline')}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { textDecorationLine: 'underline' }, textStyle.underline && styles.buttonTextActive]}>
            U
          </Text>
        </TouchableOpacity>

        {/* List */}
        <TouchableOpacity
          style={[styles.button, textStyle.list && styles.buttonActive]}
          onPress={() => onToggle('list')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="list"
            size={20}
            color={textStyle.list ? '#fff' : '#333'}
          />
        </TouchableOpacity>

        {/* Left Border Line — new button */}
        <TouchableOpacity
          style={[styles.button, textStyle.leftBorder && styles.buttonActive]}
          onPress={() => onToggle('leftBorder')}
          activeOpacity={0.7}
        >
          {/* Visual: vertical bar + lines */}
          <View style={styles.leftBorderIcon}>
            <View style={[
              styles.leftBorderIconBar,
              { backgroundColor: textStyle.leftBorder ? '#fff' : '#faab00' }
            ]} />
            <View style={styles.leftBorderIconLines}>
              <View style={[styles.leftBorderIconLine, { backgroundColor: textStyle.leftBorder ? '#fff' : '#555' }]} />
              <View style={[styles.leftBorderIconLine, styles.lineShort, { backgroundColor: textStyle.leftBorder ? '#fff' : '#555' }]} />
              <View style={[styles.leftBorderIconLine, { backgroundColor: textStyle.leftBorder ? '#fff' : '#555' }]} />
            </View>
          </View>
        </TouchableOpacity>
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
  toolbar: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonActive: {
    backgroundColor: '#faab00',
    borderColor: '#faab00',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  buttonTextActive: {
    color: '#fff',
  },
  // Left border button icon
  leftBorderIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 26,
  },
  leftBorderIconBar: {
    width: 3,
    height: 26,
    borderRadius: 2,
  },
  leftBorderIconLines: {
    gap: 4,
    justifyContent: 'center',
  },
  leftBorderIconLine: {
    height: 2.5,
    width: 18,
    borderRadius: 2,
  },
  lineShort: {
    width: 12,
  },
});