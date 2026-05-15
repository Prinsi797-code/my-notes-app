// components/NoteThemeSelector.tsx
// Per-note theme selector — receives selectedId + onSelect as props (no global context)

import { NOTE_THEMES } from '@/constants/NoteThemes';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  colors: any;
  selectedId: string;             // current note's themeId
  onSelect: (id: string) => void; // update note's themeId
}

export const NoteThemeSelector: React.FC<Props> = ({ colors, selectedId, onSelect }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {NOTE_THEMES.map(theme => {
        const active = selectedId === theme.id;
        return (
          <TouchableOpacity
            key={theme.id}
            onPress={() => onSelect(theme.id)}
            activeOpacity={0.75}
            style={styles.item}
          >
            <View style={[
              styles.ring,
              active
                ? { borderColor: colors.primary, borderWidth: 3 }
                : { borderColor: colors.border, borderWidth: 1.5 },
            ]}>
              {theme.image ? (
                <Image
                  source={theme.image}
                  style={styles.img}
                  resizeMode="cover"
                  fadeDuration={0}
                />
              ) : (
                <View style={[styles.img, styles.noTheme, { backgroundColor: colors.cardBackground }]}>
                  <Ionicons name="ban-outline" size={26} color={colors.textTertiary} />
                </View>
              )}
              {active && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={11} color="#fff" />
                </View>
              )}
            </View>
            <Text style={[
              styles.label,
              { color: active ? colors.primary : colors.textSecondary },
              active && { fontWeight: '700' },
            ]}>
              {theme.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const W = 72, H = 90;

const styles = StyleSheet.create({
  row:     { flexDirection: 'row', gap: 12, paddingVertical: 6, paddingHorizontal: 2 },
  item:    { alignItems: 'center', width: W },
  ring:    { width: W, height: H, borderRadius: 12, overflow: 'hidden' },
  img:     { width: '100%', height: '100%' },
  noTheme: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 5, right: 5,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    // shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.35, shadowRadius: 2,
  },
  label: { marginTop: 6, fontSize: 11, fontWeight: '500', textAlign: 'center', width: W },
});