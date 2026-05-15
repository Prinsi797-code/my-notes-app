import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import AdsManager from '@/services/adsManager';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAdSize, GAMBannerAd } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY = '#faab00';
const TAB_BAR_HEIGHT = 40;

export default function TabLayout() {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [bannerConfig, setBannerConfig] = useState<{ show: boolean; id: string } | null>(null);
  const [adHeight, setAdHeight] = useState(0);

  useEffect(() => {
    const loadBannerConfig = async () => {
      const config = await AdsManager.getBannerConfig('main');
      if (config) setBannerConfig(config);
    };
    loadBannerConfig();
  }, []);

  const showAd = bannerConfig?.show === true;

  const extraPadding = showAd ? adHeight : 0;
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom + extraPadding;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: PRIMARY,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.background ?? (isDarkMode ? '#1c1c1e' : '#ffffff'),
            borderTopColor: isDarkMode ? '#2c2c2e' : '#e0e0e0',
            height: tabBarHeight,
            paddingBottom: insets.bottom + extraPadding,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginBottom: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('home.title'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="calendar"
          options={{
            title: t('home.calendar'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="coach"
          options={{
            title: t('home.Coach'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bulb" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: t('home.settings'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {showAd && (
        <View
          style={styles.stickyAdContainer}
          onLayout={(e) => setAdHeight(e.nativeEvent.layout.height)}
        >
          <View
            style={[
              styles.separator,
              { backgroundColor: isDarkMode ? '#3a3a3c' : '#d1d1d6' },
            ]}
          />
          <GAMBannerAd
            unitId={bannerConfig!.id}
            sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stickyAdContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  separator: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    marginBottom: 2,
  },
});