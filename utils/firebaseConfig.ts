import analyticsModule from '@react-native-firebase/analytics';
import remoteConfigModule from '@react-native-firebase/remote-config';

import { getApps, initializeApp } from "firebase/app";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";

// Web SDK sirf Firestore fallback logging ke liye use ho raha hai
const firebaseConfig = {
  apiKey: "AIzaSyDHjYPZoiOMngNU1pKCOJCQEf4emxSDXrQ",
  authDomain: "notes-app-473a7.firebaseapp.com",
  projectId: "notes-app-473a7",
  storageBucket: "notes-app-473a7.firebasestorage.app",
  messagingSenderId: "173209080858",
  appId: "1:173209080858:web:d218449bd49ed4151eada3",
  measurementId: "G-MNERDBRFNP"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

const db = getFirestore(app);

// ------------------------------
//  REMOTE CONFIG DEFAULTS
// ------------------------------
const DEFAULTS = {
  // floor_inter
  inter_ads_flag: 0,
  inter_id: '',

  ad_flag: 0,
  baner_id: '',
  language_inter_ads_flag: 0,
  language_inter_id: '',

  main_ad_flag: 0,
  main_baner_id: '',

  main_screen_ad_flag: 0,   
  main_inter_ads_id: '',

  note_ad_flag: 0,
  note_baner_id: '',
  note_inter_id: '',
  note_inter_ads_flag: 0,
  review_id: '',
  review_ad_flag: 0,

  setting_ad_flag: 0,
  setting_baner_id: '',
  setting_inter_ads_flag: 0,
  setting_inter_id: '',

  splash_inter_ads_flag: 0,
  splash_inter_id: '',

  detail_inter_ads_flag: 0,
  detail_inter_id: '',
};

// ------------------------------
//  FETCH APP CONFIG (Remote Config se)
// ------------------------------
export async function fetchAppConfig() {
  try {
    const rc = remoteConfigModule();

    await rc.setDefaults(DEFAULTS);
    await rc.setConfigSettings({ minimumFetchIntervalMillis: 0 });

    await rc.fetchAndActivate();

    const getNum = (key: string) => rc.getValue(key).asNumber();
    const getStr = (key: string) => rc.getValue(key).asString();

    const config = {
      floor_inter: {
        inter_ads_flag: getNum('inter_ads_flag'),
        inter_id: getStr('inter_id'),
      },
      language_screen: {
        ad_flag: getNum('ad_flag'),
        baner_id: getStr('baner_id'),
        inter_ads_flag: getNum('language_inter_ads_flag'),
        inter_id: getStr('language_inter_id'),
      },
      main_screen: {
        ad_flag: getNum('main_ad_flag'),
        baner_id: getStr('main_baner_id'),
      },
      main_screen_ad: {
        ad_flag: getNum('main_screen_ad_flag'),
        inter_ads_id: getStr('main_inter_ads_id'),
      },
      note_screen: {
        ad_flag: getNum('note_ad_flag'),
        baner_id: getStr('note_baner_id'),
        inter_id: getStr('note_inter_id'),
        inter_ads_flag: getNum('note_inter_ads_flag'),
        review_id: getStr('review_id'),
        review_ad_flag: getNum('review_ad_flag'),
      },
      setting_screen: {
        ad_flag: getNum('setting_ad_flag'),
        baner_id: getStr('setting_baner_id'),
        inter_ads_flag: getNum('setting_inter_ads_flag'),
        inter_id: getStr('setting_inter_id'),
      },
      splash_screen: {
        inter_ads_flag: getNum('splash_inter_ads_flag'),
        inter_id: getStr('splash_inter_id'),
      },
      detail_screen: {
        inter_ads_flag: getNum('detail_inter_ads_flag'),
        inter_id: getStr('detail_inter_id'),
      },
    };

    console.log('✅ Remote Config fetched:', config);
    return config;
  } catch (error) {
    console.log("Remote Config Fetch Failed:", error);
    return null;
  }
}

// ------------------------------
//  FIREBASE ANALYTICS LOG EVENT (Native)
// ------------------------------
export async function logAnalyticsEvent(
  eventName: string,
  params?: Record<string, any>
) {
  try {
    await analyticsModule().logEvent(eventName, params);
    console.log(`📊 Analytics Event: ${eventName}`, params);
  } catch (e) {
    console.log("Analytics log failed:", e);
    // Firestore fallback agar analytics fail ho
    await logToFirestore(eventName, params);
  }
}

// ------------------------------
//  FIRESTORE FALLBACK LOGGER
// ------------------------------
export async function logToFirestore(
  eventName: string,
  params?: Record<string, any>
) {
  try {
    await addDoc(collection(db, "ad_analytics"), {
      event: eventName,
      ...params,
      timestamp: serverTimestamp(),
    });
    console.log(`🔥 Firestore Logged: ${eventName}`);
  } catch (e) {
    console.log("Firestore log failed:", e);
  }
}