import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { NotificationManager } from '@/services/notificationManager';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { default as React, useEffect, useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';

import { Linking, ScrollView, Share, TouchableOpacity } from 'react-native';
import { globalStyles } from '../../contexts/global';

export default function SettingsScreen() {
  const { isDarkMode, themeMode } = useTheme();
  const { colors } = useTheme();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    NotificationManager.isEnabled().then(setNotificationEnabled);
  }, []);

  const handleRateUs = async () => {
    const url = "https://apps.apple.com/app/UltraNotes/id6759310867";

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log("Cannot open App Store");
    }
  };

  const handleThemePress = () => {
    router.push('/Themeselectionscreen');
  };

  const handleLanguagePress = () => {
    router.push('/Languageselectionscreen');
  };

  const handlePrivacyPolicy = async () => {
    const url = 'https://altranotes.blogspot.com/';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log('Cannot open URL:', url);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out this amazing app!',
        url: 'https://apps.apple.com/app/UltraNotes/id6759310867',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'Light':
        return t('home.light');
      case 'Dark':
        return t('home.dark');
      case 'System':
        return t('home.system');
      default:
        return t('home.light');
    }
  };

  const languageNames: any = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    pt: 'Português',
    ru: 'Русский',
    ko: '한국어',
    de: 'Deutsch',
    it: 'Italiano',
    ja: '日本語',
    id: 'Indonesia',
    zh: '中文',
    hi: 'हिंदी',
  };
  
  return (
    <SafeAreaView style={[globalStyles.container, isDarkMode && globalStyles.darkContainer]}>
      <View style={globalStyles.header}>
        <View style={globalStyles.headerLeft}>
          <Text style={[globalStyles.headerTitle, { color: colors.textPrimary }]}>{t('home.settings')}</Text>
        </View>
        <View style={[globalStyles.headerRight]}>
          <View style={[globalStyles.iconPill, { backgroundColor: colors.cardBackground }, { borderColor: colors.border }]}>
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

      <ScrollView style={globalStyles.content} showsVerticalScrollIndicator={false}>
        {/* Personalization Section */}
        <View style={globalStyles.section}>
          <Text style={[globalStyles.sectionTitle, isDarkMode && globalStyles.darkText]}>
            {t('home.personalization')}
          </Text>

          {/* Language */}
          <View style={[globalStyles.settingCard, isDarkMode && globalStyles.darkCard]}>
            <TouchableOpacity
              style={globalStyles.settingRow}
              onPress={handleLanguagePress}
              activeOpacity={0.6}
            >
              <View style={globalStyles.settingLeft}>
                <View style={[globalStyles.iconContainer, { backgroundColor: '#6200EE15' }]}>
                  <Ionicons name="language" size={22} color="#6200EE" />
                </View>
                <View>
                  <Text style={[globalStyles.settingTitle, isDarkMode && globalStyles.darkText]}>
                    {t('home.language')}
                  </Text>
                  <Text style={[globalStyles.settingSubtitle, isDarkMode && globalStyles.darkSubtitle]}>
                    {languageNames[locale]}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* App Theme */}
          <View style={[globalStyles.settingCard, isDarkMode && globalStyles.darkCard, { marginTop: 12 }]}>
            <TouchableOpacity
              style={globalStyles.settingRow}
              onPress={handleThemePress}
              activeOpacity={0.6}
            >
              <View style={globalStyles.settingLeft}>
                <View style={[globalStyles.iconContainer, { backgroundColor: '#FF6F0015' }]}>
                  <Ionicons
                    name={isDarkMode ? "moon" : "sunny"}
                    size={22}
                    color="#FF6F00"
                  />
                </View>
                <View>
                  <Text style={[globalStyles.settingTitle, isDarkMode && globalStyles.darkText]}>
                    {t('home.theme')}
                  </Text>
                  <Text style={[globalStyles.settingSubtitle, isDarkMode && globalStyles.darkSubtitle]}>
                    {getThemeLabel()}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

        </View>
        {/* Notifications Section */}
        <View style={globalStyles.section}>
          <Text style={[globalStyles.sectionTitle, isDarkMode && globalStyles.darkText]}>
            {t('home.Notifications')}
          </Text>

          <View style={[globalStyles.settingCard, isDarkMode && globalStyles.darkCard]}>
            <TouchableOpacity
              style={globalStyles.settingRow}
              activeOpacity={1}
              onPress={() => router.push('/NotificationScreen')}
            >
              <View style={globalStyles.settingLeft}>
                <View style={[globalStyles.iconContainer, { backgroundColor: '#FF9F0A15' }]}>
                  <Ionicons name="notifications" size={22} color="#FF9F0A" />
                </View>
                <View>
                  <Text style={[globalStyles.settingTitle, isDarkMode && globalStyles.darkText]}>
                    {t('home.Notifications')}
                  </Text>
                  <Text style={[globalStyles.settingSubtitle, isDarkMode && globalStyles.darkSubtitle]}>
                    {notificationEnabled ? t('home.reminderone') : t('home.reminderoff')}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}

        <View style={globalStyles.section}>
          <Text style={[globalStyles.sectionTitle, isDarkMode && globalStyles.darkText]}>
            {t('home.about')}
          </Text>

          <View style={[globalStyles.settingCard, isDarkMode && globalStyles.darkCard]}>
            <TouchableOpacity style={globalStyles.settingRow} activeOpacity={0.6} onPress={handlePrivacyPolicy}>
              <View style={globalStyles.settingLeft}>
                <View style={[globalStyles.iconContainer, { backgroundColor: '#00BCD415' }]}>
                  <Ionicons name="shield-checkmark" size={22} color="#4CAF50" />
                </View>
                <Text style={[globalStyles.settingTitle, isDarkMode && globalStyles.darkText]}>
                  {t('home.privacypolicy')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={[globalStyles.settingCard, isDarkMode && globalStyles.darkCard, { marginTop: 12 }]}>
            <TouchableOpacity
              style={globalStyles.settingRow}
              activeOpacity={0.6}
              onPress={handleRateUs}
            >
              <View style={globalStyles.settingLeft}>
                <View style={[globalStyles.iconContainer, { backgroundColor: '#00BCD415' }]}>
                  <Ionicons name="star" size={22} color="#FFC107" />
                </View>
                <Text style={[globalStyles.settingTitle, isDarkMode && globalStyles.darkText]}>
                  {t('home.rateus')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={[globalStyles.settingCard, isDarkMode && globalStyles.darkCard, { marginTop: 12 }]}>
            <TouchableOpacity style={globalStyles.settingRow} activeOpacity={0.6} onPress={handleShareApp}>
              <View style={globalStyles.settingLeft}>
                <View style={[globalStyles.iconContainer, { backgroundColor: '#00BCD415' }]}>
                  <Ionicons name="share-social" size={22} color="#2196F3" />
                </View>
                <Text style={[globalStyles.settingTitle, isDarkMode && globalStyles.darkText]}>
                  {t('home.share')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={[globalStyles.settingCard, isDarkMode && globalStyles.darkCard, { marginTop: 12 }]}>
            <TouchableOpacity style={globalStyles.settingRow} activeOpacity={0.6}>
              <View style={globalStyles.settingLeft}>
                <View style={[globalStyles.iconContainer, { backgroundColor: '#00BCD415' }]}>
                  <Ionicons name="information-circle" size={22} color="#00BCD4" />
                </View>
                <Text style={[globalStyles.settingTitle, isDarkMode && globalStyles.darkText]}>
                  {t('home.appversion')}
                </Text>
              </View>
              <Text style={[globalStyles.versionText, isDarkMode && globalStyles.darkSubtitle]}>
                1.0.0
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={globalStyles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}
