// app/NoteEditorModal.tsx — per-note theme (no global context)
import { CategoryFilter } from '@/components/CategoryFilter';
import { ColorSelector } from '@/components/ColorSelector';
import { ImageUploader } from '@/components/ImageUploader';
import { ListLineRenderer } from '@/components/ListLineRenderer';
import { NoteThemeSelector } from '@/components/NoteThemeSelector';
import { TableEditor } from '@/components/TableEditor';
import { TextFormatter } from '@/components/TextFormatter';
import { CATEGORIES } from '@/constants/Categories';
import { DEFAULT_COLOR } from '@/constants/Colors';
import { getThemeById } from '@/constants/NoteThemes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useNotes } from '@/hooks/useNotes';
import AdsManager from '@/services/adsManager';
import { NotificationManager } from '@/services/notificationManager';
import { NoteFormData, TextStyle } from '@/types/Note';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Image, ImageBackground,
  KeyboardAvoidingView, Platform,
  StatusBar as RNStatusBar,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { BannerAdSize, GAMBannerAd } from 'react-native-google-mobile-ads';
import { globalStyles } from '../contexts/global';

type ActivePanel = null | 'format' | 'color' | 'category' | 'image' | 'font' | 'theme' | 'checklist' | 'more';

const FONTS = [
  { label: 'Default', value: 'System', sample: 'The quick brown fox' },
  { label: 'Roboto', value: 'Roboto', sample: 'The quick brown fox' },
  { label: 'Lato', value: 'Lato', sample: 'The quick brown fox' },
  { label: 'Georgia', value: 'Georgia', sample: 'The quick brown fox' },
  { label: 'Courier', value: 'Courier New', sample: 'The quick brown fox' },
  { label: 'Palatino', value: 'Palatino', sample: 'The quick brown fox' },
  { label: 'Times New Roman', value: 'Times New Roman', sample: 'The quick brown fox' },
  { label: 'Helvetica', value: 'Helvetica', sample: 'The quick brown fox' },
  { label: 'Menlo', value: 'Menlo', sample: 'The quick brown fox' },
  { label: 'Chalkboard', value: 'Chalkboard SE', sample: 'The quick brown fox' },
  { label: 'Arial', value: 'Arial', sample: 'The quick brown fox' },
];

