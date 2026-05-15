import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme as useDeviceColorScheme } from 'react-native'; // ✅ Appearance add

type ThemeMode = 'Light' | 'Dark' | 'System';

const lightColors = {
  primary: '#faab00',
  primaryLight: '#faab00',
  background: '#FFFFFF',
  cardBackground: '#F5F5F5',
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#e1e1e1ff',
  success: '#4CAF50',
  warning: '#FFF9C4',
  diary: '#faab00',
  white: '#FFFFFF',
};

const darkColors = {
  primary: '#faab00',
  primaryLight: '#faab00',
  background: '#121212',
  cardBackground: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textTertiary: '#808080',
  border: '#2C2C2C',
  success: '#4CAF50',
  warning: '#FFF9C4',
  diary: '#faab00',
  white: '#FFFFFF',
};

export type ThemeColors = typeof lightColors;

interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

// ✅ iOS NativeTabs (UITabBar) ko sync karo
function syncNativeAppearance(mode: ThemeMode, deviceScheme: string | null | undefined) {
  if (mode === 'Light') Appearance.setColorScheme('light');
  else if (mode === 'Dark') Appearance.setColorScheme('dark');
  else Appearance.setColorScheme(null); // System default
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('Light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeModeState(savedTheme as ThemeMode);
        syncNativeAppearance(savedTheme as ThemeMode, deviceColorScheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
      syncNativeAppearance(mode, deviceColorScheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const isDarkMode =
    themeMode === 'Dark' ||
    (themeMode === 'System' && deviceColorScheme === 'dark');

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, isDarkMode, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};