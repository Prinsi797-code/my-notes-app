import { NOTE_TEMPLATES, NoteTemplate, TEMPLATE_CATEGORIES } from '@/constants/NoteTemplates';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Icon, Label } from 'expo-router/build/native-tabs/common/elements';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal, Platform, Pressable, SafeAreaView, ScrollView,
    Text, TouchableOpacity, View
} from 'react-native';
import { globalStyles } from '../../contexts/global';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function CoachScreen() {
    const { colors, isDarkMode } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);
    const { t } = useLanguage();

    const getTemplateTitle = (id: string, fallback: string) =>
        t(`templates.${id}.title`) !== `templates.${id}.title`
            ? t(`templates.${id}.title`)
            : fallback;

    const getTemplateDesc = (id: string, fallback: string) =>
        t(`templates.${id}.description`) !== `templates.${id}.description`
            ? t(`templates.${id}.description`)
            : fallback;

    const filtered = selectedCategory === 'All'
        ? NOTE_TEMPLATES
        : NOTE_TEMPLATES.filter(t => t.category === selectedCategory);

    const grouped = TEMPLATE_CATEGORIES.filter(c => c !== 'All').map(cat => ({
        category: cat,
        templates: filtered.filter(t => t.category === cat),
    })).filter(g => g.templates.length > 0);

    const handleUseTemplate = (template: NoteTemplate) => {
        setSelectedTemplate(null);
        router.push({
            pathname: '/NoteEditorModal',
            params: {
                templateId: template.id,
                templateTitle: template.title,
                templateContent: template.content,
                templateChecklist: template.checklistItems
                    ? JSON.stringify(template.checklistItems)
                    : '',
            },
        });
    };

    const getCategoryTitle = (category: string) => {
        switch (category) {
            case 'Plan Your Life': return t('home.planlife');
            case 'Healthy Living': return t('home.healthyliving');
            case 'Love & Relationships': return t('home.loverelation');
            case 'Travel': return t('home.travel');
            default: return category;
        }
    };

    const CATEGORY_DETAILS = [
        { key: 'Plan Your Life', detail: () => t('home.categorydetail1') },
        { key: 'Healthy Living', detail: () => t('home.categorydetail2') },
        { key: 'Love & Relationships', detail: () => t('home.categorydetail3') },
        { key: 'Travel', detail: () => t('home.categorydetail4') },
    ];

    const getCategorySubtitle = (category: string) => {
        const found = CATEGORY_DETAILS.find(c => c.key === category);
        return found ? found.detail() : '';
    };
    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: colors.background }]}>

            {Platform.OS === 'ios' && NativeTabs && (
                <NativeTabs.Trigger>
                    <Icon sf="calendar" />
                    <Label>Calendar</Label>
                </NativeTabs.Trigger>
            )}


            {/* Header */}
            <View style={globalStyles.header}>
                <View style={globalStyles.headerLeft}>
                    <Text style={[globalStyles.headerTitle, { color: colors.textPrimary }]}>{t('home.Coach')}</Text>
                </View>
                <View style={globalStyles.headerRight}>
                    <View style={[globalStyles.iconPill, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <Pressable
                            onPress={() => router.push('/PremiumScreen')}
                            style={({ pressed }) => [
                                globalStyles.pillIconBtn,
                                pressed && { backgroundColor: colors.border }
                            ]}
                        >
                            <Ionicons name="diamond" size={20} color={colors.primary} />
                        </Pressable>
                    </View>
                </View>
            </View>
            {/* Main Vertical Scroll */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={globalStyles.scrollContent}
            >
                {grouped.map(group => (
                    <View key={group.category} style={globalStyles.section}>
                        {/* Section Header */}
                        <View style={globalStyles.sectionHeader}>
                            <Text style={[globalStyles.sectionTitle, { color: colors.textPrimary }]}>
                                {getCategoryTitle(group.category)}
                            </Text>
                            <Text style={[globalStyles.sectionSubtitle, { color: colors.textSecondary }]}>
                                {getCategorySubtitle(group.category)}
                            </Text>
                        </View>

                        {/* Horizontal Card Scroller */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={globalStyles.horizontalList}
                        >
                            {group.templates.map(template => (
                                <TouchableOpacity
                                    key={template.id}
                                    style={[globalStyles.card, { backgroundColor: colors.cardBackground }]}
                                    onPress={() => setSelectedTemplate(template)}
                                    activeOpacity={0.85}
                                >
                                    {/* Card Preview */}
                                    <View style={[globalStyles.cardPreview, { backgroundColor: template.bgColor }]}>
                                        <Text style={globalStyles.cardPreviewEmoji}>{template.emoji}</Text>
                                        <Text style={[globalStyles.cardPreviewTitle, { color: template.accentColor }]}>
                                            {template.title}
                                        </Text>
                                        {template.checklistItems?.slice(0, 3).map(item => (
                                            <View key={item.id} style={globalStyles.cardPreviewRow}>
                                                <View style={[globalStyles.cardPreviewCheck, { borderColor: template.accentColor }]} />
                                                <Text style={globalStyles.cardPreviewItem} numberOfLines={1}>{item.text}</Text>
                                            </View>
                                        ))}
                                        {!template.checklistItems && (
                                            <Text style={globalStyles.cardPreviewContent} numberOfLines={3}>
                                                {template.content.replace(/#+\s/g, '').substring(0, 80)}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Card Info */}
                                    <View style={globalStyles.cardInfo}>
                                        <Text style={[globalStyles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                            {template.title}
                                        </Text>
                                        <Text style={globalStyles.cardBadge}>
                                            FREE · {template.description.substring(0, 28)}...
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                ))}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Template Detail Modal */}
            <Modal
                visible={!!selectedTemplate}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedTemplate(null)}
            >
                {selectedTemplate && (
                    <SafeAreaView style={[globalStyles.modalContainer, { backgroundColor: colors.background }]}>
                        {/* <TouchableOpacity
                            onPress={() => setSelectedTemplate(null)}
                            style={globalStyles.modalBack}
                        >
                            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
                        </TouchableOpacity> */}

                        <TouchableOpacity
                            onPress={() => setSelectedTemplate(null)}
                            style={globalStyles.modalBack}
                        >
                            <View style={[globalStyles.closeBtnCircle, { backgroundColor: colors.cardBackground }]}>
                                <Ionicons name="chevron-back" size={26} color={colors.textSecondary} />
                            </View>
                        </TouchableOpacity>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={[globalStyles.modalPreview, { backgroundColor: selectedTemplate.bgColor }]}>
                                <Text style={globalStyles.modalPreviewEmoji}>{selectedTemplate.emoji}</Text>
                                <Text style={[globalStyles.modalPreviewTitle, { color: selectedTemplate.accentColor }]}>
                                    {selectedTemplate.title}
                                </Text>
                                {selectedTemplate.checklistItems?.map(item => (
                                    <View key={item.id} style={globalStyles.modalPreviewRow}>
                                        <View style={[globalStyles.modalPreviewCheck, { borderColor: selectedTemplate.accentColor }]} />
                                        <Text style={globalStyles.modalPreviewItem}>{item.text}</Text>
                                    </View>
                                ))}
                                {!selectedTemplate.checklistItems && (
                                    <Text style={globalStyles.modalPreviewContent} numberOfLines={6}>
                                        {selectedTemplate.content.replace(/#+\s/g, '').substring(0, 200)}
                                    </Text>
                                )}
                            </View>

                            <View style={globalStyles.modalBody}>
                                <Text style={[globalStyles.modalTitle, { color: colors.textPrimary }]}>
                                    {getTemplateTitle(selectedTemplate.id, selectedTemplate.title)}
                                </Text>
                                <Text style={[globalStyles.modalDescription, { color: colors.textSecondary }]}>
                                    {getTemplateDesc(selectedTemplate.id, selectedTemplate.description)}

                                </Text>

                                <TouchableOpacity
                                    style={[globalStyles.useBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => handleUseTemplate(selectedTemplate)}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name="pencil" size={18} color="#fff" />
                                    <Text style={globalStyles.useBtnText}>{t('home.useTemplete')}</Text>
                                </TouchableOpacity>

                                <View style={[globalStyles.metaRow, { borderColor: colors.border }]}>
                                    <View style={globalStyles.metaItem}>
                                        <Ionicons name="list-outline" size={20} color={colors.textTertiary} />
                                        <Text style={[globalStyles.metaText, { color: colors.textTertiary }]}>{t('home.template')}</Text>
                                    </View>
                                    <View style={[globalStyles.metaDivider, { backgroundColor: colors.border }]} />
                                    <View style={globalStyles.metaItem}>
                                        <View style={globalStyles.coachAvatar}>
                                            <Text style={globalStyles.coachAvatarText}>🧑</Text>
                                        </View>
                                        <Text style={[globalStyles.metaText, { color: colors.textPrimary, fontWeight: '600' }]}>
                                            {t('home.Coach')}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[globalStyles.freeLabel, { color: colors.textTertiary }]}>FREE</Text>
                                <Text style={[globalStyles.modalFullDesc, { color: colors.textSecondary }]}>
                                    {t('home.useThisTemplate')} {getTemplateDesc(selectedTemplate.id, selectedTemplate.description).toLowerCase()} {t('home.thistempletehelps')}
                                </Text>
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                )}
            </Modal>
        </SafeAreaView>
    );
}
