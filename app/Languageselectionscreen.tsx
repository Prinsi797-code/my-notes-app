import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import AdsManager from '@/services/adsManager';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, Image, SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  BannerAdSize,
  GAMBannerAd
} from 'react-native-google-mobile-ads';
import { globalStyles } from '../contexts/global';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: any;
}

export default function LanguageSelectionScreen() {
  const { colors, isDarkMode } = useTheme();
  const { t, locale, changeLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [isAdLoading, setIsAdLoading] = useState(false);

  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: require('@/assets/flags/en.png') },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: require('@/assets/flags/es.png') },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: require('@/assets/flags/fr.png') },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: require('@/assets/flags/pt.png') },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: require('@/assets/flags/ru.png') },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: require('@/assets/flags/ko.png') },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: require('@/assets/flags/de.png') },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: require('@/assets/flags/it.png') },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: require('@/assets/flags/ja.png') },
    { code: 'id', name: 'Indonesian', nativeName: 'Indonesia', flag: require('@/assets/flags/id.png') },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: require('@/assets/flags/zh.png') },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: require('@/assets/flags/hi.png') },
  ];

  const [bannerConfig, setBannerConfig] = useState<{ show: boolean; id: string } | null>(null);
  useEffect(() => {
    const loadBannerConfig = async () => {
      const config = await AdsManager.getBannerConfig('setting');
      if (config) setBannerConfig(config);
    };
    loadBannerConfig();
  }, []);

  useEffect(() => {
    setSelectedLanguage(locale);
  }, [locale]);

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

  const handleSave = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    try {
      await changeLanguage(selectedLanguage);

      const successMsg = t('language.success') || 'Language changed successfully!';
      const successTitle = t('language.successTitle') || 'Success';

      // Step 2: Ad show karo
      console.log('💾 Language save pressed — attempting ad...');
      await AdsManager.showSettingScreenInterstitialAd('save');
    } catch {
      const errorMsg = t('language.error') || 'Failed to change language';
      const errorTitle = t('language.errorTitle') || 'Error';
      Alert.alert(errorTitle, errorMsg);
    } finally {
      setIsAdLoading(false);
      setTimeout(() => router.back(), 100);
    }
  };

  const handleLanguageSelect = (code: string) => setSelectedLanguage(code);

  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: colors.cardBackground }]}>

      {/* Header */}
      {/* <View style={[globalStyles.languageheader, {alignItems: 'center'}]}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={globalStyles.backButton}
          disabled={isAdLoading}
        >
          <View style={[globalStyles.closeBtnCircle, { backgroundColor: colors.background }]}>
            <Ionicons name="chevron-back" size={26} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <Text style={[globalStyles.languageheaderTitle, { color: colors.textPrimary }]}>
          {t('home.language')}
        </Text>

        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={handleSave}
          disabled={isAdLoading}
          style={[globalStyles.saveButton]}
        >
          {isAdLoading ? (
            <Text
              style={[
                globalStyles.themesaveButtonText,
                { color: colors.textSecondary }
              ]}
            >
              {t('home.save')}
            </Text>
          ) : (
            <Text
              style={[
                globalStyles.themesaveButtonText,
                { color: colors.primary }
              ]}
            >
              {t('home.save')}
            </Text>
          )}
        </TouchableOpacity>
      </View> */}
      <View style={[globalStyles.languageheader,]}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={globalStyles.backButton}
          disabled={isAdLoading}
        >
          <View style={[globalStyles.closeBtnCircle, { backgroundColor: colors.background }]}>
            <Ionicons name="chevron-back" size={26} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <Text style={[globalStyles.themeheaderTitle, { color: colors.textPrimary, alignItems: 'center' }]}>
          {t('home.language')}
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isAdLoading}
          style={[globalStyles.saveButton]}
        >
          {isAdLoading ? (
            <Text
              style={[
                globalStyles.themesaveButtonText,
                { color: colors.textSecondary }
              ]}
            >
             {t('home.save')}
            </Text>
          ) : (
            <Text
              style={[
                globalStyles.themesaveButtonText,
                { color: colors.primary }
              ]}
            >
              {t('home.save')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Language List */}
      <ScrollView style={globalStyles.languagecontent}>
        <View style={[
          globalStyles.languageList,
          {
            backgroundColor: colors.background,
            shadowColor: isDarkMode ? '#000' : '#aaa',
          }
        ]}>
          {languages.map((lang, index) => (
            <View key={lang.code}>
              <TouchableOpacity
                style={globalStyles.languageItem}
                onPress={() => handleLanguageSelect(lang.code)}
                activeOpacity={0.6}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Image
                    source={lang.flag}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      marginRight: 12,
                    }}
                  />
                  <View style={globalStyles.languageInfo}>
                    <Text style={[globalStyles.languageName, { color: colors.textPrimary }]}>
                      {lang.name}
                    </Text>
                    <Text style={[globalStyles.nativeName, { color: colors.textSecondary }]}>
                      {lang.nativeName}
                    </Text>
                  </View>
                </View>

                <View style={[
                  globalStyles.radioOuter,
                  { borderColor: selectedLanguage === lang.code ? colors.primary : colors.border }
                ]}>
                  {selectedLanguage === lang.code && (
                    <View style={[globalStyles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </TouchableOpacity>

              {index < languages.length - 1 && (
                <View style={[globalStyles.languagedivider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      {bannerConfig?.show && (
        <View
          style={{
            marginBottom: 0,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <GAMBannerAd
            unitId={bannerConfig.id}
            sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}