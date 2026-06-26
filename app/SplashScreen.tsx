import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  View
} from 'react-native';
import { globalStyles } from '../contexts/global';
import AdsManager from '../services/adsManager';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const [adAttempted, setAdAttempted] = useState(false);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const loaderWidth = useRef(new Animated.Value(0)).current;
  const bgCircle1 = useRef(new Animated.Value(0)).current;
  const bgCircle2 = useRef(new Animated.Value(0)).current;

  const navigateToHome = () => {
    router.replace('/(tabs)');
  };

  const runAdFlow = async () => {
    try {
      console.log('🚀 Initializing ads for splash...');
      await AdsManager.initializeAds();

      console.log('🎯 Attempting to show splash ad...');
      const adShown = await AdsManager.showSplashAd();

      if (adShown) {
        console.log('✅ Splash ad shown and closed. Navigating to home...');
      } else {
        console.log('⏭️ No splash ad shown. Navigating to home...');
      }
    } catch (error) {
      console.log('❌ Ad flow error:', error);
    } finally {
      navigateToHome();
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgCircle1, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgCircle1, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgCircle2, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgCircle2, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Logo entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Title fade in
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Loader bar animation
    Animated.timing(loaderWidth, {
      toValue: 1,
      duration: 2800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      setAdAttempted(true);
      runAdFlow();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const bgCircle1Scale = bgCircle1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const bgCircle2Scale = bgCircle2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const loaderWidthInterpolated = loaderWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={globalStyles.splashcontainer}>
      {/* Animated background circles */}
      {/* <Animated.View
        style={[
          globalStyles.bgCircle1,
          { transform: [{ scale: bgCircle1Scale }] },
        ]}
      />
      <Animated.View
        style={[
          globalStyles.bgCircle2,
          { transform: [{ scale: bgCircle2Scale }] },
        ]}
      /> */}
      {/* <View style={globalStyles.bgCircle3} /> */}

      {/* Main content */}
      <View style={globalStyles.splashcontent}>
        {/* Logo container */}
        <Animated.View
          style={[
            globalStyles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image source={require('../assets/images/logo2.png')} style={globalStyles.logo} />
          <View style={globalStyles.glowRing} />
        </Animated.View>
        <Animated.Text
          style={[
            globalStyles.appName,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          {/* NoteKeep */}
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={[globalStyles.tagline, { opacity: subtitleOpacity }]}
        >
          {/* Your thoughts, organized */}
        </Animated.Text>
      </View>

      {/* Bottom loader */}
      <View style={globalStyles.loaderContainer}>
        <View style={globalStyles.loaderTrack}>
          <Animated.View
            style={[globalStyles.loaderBar, { width: loaderWidthInterpolated }]}
          />
        </View>
        <Animated.Text style={[globalStyles.loaderText, { opacity: subtitleOpacity }]}>
          Loading...
        </Animated.Text>
      </View>
    </View>
  );
}