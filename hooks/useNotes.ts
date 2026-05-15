import { Note, NoteFormData } from '@/types/Note';
import { useCallback, useEffect, useState } from 'react';
import { useStorage } from './useStorage';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { loadNotes, saveNotes } = useStorage();

  // Load notes on mount
  useEffect(() => {
    loadNotesFromStorage();
  }, []);

  const loadNotesFromStorage = async () => {
    setLoading(true);
    const loadedNotes = await loadNotes();
    setNotes(loadedNotes);
    setLoading(false);
  };

  const addNote = useCallback(async (formData: NoteFormData): Promise<Note> => {
    const newNote: Note = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
    return newNote;
  }, [notes]);

  const updateNote = useCallback(async (id: string, formData: Partial<NoteFormData>): Promise<Note | null> => {
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex === -1) return null;

    const updatedNote: Note = {
      ...notes[noteIndex],
      ...formData,
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [...notes];
    updatedNotes[noteIndex] = updatedNote;
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
    return updatedNote;
  }, [notes]);

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    const filteredNotes = notes.filter(note => note.id !== id);
    setNotes(filteredNotes);
    const success = await saveNotes(filteredNotes);
    return success;
  }, [notes]);

  const togglePin = useCallback(async (id: string): Promise<boolean> => {
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex === -1) return false;

    const updatedNote: Note = {
      ...notes[noteIndex],
      pinned: !notes[noteIndex].pinned,
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [...notes];
    updatedNotes[noteIndex] = updatedNote;
    
    // Sort notes: pinned first, then by updatedAt
    updatedNotes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    setNotes(updatedNotes);
    const success = await saveNotes(updatedNotes);
    return success;
  }, [notes]);

  const getNoteById = useCallback((id: string): Note | undefined => {
    return notes.find(note => note.id === id);
  }, [notes]);

  const searchNotes = useCallback((query: string): Note[] => {
    if (!query.trim()) return notes;
    
    const lowerQuery = query.toLowerCase();
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
    );
  }, [notes]);

  const filterByCategory = useCallback((category: string): Note[] => {
    if (category === 'All') return notes;
    return notes.filter(note => note.category === category);
  }, [notes]);

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    getNoteById,
    searchNotes,
    filterByCategory,
    refreshNotes: loadNotesFromStorage,
  };
};