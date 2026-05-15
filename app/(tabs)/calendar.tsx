import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { CalendarList, LocaleConfig } from 'react-native-calendars';
import { globalStyles } from '../../contexts/global';

export default function CalendarScreen() {
    const { colors, isDarkMode } = useTheme();
    const router = useRouter();
    const { t } = useLanguage();

    const today = new Date().toISOString().split('T')[0];
    const [selected, setSelected] = useState(today);

    const monthNames: string[] = [
        t('calendar.month.january'),
        t('calendar.month.february'),
        t('calendar.month.march'),
        t('calendar.month.april'),
        t('calendar.month.may'),
        t('calendar.month.june'),
        t('calendar.month.july'),
        t('calendar.month.august'),
        t('calendar.month.september'),
        t('calendar.month.october'),
        t('calendar.month.november'),
        t('calendar.month.december'),
    ];

    const monthNamesShort: string[] = [
        t('calendar.monthShort.jan'),
        t('calendar.monthShort.feb'),
        t('calendar.monthShort.mar'),
        t('calendar.monthShort.apr'),
        t('calendar.monthShort.may'),
        t('calendar.monthShort.jun'),
        t('calendar.monthShort.jul'),
        t('calendar.monthShort.aug'),
        t('calendar.monthShort.sep'),
        t('calendar.monthShort.oct'),
        t('calendar.monthShort.nov'),
        t('calendar.monthShort.dec'),
    ];

    const dayNames: string[] = [
        t('calendar.day.sunday'),
        t('calendar.day.monday'),
        t('calendar.day.tuesday'),
        t('calendar.day.wednesday'),
        t('calendar.day.thursday'),
        t('calendar.day.friday'),
        t('calendar.day.saturday'),
    ];

    const dayNamesShort: string[] = [
        t('calendar.dayShort.sun'),
        t('calendar.dayShort.mon'),
        t('calendar.dayShort.tue'),
        t('calendar.dayShort.wed'),
        t('calendar.dayShort.thu'),
        t('calendar.dayShort.fri'),
        t('calendar.dayShort.sat'),
    ];

    LocaleConfig.locales['app'] = {
        monthNames,
        monthNamesShort,
        dayNames,
        dayNamesShort,
        today: t('calendar.today') ?? 'Today',
    };
    LocaleConfig.defaultLocale = 'app';

    const markedDates = {
        [selected]: {
            selected: true,
            selectedColor: colors.primary,
            selectedTextColor: '#fff',
        },
        [today]: {
            marked: true,
            dotColor: colors.primary,
            ...(selected === today && {
                selected: true,
                selectedColor: colors.primary,
                selectedTextColor: '#fff',
            }),
        },
    };

    const calendarTheme = {
        backgroundColor: colors.background,
        calendarBackground: colors.background,
        monthTextColor: colors.primary,
        textMonthFontSize: 18,
        textMonthFontWeight: '700' as const,
        textSectionTitleColor: colors.textTertiary,
        textDayHeaderFontSize: 12,
        textDayHeaderFontWeight: '600' as const,
        dayTextColor: colors.textPrimary,
        textDayFontSize: 16,
        textDayFontWeight: '400' as const,
        todayTextColor: colors.primary,
        todayBackgroundColor: colors.primary + '22',
        selectedDayBackgroundColor: colors.primary,
        selectedDayTextColor: '#ffffff',
        textDisabledColor: colors.textTertiary,
        arrowColor: colors.primary,
        textDayStyle: { color: colors.textPrimary },
        dotColor: colors.primary,
        selectedDotColor: '#ffffff',
        'stylesheet.calendar.main': {
            week: {
                marginTop: 2,
                marginBottom: 2,
                flexDirection: 'row' as const,
                justifyContent: 'space-around' as const,
            },
        },
        'stylesheet.day.basic': {
            base: {
                width: 36,
                height: 36,
                alignItems: 'center' as const,
                justifyContent: 'center' as const,
                borderRadius: 18,
            },
            selected: {
                backgroundColor: colors.primary,
                borderRadius: 18,
            },
            today: {
                backgroundColor: colors.primary + '22',
                borderRadius: 18,
            },
        },
    };
    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        const day = dayNames[date.getDay()];
        const month = monthNames[date.getMonth()];
        const dateNum = date.getDate();
        const year = date.getFullYear();
        return `${day}, ${dateNum} ${month} ${year}`;
    };

    const handleAddNote = () => {
        router.push({
            pathname: '/NoteEditorModal',
            params: {
                noteDate: selected,
                noteDateDisplay: formatDisplayDate(selected),
            },
        });
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={globalStyles.header}>
                <View style={globalStyles.headerLeft}>
                    <Text style={[globalStyles.headerTitle, { color: colors.textPrimary }]}>
                        {t('home.calendar') ?? 'Calendar'}
                    </Text>
                </View>
                <View style={[globalStyles.iconPill, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Pressable
                        style={({ pressed }) => [globalStyles.pillIconBtn, pressed && { backgroundColor: colors.border }]}
                        onPress={handleAddNote}
                    >
                        <Ionicons name="add" size={22} color={colors.textSecondary} />
                    </Pressable>
                    <View style={[globalStyles.pillDivider, { backgroundColor: colors.border }]} />
                    <Pressable
                        style={({ pressed }) => [globalStyles.pillIconBtn, pressed && { backgroundColor: colors.border }]}
                        onPress={() => router.push('/PremiumScreen')}
                    >
                        <Ionicons name="diamond" size={20} color={colors.primary} />
                    </Pressable>
                </View>
            </View>

            <View style={[globalStyles.selectedDateBar, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                <Text style={[globalStyles.selectedDateText, { color: colors.textSecondary }]}>
                    {formatDisplayDate(selected)}
                </Text>
                {selected !== today && (
                    <Pressable onPress={() => setSelected(today)} style={globalStyles.todayBtn}>
                        <Text style={[globalStyles.todayBtnText, { color: colors.primary }]}>
                            {t('calendar.today') ?? 'Today'}
                        </Text>
                    </Pressable>
                )}
            </View>

            <CalendarList
                current={today}
                onDayPress={(day) => setSelected(day.dateString)}
                markedDates={markedDates}
                theme={calendarTheme}
                showScrollIndicator={false}
                horizontal={false}
                pagingEnabled={false}
                pastScrollRange={12}
                futureScrollRange={12}
                style={{ backgroundColor: colors.background, marginBottom: 150 }}
            />
        </SafeAreaView>
    );
}