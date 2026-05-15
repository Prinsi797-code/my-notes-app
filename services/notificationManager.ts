import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIFICATION_ENABLED_KEY = 'notification_enabled';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const NotificationManager = {

    // Permission maango
    async requestPermission(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('note-reminders', {
                name: 'Note Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                sound: 'default',
            });
        }

        return finalStatus === 'granted';
    },

    // Notification on/off status get karo
    async isEnabled(): Promise<boolean> {
        const val = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
        return val === 'true';
    },

    // Notification on/off save karo
    async setEnabled(enabled: boolean): Promise<void> {
        await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, enabled ? 'true' : 'false');
        if (!enabled) {
            // Sab scheduled notifications cancel karo
            await Notifications.cancelAllScheduledNotificationsAsync();
        }
    },

    // Ek note ke liye midnight notification schedule karo
    async scheduleNoteNotification(noteId: string, noteTitle: string, noteDate: string): Promise<void> {
        const enabled = await this.isEnabled();
        if (!enabled) return;

        const granted = await this.requestPermission();
        if (!granted) return;

        // Today ki date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Note ki date
        const targetDate = new Date(noteDate + 'T00:00:00');
        targetDate.setHours(0, 0, 0, 0);

        // Sirf future dates ke liye schedule karo
        if (targetDate <= today) return;

        // Midnight pe trigger — targetDate ki raat 12 baje
        const triggerDate = new Date(noteDate + 'T00:00:00');
        triggerDate.setHours(0, 0, 0, 0); // exactly midnight

        // Pehle agar same note ki notification thi toh cancel karo
        await this.cancelNoteNotification(noteId);

        await Notifications.scheduleNotificationAsync({
            identifier: `note-${noteId}`,
            content: {
                title: '📝 Note Reminder',
                body: noteTitle || 'You have a note for today!',
                data: { noteId },
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
            },
        });

        console.log(`✅ Notification scheduled for note "${noteTitle}" on ${noteDate} at midnight`);
    },

    // Note ki notification cancel karo
    async cancelNoteNotification(noteId: string): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(`note-${noteId}`);
    },

    // Saari notes ke liye notifications reschedule karo
    async rescheduleAllNotes(notes: any[]): Promise<void> {
        const enabled = await this.isEnabled();
        if (!enabled) {
            await Notifications.cancelAllScheduledNotificationsAsync();
            return;
        }

        await Notifications.cancelAllScheduledNotificationsAsync();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const note of notes) {
            const noteDate = (note as any).noteDate;
            if (!noteDate) continue;

            const targetDate = new Date(noteDate + 'T00:00:00');
            if (targetDate <= today) continue;

            await this.scheduleNoteNotification(note.id, note.title, noteDate);
        }
    },
};