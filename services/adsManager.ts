import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AdEventType,
  AppOpenAd,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';
import { fetchAppConfig, logAnalyticsEvent } from '../utils/firebaseConfig';
import PurchaseManager from './purchaseManager';

interface AdConfig {
  detail_screen?: {
    inter_ads_flag: number;
    inter_id: string;
  };

  note_screen?: {
    ad_flag: number;
    baner_id: string;
    inter_ads_flag: number;
    inter_id: string;
    review_id: string;
    review_ad_flag: number;
  };

  language_screen?: {
    ad_flag: number;
    baner_id: string;
    inter_ads_flag: number;
    inter_id: string;
  };

  main_screen?: {
    ad_flag: number;
    baner_id: string;
  };

  main_screen_ad?: {
    ad_flag: number;
    inter_ads_id: string;
  };

  setting_screen?: {
    ad_flag: number;
    baner_id: string;
    inter_ads_flag: number;
    inter_id: string;
  };

  splash_screen?: {
    inter_ads_flag: number;
    inter_id: string;
  };

  floor_inter?: {
    inter_id: string;
    inter_ads_flag: number;
  };
}

class AdsManager {
  private static skipNextAppOpenAd = false;
  private static instance: AdsManager;
  private config: AdConfig | null = null;
  private appOpenAd: AppOpenAd | null = null;
  private floorInterstitialAd: InterstitialAd | null = null;
  private settingInterstitialAd: InterstitialAd | null = null;
  private detailInterstitialAd: InterstitialAd | null = null;
  private NoteInterstitialAd: InterstitialAd | null = null;

  private reviewInterstitialAd: InterstitialAd | null = null;
  private isReviewInterstitialLoaded = false;

  private isShowingAd = false;
  private isConfigLoaded = false;
  private isFloorInterstitialLoaded = false;
  private isSettingInterstitialLoaded = false;
  private isDetailInterstitialLoaded = false;
  private isNoteInterstitialLoaded = false;

  private appResumeInterstitialAd: InterstitialAd | null = null;
  private isAppResumeInterstitialLoaded = false;
  private isAppResumeAdEnabled = false;

  // Ad frequency tracking keys
  private readonly SPLASH_AD_SHOWN_KEY = 'splash_ad_shown';
  private readonly SPLASH_AD_LAST_SHOWN_KEY = 'splash_ad_last_shown';
  private readonly SETTING_AD_SHOWN_KEY = 'setting_ad_shown';
  private readonly SETTING_AD_LAST_SHOWN_KEY = 'setting_ad_last_shown';
  private readonly DETAIL_AD_SHOWN_KEY = 'detail_ad_shown';
  private readonly DETAIL_AD_LAST_SHOWN_KEY = 'detail_ad_last_shown';
  private readonly NOTE_AD_SHOWN_KEY = 'note_ad_shown';
  private readonly NOTE_AD_LAST_SHOWN_KEY = 'note_ad_last_shown';

  private sessionAdsShown: Set<string> = new Set();
  private recentAdShown: { screenName: string; timestamp: number } | null = null;
  private readonly AD_COOLDOWN_MS = 60000;

  private async isUserPremium(): Promise<boolean> {
    try {
      const isPremium = await PurchaseManager.isPremium();
      return isPremium;
    } catch {
      return false;
    }
  }
  private constructor() { }

  static setSkipNextAppOpenAd(skip: boolean) {
    this.skipNextAppOpenAd = skip;
    console.log('🔔 Skip next App Open Ad:', skip);
  }

  static getInstance(): AdsManager {
    if (!AdsManager.instance) {
      AdsManager.instance = new AdsManager();
    }
    return AdsManager.instance;
  }

  async loadConfigFromFirebase(): Promise<boolean> {
    try {
      console.log('Loading ad config from Firebase...');
      const firebaseConfig = await fetchAppConfig();

      if (firebaseConfig) {
        this.config = firebaseConfig as AdConfig;
        this.isConfigLoaded = true;
        console.log('Firebase ad config loaded:', this.config);
        return true;
      } else {
        console.log('No Firebase config found');
        this.isConfigLoaded = false;
        return false;
      }
    } catch (error) {
      console.log('Failed to load Firebase config:', error);
      this.isConfigLoaded = false;
      return false;
    }
  }

  setConfig(config: AdConfig) {
    this.config = config;
    this.isConfigLoaded = true;
    console.log('🎯 Ads Config Set:', config);
  }

  private getAdUnitId(adId?: string): string {
    if (!adId || adId.trim() === '') {
      console.log('No ad ID provided, using test ID');
      return TestIds.INTERSTITIAL;
    }
    return adId;
  }

  isConfigReady(): boolean {
    return this.isConfigLoaded;
  }

