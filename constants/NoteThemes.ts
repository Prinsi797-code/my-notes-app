// constants/NoteThemes.ts
// Per-note themes — no global context needed
// Each note stores themeId string, this file maps id → image

export interface NoteTheme {
  id: string;
  name: string;
  image: any | null;
}

// CRITICAL: require() must be STATIC — Metro bundler cannot handle dynamic paths
export const NOTE_THEMES: NoteTheme[] = [
  { id: 'none',   name: 'Default', image: null },
  { id: 'theme1', name: 'Theme 1', image: require('../assets/themes/theme1.jpeg') },
  { id: 'theme2', name: 'Theme 2', image: require('../assets/themes/theme2.jpeg') },
  { id: 'theme3', name: 'Theme 3', image: require('../assets/themes/theme3.jpeg') },
  { id: 'theme4', name: 'Theme 4', image: require('../assets/themes/theme4.jpeg') },
  { id: 'theme5', name: 'Theme 5', image: require('../assets/themes/theme5.jpeg') },
  { id: 'theme6', name: 'Theme 6', image: require('../assets/themes/theme6.jpeg') },
  { id: 'theme7', name: 'Theme 7', image: require('../assets/themes/theme7.jpeg') },
  { id: 'theme8', name: 'Theme 8', image: require('../assets/themes/theme8.jpeg') },
  { id: 'theme9', name: 'Theme 9', image: require('../assets/themes/theme9.jpeg') },
  { id: 'theme10', name: 'Theme 10', image: require('../assets/themes/theme10.jpeg') },
  { id: 'theme11', name: 'Theme 11', image: require('../assets/themes/theme11.jpeg') },
  { id: 'theme12', name: 'Theme 12', image: require('../assets/themes/theme12.jpeg') },
  { id: 'theme13', name: 'Theme 13', image: require('../assets/themes/theme13.jpeg') },
  { id: 'theme14', name: 'Theme 14', image: require('../assets/themes/theme14.jpeg') },
  { id: 'theme15', name: 'Theme 15', image: require('../assets/themes/theme15.jpeg') },
];

/** themeId string se NoteTheme object lo */
export function getThemeById(themeId?: string): NoteTheme {
  if (!themeId) return NOTE_THEMES[0];
  return NOTE_THEMES.find(t => t.id === themeId) ?? NOTE_THEMES[0];
}