import { Note } from '@/types/Note';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_STORAGE_KEY = '@notes_app:notes';

export const useStorage = () => {
  const loadNotes = async (): Promise<Note[]> => {
    try {
      const storedNotes = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      if (storedNotes) {
        return JSON.parse(storedNotes);
      }
      return [];
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  };

  const saveNotes = async (notes: Note[]): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
      return true;
    } catch (error) {
      console.error('Error saving notes:', error);
      return false;
    }
  };

  const clearAllNotes = async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(NOTES_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing notes:', error);
      return false;
    }
  };

  return {
    loadNotes,
    saveNotes,
    clearAllNotes,
  };
};