import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import AdsManager from '@/services/adsManager';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
    Canvas,
    Path,
    Skia,
    SkPath,
    useCanvasRef,
} from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { globalStyles } from '../contexts/global';
import PurchaseManager from '../services/purchaseManager';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DrawnPath {
    path: SkPath;
    color: string;
    strokeWidth: number;
    opacity: number;
}
interface TextOverlay {
    id: string; text: string;
    x: number; y: number;
    color: string; fontSize: number;
}
interface StickerOverlay {
    id: string; uri: string;
    x: number; y: number; size: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
type DrawTool = 'pen' | 'finepen' | 'marker' | 'eraser';

// Flat palette — 20 colors like iOS
const PALETTE_COLORS = [
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#FFFFFF',
    '#FF0000', '#FF4500', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF',
    '#9900FF', '#FF00FF', '#FF69B4', '#8B4513', '#006400', '#00008B',
];

const DEFAULT_TOOL_WIDTH: Record<DrawTool, number> = {
    pen: 3, finepen: 1.5, marker: 18, eraser: 24,
};

export default function DrawingScreen() {
    const { colors, isDarkMode } = useTheme();
    const params = useLocalSearchParams();
    const noteId = params.noteId as string | undefined;

    const canvasRef = useCanvasRef();

    const [paths, setPaths] = useState<DrawnPath[]>([]);
    const [redoStack, setRedoStack] = useState<DrawnPath[]>([]);
    const [livePath, setLivePath] = useState<DrawnPath | null>(null);
    const currentSkPath = useRef<SkPath | null>(null);

    const activeToolRef = useRef<DrawTool>('pen');
    const activeColorRef = useRef('#FFD60A');
    const strokeWidthRef = useRef(DEFAULT_TOOL_WIDTH['pen']);
    const opacityRef = useRef(1);
    const { t } = useLanguage();
    const isDarkRef = useRef(isDarkMode);
    isDarkRef.current = isDarkMode;

    const [activeTool, setActiveTool] = useState<DrawTool>('pen');
    const [activeColor, setActiveColor] = useState('#FFD60A');
    const [strokeWidth, setStrokeWidth] = useState(DEFAULT_TOOL_WIDTH['pen']);
    const [opacity, setOpacity] = useState(1);

    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showStrokePanel, setShowStrokePanel] = useState(false);

    const [showTextInput, setShowTextInput] = useState(false);
    const [pendingText, setPendingText] = useState('');

