import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// ── Exported type — add this to types/Note.ts as well ──────────────────────────
export interface TableData {
    rows: number;
    cols: number;
    cellData: string[][];
}

interface TableEditorProps {
    colors: any;
    onRemove?: () => void;
    initialData?: TableData;          
    onChange?: (data: TableData) => void; 
}

const SCREEN_W = Dimensions.get('window').width;
const H_PADDING = 40;
const ROW_BTN_W = 28;
const COL_BTN_H = 28;
const CELL_H = 44;

export const TableEditor: React.FC<TableEditorProps> = ({
    colors,
    onRemove,
    initialData,
    onChange,
}) => {
    const bg = (colors.background ?? '').toLowerCase();
    const tp = (colors.textPrimary ?? '').toLowerCase();
    const isDarkMode =
        bg === '#000' || bg === '#000000' || bg === '#151718' ||
        bg === '#1c1c1e' || bg === '#111' || bg.startsWith('#0') ||
        tp === '#fff' || tp === '#ffffff' || tp === '#ecedee' || tp === '#f5f5f5';

    const borderColor = colors.border ?? (isDarkMode ? '#3A3A3C' : '#D1D1D6');
    const bgColor = colors.background ?? (isDarkMode ? '#1C1C1E' : '#FFFFFF');
    const headerBg = isDarkMode ? '#2C2C2E' : '#E8E8ED';
    const textColor = colors.textPrimary ?? (isDarkMode ? '#FFFFFF' : '#000000');
    const subTextColor = colors.textSecondary ?? (isDarkMode ? '#8E8E93' : '#6C6C70');
    const primaryColor = colors.primary ?? '#FFD60A';

    const initRows = initialData?.rows ?? 2;
    const initCols = initialData?.cols ?? 2;
    const initCells: string[][] = initialData?.cellData ??
        Array.from({ length: initRows }, () => Array(initCols).fill(''));

    const [rows, setRows] = useState(initRows);
    const [cols, setCols] = useState(initCols);
    const [cellData, setCellData] = useState<string[][]>(initCells);
    const [showMenu, setShowMenu] = useState(false);
    const [menuType, setMenuType] = useState<'table' | 'row' | 'col'>('table');
    const { t } = useLanguage();

    const availableW = SCREEN_W - H_PADDING - ROW_BTN_W - 2;
    const cellW = Math.max(60, Math.floor(availableW / cols));

    // ── notify parent helper ──────────────────────────────────────────────────
    const notify = (newRows: number, newCols: number, newCells: string[][]) => {
        onChange?.({ rows: newRows, cols: newCols, cellData: newCells });
    };

    const updateCell = (r: number, c: number, val: string) => {
        const next = cellData.map(row => [...row]);
        next[r][c] = val;
        setCellData(next);
        notify(rows, cols, next);  // ✅ render ke bahar
    };

    const addRow = () => {
        const newCells = [...cellData, Array(cols).fill('')];
        const newRows = rows + 1;
        setCellData(newCells);
        setRows(newRows);
        notify(newRows, cols, newCells);
        setShowMenu(false);
    };

    const addCol = () => {
        const newCells = cellData.map(row => [...row, '']);
        const newCols = cols + 1;
        setCellData(newCells);
        setCols(newCols);
        notify(rows, newCols, newCells);
        setShowMenu(false);
    };

    const deleteLastRow = () => {
        if (rows <= 1) { Alert.alert('Cannot delete', 'At least 1 row required.'); return; }
        const newCells = cellData.slice(0, -1);
        const newRows = rows - 1;
        setCellData(newCells);
        setRows(newRows);
        notify(newRows, cols, newCells);
        setShowMenu(false);
    };

    const deleteLastCol = () => {
        if (cols <= 1) { Alert.alert('Cannot delete', 'At least 1 col required.'); return; }
        const newCells = cellData.map(row => row.slice(0, -1));
        const newCols = cols - 1;
        setCellData(newCells);
        setCols(newCols);
        notify(rows, newCols, newCells);
        setShowMenu(false);
    };

    const ThreeDots = ({ vertical = false }: { vertical?: boolean }) => (
        <View style={vertical ? styles.vDots : styles.hDots}>
            {[0, 1, 2].map(i => (
                <View key={i} style={[styles.dot, { backgroundColor: subTextColor }]} />
            ))}
        </View>
    );

    const rowMid = Math.floor(rows / 2);
    const colMid = Math.floor(cols / 2);

    return (
        <View style={[styles.wrapper, { borderColor, backgroundColor: bgColor }]}>

            {/* ── Top header ── */}
            <View style={[styles.topRow, { borderBottomColor: borderColor, backgroundColor: headerBg }]}>
                <TouchableOpacity
                    style={[styles.corner, { borderRightColor: borderColor }]}
                    onPress={() => { setMenuType('table'); setShowMenu(true); }}
                    activeOpacity={0.7}
                >
                    <ThreeDots />
                </TouchableOpacity>

                {Array.from({ length: cols }).map((_, c) => (
                    <View
                        key={`th-${c}`}
                        style={[
                            styles.topCell,
                            {
                                width: cellW,
                                borderRightColor: borderColor,
                                borderRightWidth: c < cols - 1 ? StyleSheet.hairlineWidth : 0,
                            },
                        ]}
                    >
                        {c === colMid ? (
                            <TouchableOpacity
                                onPress={() => { setMenuType('col'); setShowMenu(true); }}
                                activeOpacity={0.7}
                                style={styles.midBtn}
                            >
                                <ThreeDots />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                ))}
            </View>

            {/* ── Data rows ── */}
            {Array.from({ length: rows }).map((_, r) => (
                <View
                    key={`row-${r}`}
                    style={[
                        styles.dataRow,
                        {
                            borderBottomColor: borderColor,
                            borderBottomWidth: r < rows - 1 ? StyleSheet.hairlineWidth : 0,
                        },
                    ]}
                >
                    <View style={[styles.leftCell, { borderRightColor: borderColor, backgroundColor: headerBg }]}>
                        {r === rowMid ? (
                            <TouchableOpacity
                                onPress={() => { setMenuType('row'); setShowMenu(true); }}
                                activeOpacity={0.7}
                                style={styles.midBtn}
                            >
                                <ThreeDots vertical />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {Array.from({ length: cols }).map((_, c) => (
                        <TextInput
                            key={`cell-${r}-${c}`}
                            style={[
                                styles.cell,
                                {
                                    width: cellW,
                                    color: textColor,
                                    backgroundColor: bgColor,
                                    borderRightColor: borderColor,
                                    borderRightWidth: c < cols - 1 ? StyleSheet.hairlineWidth : 0,
                                },
                            ]}
                            value={cellData[r]?.[c] ?? ''}
                            onChangeText={val => updateCell(r, c, val)}
                            placeholder=""
                            placeholderTextColor={subTextColor}
                            multiline={false}
                            returnKeyType="next"
                        />
                    ))}
                </View>
            ))}

            {/* ── Options Modal ── */}
            <Modal visible={showMenu} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setShowMenu(false)}
                >
                    <View
                        style={[styles.menuBox, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }]}
                        onStartShouldSetResponder={() => true}
                    >
                        <Text style={[styles.menuTitle, { color: subTextColor }]}>
                            {menuType === 'row' ? t('home.row_options')
                                : menuType === 'col' ? t('home.column_options')
                                    : t('home.Table_options')}
                        </Text>

                        {(menuType === 'table' || menuType === 'row') && (
                            <TouchableOpacity style={styles.menuItem} onPress={addRow} activeOpacity={0.7}>
                                <View style={[styles.menuIcon, { backgroundColor: primaryColor + '22' }]}>
                                    <Ionicons name="add" size={18} color={primaryColor} />
                                </View>
                                <Text style={[styles.menuText, { color: textColor }]}>{t('home.add_row')}</Text>
                            </TouchableOpacity>
                        )}

                        {(menuType === 'table' || menuType === 'col') && (
                            <TouchableOpacity style={styles.menuItem} onPress={addCol} activeOpacity={0.7}>
                                <View style={[styles.menuIcon, { backgroundColor: primaryColor + '22' }]}>
                                    <Ionicons name="add" size={18} color={primaryColor} />
                                </View>
                                <Text style={[styles.menuText, { color: textColor }]}>{t('home.add_col')}</Text>
                            </TouchableOpacity>
                        )}

                        <View style={[styles.divider, { backgroundColor: borderColor }]} />

                        {(menuType === 'table' || menuType === 'row') && (
                            <TouchableOpacity style={styles.menuItem} onPress={deleteLastRow} activeOpacity={0.7}>
                                <View style={[styles.menuIcon, { backgroundColor: '#FF453A22' }]}>
                                    <Ionicons name="remove" size={18} color="#FF453A" />
                                </View>
                                <Text style={[styles.menuText, { color: '#FF453A' }]}>{t('home.delete_row')}</Text>
                            </TouchableOpacity>
                        )}

                        {(menuType === 'table' || menuType === 'col') && (
                            <TouchableOpacity style={styles.menuItem} onPress={deleteLastCol} activeOpacity={0.7}>
                                <View style={[styles.menuIcon, { backgroundColor: '#FF453A22' }]}>
                                    <Ionicons name="remove" size={18} color="#FF453A" />
                                </View>
                                <Text style={[styles.menuText, { color: '#FF453A' }]}>{t('home.delete_col')}</Text>
                            </TouchableOpacity>
                        )}

                        {menuType === 'table' && onRemove && (
                            <>
                                <View style={[styles.divider, { backgroundColor: borderColor }]} />
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => { setShowMenu(false); onRemove(); }}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.menuIcon, { backgroundColor: '#FF453A22' }]}>
                                        <Ionicons name="trash-outline" size={18} color="#FF453A" />
                                    </View>
                                    <Text style={[styles.menuText, { color: '#FF453A' }]}>{t('home.remove_table')}</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.cancelBtn, { borderColor }]}
                            onPress={() => setShowMenu(false)}
                        >
                            <Text style={[styles.cancelTxt, { color: subTextColor }]}>{t('home.cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 10,
        overflow: 'hidden',
        marginVertical: 12,
    },
    topRow: {
        flexDirection: 'row',
        height: COL_BTN_H,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    corner: {
        width: ROW_BTN_W,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: StyleSheet.hairlineWidth,
    },
    topCell: {
        height: COL_BTN_H,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dataRow: { flexDirection: 'row' },
    leftCell: {
        width: ROW_BTN_W,
        height: CELL_H,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: StyleSheet.hairlineWidth,
    },
    cell: {
        height: CELL_H,
        paddingHorizontal: 8,
        fontSize: 14,
    },
    midBtn: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hDots: { flexDirection: 'row', gap: 3, alignItems: 'center' },
    vDots: { alignItems: 'center', gap: 3 },
    dot: { width: 3, height: 3, borderRadius: 1.5 },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    menuBox: {
        width: '100%',
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 16,
    },
    menuTitle: {
        fontSize: 11, fontWeight: '600',
        letterSpacing: 0.8,
        paddingHorizontal: 16, paddingVertical: 8,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12, gap: 12,
    },
    menuIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    menuText: { fontSize: 15, fontWeight: '500' },
    divider: { height: StyleSheet.hairlineWidth, marginVertical: 4, marginHorizontal: 16 },
    cancelBtn: {
        marginHorizontal: 16, marginTop: 4, marginBottom: 8,
        paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center',
    },
    cancelTxt: { fontSize: 15, fontWeight: '500' },
});