import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import AdsManager from '@/services/adsManager';
import { Icon, Label } from 'expo-router/build/native-tabs/common/elements';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BannerAdSize, GAMBannerAd } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

let NativeTabs: any = null;
const PRIMARY = '#faab00';

try {
  NativeTabs = require('expo-router/unstable-native-tabs').NativeTabs;
} catch (_) { }

const NATIVE_TAB_BAR_HEIGHT = 55;

export default function TabLayout() {
  const { colors, isDarkMode } = useTheme();
  const { width, height } = useWindowDimensions();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const isPad = Platform.OS === 'ios' && Math.min(width, height) >= 768;

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
  const nativeTabBarTotalHeight = NATIVE_TAB_BAR_HEIGHT + insets.bottom;

  if (Platform.OS === 'ios' && NativeTabs) {
    return (
      <View style={{ flex: 1 }}>
        <NativeTabs style={[styles.menu, { marginBottom: 30 }]}>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.TabBar iconColor={colors.textSecondary} />
            <Icon sf="doc.text.fill" selectedColor={PRIMARY} />
            <Label selectedStyle={{ color: PRIMARY }}>{t('home.title')}</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="calendar">
            <NativeTabs.Trigger.TabBar iconColor={colors.textSecondary} />
            <Icon sf="calendar" selectedColor={PRIMARY} />
            <Label selectedStyle={{ color: PRIMARY }}>{t('home.calendar')}</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="coach">
            <NativeTabs.Trigger.TabBar iconColor={colors.textSecondary} />
            <Icon sf="lightbulb" selectedColor={PRIMARY} />
            <Label selectedStyle={{ color: PRIMARY }}>{t('home.Coach')}</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="settings" iconColor={{ default: 'gray', selected: 'blue' }}>
            <NativeTabs.Trigger.TabBar iconColor={colors.textSecondary} />
            <Icon sf="gear" selectedColor={PRIMARY} />
            <Label selectedStyle={{ color: PRIMARY }}>{t('home.settings')}</Label>
          </NativeTabs.Trigger>
        </NativeTabs>

        {showAd && (
          <View
            style={[
              styles.stickyAdContainer,
              { bottom: nativeTabBarTotalHeight },
            ]}
            onLayout={(e) => setAdHeight(e.nativeEvent.layout.height)}
          >
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
}

const styles = StyleSheet.create({
  stickyAdContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  menu: {}
});