  private isAdInCooldown(): boolean {
    if (!this.recentAdShown) return false;

    const now = Date.now();
    const timeSinceLastAd = now - this.recentAdShown.timestamp;

    if (timeSinceLastAd < this.AD_COOLDOWN_MS) {
      console.log(
        `Ad cooldown active (${Math.round(
          (this.AD_COOLDOWN_MS - timeSinceLastAd) / 1000
        )}s remaining)`
      );
      return true;
    }

    this.recentAdShown = null;
    return false;
  }

  // ==================== REVIEW AD (Drawing Screen Save) ====================
  // review_ad_flag: 0 = disabled, 1 = show review interstitial ad before save

  async loadReviewInterstitialAd() {
    const noteConfig = this.config?.note_screen;

    if (!noteConfig || noteConfig.review_ad_flag !== 1) {
      console.log('Review ad disabled (review_ad_flag != 1)');
      this.isReviewInterstitialLoaded = false;
      return;
    }

    if (!noteConfig.review_id || noteConfig.review_id.trim() === '') {
      console.log('Review ad: review_id is empty');
      this.isReviewInterstitialLoaded = false;
      return;
    }

    const adUnitId = this.getAdUnitId(noteConfig.review_id);
    console.log('Loading review interstitial ad with ID:', adUnitId);

    try {
      this.reviewInterstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.reviewInterstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        this.isReviewInterstitialLoaded = true;
        console.log('✅ Review Interstitial Ad Loaded');
      });

