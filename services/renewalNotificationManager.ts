import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


// TEST ONLY — 2 minute baad notification bhejo
// export async function scheduleTestNotifications(planKey: 'weekly' | 'monthly' | 'yearly') {
//   const hasPermission = await requestNotificationPermission();
//   if (!hasPermission) {
//     console.log('❌ Permission nahi mili');
//     return;
//   }

//   await cancelRenewalNotifications();

//   const now = new Date();

//   const testSchedules: { id: string; secondsFromNow: number; title: string; body: string }[] = [];

//   if (planKey === 'weekly') {
//     testSchedules.push({
//       id: 'renewal_weekly_1day',
//       secondsFromNow: 10,
//       title: '⏰ Weekly Plan Expires Tomorrow!',
//       body: 'Renew your Premium plan to keep enjoying ad-free experience.',
//     });
//   }

//   if (planKey === 'monthly') {
//     testSchedules.push(
//       {
//         id: 'renewal_monthly_3day',
//         secondsFromNow: 10,
//         title: '📅 Premium Expires in 3 Days',
//         body: 'Your Monthly plan is ending soon. Renew now!',
//       },
//       {
//         id: 'renewal_monthly_1day',
//         secondsFromNow: 20,
//         title: '⚠️ Premium Expires Tomorrow!',
//         body: 'Last chance! Renew your Monthly plan before it expires.',
//       }
//     );
//   }

//   if (planKey === 'yearly') {
//     testSchedules.push(
//       {
//         id: 'renewal_yearly_30day',
//         secondsFromNow: 10,
//         title: '📆 Premium Expires in 1 Month',
//         body: 'Your Yearly plan expires in 30 days. Plan your renewal!',
//       },
//       {
//         id: 'renewal_yearly_7day',
//         secondsFromNow: 20,
//         title: '📆 Premium Expires in 1 Week',
//         body: 'Only 7 days left on your Yearly plan. Renew soon!',
//       },
//       {
//         id: 'renewal_yearly_1day',
//         secondsFromNow: 30,
//         title: '🚨 Premium Expires Tomorrow!',
//         body: 'Your Yearly plan expires tomorrow. Renew now!',
//       }
//     );
//   }

//   for (const s of testSchedules) {
//     await Notifications.scheduleNotificationAsync({
//       identifier: s.id,
//       content: {
//         title: s.title,
//         body: s.body,
//         sound: true,
//         data: { screen: 'PremiumScreen' },
//       },
//       trigger: {
//         type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
//         seconds: s.secondsFromNow,
//         repeats: false,
//       },
//     });
//     console.log(`✅ Test scheduled: ${s.id} — ${s.secondsFromNow}s baad`);
//   }

//   console.log(`🧪 Test notifications scheduled for: ${planKey}`);
// }

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Purani renewal notifications cancel karo
export async function cancelRenewalNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.identifier.startsWith('renewal_')) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

// Plan ke hisaab se notifications schedule karo
export async function scheduleRenewalNotifications(
  planKey: 'weekly' | 'monthly' | 'yearly',
  expiryDate: Date
) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Pehle purani cancel karo
  await cancelRenewalNotifications();

  const now = new Date();

  // Plan ke hisaab se schedules define karo
  const schedules: { id: string; daysBefore: number; title: string; body: string }[] = [];

  if (planKey === 'weekly') {
    schedules.push({
      id: 'renewal_weekly_1day',
      daysBefore: 1,
      title: '⏰ Weekly Plan Expires Tomorrow!',
      body: 'Renew your Premium plan to keep enjoying ad-free experience.',
    });
  }

  if (planKey === 'monthly') {
    schedules.push(
      {
        id: 'renewal_monthly_3day',
        daysBefore: 3,
        title: '📅 Premium Expires in 3 Days',
        body: 'Your Monthly plan is ending soon. Renew now to stay Premium!',
      },
      {
        id: 'renewal_monthly_1day',
        daysBefore: 1,
        title: '⚠️ Premium Expires Tomorrow!',
        body: 'Last chance! Renew your Monthly plan before it expires.',
      }
    );
  }

  if (planKey === 'yearly') {
    schedules.push(
      {
        id: 'renewal_yearly_30day',
        daysBefore: 30,
        title: '📆 Premium Expires in 1 Month',
        body: 'Your Yearly plan expires in 30 days. Plan your renewal!',
      },
      {
        id: 'renewal_yearly_7day',
        daysBefore: 7,
        title: '📆 Premium Expires in 1 Week',
        body: 'Only 7 days left on your Yearly plan. Renew soon!',
      },
      {
        id: 'renewal_yearly_1day',
        daysBefore: 1,
        title: '🚨 Premium Expires Tomorrow!',
        body: 'Your Yearly plan expires tomorrow. Renew now!',
      }
    );
  }

  // Schedule karo
  for (const s of schedules) {
    const triggerDate = new Date(expiryDate);
    triggerDate.setDate(triggerDate.getDate() - s.daysBefore);
    triggerDate.setHours(10, 0, 0, 0); // Morning 10 baje bhejo

    // Future mein hai tabhi schedule karo
    if (triggerDate > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: s.id,
        content: {
          title: s.title,
          body: s.body,
          sound: true,
          data: { screen: 'PremiumScreen' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      console.log(`✅ Scheduled: ${s.id} at ${triggerDate.toLocaleDateString()}`);
    }
  }
}