export default function NoteEditorModal() {
  const { colors, isDarkMode } = useTheme();
  const params = useLocalSearchParams();
  const noteId = params.noteId as string | undefined;
  const { t } = useLanguage();
  const { notes, addNote, updateNote } = useNotes();
  const { images, pickImage, removeImage, setInitialImages, clearImages, loading: imageLoading } = useImagePicker();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tableData, setTableData] = useState<any>(undefined);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('none');
  const [textStyle, setTextStyle] = useState<TextStyle>({
    bold: false, italic: false, underline: false, list: false, leftBorder: false,
  });
  const [selectedFont, setSelectedFont] = useState('System');
  const [saving, setSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [showTable, setShowTable] = useState(false);
  const [bannerConfig, setBannerConfig] = useState<{ show: boolean; id: string } | null>(null);
  const [noteDisplayDate, setNoteDisplayDate] = useState('');

  const [noteDate, setNoteDate] = useState<string>('');
  const imagesRef = useRef(images);
  const contentRef = useRef<TextInput>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;

  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; checked: boolean }[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  useEffect(() => { imagesRef.current = images; }, [images]);

  useFocusEffect(useCallback(() => {
    try {
      const DS = require('./DrawingScreen').default as any;
      if (DS?._lastDrawingUri) {
        const uri: string = DS._lastDrawingUri;
        DS._lastDrawingUri = null;
        setInitialImages([...imagesRef.current, uri]);
      }
    } catch (_) { }
  }, []));

  useEffect(() => {
    AdsManager.getBannerConfig('note').then(cfg => { if (cfg) setBannerConfig(cfg); });
  }, []);

  // noteId useEffect ke saath — naya note create hone pe template load karo
  useEffect(() => {
    if (!noteId) {
      const templateContent = params.templateContent as string;
      const templateTitle = params.templateTitle as string;
      const templateChecklist = params.templateChecklist as string;
      const noteDateDisplay = params.noteDateDisplay as string;
      const noteDateParam = params.noteDate as string; 

      if (templateTitle) setTitle(templateTitle);
      if (templateContent) setContent(templateContent);

      if (!templateTitle && noteDateDisplay) {
        setTitle(noteDateDisplay);
      }

      if (noteDateParam) {
        setNoteDate(noteDateParam);

        const d = new Date(noteDateParam + 'T00:00:00');
        const formatted = d.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        setNoteDisplayDate(formatted);
      }

      if (templateChecklist) {
        try {
          const items = JSON.parse(templateChecklist);
          if (items.length > 0) {
            setChecklistItems(items);
            setShowChecklist(true);
          }
        } catch (_) { }
      }
    }
  }, [params.templateTitle, params.templateContent, params.templateChecklist, params.noteDateDisplay, params.noteDate]);
  
  useEffect(() => {
    if (noteId && notes.length > 0 && !isLoaded) {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setSelectedColor(note.color);
        setCategory(note.category || CATEGORIES[0]);
        setTextStyle({
          bold: note.textStyle.bold,
          italic: note.textStyle.italic,
          underline: note.textStyle.underline,
          list: note.textStyle.list,
          leftBorder: note.textStyle.leftBorder ?? false,
        });
        setInitialImages(note.images || []);
        if ((note as any).fontFamily) setSelectedFont((note as any).fontFamily);
        if ((note as any).tableData) { setTableData((note as any).tableData); setShowTable(true); }
        setSelectedThemeId((note as any).themeId ?? 'none');

        if ((note as any).checklistItems && (note as any).checklistItems.length > 0) {
          setChecklistItems((note as any).checklistItems);
          setShowChecklist(true);
        }
        if ((note as any).noteDate) {
          setNoteDate((note as any).noteDate);
          const d = new Date((note as any).noteDate + 'T00:00:00');
          const formatted = d.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          setNoteDisplayDate(formatted);
        }

        setIsLoaded(true);
      }
    } else if (!noteId) {
      // Template params hain toh reset mat karo
      const hasTemplate = !!(params.templateTitle || params.templateContent || params.templateChecklist);
      if (!hasTemplate) {
        setTitle(''); setContent(''); setSelectedColor(DEFAULT_COLOR);
        setCategory(CATEGORIES[0]);
        setTextStyle({ bold: false, italic: false, underline: false, list: false, leftBorder: false });
        clearImages(); setSelectedFont('System');
        setSelectedThemeId('none');
        setShowChecklist(false);
        setChecklistItems([]);
        setIsLoaded(false);
      }
    }
  }, [noteId, notes, isLoaded]);

  const handleTableChange = useCallback((data: any) => setTableData(data), []);

  const togglePanel = (panel: ActivePanel) => {
    if (activePanel === panel) { closePanel(); return; }
    setActivePanel(panel);
    Animated.spring(panelAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
  };
  const closePanel = () => {
    Animated.spring(panelAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 })
      .start(() => setActivePanel(null));
  };

  const handleToggleTextStyle = (key: keyof TextStyle) =>
    setTextStyle(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Missing Title', 'Please enter a title for your note'); return; }
    if (isAdLoading) return;
    setSaving(true);
    const formData: NoteFormData = {
      title: title.trim(), content: content.trim(),
      color: selectedColor, category, images, textStyle,
      fontFamily: selectedFont,
      tableData: showTable ? tableData : undefined,
      themeId: selectedThemeId,
      checklistItems: showChecklist ? checklistItems : undefined,
      noteDate: noteDate || undefined,
    };
    try {
      if (noteId) await updateNote(noteId, formData);
      else await addNote(formData);
      if (noteDate) {
        await NotificationManager.scheduleNoteNotification(
          noteId || Date.now().toString(),
          title.trim(),
          noteDate
        );
      }

      setIsAdLoading(true);
      await AdsManager.showNoteScreenInterstitialAd('note_screen', 'save');
    } catch {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setSaving(false); setIsAdLoading(false);
      router.canGoBack() ? router.back() : router.replace('/(tabs)');
    }
  };

  const addChecklistItem = (afterId?: string) => {
    const newItem = { id: generateId(), text: '', checked: false };
    setChecklistItems(prev => {
      if (!afterId) return [...prev, newItem];
      const idx = prev.findIndex(i => i.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, newItem);
      return next;
    });
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(prev =>
      prev.length === 1
        ? [{ id: generateId(), text: '', checked: false }]
        : prev.filter(i => i.id !== id)
    );
  };

  const updateChecklistItem = (id: string, text: string) => {
    setChecklistItems(prev => prev.map(i => i.id === id ? { ...i, text } : i));
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const handleCancel = async () => {
    const hasChanges = title.trim() || content.trim() || images.length > 0;
    if (hasChanges) {
      Alert.alert(t('home.Discardchanges'), t('home.unsavedchanges'), [
        { text: t('home.keepEditing'), style: 'cancel' },
        { text: t('home.discard'), style: 'destructive', onPress: showAdAndGoBack },
      ]);
    } else {
      await showAdAndGoBack();
    }
  };

  const showAdAndGoBack = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    try { await AdsManager.showNoteScreenInterstitialAd('note_screen', 'back'); } catch (_) { }
    finally {
      setIsAdLoading(false);
      router.canGoBack() ? router.back() : router.replace('/(tabs)');
    }
  };

  const saveImageToGallery = async (uri: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert(t('permission_need'), t('please_allow_save_image')); return; }
      if (uri.startsWith('data:image')) {
        const ci = uri.indexOf(',');
        const tmp = `${FileSystem.documentDirectory}drawing_${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(tmp, uri.substring(ci + 1), { encoding: 'base64' as any });
        await MediaLibrary.saveToLibraryAsync(tmp);
        FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => { });
      } else {
        await MediaLibrary.saveToLibraryAsync(uri);
      }
      Alert.alert(t('Saved!'), t('image_saved'));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save image.');
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const useLineRenderer = textStyle.leftBorder || textStyle.list;
  const currentTheme = getThemeById(selectedThemeId);
  const hasThemeBg = currentTheme.id !== 'none' && currentTheme.image != null;
  const overlayColor = isDarkMode ? 'rgba(10,10,10,0.55)' : 'rgba(164, 164, 164, 0.58)';
  // const panelTranslateY = panelAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] });
  const panelTranslateY = panelAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });

  const titleInputStyle = [
    globalStyles.notetitleInput,
    { color: colors.textPrimary, fontFamily: selectedFont === 'System' ? undefined : selectedFont },
  ];
  const contentInputStyle = [
    globalStyles.contentInput,
    { color: colors.textPrimary, fontFamily: selectedFont === 'System' ? undefined : selectedFont },
    textStyle.bold && { fontWeight: '700' as const },
    textStyle.italic && { fontStyle: 'italic' as const },
    textStyle.underline && { textDecorationLine: 'underline' as const },
  ];

  // ── Panels ───────────────────────────────────────────────────────────────
  const renderPanel = () => {
    if (!activePanel || activePanel === 'more') return null;
    return (
      <>
        {/* iOS-style dim overlay */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={closePanel}
          style={globalStyles.sheetOverlay}
        />

        {/* iOS bottom sheet */}
        <Animated.View style={[
          globalStyles.sheet,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            transform: [{ translateY: panelTranslateY }],
          }
        ]}>
          {/* Sheet handle */}
          <View style={globalStyles.sheetHandleRow}>
            <View style={[globalStyles.sheetHandle, { backgroundColor: colors.textTertiary }]} />
          </View>

          {/* Sheet title */}
          <View style={[globalStyles.sheetTitleRow, { borderBottomColor: colors.border }]}>
            <Text style={[globalStyles.sheetTitle, { color: colors.textPrimary }]}>
              {activePanel === 'format' && t('model.textFormatting')}
              {activePanel === 'color' && t('model.noteColor')}
              {activePanel === 'category' && t('model.category')}
              {activePanel === 'image' && t('model.attachImage')}
              {activePanel === 'font' && t('model.FontStyle')}
              {activePanel === 'theme' && t('model.NoteTheme')}
            </Text>
            <TouchableOpacity onPress={closePanel} style={globalStyles.sheetCloseBtn}>
              <View style={[globalStyles.sheetClosePill, { backgroundColor: colors.border }]}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Sheet content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={globalStyles.sheetContent}>
              {activePanel === 'format' && (
                <TextFormatter textStyle={textStyle} onToggle={handleToggleTextStyle} label="" />
              )}
              {activePanel === 'color' && (
                <ColorSelector selectedColor={selectedColor} onSelectColor={setSelectedColor} label="" />
              )}
              {activePanel === 'category' && (
                <CategoryFilter selectedCategory={category} onSelectCategory={setCategory as any} />
              )}
              {activePanel === 'image' && (
                <ImageUploader images={images} onPickImage={pickImage} onRemoveImage={removeImage} loading={imageLoading} label="" />
              )}
              {activePanel === 'font' && (
                <View>
                  {FONTS.map(f => (
                    <TouchableOpacity
                      key={f.value}
                      onPress={() => { setSelectedFont(f.value); closePanel(); }}
                      style={[
                        globalStyles.fontRow,
                        { borderColor: selectedFont === f.value ? colors.primary : colors.border },
                        selectedFont === f.value && { backgroundColor: colors.primary + '18' },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontFamily: f.value === 'System' ? undefined : f.value, fontSize: 15, color: colors.textPrimary }}>{f.sample}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>{f.label}</Text>
                      </View>
                      {selectedFont === f.value && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {activePanel === 'theme' && (
                <NoteThemeSelector
                  colors={colors}
                  selectedId={selectedThemeId}
                  onSelect={(id) => setSelectedThemeId(id)}
                />
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </>
    );
  };

  // ── Editor body ──────────────────────────────────────────────────────────
  const body = (
    <>
      <View style={globalStyles.noteheader}>
        <TouchableOpacity onPress={handleCancel} style={globalStyles.noteheaderBtn} disabled={isAdLoading || saving}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          style={[globalStyles.notedoneBtn, { backgroundColor: colors.primary }]}
          disabled={saving || isAdLoading}
        >
          {saving ? <Text style={globalStyles.doneTxt}>...</Text> : <Ionicons name="checkmark" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      <Text style={[globalStyles.dateLine, { color: colors.textTertiary }]}>
        {noteDisplayDate || new Date().toLocaleDateString('en-US', {
          day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })}
      </Text>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={globalStyles.notescrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TextInput
          style={titleInputStyle}
          placeholder={t('home.titlenot')}
          placeholderTextColor={colors.textTertiary}
          value={title} onChangeText={setTitle}
          autoFocus={!noteId} returnKeyType="next"
          onSubmitEditing={() => contentRef.current?.focus()}
        />
        {useLineRenderer ? (
          <ListLineRenderer
            value={content} onChange={setContent} colors={colors} fontFamily={selectedFont}
            bold={textStyle.bold} italic={textStyle.italic} underline={textStyle.underline}
            placeholder={t('home.additem')} showBorder
          />
        ) : (
          <TextInput
            ref={contentRef} style={contentInputStyle}
            placeholder={t('home.starttyping')} placeholderTextColor={colors.textTertiary}
            value={content} onChangeText={setContent} multiline textAlignVertical="top"
          />
        )}
        {showTable && (
          <TableEditor
            colors={colors}
            onRemove={() => { setShowTable(false); setTableData(undefined); }}
            initialData={tableData} onChange={handleTableChange}
          />
        )}

        {showChecklist && (
          <View style={{ marginTop: 16 }}>
            {/* Header */}
            <View style={[globalStyles.clSectionHeader, { borderBottomColor: colors.border }]}>
              <Ionicons name="checkbox-outline" size={14} color={colors.textTertiary} />
              <Text style={[globalStyles.clSectionTitle, { color: colors.textTertiary }]}>CHECKLIST</Text>
              <TouchableOpacity
                onPress={() => { setShowChecklist(false); setChecklistItems([]); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginLeft: 'auto' }}
              >
                <Ionicons name="close-circle-outline" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Unchecked items — editable */}
            {checklistItems.filter(i => !i.checked).map((item) => (
              <View key={item.id} style={[globalStyles.clBodyRow, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => toggleChecklistItem(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <View style={[globalStyles.clCheckbox, { borderColor: colors.primary }]} />
                </TouchableOpacity>
                <TextInput
                  style={[globalStyles.clBodyText, { color: colors.textPrimary }]}
                  value={item.text}
                  onChangeText={(text) => updateChecklistItem(item.id, text)}
                  placeholder="List item..."
                  placeholderTextColor={colors.textTertiary}
                  onSubmitEditing={() => addChecklistItem(item.id)}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  onPress={() => removeChecklistItem(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Checked items */}
            {checklistItems.filter(i => i.checked).map((item) => (
              <View key={item.id} style={[globalStyles.clBodyRow, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => toggleChecklistItem(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <View style={[globalStyles.clCheckboxFilled, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                </TouchableOpacity>
                <Text style={[globalStyles.clBodyTextDone, { color: colors.textTertiary }]} numberOfLines={1}>
                  {item.text}
                </Text>
                <TouchableOpacity
                  onPress={() => removeChecklistItem(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add item */}
            <TouchableOpacity
              onPress={() => addChecklistItem()}
              style={globalStyles.clAddBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={[globalStyles.clAddText, { color: colors.primary }]}>Add item</Text>
            </TouchableOpacity>
          </View>
        )}
        {images.length > 0 && (
          <View style={{ marginTop: 16 }}>
            {images.map((uri, idx) => {
              const isDrawing = uri.startsWith('data:image');
              return (
                <View key={`img-${idx}`} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Ionicons name={isDrawing ? 'pencil' : 'image-outline'} size={12} color={colors.textSecondary} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>{isDrawing ? 'Drawing' : 'Image'}</Text>
                  </View>
                  <Image
                    source={{ uri }}
                    style={[globalStyles.imgPreview, { borderColor: colors.border }, isDrawing && { backgroundColor: '#000' }]}
                    resizeMode={isDrawing ? 'contain' : 'cover'}
                  />
                  <TouchableOpacity onPress={() => saveImageToGallery(uri)} style={[globalStyles.imgSaveBtn, { backgroundColor: colors.cardBackground }]}>
                    <Ionicons name="download-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 200 }} />
      </ScrollView>
    </>
  );

  // ── Root ─────────────────────────────────────────────────────────────────
  return (
    <View style={[
      globalStyles.root,
      {
        backgroundColor: hasThemeBg ? 'transparent' : colors.background,
        paddingTop: hasThemeBg ? 0 : (Platform.OS === 'android' ? RNStatusBar.currentHeight : 0),
      }
    ]}>
      <StatusBar
        style={isDarkMode ? 'light' : 'dark'}
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.background }} keyboardVerticalOffset={0}>
        {hasThemeBg ? (
          <ImageBackground source={currentTheme.image} style={{ flex: 1 }} resizeMode="cover" fadeDuration={0}>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }]} />
            {body}
          </ImageBackground>
        ) : (
          <View style={{ flex: 1 }}>{body}</View>
        )}

        {renderPanel()}

        {bannerConfig?.show && (
          <View style={{ alignItems: 'center', backgroundColor: colors.background }}>
            <GAMBannerAd unitId={bannerConfig.id} sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
          </View>
        )}

        {/* Toolbar */}
        {/* iOS Liquid Glass Toolbar */}
        <View style={[globalStyles.toolbarWrapper, { backgroundColor: colors.background }]}>
          <View style={[
            globalStyles.toolbarPill,
            {
              backgroundColor: isDarkMode
                ? 'rgba(30,30,30,0.85)'
                : 'rgba(245,245,245,0.92)',
              borderColor: colors.border,
            }
          ]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={globalStyles.toolbarScroll}
              bounces={false}
            >
              <ToolBtn active={activePanel === 'format'} colors={colors} onPress={() => togglePanel('format')}>
                <Text style={[globalStyles.btnLabel, { color: activePanel === 'format' ? colors.primary : colors.textSecondary }]}>Aa</Text>
              </ToolBtn>

              <View style={[globalStyles.toolDivider, { backgroundColor: colors.border }]} />

              <ToolBtn active={activePanel === 'category'} colors={colors} onPress={() => togglePanel('category')}>
                <Ionicons name="list" size={20} color={activePanel === 'category' ? colors.primary : colors.textSecondary} />
              </ToolBtn>

              <ToolBtn active={showTable} colors={colors} onPress={() => setShowTable(v => !v)}>
                <Ionicons name="grid-outline" size={20} color={showTable ? colors.primary : colors.textSecondary} />
              </ToolBtn>

              <ToolBtn active={activePanel === 'color'} colors={colors} onPress={() => togglePanel('color')}>
                <Ionicons name="color-palette-outline" size={20} color={activePanel === 'color' ? colors.primary : colors.textSecondary} />
              </ToolBtn>

              <ToolBtn active={activePanel === 'image'} colors={colors} onPress={() => togglePanel('image')}>
                <Ionicons name="attach" size={20} color={activePanel === 'image' ? colors.primary : colors.textSecondary} />
              </ToolBtn>

              <View style={[globalStyles.toolDivider, { backgroundColor: colors.border }]} />

              <ToolBtn active={activePanel === 'font'} colors={colors} onPress={() => togglePanel('font')}>
                <Text style={[globalStyles.fontBtnLabel, { color: activePanel === 'font' ? colors.primary : colors.textSecondary }]}>F</Text>
              </ToolBtn>

              <ToolBtn active={activePanel === 'theme'} colors={colors} onPress={() => togglePanel('theme')}>
                <Ionicons name="image-outline" size={20} color={activePanel === 'theme' ? colors.primary : colors.textSecondary} />
              </ToolBtn>

              <ToolBtn active={showChecklist} colors={colors} onPress={() => {
                if (showChecklist) {
                  setShowChecklist(false);
                  setChecklistItems([]);
                } else {
                  setShowChecklist(true);
                  setChecklistItems([{ id: generateId(), text: '', checked: false }]);
                }
              }}>
                <Ionicons name="checkbox-outline" size={20} color={showChecklist ? colors.primary : colors.textSecondary} />
              </ToolBtn>

              <View style={[globalStyles.toolDivider, { backgroundColor: colors.border }]} />

              <ToolBtn active={false} colors={colors} onPress={() => router.push({ pathname: '/DrawingScreen', params: noteId ? { noteId } : {} })}>
                <View style={{ position: 'relative', width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="brush-outline" size={20} color={colors.textSecondary} />
                  <View style={globalStyles.premiumDot}>
                    <Ionicons name="diamond" size={7} color="#fff" />
                  </View>
                </View>
              </ToolBtn>

              <ToolBtn active={false} colors={colors} onPress={() => { if (activePanel) closePanel(); }}>
                <Ionicons name="chevron-down" size={20} color={activePanel ? colors.primary : colors.textTertiary} />
              </ToolBtn>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
      {/* </SafeAreaView> */}
    </View>
  );
}

function ToolBtn({ children, active, onPress, colors }: {
  children: React.ReactNode; active: boolean; onPress: () => void; colors: any
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        globalStyles.toolbarBtn,
        active && { backgroundColor: colors.primary + '22', borderRadius: 10 }
      ]}
      activeOpacity={0.6}
    >
      {children}
    </TouchableOpacity>
  );
}

function Btn({ children, active, onPress, colors }: { children: React.ReactNode; active: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity onPress={onPress} style={[globalStyles.toolbarBtn, active && { backgroundColor: colors.primary + '18' }]} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}