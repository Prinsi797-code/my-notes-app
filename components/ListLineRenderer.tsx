import React, { useRef } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Props {
  value: string;
  onChange: (text: string) => void;
  colors: any;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  placeholder?: string;
  showBorder?: boolean;
}

export function ListLineRenderer({
  value,
  onChange,
  colors,
  fontFamily,
  bold,
  italic,
  underline,
  placeholder = 'Start typing...',
  showBorder = true,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const lines = value.split('\n');

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={styles.wrapper}
    >
      {/* Hidden TextInput — captures actual keyboard input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        multiline
        autoCorrect
        spellCheck
        style={styles.hiddenInput}
        caretHidden={false}
      />

      {/* Visual renderer */}
      {lines.length === 0 || (lines.length === 1 && lines[0] === '') ? (
        <View style={styles.lineRow}>
          {showBorder && (
            <View style={[styles.leftBorder, { backgroundColor: colors.primary }]} />
          )}
          <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>
            {placeholder}
          </Text>
        </View>
      ) : (
        lines.map((line, index) => (
          <View key={index} style={styles.lineRow}>
            {showBorder && (
              <View style={[styles.leftBorder, { backgroundColor: colors.primary }]} />
            )}
            <Text
              style={[
                styles.lineText,
                { color: colors.textPrimary },
                fontFamily && fontFamily !== 'System' ? { fontFamily } : {},
                bold ? { fontWeight: '700' } : {},
                italic ? { fontStyle: 'italic' } : {},
                underline ? { textDecorationLine: 'underline' } : {},
              ]}
            >
              {line || ' '}
            </Text>
          </View>
        ))
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minHeight: 300,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 8,
    minHeight: 28,
  },
  leftBorder: {
    width: 3,
    borderRadius: 2,
    marginRight: 12,
    minHeight: 26,
  },
  lineText: {
    fontSize: 17,
    lineHeight: 26,
    flex: 1,
  },
  placeholderText: {
    fontSize: 17,
    lineHeight: 26,
    flex: 1,
  },
});