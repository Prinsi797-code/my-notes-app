import { CategoryFilter } from '@/components/CategoryFilter';
import { NoteCard } from '@/components/NoteCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { useNotes } from '@/hooks/useNotes';
import { useTrial } from '@/hooks/useTrial';
import AdsManager from '@/services/adsManager';
import { Note } from '@/types/Note';
import { View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableWithoutFeedback
} from 'react-native';
import { globalStyles } from '../../contexts/global';

export default function NotesScreen() {
  const { colors } = useTheme();
  const { notes, loading, deleteNote, togglePin, refreshNotes } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [layoutMode, setLayoutMode] = useState<'single' | 'double'>('double');
  const { trialActive, remainingDays } = useTrial();

  const [fabOpen, setFabOpen] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;

  const [bannerConfig, setBannerConfig] = useState<{ show: boolean; id: string } | null>(null);

  useEffect(() => {
    const loadBannerConfig = async () => {
      const config = await AdsManager.getBannerConfig('main');
      if (config) setBannerConfig(config);
    };
    loadBannerConfig();
  }, []);

  useEffect(() => {
    console.log('📝 Notes list updated:', notes.length, 'notes');
  }, [notes]);

  useFocusEffect(
    useCallback(() => {
      refreshNotes();
    }, [])
  );

  const toggleFab = () => {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(fabAnimation, { toValue, useNativeDriver: true, tension: 60, friction: 7 }).start();
    setFabOpen(!fabOpen);
  };

  const closeFab = () => {
    if (fabOpen) {
      Animated.spring(fabAnimation, { toValue: 0, useNativeDriver: true, tension: 60, friction: 7 }).start();
      setFabOpen(false);
    }
  };
  const overlayOpacity = fabAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });

  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (selectedCategory === 'Pinned') {
      filtered = filtered.filter(note => note.pinned === true);
    } else if (selectedCategory !== 'All') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        note =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, selectedCategory, searchQuery]);
  // filteredNotes ke baad yeh add karo
  const groupedNotes = useMemo(() => {
    const groups: { label: string; data: Note[] }[] = [];
    const map = new Map<string, Note[]>();

    filteredNotes.forEach(note => {
      // noteDate save hai toh use karo, warna updatedAt use karo
      const dateStr = (note as any).noteDate || note.updatedAt;
      const date = new Date(dateStr);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(note);
    });

    // Sort keys descending (latest month first)
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    sortedKeys.forEach(key => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      // const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const label = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

      // Month ke andar notes date wise sort karo
      const sorted = map.get(key)!.sort((a, b) => {
        const dateA = new Date((a as any).noteDate || a.updatedAt).getTime();
        const dateB = new Date((b as any).noteDate || b.updatedAt).getTime();
        return dateB - dateA;
      });
      groups.push({ label, data: sorted });
    });

    return groups;
  }, [filteredNotes]);

  const handleNotePress = (note: Note) => {
    if (note.type === 'checklist') {
      router.push({
        pathname: '/ChecklistScreen',
        params: { noteId: note.id },
      });
    } else {
      router.push({
        pathname: '/NoteEditorModal',
        params: { noteId: note.id },
      });
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      t('home.deleteNote'),
      t('home.deleteShort'),
      [
        { text: t('home.cancel'), style: 'cancel' },
        {
          text: t('home.delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await deleteNote(noteId);
            if (!success) Alert.alert('Error', 'Failed to delete note');
          },
        },
      ]
    );
  };

  const handlePinNote = async (noteId: string) => {
    const success = await togglePin(noteId);
    if (!success) Alert.alert('Error', 'Failed to pin/unpin note');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotes();
    setRefreshing(false);
  };

  const toggleLayoutMode = () => {
    setLayoutMode(prev => prev === 'double' ? 'single' : 'double');
  };

  const renderEmptyState = () => (
    <View style={globalStyles.emptyState}>
      <Ionicons name="document-text-outline" size={72} color={colors.textTertiary} />
      <Text style={[globalStyles.emptyTitle, { color: colors.textSecondary }]}>{t('home.noNote')}</Text>
      <Text style={[globalStyles.emptySubtitle, { color: colors.textTertiary }]}>
        {selectedCategory === 'Pinned'
          ? t('home.noPinNot')
          : searchQuery || selectedCategory !== 'All'
            ? t('home.nonoteMatch')
            : t('home.firstTap')}
      </Text>
    </View>
  );

  const renderNotesGrid = () => {
    if (layoutMode === 'single') {
      return groupedNotes.map(group => (
        <View key={group.label} style={globalStyles.monthGroup}>
          {/* Month Header */}
          <View style={[globalStyles.monthHeader, { borderBottomColor: colors.border }]}>
            <Text style={[globalStyles.monthLabel, { color: colors.textPrimary }]}>
              {group.label}
            </Text>
            <Text style={[globalStyles.monthCount, { color: colors.textTertiary }]}>
              {group.data.length} {group.data.length === 1 ? 'note' : 'notes'}
            </Text>
          </View>
          {/* Notes */}
          {group.data.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onPress={handleNotePress}
              onDelete={handleDeleteNote}
              onPin={handlePinNote}
            />
          ))}
        </View>
      ));
    } else {
      // Double column — group wise
      return groupedNotes.map(group => {
        const leftColumn = group.data.filter((_, i) => i % 2 === 0);
        const rightColumn = group.data.filter((_, i) => i % 2 === 1);
        return (
          <View key={group.label} style={globalStyles.monthGroup}>
            {/* Month Header */}
            <View style={[globalStyles.monthHeader, { borderBottomColor: colors.border }]}>
              <Text style={[globalStyles.monthLabel, { color: colors.textPrimary }]}>
                {group.label}
              </Text>
              <Text style={[globalStyles.monthCount, { color: colors.textTertiary }]}>
                {group.data.length} {group.data.length === 1 ? 'note' : 'notes'}
              </Text>
            </View>
            <View style={globalStyles.gridContainer}>
              <View style={globalStyles.gridColumn}>
                {leftColumn.map(note => (
                  <NoteCard key={note.id} note={note} onPress={handleNotePress} onDelete={handleDeleteNote} onPin={handlePinNote} />
                ))}
              </View>
              <View style={globalStyles.gridColumn}>
                {rightColumn.map(note => (
                  <NoteCard key={note.id} note={note} onPress={handleNotePress} onDelete={handleDeleteNote} onPin={handlePinNote} />
                ))}
              </View>
            </View>
          </View>
        );
      });
    }
  };

  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: colors.background }]}>
      <View style={globalStyles.header}>
        <View style={globalStyles.headerLeft}>
          <Text style={[globalStyles.headerTitle, { color: colors.textPrimary }]}>{t('home.title')}</Text>
        </View>
        {/* // headerRight JSX — same rehega */}
        <View style={[globalStyles.headerRight]}>
          <View style={[globalStyles.iconPill, { backgroundColor: colors.cardBackground }, { borderColor: colors.border }]}>
            <Pressable
              onPress={() => router.push('/NoteEditorModal')}
              style={({ pressed }) => [
                globalStyles.pillIconBtn,
                pressed && { backgroundColor: colors.border }
              ]}
            >
              <Ionicons name="add" size={22} color={colors.textSecondary} />
            </Pressable>
            <View style={[globalStyles.pillDivider, { backgroundColor: colors.border }]} />

            <Pressable
              onPress={() => router.push('/PremiumScreen')}
              style={({ pressed }) => [
                globalStyles.pillIconBtn,
                pressed && { backgroundColor: colors.border }
              ]}
            >
              <Ionicons name="diamond" size={20} color={colors.primary} />
            </Pressable>

            <View style={[globalStyles.pillDivider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={toggleLayoutMode}
              style={({ pressed }) => [
                globalStyles.pillIconBtn,
                pressed && { backgroundColor: colors.border }
              ]}
            >
              <Ionicons
                name={layoutMode === 'single' ? 'grid-outline' : 'list-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* <TrialBanner visible={trialActive} remainingDays={remainingDays} /> */}
      {/* <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} /> */}

      {/* <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={t('home.searchPlaceholder')} /> */}
      <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      <ScrollView
        style={globalStyles.notesList}
        contentContainerStyle={[
          globalStyles.notesListContent,
          filteredNotes.length === 0 && globalStyles.emptyContentContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={globalStyles.loadingContainer}>
            <Text style={[globalStyles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
          </View>
        ) : filteredNotes.length === 0 ? (
          renderEmptyState()
        ) : (
          renderNotesGrid()
        )}
      </ScrollView>
      {fabOpen && (
        <TouchableWithoutFeedback onPress={closeFab}>
          <Animated.View style={[globalStyles.overlay, { opacity: overlayOpacity, backgroundColor: '#000' }]} />
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
}