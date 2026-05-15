export const NOTE_COLORS = [
  { name: 'Yellow', color: '#FFF9C4', dark: '#F9A825', border: '#FFF59D' },
  { name: 'Pink', color: '#F8BBD0', dark: '#C2185B', border: '#F48FB1' },
  { name: 'Blue', color: '#BBDEFB', dark: '#1976D2', border: '#90CAF9' },
  { name: 'Green', color: '#C8E6C9', dark: '#388E3C', border: '#A5D6A7' },
  { name: 'Purple', color: '#E1BEE7', dark: '#7B1FA2', border: '#CE93D8' },
  { name: 'Orange', color: '#FFE0B2', dark: '#F57C00', border: '#FFCC80' },
  { name: 'Teal', color: '#B2DFDB', dark: '#00796B', border: '#80CBC4' },
  { name: 'Red', color: '#FFCDD2', dark: '#D32F2F', border: '#EF9A9A' },
];

export const DEFAULT_COLOR = NOTE_COLORS[0];

export type NoteColor = typeof NOTE_COLORS[number];