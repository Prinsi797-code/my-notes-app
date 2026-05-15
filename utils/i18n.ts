import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// ✅ STATIC IMPORTS
import de from "../locales/de.json";
import en from "../locales/en.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import hi from "../locales/hi.json";
import id from "../locales/id.json";
import it from "../locales/it.json";
import ja from "../locales/ja.json";
import ko from "../locales/ko.json";
import pt from "../locales/pt.json";
import ru from "../locales/ru.json";
import zh from "../locales/zh.json";

const SUPPORTED_LANGUAGES = ['en', 'hi', 'de', 'es', 'fr', 'id', 'it', 'ko', 'pt', 'ru', 'zh', 'ja'];
const LANGUAGE_STORAGE_KEY = "selectedLanguage";

// ✅ Initialize synchronously - This runs immediately
const initializeSync = () => {
  if (!i18n.isInitialized) {
    i18n
      .use(initReactI18next)
      .init({
        compatibilityJSON: "v3",
        lng: "en",          // ✅ Uncomment karo
        fallbackLng: false,
        resources: {
          en: { translation: en },
          hi: { translation: hi },
          de: { translation: de },
          es: { translation: es },
          fr: { translation: fr },
          id: { translation: id },
          it: { translation: it },
          ko: { translation: ko },
          pt: { translation: pt },
          ru: { translation: ru },
          zh: { translation: zh },
          ja: { translation: ja },
        },

        keySeparator: '.',      
        defaultNS: 'translation',
        ns: ['translation'],

        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false,
        },
      });
    console.log('✅ i18n initialized synchronously');
  }
};

// Initialize immediately when module loads
initializeSync();

export const initializeI18n = async () => {
  try {
    console.log('🌍 Loading saved language preference...');
    const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

    const locales = Localization.getLocales();
    const deviceLang = locales[0]?.languageCode ?? "en";

    let targetLang = "en";

    if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
      targetLang = savedLang;
      console.log('✅ Using saved language:', savedLang);
    } else if (SUPPORTED_LANGUAGES.includes(deviceLang)) {
      targetLang = deviceLang;
      console.log('📱 Using device language:', deviceLang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, deviceLang);
    } else {
      console.log('⚠️ Using fallback: English');
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    }

    if (i18n.language !== targetLang) {
      await i18n.changeLanguage(targetLang);
      console.log('✅ Language changed to:', targetLang);
    }

    return i18n;
  } catch (error) {
    console.error('❌ Error loading language:', error);
    return i18n;
  }
};

export const changeLanguage = async (languageCode: string) => {
  try {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    console.log('✅ Language changed to:', languageCode);
  } catch (error) {
    console.error('❌ Error changing language:', error);
    throw error;
  }
};

export const getCurrentLanguage = () => i18n.language;

export default i18n;