import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function PurchaseSuccessScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const btnSlide = useRef(new Animated.Value(30)).current;
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    setTimeout(() => lottieRef.current?.play(), 200);

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.timing(btnSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" />

      {/* Sheet Container */}
      <View style={styles.sheet}>
        {/* iOS style pill handle */}
        <View style={styles.handle} />

        {/* Lottie Animation */}
        <View style={styles.lottieWrap}>
          <LottieView
            ref={lottieRef}
            source={require('../assets/animations/success.json')}
            autoPlay
            loop={false}
            style={{ width: 180, height: 180 }}
          />
        </View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Title Row */}
          <View style={styles.titleRow}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
            <Text style={styles.title}>Purchase Successful!</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Features list */}
          {[
            { icon: 'ban-outline', text: 'All ads removed' },
            { icon: 'diamond-outline', text: 'Premium features unlocked' },
            { icon: 'infinite-outline', text: 'Unlimited notes & access' },
          ].map((item, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Ionicons name={item.icon as any} size={16} color="#faab00" />
              </View>
              <Text style={styles.featureText}>{item.text}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
            </View>
          ))}
          <Text style={styles.subtitle}>
            Welcome to Premium! Enjoy an ad-free experience.
          </Text>
        </Animated.View>

        {/* Button */}
        <Animated.View style={[styles.btnWrap, { transform: [{ translateY: btnSlide }] }]}>
          <TouchableOpacity
            style={styles.btn}
            activeOpacity={0.85}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="home" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnText}>Go to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    paddingTop: 12,
    minHeight: height * 0.55,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 100,
    marginBottom: 20,
    alignSelf: 'center',
  },
  lottieWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 20,
  },
  btnWrap: {
    width: '100%',
    marginTop: 16,
  },
  btn: {
    backgroundColor: '#faab00',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});