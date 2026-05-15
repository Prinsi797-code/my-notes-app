// components/NoteCard.tsx — per-note theme background
import { CATEGORY_ICONS } from '@/constants/Categories';
import { getThemeById } from '@/constants/NoteThemes'; // ✅ per-note
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { Note } from '@/types/Note';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onPin: (noteId: string) => void;
}

const buildShareText = (note: Note): string => {
  const ts = note.textStyle ?? { bold: false, italic: false, underline: false, list: false, leftBorder: false };
  const titleLine = note.title;

  let tableText = '';
  const td = (note as any).tableData;
  if (td && td.cellData && td.rows > 0 && td.cols > 0) {
    const colWidths: number[] = Array(td.cols).fill(0);
    td.cellData.forEach((row: string[]) => {
      row.forEach((cell: string, c: number) => {
        colWidths[c] = Math.max(colWidths[c], (cell ?? '').length, 3);
      });
    });
    const border = ' ' + colWidths.map(w => '  '.repeat(w)).join('  ') + '  ';
    const formatRow = (row: string[]) =>
      '  ' + row.map((cell, c) => (cell ?? '  ').padEnd(colWidths[c])).join('  ') + ' ';
    const lines = [border];
    td.cellData.forEach((row: string[]) => { lines.push(formatRow(row)); lines.push(border); });
    tableText = '\n\n' + lines.join('\n');
  }

  if (!note.content && !tableText) return titleLine;

  const lines = (note.content || '').split('\n');
  let contentText = '';
  if (ts.leftBorder)     contentText = lines.map(l => `| ${l}`).join('\n');
  else if (ts.list)      contentText = lines.map(l => `• ${l}`).join('\n');
  else                   contentText = lines.join('\n');

  return `${titleLine}${note.content ? '\n\n' + contentText : ''}${tableText}`;
};

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onDelete, onPin }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Per-note theme — read from note.themeId
  const noteTheme  = getThemeById(note.themeId);
  const hasThemeBg = noteTheme.id !== 'none' && noteTheme.image != null;
  const overlayColor = isDarkMode ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.58)';

  const ts          = note.textStyle ?? { bold: false, italic: false, underline: false, list: false, leftBorder: false };
  const isChecklist = (note as any).type === 'checklist';
  const cardBg      = colors.cardBackground;
  const userColor   = note.color?.color ?? null;

  const textStyle = [
    styles.noteContent,
    { color: colors.textSecondary },
    ts.bold      && styles.boldText,
    ts.italic    && styles.italicText,
    ts.underline && styles.underlineText,
  ];

  const handleDelete = () => { setMenuVisible(false); onDelete(note.id); };
  const handlePin    = () => { setMenuVisible(false); onPin(note.id); };

  // ── Open menu (shared by 3-dot button & long press) ─────────────────────
  const openMenu = (pageX: number, pageY: number) => {
    setMenuPosition({ x: pageX, y: pageY });
    setMenuVisible(true);
  };

  const handleShare = async () => {
    setMenuVisible(false);
    await new Promise(r => setTimeout(r, 350));
    const formattedText = buildShareText(note);
    try {
      const validImage = (note.images ?? []).find(
        (img: any) => img && typeof img === 'string' && img.trim().length > 10
      );
      if (validImage) {
        const cacheDir = FileSystem.cacheDirectory;
        if (!cacheDir) { await Share.share({ message: formattedText }); return; }
        let fileUri: string | null = null;
        let mimeType = 'image/jpeg';
        if (validImage.startsWith('data:image')) {
          const ci = validImage.indexOf(',');
          if (ci === -1) { await Share.share({ message: formattedText }); return; }
          const b64 = validImage.substring(ci + 1);
          if (!b64 || b64.length < 10) { await Share.share({ message: formattedText }); return; }
          mimeType  = 'image/png';
          fileUri   = cacheDir + 'note_drawing_' + Date.now() + '.png';
          await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: FileSystem.EncodingType.Base64 });
        } else if (validImage.startsWith('file://') || validImage.startsWith('content://')) {
          fileUri = cacheDir + 'note_image_' + Date.now() + '.jpg';
          await FileSystem.copyAsync({ from: validImage, to: fileUri });
        } else if (validImage.startsWith('http')) {
          fileUri = cacheDir + 'note_image_' + Date.now() + '.jpg';
          fileUri = (await FileSystem.downloadAsync(validImage, fileUri)).uri;
        }
        if (fileUri && (await FileSystem.getInfoAsync(fileUri)).exists) {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
              dialogTitle: note.title, mimeType,
              UTI: mimeType === 'image/png' ? 'public.png' : 'public.jpeg',
            });
            return;
          }
        }
      }
      await Share.share({ message: formattedText, title: note.title });
    } catch {
      try { await Share.share({ message: buildShareText(note), title: note.title }); } catch (_) {}
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d), now = new Date();
    const h = Math.floor((now.getTime() - date.getTime()) / 3_600_000);
    if (h < 24) return `${h}h ago`;
    if (h < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ── Checklist preview ───────────────────────────────────────────────────
  const renderChecklistContent = () => {
    if (!note.content) return null;
    const all = note.content.split('\n').filter(l => l.trim());
    const preview = all.slice(0, 5), remaining = all.length - 5;
    return (
      <View style={styles.checklistContainer}>
        {preview.map((line, idx) => {
          const checked = line.startsWith('☑');
          return (
            <View key={idx} style={styles.checklistRow}>
              <View style={[styles.checkboxSmall, { borderColor: colors.primary },
                checked && { backgroundColor: colors.primary }]}>
                {checked && <Ionicons name="checkmark" size={10} color="#fff" />}
              </View>
              <Text style={[styles.checklistItemText, { color: colors.textSecondary },
                checked && { textDecorationLine: 'line-through', color: colors.textTertiary }]}
                numberOfLines={1}>
                {line.replace(/^[☐☑]\s*/, '')}
              </Text>
            </View>
          );
        })}
        {remaining > 0 && <Text style={[styles.moreItemsText, { color: colors.textTertiary }]}>+{remaining} more items</Text>}
      </View>
    );
  };

  // ── Content preview ─────────────────────────────────────────────────────
  const renderContent = () => {
    if (isChecklist) return renderChecklistContent();
    if (ts.leftBorder && note.content) {
      const lines = note.content.split('\n').slice(0, 4);
      return (
        <View style={styles.leftBorderContainer}>
          {lines.map((line, idx) => (
            <View key={idx} style={styles.leftBorderRow}>
              <View style={[styles.leftBorderBar, { backgroundColor: colors.primary }]} />
              <Text style={textStyle} numberOfLines={1}>{line || ' '}</Text>
            </View>
          ))}
          {note.content.split('\n').length > 4 && (
            <Text style={[styles.moreItemsText, { color: colors.textTertiary }]}>
              +{note.content.split('\n').length - 4} more lines
            </Text>
          )}
        </View>
      );
    }
    if (ts.list && note.content) {
      return note.content.split('\n').slice(0, 4).map((line, idx) => (
        <Text key={idx} style={textStyle} numberOfLines={1}>• {line}</Text>
      ));
    }
    return <Text style={textStyle} numberOfLines={4}>{note.content}</Text>;
  };

  // ── Table preview ───────────────────────────────────────────────────────
  const renderTablePreview = () => {
    const td = (note as any).tableData;
    if (!td || !td.cellData || td.rows === 0) return null;
    const rows = td.cellData.slice(0, 3);
    const cols = Math.min(td.cols, 3);
    return (
      <View style={[styles.tablePreview, { borderColor: colors.border }]}>
        {rows.map((row: string[], r: number) => (
          <View key={`tr-${r}`} style={[styles.tablePreviewRow, {
            borderBottomColor: colors.border,
            borderBottomWidth: r < rows.length - 1 ? StyleSheet.hairlineWidth : 0,
          }]}>
            {row.slice(0, cols).map((cell: string, c: number) => (
              <Text key={`tc-${c}`} style={[styles.tablePreviewCell, {
                color: colors.textSecondary,
                borderRightColor: colors.border,
                borderRightWidth: c < cols - 1 ? StyleSheet.hairlineWidth : 0,
              }]} numberOfLines={1}>{cell ?? ''}</Text>
            ))}
          </View>
        ))}
        {(td.rows > 3 || td.cols > 3) && (
          <Text style={[styles.tableMoreText, { color: colors.textTertiary }]}>{td.rows}×{td.cols} table</Text>
        )}
      </View>
    );
  };

  // ── Inner card content ──────────────────────────────────────────────────
  const inner = (
    <>
      {note.pinned && (
        <View style={styles.pinIndicator}>
          <MaterialIcons name="push-pin" size={16} color={colors.primary} />
        </View>
      )}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>{note.title}</Text>
        <TouchableOpacity
          onPress={e => {
            e.stopPropagation();
            openMenu(e.nativeEvent.pageX, e.nativeEvent.pageY);
          }}
          style={styles.menuButton}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.categoryBadge,
        { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
        {isChecklist
          ? <Ionicons name="checkbox-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
          : <Text style={styles.categoryIcon}>{CATEGORY_ICONS[note.category]}</Text>}
        <Text style={[styles.categoryText, { color: colors.textSecondary }]}>{note.category}</Text>
      </View>

      {note.content ? <View style={styles.contentContainer}>{renderContent()}</View> : null}
      {renderTablePreview()}

      {!isChecklist && note.images && note.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
          {note.images.slice(0, 3).map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.imagePreview} />
          ))}
          {note.images.length > 3 && (
            <View style={styles.moreImagesOverlay}>
              <Text style={styles.moreImagesText}>+{note.images.length - 3}</Text>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Text style={[styles.dateText, { color: colors.textTertiary }]}>{formatDate(note.updatedAt)}</Text>
        {!isChecklist && userColor && (
          <View style={[styles.colorDot, { backgroundColor: userColor }]} />
        )}
      </View>
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          !hasThemeBg && { backgroundColor: cardBg },
          isDarkMode && !hasThemeBg && { borderWidth: 1, borderColor: colors.border },
        ]}
        onPress={() => onPress(note)}
        onLongPress={e => openMenu(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        delayLongPress={300}
        activeOpacity={0.7}
      >
        {hasThemeBg ? (
          <ImageBackground
            source={noteTheme.image}
            style={styles.bgFill}
            resizeMode="cover"
            fadeDuration={0}
          >
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }]} />
            <View style={styles.innerPad}>{inner}</View>
          </ImageBackground>
        ) : (
            <View style={[styles.innerPad, { backgroundColor: cardBg }]}>{inner}</View>
        )}
      </TouchableOpacity>

      {/* Context menu */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuContainer, {
            position: 'absolute', top: menuPosition.y - 20, right: 16,
            backgroundColor: colors.cardBackground,
            borderWidth: isDarkMode ? 1 : 0, borderColor: colors.border,
          }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handlePin}>
              <MaterialIcons name="push-pin" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>
                {note.pinned ? t('home.unpin') : t('home.pin')}
              </Text>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>{t('home.share')}</Text>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#E53935" />
              <Text style={[styles.menuText, styles.deleteText]}>{t('home.delete')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    overflow: 'hidden',
  },
  bgFill:   { width: '100%' },
  innerPad: { padding: 14 },
  pinIndicator: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title:  { fontSize: 17, fontWeight: '700', flex: 1, marginRight: 8 },
  menuButton: { padding: 2 },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 8,
  },
  categoryIcon: { fontSize: 11, marginRight: 3 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  contentContainer: { marginBottom: 8 },
  noteContent:  { fontSize: 13, lineHeight: 18 },
  boldText:     { fontWeight: '700' },
  italicText:   { fontStyle: 'italic' },
  underlineText:{ textDecorationLine: 'underline' },
  leftBorderContainer: { gap: 5 },
  leftBorderRow:  { flexDirection: 'row', alignItems: 'center', minHeight: 18 },
  leftBorderBar:  { width: 3, borderRadius: 2, marginRight: 8, alignSelf: 'stretch', minHeight: 16 },
  checklistContainer: { gap: 6 },
  checklistRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkboxSmall:      { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checklistItemText:  { flex: 1, fontSize: 13 },
  moreItemsText:      { fontSize: 11, marginTop: 4 },
  imagePreviewContainer: { marginVertical: 10 },
  imagePreview:          { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
  moreImagesOverlay:     { width: 80, height: 80, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  moreImagesText:        { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  dateText: { fontSize: 12 },
  colorDot: { width: 20, height: 20, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuContainer: {
    borderRadius: 12, width: 180, paddingVertical: 8,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  menuItem:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuText:   { fontSize: 16, marginLeft: 12, fontWeight: '500' },
  deleteText: { color: '#E53935' },
  menuDivider:{ height: 1, marginHorizontal: 16 },
  tablePreview:     { borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  tablePreviewRow:  { flexDirection: 'row' },
  tablePreviewCell: { flex: 1, fontSize: 11, paddingHorizontal: 6, paddingVertical: 4 },
  tableMoreText:    { fontSize: 10, textAlign: 'center', paddingVertical: 3 },
});