      this.reviewInterstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('Review Ad Error:', error);
        this.isReviewInterstitialLoaded = false;
        setTimeout(() => this.loadReviewInterstitialAd(), 5000);
      });

      this.reviewInterstitialAd.load();
    } catch (error) {
      console.log('Review Ad Load Failed:', error);
      this.isReviewInterstitialLoaded = false;
    }
  }

  async showReviewAd(): Promise<boolean> {
    console.log('🎬 Attempting Review Ad (Drawing save)');

    if (await this.isUserPremium()) {
      console.log('👑 Premium user — skipping review ad');
      return false;
    }

    const noteConfig = this.config?.note_screen;

    if (!noteConfig || noteConfig.review_ad_flag !== 1) {
      console.log('Review ad disabled');
      return false;
    }

    if (this.isShowingAd) {
      console.log('Already showing an ad');
      return false;
    }

    if (!this.isReviewInterstitialLoaded || !this.reviewInterstitialAd) {
      console.log('No review ad loaded, proceeding without ad');
      return false;
    }

    try {
      this.isShowingAd = true;

      await new Promise<void>((resolve) => {
        const unsubscribe = this.reviewInterstitialAd!.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            console.log('Review Ad Closed');
            this.isShowingAd = false;
            this.isReviewInterstitialLoaded = false;
            unsubscribe();
            resolve();
            setTimeout(() => this.loadReviewInterstitialAd(), 1000);
          }
        );

        const timeout = setTimeout(() => {
          this.isShowingAd = false;
          unsubscribe();
          resolve();
        }, 30000);

        this.reviewInterstitialAd!.show().catch((e) => {
          console.warn('Review ad show failed:', e);
          clearTimeout(timeout);
          unsubscribe();
          this.isShowingAd = false;
          resolve();
        });
      });

      logAnalyticsEvent('ad_shown', {
        ad_type: 'review',
        screen: 'review_screen',
      });

      this.recentAdShown = { screenName: 'review_ad', timestamp: Date.now() };
      console.log('✅ Review ad shown');
      return true;
    } catch (e) {
      console.log('Review ad failed:', e);
      this.isShowingAd = false;
      return false;
    }
  }

  // ==================== APP RESUME INTERSTITIAL AD (main_screen_ad) ====================
  // Yeh ad tab dikhta hai jab user app ko background se foreground me laaye
  async loadAppResumeInterstitialAd() {
    const mainAdConfig = this.config?.main_screen_ad;

    if (!mainAdConfig || mainAdConfig.ad_flag !== 1) {
      console.log('App resume ad disabled or not configured (ad_flag != 1)');
      this.isAppResumeAdEnabled = false;
      this.isAppResumeInterstitialLoaded = false;
      return;
    }

    if (!mainAdConfig.inter_ads_id || mainAdConfig.inter_ads_id.trim() === '') {
      console.log('App resume ad: inter_ads_id is empty');
      this.isAppResumeAdEnabled = false;
      this.isAppResumeInterstitialLoaded = false;
      return;
    }

    this.isAppResumeAdEnabled = true;
    const adUnitId = this.getAdUnitId(mainAdConfig.inter_ads_id);
    console.log('Loading app resume interstitial ad with ID:', adUnitId);

    try {
      this.appResumeInterstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.appResumeInterstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        this.isAppResumeInterstitialLoaded = true;
        console.log('✅ App Resume Interstitial Ad Loaded and Ready');
      });

      this.appResumeInterstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('App Resume Interstitial Ad Closed');
        this.isShowingAd = false;
        this.isAppResumeInterstitialLoaded = false;
        // Reload for next time
        setTimeout(() => this.loadAppResumeInterstitialAd(), 1000);
      });

      this.appResumeInterstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('App Resume Interstitial Ad Error:', error);
        this.isShowingAd = false;
        this.isAppResumeInterstitialLoaded = false;
        setTimeout(() => this.loadAppResumeInterstitialAd(), 5000);
      });

      this.appResumeInterstitialAd.load();
    } catch (error) {
      console.log('App Resume Interstitial Ad Load Failed:', error);
      this.isAppResumeInterstitialLoaded = false;
    }
  }

  // ==================== FLOOR INTERSTITIAL AD (PRIORITY) ====================
  async loadFloorInterstitialAd() {
    const floorConfig = this.config?.floor_inter;

    if (!floorConfig || !floorConfig.inter_id || floorConfig.inter_id.trim() === '') {
      console.log('Floor interstitial not configured or empty ID');
      this.isFloorInterstitialLoaded = false;
      return;
    }

    const adUnitId = this.getAdUnitId(floorConfig.inter_id);
    console.log('Loading floor interstitial ad with ID:', adUnitId);

    try {
      this.floorInterstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.floorInterstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        this.isFloorInterstitialLoaded = true;
        console.log('Floor Interstitial Ad Loaded and Ready');
      });

      this.floorInterstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Floor Interstitial Ad Closed');
        this.isShowingAd = false;
        this.isFloorInterstitialLoaded = false;
        setTimeout(() => this.loadFloorInterstitialAd(), 1000);
      });

      this.floorInterstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('Floor Interstitial Ad Error:', error);
        this.isShowingAd = false;
        this.isFloorInterstitialLoaded = false;
        setTimeout(() => this.loadFloorInterstitialAd(), 5000);
      });

      this.floorInterstitialAd.load();
    } catch (error) {
      console.log('Floor Interstitial Ad Load Failed:', error);
      this.isFloorInterstitialLoaded = false;
    }
  }
  async showAppResumeAd(): Promise<boolean> {
    console.log('🔄 Attempting App Resume Ad (background → foreground)');
    if (await this.isUserPremium()) {
      console.log('👑 Premium user — skipping app resume ad');
      return false;
    }
    if (AdsManager.skipNextAppOpenAd) {
      console.log('Skipping app resume ad (skipNextAppOpenAd = true)');
      AdsManager.skipNextAppOpenAd = false;
      return false;
    }

    if (this.isShowingAd) {
      console.log('Already showing an ad');
      return false;
    }

    if (this.isAdInCooldown()) {
      console.log('Skipping app resume ad due to cooldown');
      return false;
    }

    const mainAdConfig = this.config?.main_screen_ad;
    if (!mainAdConfig || mainAdConfig.ad_flag !== 1) {
      console.log('App resume ad disabled (ad_flag != 1)');
      return false;
    }

    if (!this.isAppResumeInterstitialLoaded || !this.appResumeInterstitialAd) {
      console.log('App resume interstitial ad not loaded yet');
      return false;
    }

    try {
      this.isShowingAd = true;
      await this.appResumeInterstitialAd.show();
      logAnalyticsEvent('ad_shown', {
        ad_type: 'app_resume',
        screen: 'main_screen',
      });

      this.recentAdShown = {
        screenName: 'main_screen_ad',
        timestamp: Date.now(),
      };

      console.log('✅ App resume interstitial ad shown');
      return true;
    } catch (e) {
      console.log('App resume ad failed to show:', e);
      this.isShowingAd = false;
      return false;
    }
  }
  // ==================== SETTING SCREEN INTERSTITIAL AD ====================
  async loadSettingInterstitialAd() {
    // Only load if floor interstitial is not available
    if (this.isFloorInterstitialLoaded && this.floorInterstitialAd) {
      console.log('Floor interstitial available, skipping setting interstitial load');
      return;
    }

    const settingConfig = this.config?.setting_screen;

    if (!settingConfig || !settingConfig.inter_id || settingConfig.inter_id.trim() === '') {
      console.log('Setting interstitial not configured or empty ID');
      this.isSettingInterstitialLoaded = false;
      return;
    }

    const adUnitId = this.getAdUnitId(settingConfig.inter_id);
    console.log('Loading setting interstitial ad with ID:', adUnitId);

    try {
      this.settingInterstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.settingInterstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        this.isSettingInterstitialLoaded = true;
        console.log('Setting Interstitial Ad Loaded and Ready');
      });

      this.settingInterstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Setting Interstitial Ad Closed');
        this.isShowingAd = false;
        this.isSettingInterstitialLoaded = false;
        setTimeout(() => this.loadSettingInterstitialAd(), 1000);
      });

      this.settingInterstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('Setting Interstitial Ad Error:', error);
        this.isShowingAd = false;
        this.isSettingInterstitialLoaded = false;
        setTimeout(() => this.loadSettingInterstitialAd(), 5000);
      });

      this.settingInterstitialAd.load();
    } catch (error) {
      console.log('Setting Interstitial Ad Load Failed:', error);
      this.isSettingInterstitialLoaded = false;
    }
  }

  isAppResumeAdActive(): boolean {
    return this.isAppResumeAdEnabled;
  }

  // ==================== DETAIL SCREEN INTERSTITIAL AD ====================
  async loadDetailInterstitialAd() {
    if (this.isFloorInterstitialLoaded && this.floorInterstitialAd) {
      console.log('Floor interstitial available, skipping detail interstitial load');
      return;
    }

    const detailConfig = this.config?.detail_screen;

    if (!detailConfig || !detailConfig.inter_id || detailConfig.inter_id.trim() === '') {
      console.log('Detail interstitial not configured or empty ID');
      this.isDetailInterstitialLoaded = false;
      return;
    }

    const adUnitId = this.getAdUnitId(detailConfig.inter_id);
    console.log('Loading detail interstitial ad with ID:', adUnitId);

    try {
      this.detailInterstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.detailInterstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        this.isDetailInterstitialLoaded = true;
        console.log('Detail Interstitial Ad Loaded and Ready');
      });

      this.detailInterstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Detail Interstitial Ad Closed');
        this.isShowingAd = false;
        this.isDetailInterstitialLoaded = false;
        setTimeout(() => this.loadDetailInterstitialAd(), 1000);
      });

      this.detailInterstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('Detail Interstitial Ad Error:', error);
        this.isShowingAd = false;
        this.isDetailInterstitialLoaded = false;
        setTimeout(() => this.loadDetailInterstitialAd(), 5000);
      });

      this.detailInterstitialAd.load();
    } catch (error) {
      console.log('Detail Interstitial Ad Load Failed:', error);
      this.isDetailInterstitialLoaded = false;
    }
  }

  // ==================== Note SCREEN INTERSTITIAL AD ====================
  async loadNoteInterstitialAd() {
    // Only load if floor interstitial is not available
    if (this.isFloorInterstitialLoaded && this.floorInterstitialAd) {
      console.log('Floor interstitial available, skipping Note interstitial load');
      return;
    }

    const noteConfig = this.config?.note_screen;

    if (!noteConfig || !noteConfig.inter_id || noteConfig.inter_id.trim() === '') {
      console.log('Note interstitial not configured or empty ID');
      this.isNoteInterstitialLoaded = false;
      return;
    }

    const adUnitId = this.getAdUnitId(noteConfig.inter_id);
    console.log('Loading Note interstitial ad with ID:', adUnitId);

    try {
      this.NoteInterstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.NoteInterstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        this.isNoteInterstitialLoaded = true;
        console.log('Note Interstitial Ad Loaded and Ready');
      });

      this.NoteInterstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Note Interstitial Ad Closed');
        this.isShowingAd = false;
        this.isNoteInterstitialLoaded = false;
        setTimeout(() => this.loadNoteInterstitialAd(), 1000);
      });

      this.NoteInterstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('Note Interstitial Ad Error:', error);
        this.isShowingAd = false;
        this.isNoteInterstitialLoaded = false;
        setTimeout(() => this.loadNoteInterstitialAd(), 5000);
      });

      this.NoteInterstitialAd.load();
    } catch (error) {
      console.log('Note Interstitial Ad Load Failed:', error);
      this.isNoteInterstitialLoaded = false;
    }
  }

  // ==================== SPLASH SCREEN AD ====================
  async showSplashAd(): Promise<boolean> {
    console.log('Attempting Splash Screen Ad');
    if (await this.isUserPremium()) {
      logAnalyticsEvent('ad_premium_skip', { screen: 'splash_screen' });

      console.log('👑 Premium user — skipping splash ad');
      return false;
    }

    if (this.isShowingAd) {
      console.log('Already showing an ad');
      return false;
    }

    const splashConfig = this.config?.splash_screen;
    if (!splashConfig) {
      console.log('Splash screen config not found');
      return false;
    }

    const frequency = splashConfig.inter_ads_flag ?? 0;

    // 0 = no ads
    if (frequency === 0) {
      console.log('Splash ads disabled (flag = 0)');
      return false;
    }

    // 1 = once in lifetime
    if (frequency === 1) {
      const shown = await AsyncStorage.getItem(this.SPLASH_AD_SHOWN_KEY);
      if (shown) {
        console.log('Splash ad already shown (lifetime)');
        return false;
      }
    }

    // 2 = once in a day
    if (frequency === 2) {
      const lastShown = await AsyncStorage.getItem(this.SPLASH_AD_LAST_SHOWN_KEY);
      if (lastShown) {
        const lastDate = new Date(lastShown).toDateString();
        const today = new Date().toDateString();
        if (lastDate === today) {
          console.log('⏭️ Splash ad already shown today');
          return false;
        }
      }
    }

    // Priority: floor_inter > splash inter
    let adToShow: InterstitialAd | null = null;
    let adType = '';

    // PRIORITY 1: Check floor_inter first
    if (this.isFloorInterstitialLoaded && this.floorInterstitialAd) {
      adToShow = this.floorInterstitialAd;
      adType = 'floor';
      console.log('Using floor_inter for splash ad');
    }
    // PRIORITY 2: Load splash-specific ad only if floor_inter is not available
    else if (splashConfig.inter_id && splashConfig.inter_id.trim() !== '') {
      console.log('Floor_inter not available, loading splash-specific ad');
      const adUnitId = this.getAdUnitId(splashConfig.inter_id);

      try {
        const splashAd = InterstitialAd.createForAdRequest(adUnitId, {
          requestNonPersonalizedAdsOnly: true,
        });

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Ad load timeout'));
          }, 5000);

          splashAd.addAdEventListener(AdEventType.LOADED, () => {
            clearTimeout(timeout);
            console.log('Splash-specific ad loaded');
            resolve();
          });

          splashAd.addAdEventListener(AdEventType.ERROR, (error) => {
            clearTimeout(timeout);
            console.log('Splash ad load error:', error);
            reject(error);
          });

          splashAd.load();
        });

        adToShow = splashAd;
        adType = 'splash';
      } catch (e) {
        console.log('Failed to load splash ad', e);
        return false;
      }
    } else {
      console.log('No splash ad ID configured');
    }

    if (!adToShow) {
      console.log('No splash ad available');
      return false;
    }

    try {
      this.isShowingAd = true;

      const adClosedPromise = new Promise<void>((resolve) => {
        const closedListener = adToShow!.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            console.log('Splash ad closed by user');
            this.isShowingAd = false;
            if (closedListener) closedListener();
            resolve();
          }
        );

        setTimeout(() => {
          console.log('Splash ad timeout');
          this.isShowingAd = false;
          if (closedListener) closedListener();
          resolve();
        }, 30000);
      });

      await adToShow.show();
      logAnalyticsEvent('ad_shown', {
        ad_type: adType,
        screen: 'splash_screen',
      });

      if (frequency === 1) {
        await AsyncStorage.setItem(this.SPLASH_AD_SHOWN_KEY, 'true');
      }
      if (frequency === 2) {
        await AsyncStorage.setItem(this.SPLASH_AD_LAST_SHOWN_KEY, new Date().toISOString());
      }

      console.log(`Splash ad shown (${adType}), waiting for close...`);

      await adClosedPromise;

      console.log('Splash ad flow complete');
      return true;
    } catch (e) {
      console.log('Splash ad failed to show', e);
      this.isShowingAd = false;
      return false;
    }
  }

  // ==================== LANGUAGE SCREEN ADS (First-time users) ====================
  private languageInterstitialAd: InterstitialAd | null = null;
  private isLanguageInterstitialLoaded = false;
  private readonly LANGUAGE_AD_SHOWN_KEY = 'language_ad_shown';
  private readonly LANGUAGE_AD_LAST_SHOWN_KEY = 'language_ad_last_shown';

  async loadLanguageInterstitialAd() {
    if (this.isFloorInterstitialLoaded && this.floorInterstitialAd) {
      console.log('Floor interstitial available, skipping language interstitial load');
      return;
    }

    const languageConfig = this.config?.language_screen;

    if (!languageConfig || !languageConfig.inter_id || languageConfig.inter_id.trim() === '') {
      console.log('Language interstitial not configured or empty ID');
      this.isLanguageInterstitialLoaded = false;
      return;
    }

    const adUnitId = this.getAdUnitId(languageConfig.inter_id);
    console.log('Loading language interstitial ad with ID:', adUnitId);

    try {
      this.languageInterstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.languageInterstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        this.isLanguageInterstitialLoaded = true;
        console.log('Language Interstitial Ad Loaded and Ready');
      });

      this.languageInterstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Language Interstitial Ad Closed');
        this.isShowingAd = false;
        this.isLanguageInterstitialLoaded = false;
        setTimeout(() => this.loadLanguageInterstitialAd(), 1000);
      });

      this.languageInterstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('Language Interstitial Ad Error:', error);
        this.isShowingAd = false;
        this.isLanguageInterstitialLoaded = false;
        setTimeout(() => this.loadLanguageInterstitialAd(), 5000);
      });

      this.languageInterstitialAd.load();
    } catch (error) {
      console.log('Language Interstitial Ad Load Failed:', error);
      this.isLanguageInterstitialLoaded = false;
    }
  }

  async showLanguageScreenInterstitialAd(actionType: 'save' | 'back'): Promise<boolean> {
    console.log(`Attempting Language Screen ${actionType} Ad (First-time user)`);

    if (await this.isUserPremium()) {
      console.log('👑 Premium user — skipping language ad');
      return false;
    }

    if (this.isShowingAd) {
      console.log('Already showing an ad');
      return false;
    }

    if (this.isAdInCooldown()) {
      console.log('Skipping ad due to cooldown');
      return false;
    }

    const languageConfig = this.config?.language_screen;
    if (!languageConfig) {
      console.log('Language screen config not found');
      return false;
    }

    const frequency = languageConfig.inter_ads_flag ?? 0;

    // 0 = no ads
    if (frequency === 0) {
      console.log('Language screen ads disabled (flag = 0)');
      return false;
    }

    // 1 = once in lifetime
    if (frequency === 1) {
      const shown = await AsyncStorage.getItem(this.LANGUAGE_AD_SHOWN_KEY);
      if (shown) {
        console.log('Language ad already shown (lifetime)');
        return false;
      }
    }

    // 2 = once in a day
    if (frequency === 2) {
      const lastShown = await AsyncStorage.getItem(this.LANGUAGE_AD_LAST_SHOWN_KEY);
      if (lastShown) {
        const lastDate = new Date(lastShown).toDateString();
        const today = new Date().toDateString();
        if (lastDate === today) {
          console.log('⏭️ Language ad already shown today');
          return false;
        }
      }
    }

    let adToShow: InterstitialAd | null = null;
    let adType = '';

    if (this.isFloorInterstitialLoaded && this.floorInterstitialAd) {
      adToShow = this.floorInterstitialAd;
      adType = 'floor';
    } else if (this.isLanguageInterstitialLoaded && this.languageInterstitialAd) {
      adToShow = this.languageInterstitialAd;
      adType = 'language';
    }

    if (!adToShow) {
      console.log('No language ad loaded');
      return false;
    }

    try {
      this.isShowingAd = true;
      await adToShow.show();

      // Update cooldown
      this.recentAdShown = {
        screenName: 'language_screen',
        timestamp: Date.now()
      };

      // Save based on frequency
      if (frequency === 1) {
        await AsyncStorage.setItem(this.LANGUAGE_AD_SHOWN_KEY, 'true');
      }
      if (frequency === 2) {
        await AsyncStorage.setItem(this.LANGUAGE_AD_LAST_SHOWN_KEY, new Date().toISOString());
      }

      console.log(`Language screen ${actionType} ad shown (${adType})`);
      return true;
    } catch (e) {
      console.log(`Language ${actionType} ad failed`, e);
      this.isShowingAd = false;
      return false;
    }
  }

  // ==================== SETTING SCREEN ADS (Language, Country, etc.) ====================
  async showSettingScreenInterstitialAd(actionType: 'save' | 'back'): Promise<boolean> {
    console.log(`Attempting Setting Screen ${actionType} Ad`);
    if (await this.isUserPremium()) {
      console.log('👑 Premium user — skipping setting ad');
      return false;
    }
    if (this.isShowingAd) {
      console.log('Already showing an ad');
      return false;
    }

    if (this.isAdInCooldown()) {
      console.log('Skipping ad due to cooldown');
      return false;
    }

    const settingConfig = this.config?.setting_screen;
    if (!settingConfig) {
      console.log('Setting screen config not found');
      return false;
    }

    const frequency = settingConfig.inter_ads_flag ?? 0;

    // 0 = no ads
    if (frequency === 0) {
      console.log('Setting screen ads disabled (flag = 0)');
      return false;
    }

    // 1 = once in lifetime
    if (frequency === 1) {
      const shown = await AsyncStorage.getItem(this.SETTING_AD_SHOWN_KEY);
      if (shown) {
        console.log('Setting ad already shown (lifetime)');
        return false;
      }
    }

    // 2 = once in a day
    if (frequency === 2) {
      const lastShown = await AsyncStorage.getItem(this.SETTING_AD_LAST_SHOWN_KEY);
      if (lastShown) {
        const lastDate = new Date(lastShown).toDateString();
        const today = new Date().toDateString();
        if (lastDate === today) {
          console.log('⏭️ Setting ad already shown today');
          return false;
        }
      }
    }

    // 3 = every time (no check needed)

    let adToShow: InterstitialAd | null = null;
    let adType = '';

    if (this.isFloorInterstitialLoaded && this.floorInterstitialAd) {
      adToShow = this.floorInterstitialAd;
      adType = 'floor';
    } else if (this.isSettingInterstitialLoaded && this.settingInterstitialAd) {
      adToShow = this.settingInterstitialAd;
      adType = 'setting';
    }

    if (!adToShow) {
      console.log('No setting ad loaded');
      return false;
    }

    try {
      this.isShowingAd = true;
      await adToShow.show();
      logAnalyticsEvent('ad_shown', {
        ad_type: adType,
        screen: 'setting_screen',
      });

      // Update cooldown
      this.recentAdShown = {
        screenName: 'setting_screen',
        timestamp: Date.now()
      };

      // Save based on frequency
      if (frequency === 1) {
        await AsyncStorage.setItem(this.SETTING_AD_SHOWN_KEY, 'true');
      }
      if (frequency === 2) {
        await AsyncStorage.setItem(this.SETTING_AD_LAST_SHOWN_KEY, new Date().toISOString());
      }

      console.log(`Setting screen ${actionType} ad shown (${adType})`);
      return true;
    } catch (e) {
      console.log(`Setting ${actionType} ad failed`, e);
      this.isShowingAd = false;
      return false;
    }
  }

  // ==================== DETAIL SCREEN ADS (Note, Challenge, Memo, Diary back button) ====================
  async showDetailScreenInterstitialAd(screenName: string): Promise<boolean> {
    console.log(`Attempting Detail Screen Ad for: ${screenName}`);

    if (await this.isUserPremium()) {
      console.log('👑 Premium user — skipping detail ad');
      return false;
    }

    if (this.isShowingAd) {
      console.log('Already showing an ad');
      return false;
    }

    if (this.isAdInCooldown()) {
      console.log('Skipping ad due to cooldown');
      return false;
    }

    const detailConfig = this.config?.detail_screen;
    if (!detailConfig) {
      console.log('Detail screen config not found');
      return false;
    }

    const frequency = detailConfig.inter_ads_flag ?? 0;

    // 0 = no ads
    if (frequency === 0) {
      console.log('Detail screen ads disabled (flag = 0)');
      return false;
    }

    // 1 = once in lifetime
    if (frequency === 1) {
      const shown = await AsyncStorage.getItem(this.DETAIL_AD_SHOWN_KEY);
      if (shown) {
        console.log('Detail ad already shown (lifetime)');
        return false;
      }
    }

    // 2 = once in a day
    if (frequency === 2) {
      const lastShown = await AsyncStorage.getItem(this.DETAIL_AD_LAST_SHOWN_KEY);
      if (lastShown) {
        const lastDate = new Date(lastShown).toDateString();
        const today = new Date().toDateString();
        if (lastDate === today) {
          console.log('Detail ad already shown today');
          return false;
        }
      }
    }

    // 3 = every time (no check needed)

    // Priority: floor_inter > detail_inter
    let adToShow: InterstitialAd | null = null;
    let adType = '';

    if (this.isFloorInterstitialLoaded && this.floorInterstitialAd) {
      adToShow = this.floorInterstitialAd;
      adType = 'floor';
    } else if (this.isDetailInterstitialLoaded && this.detailInterstitialAd) {
      adToShow = this.detailInterstitialAd;
      adType = 'detail';
    }

    if (!adToShow) {
      console.log('No detail ad loaded');
      return false;
    }

    try {
      this.isShowingAd = true;
      await adToShow.show();

      logAnalyticsEvent('ad_shown', {
        ad_type: adType,
        screen: 'detail_screen',
      });


      // Update cooldown
      this.recentAdShown = {
        screenName: screenName,
        timestamp: Date.now()
      };

      // Save based on frequency
      if (frequency === 1) {
        await AsyncStorage.setItem(this.DETAIL_AD_SHOWN_KEY, 'true');
      }
      if (frequency === 2) {
        await AsyncStorage.setItem(this.DETAIL_AD_LAST_SHOWN_KEY, new Date().toISOString());
      }

      console.log(`Detail screen ad shown for ${screenName} (${adType})`);
      return true;
    } catch (e) {
      console.log('Detail ad failed', e);
      this.isShowingAd = false;
      return false;
    }
  }

  // ==================== Note SCREEN ADS (Note, Challenge, Memo, Diary save/back button) ====================
  async showNoteScreenInterstitialAd(screenName: string, actionType: 'save' | 'back'): Promise<boolean> {
    console.log(`Attempting Note Screen ${actionType} Ad for: ${screenName}`);
    if (await this.isUserPremium()) {
      console.log('👑 Premium user — skipping note ad');
      return false;
    }
    if (this.isShowingAd) {
      console.log('Already showing an ad');
      return false;
    }

    if (this.isAdInCooldown()) {
      console.log('Skipping ad due to cooldown');
      return false;
    }

    const noteConfig = this.config?.note_screen;
    if (!noteConfig) {
      console.log('Note screen config not found');
      return false;
    }

    const frequency = noteConfig.inter_ads_flag ?? 0;

    // 0 = no ads
    if (frequency === 0) {
      console.log('Note screen ads disabled (flag = 0)');
      return false;
    }
    // 1 = once in lifetime
    if (frequency === 1) {
      const shown = await AsyncStorage.getItem(this.NOTE_AD_SHOWN_KEY);
      if (shown) {
        console.log('Note ad already shown (lifetime)');
        return false;
      }
    }
    // 2 = once in a day
    if (frequency === 2) {
      const lastShown = await AsyncStorage.getItem(this.NOTE_AD_LAST_SHOWN_KEY);
      if (lastShown) {
        const lastDate = new Date(lastShown).toDateString();
        const today = new Date().toDateString();
        if (lastDate === today) {
          console.log('Note ad already shown today');
          return false;
        }
      }
    }
    // 3 = every time (no check needed)
    // Priority: floor_inter > Note_inter
    let adToShow: InterstitialAd | null = null;
    let adType = '';

    if (this.isFloorInterstitialLoaded && this.floorInterstitialAd) {
      adToShow = this.floorInterstitialAd;
      adType = 'floor';
    } else if (this.isNoteInterstitialLoaded && this.NoteInterstitialAd) {
      adToShow = this.NoteInterstitialAd;
      adType = 'note';
    }

    if (!adToShow) {
      console.log('No Note ad loaded');
      return false;
    }

    try {
      this.isShowingAd = true;
      await adToShow.show();
      logAnalyticsEvent('ad_shown', {
        ad_type: adType,
        screen: `note_screen_${actionType}`,
      });

      // Update cooldown
      this.recentAdShown = {
        screenName: screenName,
        timestamp: Date.now()
      };

      // Save based on frequency
      if (frequency === 1) {
        await AsyncStorage.setItem(this.NOTE_AD_SHOWN_KEY, 'true');
      }
      if (frequency === 2) {
        await AsyncStorage.setItem(this.NOTE_AD_LAST_SHOWN_KEY, new Date().toISOString());
      }

      console.log(`Note screen ${actionType} ad shown for ${screenName} (${adType})`);
      return true;
    } catch (e) {
      console.log(`Note ${actionType} ad failed`, e);
      this.isShowingAd = false;
      return false;
    }
  }

  // ==================== BANNER AD CONFIG ====================
  // getBannerConfig(screen: 'main' | 'language' | 'setting' | 'note'): { show: boolean; id: string } | null {
  async getBannerConfig(screen: 'main' | 'language' | 'setting' | 'note'): Promise<{ show: boolean; id: string } | null> {

    if (await this.isUserPremium()) {
      console.log('👑 Premium user — no banner');
      return null;
    }

    const screenKey = `${screen}_screen` as keyof AdConfig;
    const screenConfig = this.config?.[screenKey];

    if (!screenConfig || typeof screenConfig !== 'object') {
      return null;
    }

    if ('ad_flag' in screenConfig && 'baner_id' in screenConfig) {
      const config = screenConfig as { ad_flag: number; baner_id: string };

      // ad_flag: 0 = no banner, 1 = show banner
      if (config.ad_flag === 1 && config.baner_id && config.baner_id.trim() !== '') {
        return {
          show: true,
          id: this.getAdUnitId(config.baner_id),
        };
      }
    }

    return null;
  }

  // ==================== SESSION MANAGEMENT ====================
  clearSessionData() {
    this.sessionAdsShown.clear();
    this.recentAdShown = null;
    console.log('Session data cleared');
  }

  resetAdState() {
    this.isShowingAd = false;
    console.log('Ad state reset');
  }

  // ==================== INITIALIZATION ====================
  async initializeAds() {
    console.log('🚀 Initializing Ads...');

    const configLoaded = await this.loadConfigFromFirebase();

    if (!configLoaded) {
      console.log('Failed to load Firebase config');
      return;
    }
    console.log('Config loaded successfully');
    await this.loadFloorInterstitialAd();

    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!this.isFloorInterstitialLoaded) {
      console.log('Floor interstitial not available, loading other interstitials');
      this.loadLanguageInterstitialAd();
      this.loadSettingInterstitialAd();
      this.loadDetailInterstitialAd();
      this.loadNoteInterstitialAd();
    } else {
      console.log('Floor interstitial loaded, other interstitials will use it');
    }

    // 3. Always load App Resume Ad (independent of floor_inter)
    await this.loadAppResumeInterstitialAd();

    await this.loadReviewInterstitialAd();

  }

  async initializeAdsWithoutFloorInter() {
    console.log('🚀 Initializing Ads (WITHOUT floor_inter)...');

    const configLoaded = await this.loadConfigFromFirebase();

    if (!configLoaded) {
      console.log('Failed to load Firebase config');
      return;
    }

    console.log('Config loaded successfully');

    console.log('Skipping floor_inter, loading screen-specific interstitials');
    this.loadLanguageInterstitialAd();
    this.loadSettingInterstitialAd();
    this.loadDetailInterstitialAd();
    this.loadNoteInterstitialAd();

    await this.loadAppResumeInterstitialAd();
    await this.loadReviewInterstitialAd();

  }

  getConfig() {
    return this.config;
  }
}

export default AdsManager.getInstance();