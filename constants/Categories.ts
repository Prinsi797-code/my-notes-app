export const CATEGORIES = [
  'Personal',
  'Work',
  'Ideas',
  'Todo',
  'Shopping',
  'Study',
  'Health',
  'Finance',
  'Travel',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

export const CATEGORY_ICONS: Record<Category, string> = {
  Personal: '👤',
  Work: '💼',
  Ideas: '💡',
  Todo: '✅',
  Shopping: '🛒',
  Study: '📚',
  Health: '❤️',
  Finance: '💰',
  Travel: '✈️',
  Other: '📌',
};