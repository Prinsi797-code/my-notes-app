import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { scheduleRenewalNotifications, scheduleTestNotifications } from '@/services/renewalNotificationManager';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from 'expo-iap';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from 'react-native';

import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { globalStyles } from '../contexts/global';
import PurchaseManager, { SUBSCRIPTION_SKUS } from '../services/purchaseManager';

const { width } = Dimensions.get('window');
type PlanKey = 'yearly' | 'weekly' | 'monthly';

interface Plan {
  key: PlanKey;
  sku: string;
  label: string;
  fallbackPrice: string;
  sub: string;
  badge?: string;
  badgeColor?: string;
  discount: string;
  discountLabel: string;
  highlight: boolean;
}

const getExpiryDate = (planKey: PlanKey): Date => {
  const now = new Date();
  if (planKey === 'weekly') {
    now.setDate(now.getDate() + 7);
  } else if (planKey === 'monthly') {
    now.setMonth(now.getMonth() + 1);
  } else if (planKey === 'yearly') {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now;
};

const PLANS: Plan[] = [
  {
    key: 'yearly',
    sku: SUBSCRIPTION_SKUS.yearly,
    label: 'Yearly',
    fallbackPrice: '₹₹14,900',
    sub: 'Best annual deal',
    badge: 'Best value',
    badgeColor: '#faab00',
    discount: '80% OFF',
    discountLabel: '',
    highlight: true,
  },
  {
    key: 'monthly',
    sku: SUBSCRIPTION_SKUS.monthly,
    label: 'Monthly',
    fallbackPrice: '₹1,999',
    sub: 'Per month',
    discount: '76% OFF',
    discountLabel: 'Recommend',
    highlight: true,
  },
  {
    key: 'weekly',
    sku: SUBSCRIPTION_SKUS.weekly,
    label: 'Weekly',
    fallbackPrice: '₹599',
    sub: 'Per week',
    discount: '39% OFF',
    discountLabel: 'Most Popular',
    highlight: true,
  },
];

export default function PremiumScreen() {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('yearly');
  const [products, setProducts] = useState<Record<string, Subscription>>({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const trialScaleAnim = useRef(new Animated.Value(1)).current;
  const [activePlanKey, setActivePlanKey] = useState<PlanKey | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const bg = isDarkMode ? '#0D0D0D' : '#ffffff';
  const cardBg = isDarkMode ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#1A1A1A';
  const textSecondary = isDarkMode ? '#AAAAAA' : '#666666';
  const accent = '#faab00';
  const activeGreen = '#22c55e';

  useEffect(() => {
    initAndLoad();
    return () => { };
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(trialScaleAnim, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(trialScaleAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  // ProductId se PlanKey detect karo (calendar app logic)
  const getPlanKeyFromProductId = (productId: string): PlanKey | null => {
    if (productId.includes('yearly')) return 'yearly';
    if (productId.includes('monthly')) return 'monthly';
    if (productId.includes('weekly')) return 'weekly';
    return null;
  };

  const handleTestNotification = async () => {
    await scheduleTestNotifications(selectedPlan);
    Alert.alert('✅ Test Scheduled!', `${selectedPlan} plan ki notifications 10-30 seconds mein aayengi.\n\nApp background mein le jao!`);
  };

  const initAndLoad = async () => {
    try {
      setLoading(true);
      await PurchaseManager.initialize();

      PurchaseManager.setCallbacks(
        async (productId) => {
          setPurchasing(false);
          const key = getPlanKeyFromProductId(productId);
          if (key) {
            setActivePlanKey(key);
            const expiry = getExpiryDate(key);
            await scheduleRenewalNotifications(key, expiry);
          }
          setShowSuccessModal(true); // ← router.replace hata ke yeh karo
          // router.replace('/Purchasesuccessscreen');
        },
        (error) => {
          setPurchasing(false);
          Alert.alert('Purchase Failed', error || 'Something went wrong.');
        }
      );

      const subs = await PurchaseManager.getSubscriptionProducts();
      const map: Record<string, Subscription> = {};
      subs.forEach((s) => { map[s.productId] = s; });
      setProducts(map);

      // Calendar app jaisa: getPremiumInfo se seedha check karo
      const premiumInfo = await PurchaseManager.getPremiumInfo();
      if (premiumInfo.isPremium && premiumInfo.productId) {
        const key = getPlanKeyFromProductId(premiumInfo.productId);
        if (key) setActivePlanKey(key);
      } else {
        // Local mein nahi mila toh App Store se restore karo
        const restored = await PurchaseManager.checkAndRestorePremium();
        if (restored) {
          const activeSku = await PurchaseManager.getActivePurchasedSku();
          if (activeSku) {
            const key = getPlanKeyFromProductId(activeSku);
            if (key) setActivePlanKey(key);
          }
        }
      }
    } catch (err) {
      console.log('initAndLoad error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriceForPlan = (plan: Plan): string => {
    const p = products[plan.sku];
    return (p as any)?.localizedPrice ?? (p as any)?.price ?? plan.fallbackPrice;
  };

  const handleSubscribe = useCallback(async () => {
    const selected = PLANS.find((p) => p.key === selectedPlan);
    if (!selected) return;

    // Already active plan pe click kiya toh purchase mat karo
    if (activePlanKey === selectedPlan) {
      Alert.alert('Already Active', `You already have the ${selected.label} plan active.`);
      return;
    }

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    setPurchasing(true);
    try {
      await PurchaseManager.purchaseSubscription(selected.sku);
    } catch {
      setPurchasing(false);
    }
  }, [selectedPlan, scaleAnim, activePlanKey]);

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await PurchaseManager.checkAndRestorePremium();
      if (restored) {
        const premiumInfo = await PurchaseManager.getPremiumInfo();
        if (premiumInfo.productId) {
          const key = getPlanKeyFromProductId(premiumInfo.productId);
          if (key) {
            setActivePlanKey(key);
            const expiry = getExpiryDate(key);
            await scheduleRenewalNotifications(key, expiry);
          }
        }
        Alert.alert('✅ Restored!', 'Premium has been restored.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Not Found', 'No active subscription found.');
      }
    } catch {
      Alert.alert('Error', 'Could not restore. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  // Button label — calendar app jaisa
  const getButtonLabel = (): string => {
    if (purchasing) return 'Processing...';
    if (activePlanKey === selectedPlan) return 'Current Plan';
    if (activePlanKey && activePlanKey !== selectedPlan) return 'Switch Plan';
    return 'Subscribe Now';
  };

  const getButtonColor = (): string => {
    if (activePlanKey === selectedPlan) return activeGreen;
    return accent;
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={globalStyles.scroll}
        bounces={false}
        overScrollMode="never"
      >
        {/* Hero */}
        <View style={globalStyles.heroSection}>
          <Image
            source={
              isDarkMode
                ? require('../assets/images/Frame4.png')
                : require('../assets/images/Frame3.png')
            }
            style={globalStyles.heroImage}
            resizeMode="cover"
          />

          <TouchableOpacity onPress={() => router.back()} style={globalStyles.closeBtn}>
            <View
              style={[
                globalStyles.closeBtnCircle,
                {
                  backgroundColor: isDarkMode
                    ? 'rgba(68, 68, 68, 0.85)'
                    : 'rgba(232, 232, 232, 0.88)',
                },
              ]}
            >
              <Ionicons name="close" size={28} color={textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={globalStyles.titleOverlay}>
            <Text style={[globalStyles.titleOverlayText, { color: isDarkMode ? '#ffffff9b' : '#383838bd' }]}>
              {t('home.removeads')}
            </Text>
          </View>
        </View>

        {loading && (
          <View style={globalStyles.loadingRow}>
            <ActivityIndicator color={accent} />
            <Text style={[globalStyles.loadingText, { color: textSecondary }]}>Loading plans...</Text>
          </View>
        )}

        {/* Plans */}
        <View style={globalStyles.plansContainer}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.key;
            const isActive = activePlanKey === plan.key;

            return (
              <TouchableOpacity
                key={plan.key}
                activeOpacity={0.8}
                onPress={() => setSelectedPlan(plan.key)}
                style={[globalStyles.planCard, {
                  backgroundColor: isActive
                    ? (isDarkMode ? '#0D2010' : '#F0FFF4')
                    : isSelected
                      ? (isDarkMode ? '#2A1A1A' : '#fffaf0')
                      : cardBg,
                  borderColor: isActive
                    ? activeGreen
                    : isSelected
                      ? accent
                      : (isDarkMode ? '#333' : '#eeeeee'),
                  borderWidth: isActive || isSelected ? 2 : 1,
                }]}
              >
                {/* Badge */}
                {isActive ? (
                  <View style={[globalStyles.badge, { backgroundColor: activeGreen }]}>
                    <Text style={globalStyles.badgeText}>✓ Active</Text>
                  </View>
                ) : plan.badge ? (
                  <View style={[globalStyles.badge, { backgroundColor: plan.badgeColor }]}>
                    <Text style={globalStyles.badgeText}>{plan.badge}</Text>
                  </View>
                ) : null}

                <View style={globalStyles.planRow}>
                  {/* Radio */}
                  <View style={[globalStyles.radio, {
                    borderColor: isActive
                      ? activeGreen
                      : isSelected
                        ? accent
                        : (isDarkMode ? '#555' : '#CCC'),
                    backgroundColor: isActive ? activeGreen : 'transparent',
                  }]}>
                    {isActive ? (
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    ) : isSelected ? (
                      <View style={[globalStyles.radioDot, { backgroundColor: accent }]} />
                    ) : null}
                  </View>

                  <View style={globalStyles.planInfo}>
                    <Text style={[globalStyles.planLabel, { color: textPrimary }]}>
                      {plan.label} : {getPriceForPlan(plan)}
                    </Text>
                    {/* Active plan pe "Your current plan" dikhao */}
                    <Text style={[globalStyles.planSub, {
                      color: isActive ? activeGreen : textSecondary,
                      fontWeight: isActive ? '600' : 'normal',
                    }]}>
                      {isActive ? '🟢 Your current plan' : plan.sub}
                    </Text>
                  </View>

                  <View style={globalStyles.discountBox}>
                    {isActive ? (
                      <Ionicons name="checkmark-circle" size={28} color={activeGreen} />
                    ) : plan.highlight ? (
                      <>
                        <View style={[globalStyles.discountPill, { backgroundColor: accent }]}>
                          <Text style={globalStyles.discountPillText}>{plan.discount}</Text>
                        </View>
                        <Animated.View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 5,
                          backgroundColor: '#e8f5e9dd',
                          paddingHorizontal: 7,
                          paddingVertical: 3,
                          borderRadius: 10,
                          transform: [{ scale: trialScaleAnim }],
                        }}>
                          <Ionicons name="gift-outline" size={10} color="#2E7D32" />
                          <Text style={{
                            fontSize: 12,
                            color: '#2E7D32',
                            fontWeight: '700',
                            marginLeft: 2,
                          }}>
                            3-Day Free
                          </Text>
                        </Animated.View>
                      </>
                    ) : (
                      <View style={globalStyles.discountTextBox}>
                        <Text style={[globalStyles.discountText, { color: textPrimary }]}>{plan.discount}</Text>
                        <Text style={[globalStyles.discountLabel, { color: textSecondary }]}>{plan.discountLabel}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subscribe / Switch / Current Plan Button */}
        <Animated.View style={[globalStyles.subscribeWrap, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[globalStyles.subscribeBtn, {
              backgroundColor: getButtonColor(),
              opacity: purchasing || loading ? 0.7 : 1,
            }]}
            onPress={handleSubscribe}
            activeOpacity={0.9}
            disabled={purchasing || loading}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
            ) : activePlanKey === selectedPlan ? (
              <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 8 }} />
            ) : activePlanKey && activePlanKey !== selectedPlan ? (
              <Ionicons name="swap-horizontal" size={18} color="#FFF" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="diamond" size={18} color="#FFF" style={{ marginRight: 8 }} />
            )}
            <Text style={globalStyles.subscribeBtnText}>{getButtonLabel()}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Restore */}
        <TouchableOpacity onPress={handleRestore} disabled={restoring} style={globalStyles.restoreBtn}>
          {restoring
            ? <ActivityIndicator color={textSecondary} size="small" />
            : <Text style={[globalStyles.restoreText, { color: textSecondary }]}>{t('home.restorepurchase')}</Text>
          }
        </TouchableOpacity>

        {/* {__DEV__ && (
          <TouchableOpacity
            onPress={handleTestNotification}
            style={[globalStyles.restoreBtn, { marginTop: 8 }]}
          >
            <Text style={[globalStyles.restoreText, { color: '#faab00' }]}>
              🧪 Test Notification ({selectedPlan})
            </Text>
          </TouchableOpacity>
        )} */}

        {/* Footer */}
        <View style={globalStyles.footer}>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
            <Text style={[globalStyles.footerLink, { color: textSecondary }]}>{t('home.termsofuse')}</Text>
          </TouchableOpacity>
          <View style={[globalStyles.footerDivider, { backgroundColor: textSecondary }]} />
          <TouchableOpacity onPress={() => Linking.openURL('https://altranotes.blogspot.com/')}>
            <Text style={[globalStyles.footerLink, { color: textSecondary }]}>{t('home.privacypolicy')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}>
          <View style={{
            backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            width: '100%',
          }}>
            {/* Lottie */}
            <LottieView
              source={require('../assets/images/success.json')}
              autoPlay
              loop={false}
              style={{ width: 200, height: 200 }}
            />

            <Text style={{
              fontSize: 22, fontWeight: '800',
              color: isDarkMode ? '#FFFFFF' : '#1A1A1A',
              marginTop: 8, textAlign: 'center',
            }}>
              Purchase Successful! 🎉
            </Text>

            <Text style={{
              fontSize: 14,
              color: isDarkMode ? '#AAAAAA' : '#666666',
              marginTop: 8, textAlign: 'center', lineHeight: 20,
            }}>
              Welcome to Premium!{'\n'}
              Tap below to apply your benefits.
            </Text>

            <TouchableOpacity
              // onPress={async () => {
              //   setShowSuccessModal(false);
              //   const { isUserPremium: updatePremium } = require('./_layout');
              //   router.replace('/SplashScreen');
              // }}
              onPress={async () => {
                setShowSuccessModal(false);
                router.replace('/(tabs)');  // या '/SplashScreen' अगर splash चाहिए
              }}
              style={{
                backgroundColor: accent,
                borderRadius: 50,
                paddingVertical: 14,
                marginTop: 24,
                width: '100%',
                alignItems: 'center',
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>
                Go to Home 🏠
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}