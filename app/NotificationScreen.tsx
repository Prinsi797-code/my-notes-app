import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { useNotes } from '@/hooks/useNotes';
import AdsManager from '@/services/adsManager';
import { NotificationManager } from '@/services/notificationManager';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { globalStyles } from '../contexts/global';

export default function NotificationScreen() {
    const { colors, isDarkMode } = useTheme();
    const router = useRouter();
    const { notes } = useNotes();
    const { t } = useLanguage();
    const [isAdLoading, setIsAdLoading] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [scheduledCount, setScheduledCount] = useState(0);

    useEffect(() => {
        NotificationManager.isEnabled().then(setEnabled);
        countFutureNotes();
    }, []);

    const countFutureNotes = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const count = notes.filter(note => {
            const nd = (note as any).noteDate;
            if (!nd) return false;
            const d = new Date(nd + 'T00:00:00');
            return d > today;
        }).length;
        setScheduledCount(count);
    };

    const handleToggle = async (value: boolean) => {
        if (value) {
            const granted = await NotificationManager.requestPermission();
            if (!granted) {
                Alert.alert(
                    t('home.permissionRequired'),
                    t('home.pleaseAllow'),
                    [{ text: t('home.ok') }]
                );
                return;
            }
            await NotificationManager.setEnabled(true);
            setEnabled(true);
            await NotificationManager.rescheduleAllNotes(notes);
            Alert.alert(
                t('home.notificationsenabled'),
                scheduledCount > 0
                    ? `You have ${scheduledCount} upcoming note${scheduledCount > 1 ? 's' : ''}. You'll get a reminder at midnight on each note's date.`
                    : t('home.notificationsareon'),
                [{ text: t('home.gotit') }]
            );
        } else {
            await NotificationManager.setEnabled(false);
            setEnabled(false);
            Alert.alert(t('home.Notificationsdisabled'), t('home.allreminders'), [{ text: t('home.ok') }]);
        }
        countFutureNotes();
    };

    const handleGoBack = async () => {
        if (isAdLoading) return;
        setIsAdLoading(true);
        try {
            console.log('Language back pressed — attempting ad...');
            await AdsManager.showSettingScreenInterstitialAd('back');
        } catch (error) {
            console.log('Language back ad error:', error);
        } finally {
            setIsAdLoading(false);
            router.back();
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureNotes = notes.filter(note => {
        const nd = (note as any).noteDate;
        if (!nd) return false;
        const d = new Date(nd + 'T00:00:00');
        return d > today;
    }).sort((a, b) => {
        const da = new Date((a as any).noteDate + 'T00:00:00').getTime();
        const db = new Date((b as any).noteDate + 'T00:00:00').getTime();
        return da - db;
    });

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: colors.cardBackground }]}>
            {/* Header */}
            <View style={globalStyles.notificationheader}>
                {/* <TouchableOpacity onPress={() => router.back()} style={globalStyles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={colors.primary} />
                </TouchableOpacity> */}
                {/* <TouchableOpacity
                    onPress={handleGoBack}
                    style={globalStyles.backButton}
                    disabled={isAdLoading}
                >
                    <View style={[globalStyles.closeBtnCircle, { backgroundColor: colors.background }]}>
                        <Ionicons name="chevron-back" size={26} color={colors.textSecondary} />
                    </View>
                </TouchableOpacity> */}

                <TouchableOpacity
                    onPress={handleGoBack}
                    style={globalStyles.backButton}
                    disabled={isAdLoading}
                >
                    <View style={[globalStyles.closeBtnCircle, { backgroundColor: colors.background }]}>
                        <Ionicons name="chevron-back" size={26} color={colors.textSecondary} />
                    </View>
                </TouchableOpacity>


                <Text style={[globalStyles.notificationheaderTitle, { color: colors.textPrimary }]}>{t('home.Notifications')}</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={globalStyles.notificationcontent}>
                <View style={[globalStyles.notificationcard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <View style={globalStyles.row}>
                        <View style={[globalStyles.iconBox, { backgroundColor: '#FF9F0A20' }]}>
                            <Ionicons name="notifications" size={22} color="#FF9F0A" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[globalStyles.rowTitle, { color: colors.textPrimary }]}>{t('home.NoteReminders')}</Text>
                            <Text style={[globalStyles.rowSubtitle, { color: colors.textSecondary }]}>
                                {t('home.getnotified')}
                            </Text>
                        </View>
                        <Switch
                            value={enabled}
                            onValueChange={handleToggle}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.99 }] }}
                        />
                    </View>
                </View>

                {/* Info box */}
                <View style={[globalStyles.infoBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                    <Text style={[globalStyles.infoText, { color: colors.primary }]}>
                        When you add a note with a future date (e.g. March 31), you'll receive a reminder exactly at midnight when that date begins.
                    </Text>
                </View>

                {/* Upcoming notifications */}
                {futureNotes.length > 0 && (
                    <View style={{ marginTop: 24 }}>
                        <Text style={[globalStyles.sectionLabel, { color: colors.textTertiary }]}>
                            UPCOMING REMINDERS ({futureNotes.length})
                        </Text>
                        {futureNotes.map(note => (
                            <View
                                key={note.id}
                                style={[globalStyles.noteRow, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                            >
                                <View style={[globalStyles.iconBox, { backgroundColor: colors.primary + '18' }]}>
                                    <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[globalStyles.noteTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                        {note.title}
                                    </Text>
                                    <Text style={[globalStyles.noteDate, { color: colors.textSecondary }]}>
                                        🔔 {formatDate((note as any).noteDate)} · 12:00 AM
                                    </Text>
                                </View>
                                {enabled && (
                                    <View style={[globalStyles.activeBadge, { backgroundColor: colors.primary + '20' }]}>
                                        <Text style={[globalStyles.activeBadgeText, { color: colors.primary }]}>Scheduled</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {futureNotes.length === 0 && (
                    <View style={globalStyles.notificationemptyState}>
                        <Ionicons name="notifications-off-outline" size={48} color={colors.textTertiary} />
                        <Text style={[globalStyles.notificationemptyTitle, { color: colors.textSecondary }]}>{t('home.noupcoming')}</Text>
                        <Text style={[globalStyles.notificationemptySubtitle, { color: colors.textTertiary }]}>
                            {t('home.addnoteswith')}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