    const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
    const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);

    const [saving, setSaving] = useState(false);
    const [showSavePopup, setShowSavePopup] = useState(false);
    const pendingUri = useRef<string | null>(null);

    const syncTool = (t: DrawTool) => {
        setActiveTool(t);
        activeToolRef.current = t;
        const w = DEFAULT_TOOL_WIDTH[t];
        setStrokeWidth(w);
        strokeWidthRef.current = w;
        setOpacity(t === 'marker' ? 0.5 : 1);
        opacityRef.current = t === 'marker' ? 0.5 : 1;
        setShowColorPicker(false);
        setShowAddMenu(false);
        setShowStrokePanel(false);
    };

    const handleDownloadToGallery = async () => {
        if (paths.length === 0 && textOverlays.length === 0) {
            Alert.alert(t('nothing_save'), t('draw_something'));
            return;
        }
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('permission_need'), t('please_allow_access'));
                return;
            }
            const image = canvasRef.current?.makeImageSnapshot();
            if (!image) { Alert.alert(t('error'), t('could_note_capture')); return; }

            const base64 = image.encodeToBase64();
            const tempUri = FileSystem.documentDirectory + 'dl_' + Date.now() + '.png';
            await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
            await MediaLibrary.saveToLibraryAsync(tempUri);
            FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => { });
            Alert.alert(t('Saved!'), t('drawing_saved_to_your'));
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Could not save drawing.');
        }
    };

    const syncColor = (c: string) => {
        setActiveColor(c);
        activeColorRef.current = c;
    };

    const syncStroke = (w: number) => {
        setStrokeWidth(w);
        strokeWidthRef.current = w;
    };

    const syncOpacity = (o: number) => {
        setOpacity(o);
        opacityRef.current = o;
    };

    const CANVAS_H = SCREEN_H - 200;

    const panGesture = Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((e) => {
            setShowColorPicker(false);
            setShowAddMenu(false);
            setShowStrokePanel(false);

            const p = Skia.Path.Make();
            p.moveTo(e.x, e.y);
            currentSkPath.current = p;
            const tool = activeToolRef.current;
            const color = tool === 'eraser'
                ? (isDarkRef.current ? '#000000' : '#FFFFFF')
                : activeColorRef.current;
            setLivePath({
                path: p.copy(), color,
                strokeWidth: strokeWidthRef.current,
                opacity: opacityRef.current,
            });
        })
        .onUpdate((e) => {
            const p = currentSkPath.current;
            if (!p) return;
            p.lineTo(e.x, e.y);
            const tool = activeToolRef.current;
            const color = tool === 'eraser'
                ? (isDarkRef.current ? '#000000' : '#FFFFFF')
                : activeColorRef.current;
            try {
                setLivePath({
                    path: p.copy(),
                    color,
                    strokeWidth: strokeWidthRef.current,
                    opacity: opacityRef.current,
                });
            } catch (_) { }
        })
        .onEnd(() => {
            const p = currentSkPath.current;
            currentSkPath.current = null;
            setLivePath(null);
            if (!p) return;
            const tool = activeToolRef.current;
            const color = tool === 'eraser'
                ? (isDarkRef.current ? '#000000' : '#FFFFFF')
                : activeColorRef.current;
            try {
                const snapshot = p.copy();
                setPaths(prev => [...prev, {
                    path: snapshot,
                    color,
                    strokeWidth: strokeWidthRef.current,
                    opacity: opacityRef.current,
                }]);
                setRedoStack([]);
            } catch (err) {
                console.warn('DrawingScreen onEnd copy error:', err);
            }
        });

    // ── Undo / Redo ───────────────────────────────────────────────────────────────
    const handleUndo = () => {
        setPaths(prev => {
            if (!prev.length) return prev;
            const copy = [...prev];
            const removed = copy.pop()!;
            setRedoStack(r => [removed, ...r]);
            return copy;
        });
    };

    const handleRedo = () => {
        setRedoStack(prev => {
            if (!prev.length) return prev;
            const [first, ...rest] = prev;
            setPaths(p => [...p, first]);
            return rest;
        });
    };

    const handleDone = async () => {
        if (paths.length === 0 && textOverlays.length === 0 && stickerOverlays.length === 0) {
            router.back();
            return;
        }

        setSaving(true);
        try {
            const image = canvasRef.current?.makeImageSnapshot();
            if (!image) throw new Error('Canvas snapshot failed');

            const base64 = image.encodeToBase64();
            const dataUri = `data:image/png;base64,${base64}`;
            pendingUri.current = dataUri;

            // Premium user → seedha save, popup nahi
            const isPremium = await PurchaseManager.isPremium();
            if (isPremium) {
                _commitSave();
            } else {
                setShowSavePopup(true);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to save drawing. Please try again.');
            console.error('Drawing save error:', err);
        } finally {
            setSaving(false);
        }
    };


    const handleSaveWithAd = async () => {
        setShowSavePopup(false);
        await new Promise(resolve => setTimeout(resolve, 600));
        try {
            await AdsManager.showReviewAd();
        } catch (e) {
            console.warn('Review ad failed:', e);
        }
        _commitSave();
    };

    const handleGoToPremium = () => {
        setShowSavePopup(false);
        router.push('/PremiumScreen');
    };

    const _commitSave = () => {
        if (pendingUri.current) {
            DrawingScreen._lastDrawingUri = pendingUri.current;
            pendingUri.current = null;
        }
        router.back();
    };

    const handleAddSticker = async () => {
        setShowAddMenu(false);
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow photo access to add stickers.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (!result.canceled) {
            setStickerOverlays(prev => [...prev, {
                id: Date.now().toString(),
                uri: result.assets[0].uri,
                x: SCREEN_W / 2 - 50, y: 200, size: 100,
            }]);
        }
    };

    const handleAddText = () => {
        setShowAddMenu(false);
        setPendingText('');
        setShowTextInput(true);
    };

    const handleConfirmText = () => {
        if (pendingText.trim()) {
            setTextOverlays(prev => [...prev, {
                id: Date.now().toString(),
                text: pendingText,
                x: 40,
                y: 100 + prev.length * 50,
                color: activeColor,
                fontSize: 20,
            }]);
        }
        setShowTextInput(false);
    };

    const handleAddSignature = () => {
        setShowAddMenu(false);
        syncTool('finepen');
        syncColor(isDarkMode ? '#FFFFFF' : '#000000');
        Alert.alert('Signature Mode', 'Draw your signature on the canvas now.');
    };

    // const handleAddShape = () => {
    //     setShowAddMenu(false);
    //     Alert.alert('Add Shape', 'Shape tool coming soon!');
    // };

    // const handleAddLoupe = () => {
    //     setShowAddMenu(false);
    //     Alert.alert('Loupe', 'Loupe magnifier coming soon!');
    // };

    // ── Render ────────────────────────────────────────────────────────────────────
    const bgColor = isDarkMode ? '#000' : '#fff';

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={[globalStyles.root, { backgroundColor: bgColor }]}>

                {/* ── Header ── */}
                <View style={globalStyles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={globalStyles.headerBtn}>
                        <Ionicons name="chevron-back" size={28} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={globalStyles.headerCenter}>
                        <TouchableOpacity onPress={handleUndo} style={globalStyles.headerIconBtn} disabled={!paths.length}>
                            <Ionicons name="arrow-undo" size={22}
                                color={paths.length ? colors.primary : colors.textTertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleRedo} style={globalStyles.headerIconBtn} disabled={!redoStack.length}>
                            <Ionicons name="arrow-redo" size={22}
                                color={redoStack.length ? colors.primary : colors.textTertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleDownloadToGallery}
                            style={globalStyles.headerIconBtn}
                            disabled={paths.length === 0 && textOverlays.length === 0}
                        >
                            <Ionicons name="download-outline" size={22}
                                color={(paths.length > 0 || textOverlays.length > 0) ? colors.primary : colors.textTertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => Alert.alert(t('clearcanvas'), t('clearalldrawing'), [
                                { text: t('Cancel'), style: 'cancel' },
                                { text: t('Clear'), style: 'destructive', onPress: () => { setPaths([]); setRedoStack([]); setTextOverlays([]); setStickerOverlays([]); } },
                            ])}
                            style={globalStyles.headerIconBtn}
                        >
                            <Ionicons name="trash-outline" size={22} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={handleDone}
                        style={[globalStyles.doneBtn, { backgroundColor: colors.primary }]}
                        disabled={saving}
                    >
                        {saving
                            ? <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>...</Text>
                            : <Ionicons name="checkmark" size={20} color="#fff" />
                        }
                    </TouchableOpacity>
                </View>

                {/* ── Canvas ── */}
                <GestureDetector gesture={panGesture}>
                    <View style={[globalStyles.canvasWrapper, { backgroundColor: bgColor, height: CANVAS_H }]}>
                        <Canvas ref={canvasRef} style={{ width: SCREEN_W, height: CANVAS_H }}>
                            {paths.map((dp, i) => (
                                <Path key={i} path={dp.path} color={dp.color}
                                    style="stroke" strokeWidth={dp.strokeWidth}
                                    strokeCap="round" strokeJoin="round" opacity={dp.opacity} />
                            ))}
                            {livePath && (
                                <Path path={livePath.path} color={livePath.color}
                                    style="stroke" strokeWidth={livePath.strokeWidth}
                                    strokeCap="round" strokeJoin="round" opacity={livePath.opacity} />
                            )}
                        </Canvas>

                        {/* Text overlays */}
                        {textOverlays.map(t => (
                            <View key={t.id} style={[globalStyles.textOverlay, { top: t.y, left: t.x }]}>
                                <Text style={{ color: t.color, fontSize: t.fontSize, fontWeight: '600' }}>
                                    {t.text}
                                </Text>
                            </View>
                        ))}

                        {/* Sticker overlays */}
                        {stickerOverlays.map(s => (
                            <Image key={s.id} source={{ uri: s.uri }}
                                style={[globalStyles.stickerOverlay, { top: s.y, left: s.x, width: s.size, height: s.size }]}
                                resizeMode="contain" />
                        ))}
                    </View>
                </GestureDetector>

                {/* ── Color Picker Panel ── */}
                {showColorPicker && (
                    <View style={[globalStyles.floatingPanel, {
                        backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7',
                        left: 12, right: 12, bottom: 76,
                    }]}>
                        {/* Current color preview + stroke preview */}
                        <View style={globalStyles.colorPreviewRow}>
                            <View style={[globalStyles.colorPreviewSwatch, { backgroundColor: activeColor, opacity }]} />
                            <View style={globalStyles.colorPreviewInfo}>
                                <Text style={[globalStyles.colorPreviewLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
                                    {t('home.activecolor')}
                                </Text>
                                <Text style={[globalStyles.colorPreviewSub, { color: isDarkMode ? '#8E8E93' : '#636366' }]}>
                                    {t('home.tapcolorchange')}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                                <Ionicons name="close-circle" size={24} color={isDarkMode ? '#636366' : '#C7C7CC'} />
                            </TouchableOpacity>
                        </View>

                        {/* Color grid */}
                        <View style={globalStyles.colorGrid}>
                            {PALETTE_COLORS.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    onPress={() => syncColor(c)}
                                    style={[
                                        globalStyles.colorSwatch,
                                        { backgroundColor: c },
                                        c === activeColor && globalStyles.colorSwatchSelected,
                                        (c === '#FFFFFF') && { borderWidth: 1, borderColor: '#C7C7CC' },
                                    ]}
                                >
                                    {c === activeColor && (
                                        <Ionicons name="checkmark" size={14} color={isLight(c) ? '#000' : '#fff'} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Opacity slider */}
                        <View style={globalStyles.sliderRow}>
                            <Text style={[globalStyles.sliderLabel, { color: isDarkMode ? '#8E8E93' : '#636366' }]}>
                                {t('home.Opacity')}
                            </Text>
                            <View style={globalStyles.sliderTrack}>
                                {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(v => (
                                    <TouchableOpacity
                                        key={v}
                                        onPress={() => syncOpacity(v)}
                                        style={[
                                            globalStyles.sliderStep,
                                            { backgroundColor: activeColor, opacity: v },
                                            Math.abs(opacity - v) < 0.05 && globalStyles.sliderStepActive,
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={[globalStyles.sliderValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                                {Math.round(opacity * 100)}%
                            </Text>
                        </View>

                        {/* Stroke width slider */}
                        <View style={globalStyles.sliderRow}>
                            <Text style={[globalStyles.sliderLabel, { color: isDarkMode ? '#8E8E93' : '#636366' }]}>
                                {t('home.Size')}
                            </Text>
                            <View style={globalStyles.sliderTrack}>
                                {[1, 2, 3, 5, 8, 12, 16, 20, 24, 30].map(v => (
                                    <TouchableOpacity
                                        key={v}
                                        onPress={() => syncStroke(v)}
                                        style={[
                                            globalStyles.sliderStep,
                                            { backgroundColor: activeColor },
                                            Math.abs(strokeWidth - v) < 1 && globalStyles.sliderStepActive,
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={[globalStyles.sliderValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                                {strokeWidth}
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── Add Menu ── */}
                {showAddMenu && (
                    <View style={[globalStyles.floatingPanel, {
                        backgroundColor: isDarkMode ? 'rgba(28,28,30,0.97)' : 'rgba(242,242,247,0.97)',
                        right: 12, bottom: 76, width: 230,
                        paddingVertical: 4, paddingHorizontal: 0, marginBottom: 10,
                    }]}>
                        {[
                            { label: t('home.addsticker'), icon: 'leaf-outline', action: handleAddSticker },
                            { label: t('home.addtext'), icon: 'text', action: handleAddText },
                        ].map((item, i, arr) => (
                            <React.Fragment key={item.label}>
                                <TouchableOpacity style={globalStyles.addMenuItem} onPress={item.action} activeOpacity={0.7}>
                                    <View style={[globalStyles.addMenuIconWrap,
                                    { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E5EA' }]}>
                                        <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                                    </View>
                                    <Text style={[globalStyles.addMenuLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                                {i < arr.length - 1 && (
                                    <View style={[globalStyles.menuDivider,
                                    { backgroundColor: isDarkMode ? '#3A3A3C' : '#D1D1D6' }]} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                )}

                {/* ── Bottom Toolbar ── */}
                <View style={[globalStyles.toolbar, { backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7' }]}>

                    <ToolBtn active={activeTool === 'pen'} onPress={() => syncTool('pen')} accentColor={activeColor}>
                        <MaterialCommunityIcons name="pen" size={activeTool === 'pen' ? 26 : 22}
                            color={activeTool === 'pen' ? activeColor : (isDarkMode ? '#8E8E93' : '#636366')} />
                    </ToolBtn>

                    <ToolBtn active={activeTool === 'finepen'} onPress={() => syncTool('finepen')} accentColor={activeColor}>
                        <MaterialCommunityIcons name="fountain-pen-tip" size={activeTool === 'finepen' ? 26 : 22}
                            color={activeTool === 'finepen' ? activeColor : (isDarkMode ? '#8E8E93' : '#636366')} />
                    </ToolBtn>

                    <ToolBtn active={activeTool === 'marker'} onPress={() => syncTool('marker')} accentColor={activeColor}>
                        <MaterialCommunityIcons name="marker" size={activeTool === 'marker' ? 26 : 22}
                            color={activeTool === 'marker' ? activeColor : (isDarkMode ? '#8E8E93' : '#636366')} />
                    </ToolBtn>

                    <ToolBtn active={activeTool === 'eraser'} onPress={() => syncTool('eraser')} accentColor="#FF453A">
                        <MaterialCommunityIcons name="eraser" size={activeTool === 'eraser' ? 26 : 22}
                            color={activeTool === 'eraser' ? '#FF453A' : (isDarkMode ? '#8E8E93' : '#636366')} />
                    </ToolBtn>

                    {/* Color wheel — shows active color */}
                    <ToolBtn
                        active={showColorPicker}
                        onPress={() => { setShowColorPicker(v => !v); setShowAddMenu(false); setShowStrokePanel(false); }}
                        accentColor={activeColor}
                    >
                        <View style={[globalStyles.colorWheelOuter, { borderColor: showColorPicker ? activeColor : (isDarkMode ? '#8E8E93' : '#636366') }]}>
                            <View style={[globalStyles.colorWheelInner, { backgroundColor: activeColor, opacity }]} />
                        </View>
                    </ToolBtn>

                    {/* Plus */}
                    <ToolBtn
                        active={showAddMenu}
                        onPress={() => { setShowAddMenu(v => !v); setShowColorPicker(false); setShowStrokePanel(false); }}
                        accentColor={activeColor}
                    >
                        <View style={[globalStyles.plusCircle,
                        { borderColor: showAddMenu ? activeColor : (isDarkMode ? '#8E8E93' : '#636366') }]}>
                            <Ionicons name={showAddMenu ? 'close' : 'add'} size={18}
                                color={showAddMenu ? activeColor : (isDarkMode ? '#8E8E93' : '#636366')} />
                        </View>
                    </ToolBtn>
                </View>

                {/* ── Save Popup Modal (Ads or Premium) ── */}
                <Modal visible={showSavePopup} transparent animationType="fade">
                    <View style={globalStyles.popupOverlay}>
                        <View style={[globalStyles.popupBox, { backgroundColor: isDarkMode ? '#1C1C1E' : '#fff' }]}>
                            <View style={globalStyles.popupIconWrap}>
                                <Ionicons name="diamond" size={32} color="#FF9F0A" />
                            </View>

                            <Text style={[globalStyles.popupTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                                {t('home.savedrawing')}
                            </Text>
                            <Text style={[globalStyles.popupSub, { color: isDarkMode ? '#8E8E93' : '#636366' }]}>
                                {t('home.gopremiumtosave')}
                            </Text>

                            {/* Premium button */}
                            <TouchableOpacity
                                onPress={handleGoToPremium}
                                style={[globalStyles.popupBtnPremium, { backgroundColor: '#FF9F0A' }]}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="diamond" size={18} color="#fff" />
                                <Text style={globalStyles.popupBtnPremiumText}>{t('home.gopremium')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => { setShowSavePopup(false); pendingUri.current = null; }}
                                style={globalStyles.popupCancel}
                            >
                                <Text style={{ color: isDarkMode ? '#636366' : '#8E8E93', fontSize: 14 }}>
                                    {t('home.Cancel')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* ── Add Text Modal ──} */}
                <Modal visible={showTextInput} transparent animationType="slide">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={globalStyles.textModalOverlay}
                    >
                        <View style={[globalStyles.textModalBox, { backgroundColor: isDarkMode ? '#1C1C1E' : '#fff' }]}>
                            <Text style={[globalStyles.textModalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                                {t('home.addtext')}
                            </Text>
                            <TextInput
                                style={[globalStyles.textModalInput, {
                                    color: isDarkMode ? '#fff' : '#000',
                                    borderColor: colors.primary,
                                    backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
                                }]}
                                placeholder="Type here..."
                                placeholderTextColor={isDarkMode ? '#636366' : '#8E8E93'}
                                value={pendingText}
                                onChangeText={setPendingText}
                                autoFocus
                                multiline
                            />
                            <View style={globalStyles.textModalActions}>
                                <TouchableOpacity onPress={() => setShowTextInput(false)} style={globalStyles.textModalCancel}>
                                    <Text style={{ color: '#8E8E93', fontSize: 16 }}>{t('home.Cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleConfirmText}
                                    style={[globalStyles.textModalConfirm, { backgroundColor: colors.primary }]}>
                                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t('home.add')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

DrawingScreen._lastDrawingUri = null as string | null;

// ─── Helper ──────────────────────────────────────────────────────────────────────
function isLight(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// ─── Toolbar button ──────────────────────────────────────────────────────────────
function ToolBtn({ children, active, onPress, accentColor }: {
    children: React.ReactNode;
    active: boolean;
    onPress: () => void;
    accentColor: string;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[globalStyles.toolBtn, active && { backgroundColor: accentColor + '22' }]}
            activeOpacity={0.75}
        >
            {children}
        </TouchableOpacity>
    );
}
