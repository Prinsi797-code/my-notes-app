import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { getApps, initializeApp } from "firebase/app";
import { addDoc, collection, doc, getDoc, getFirestore, serverTimestamp } from "firebase/firestore";


// const firebaseConfig = {
//   apiKey: "AIzaSyAI2-FCmWHJY5ZXBYKgUqGiX2Bf4bQMSJQ",
//   authDomain: "notes-app-59abe.firebaseapp.com",
//   projectId: "notes-app-59abe",
//   storageBucket: "notes-app-59abe.firebasestorage.app",
//   messagingSenderId: "29560446221",
//   appId: "1:29560446221:web:8b54ff7cfb626bd6a36444",
//   measurementId: "G-1FR9C49MR2"
// };

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

let analyticsInstance: any = null;

async function getAnalyticsInstance() {
  if (analyticsInstance) return analyticsInstance;
  try {
    const supported = await isSupported();
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  } catch (e) {
    console.log("Analytics not supported:", e);
  }
  return analyticsInstance;
}
// ------------------------------
//  FETCH APP CONFIG
// ------------------------------
export async function fetchAppConfig() {
  try {
    const ref = doc(db, "configs", "app_config");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.log("Firestore Config Fetch Failed:", error);
    return null;
  }
}
// ------------------------------
//  FIREBASE ANALYTICS LOG EVENT
// ------------------------------
export async function logAnalyticsEvent(
  eventName: string,
  params?: Record<string, any>
) {
  try {
    const analytics = await getAnalyticsInstance();
    if (analytics) {
      logEvent(analytics, eventName, params);
      console.log(`📊 Analytics Event: ${eventName}`, params);
    } else {
      // Fallback: Firestore mein save karo
      await logToFirestore(eventName, params);
    }
  } catch (e) {
    console.log("Analytics log failed:", e);
    // Firestore fallback
    await logToFirestore(eventName, params);
  }
}

// ------------------------------
//  FIRESTORE FALLBACK LOGGER
// (Expo/RN mein analytics work na kare toh)
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