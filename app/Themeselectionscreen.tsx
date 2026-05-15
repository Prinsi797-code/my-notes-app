import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import AdsManager from '@/services/adsManager';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  BannerAdSize,
  GAMBannerAd
} from 'react-native-google-mobile-ads';
import { globalStyles } from '../contexts/global';

type ThemeMode = 'Light' | 'Dark' | 'System';

export default function ThemeSelectionScreen() {
  const { colors, themeMode: currentTheme, setThemeMode } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(currentTheme);
  const { t } = useLanguage();
  const [isAdLoading, setIsAdLoading] = useState(false);

  useEffect(() => {
    setSelectedTheme(currentTheme);
  }, [currentTheme]);

  const handleGoBack = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    await AdsManager.showSettingScreenInterstitialAd('setting_screen', 'back');
    try {
      console.log('Theme back pressed — attempting ad...');
      await AdsManager.showSettingScreenInterstitialAd('back');
    } catch (error) {
      console.log('Theme back ad error:', error);
    } finally {
      setIsAdLoading(false);
      router.back();
      await AdsManager.showSettingScreenInterstitialAd('setting_screen', 'back');
    }
  };

  const [bannerConfig, setBannerConfig] = useState<{ show: boolean; id: string } | null>(null);
  useEffect(() => {
    const loadBannerConfig = async () => {
      const config = await AdsManager.getBannerConfig('setting');
      if (config) setBannerConfig(config);
    };
    loadBannerConfig();
  }, []);

  const handleSave = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    try {
      await setThemeMode(selectedTheme);
      console.log('Theme save pressed — attempting ad...');
      await AdsManager.showSettingScreenInterstitialAd('save');
    } catch (error) {
      console.log('Theme save ad error:', error);
    } finally {
      setIsAdLoading(false);
      router.back();
    }
  };

  const handleThemeSelect = (theme: ThemeMode) => {
    setSelectedTheme(theme);
  };

  const themes: { mode: ThemeMode; icon: string }[] = [
    { mode: 'Light', icon: 'sunny' },
    { mode: 'Dark', icon: 'moon' },
    { mode: 'System', icon: 'phone-portrait' },
  ];

  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: colors.cardBackground, flex: 1 }]}>
      {/* Header */}
      <View style={[globalStyles.themeheader,]}>
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
          {t('home.selecttheme')}
        </Text>

        {/* <View style={{ flex: 1 }} /> */}

        {/* <TouchableOpacity
          onPress={handleSave}
          disabled={isAdLoading}
          style={[globalStyles.saveButton, { backgroundColor: colors.primary }]}
        >
          {isAdLoading
            ? <Text style={[globalStyles.themesaveButtonText, { color: isAdLoading ? colors.textSecondary : colors.primary }]}>...</Text>
            : <Ionicons name="checkmark" size={20} color="#fff" />
          }
        </TouchableOpacity> */}
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

      {/* Mode Label */}
      <View style={[globalStyles.themecontent, { flex: 1 }]}>
        <Text style={[globalStyles.modeLabel, { color: colors.textSecondary }]}>
          {t('home.mode')}
        </Text>

        {/* Theme Cards Grid */}
        <View style={globalStyles.themeGrid}>
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.mode}
              style={[
                globalStyles.themeCard,
                {
                  backgroundColor: colors.background,
                  borderColor: selectedTheme === theme.mode ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => handleThemeSelect(theme.mode)}
              activeOpacity={0.7}
              disabled={isAdLoading}
            >
              {/* Preview Container */}
              <View style={globalStyles.previewContainer}>
                {theme.mode === 'Light' && (
                  <View style={globalStyles.lightPreview}>
                    <View style={globalStyles.previewHeader} />
                    <View style={globalStyles.previewContent}>
                      <View style={globalStyles.previewLine} />
                      <View style={[globalStyles.previewLine, { width: '80%' }]} />
                      <View style={[globalStyles.previewLine, { width: '60%' }]} />
                    </View>
                    <View style={globalStyles.previewIcon}>
                      <Ionicons name="sunny" size={20} color="#FFA000" />
                    </View>
                  </View>
                )}
                {theme.mode === 'Dark' && (
                  <View style={globalStyles.darkPreview}>
                    <View style={globalStyles.previewHeaderDark} />
                    <View style={globalStyles.previewContent}>
                      <View style={globalStyles.previewLineDark} />
                      <View style={[globalStyles.previewLineDark, { width: '80%' }]} />
                      <View style={[globalStyles.previewLineDark, { width: '60%' }]} />
                    </View>
                    <View style={globalStyles.previewIcon}>
                      <Ionicons name="moon" size={20} color="#FFA000" />
                    </View>
                  </View>
                )}
                {theme.mode === 'System' && (
                  <View style={globalStyles.systemPreview}>
                    <View style={globalStyles.systemPreviewLeft}>
                      <View style={globalStyles.previewHeader} />
                      <View style={globalStyles.previewContent}>
                        <View style={globalStyles.previewLine} />
                        <View style={[globalStyles.previewLine, { width: '70%' }]} />
                      </View>
                    </View>
                    <View style={globalStyles.systemPreviewRight}>
                      <View style={globalStyles.previewHeaderDark} />
                      <View style={globalStyles.previewContent}>
                        <View style={globalStyles.previewLineDark} />
                        <View style={[globalStyles.previewLineDark, { width: '70%' }]} />
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Theme Label */}
              <Text style={[globalStyles.themeLabel, { color: colors.textPrimary }]}>
                {t(`home.${theme.mode.toLowerCase()}`) || theme.mode}
              </Text>

              {/* Radio Button */}
              <View style={globalStyles.radioContainer}>
                <View
                  style={[
                    globalStyles.themeradioOuter,
                    { borderColor: selectedTheme === theme.mode ? colors.primary : colors.border },
                  ]}
                >
                  {selectedTheme === theme.mode && (
                    <View style={[globalStyles.themeradioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {bannerConfig?.show && (
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            backgroundColor: colors.cardBackground,
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