import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/Themecontext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AdsManager from '../services/adsManager';
import PurchaseManager from '../services/purchaseManager';

export let isUserPremium = false;

// export const setUserPremium = (value: boolean) => {
//   isUserPremium = value;
//   console.log('👑 Premium updated:', value);
// };

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const adsInitialized = useRef(false);
  const router = useRouter();

  useEffect(() => {
    initApp();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (isReady) {
      router.replace('/(tabs)');
    }
  }, [isReady]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      (appState.current === 'background' || appState.current === 'inactive') &&
      nextAppState === 'active'
    ) {
      console.log('📱 App came to foreground (resume)');
      if (adsInitialized.current && !isUserPremium) {
        await AdsManager.showAppResumeAd();
      }
    }
    appState.current = nextAppState;
  };

  const initApp = async () => {
    try {
      await PurchaseManager.initialize();

      const premiumStatus = await PurchaseManager.checkAndRestorePremium();
      isUserPremium = premiumStatus;
      console.log('👑 Premium status:', premiumStatus);

      if (!premiumStatus) {
        await AdsManager.initializeAds();
        console.log('📢 Ads initialized');
        adsInitialized.current = true;
      } else {
        console.log('✅ User is premium — ads skipped');
      }

      setTimeout(() => {
        checkAndShowReview();
      }, 6000);

    } catch (error) {
      console.log('App init error:', error);
      await AdsManager.initializeAds();
      adsInitialized.current = true;
    } finally {
      setIsReady(true);
    }
  };

  const checkAndShowReview = async () => {
    try {
      const reviewed = await AsyncStorage.getItem('review_shown');
      if (reviewed) return;

      const lastShown = await AsyncStorage.getItem('review_last_shown');
      if (lastShown) {
        const lastDate = new Date(lastShown).toDateString();
        const today = new Date().toDateString();
        if (lastDate === today) return;
      }

      // Device support karta hai review?
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) return;

      // Popup dikhao
      await StoreReview.requestReview();

      // Save karo — aaj dikhaya
      await AsyncStorage.setItem('review_last_shown', new Date().toISOString());
      await AsyncStorage.setItem('review_shown', 'true'); // ← dobara nahi aayega
      console.log('⭐ Review popup shown');

    } catch (error) {
      console.log('Review error:', error);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Stack>
          <Stack.Screen name="SplashScreen" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="NoteEditorModal" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="ChecklistScreen" options={{ headerShown: false }} />
          <Stack.Screen name="SettingsScreen" options={{ headerShown: false }} />
          <Stack.Screen name="Languageselectionscreen" options={{ headerShown: false }} />
          <Stack.Screen name="Themeselectionscreen" options={{ headerShown: false }} />
          <Stack.Screen name="Purchasesuccessscreen" options={{ presentation: 'modal', headerShown: false, gestureEnabled: false, contentStyle: { backgroundColor: 'transparent' } }} />
          <Stack.Screen name="PremiumScreen" options={{ headerShown: false }} />
          <Stack.Screen name="DrawingScreen" options={{ headerShown: false }} />
          {/* <Stack.Screen name="Purchasesuccessscreen" options={{ headerShown: false }} /> */}
          <Stack.Screen name="NotificationScreen" options={{ headerShown: false }} />
        </Stack>
      </LanguageProvider>
    </ThemeProvider>
  );
}