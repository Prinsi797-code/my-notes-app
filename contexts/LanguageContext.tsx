import i18n, { changeLanguage as changeI18nLanguage, initializeI18n } from '@/utils/i18n';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface LanguageContextType {
  locale: string;
  t: (key: string) => string;
  changeLanguage: (languageCode: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  t: (key: string) => key,
  changeLanguage: async () => {},
  isLoading: false,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState(i18n.language || 'en');
  const [isLoading, setIsLoading] = useState(false);
  // Add a key to force re-render
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const loadLanguage = async () => {
      await initializeI18n();
      setLocale(i18n.language);
      forceUpdate(prev => prev + 1);
    };

    loadLanguage();

    const handleLanguageChange = (lng: string) => {
      console.log('🌍 Language changed to:', lng);
      setLocale(lng);
      forceUpdate(prev => prev + 1); // Force re-render
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const changeLanguage = async (languageCode: string) => {
    try {
      setIsLoading(true);
      await changeI18nLanguage(languageCode);
      setLocale(languageCode);
      forceUpdate(prev => prev + 1); // Force re-render
      console.log('✅ Language changed successfully to:', languageCode);
    } catch (error) {
      console.error('❌ Error changing language:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string): string => {
    const translation = i18n.t(key);
    // console.log(`Translation for ${key}:`, translation);
    return translation;
  };

  const value: LanguageContextType = {
    locale,
    t,
    changeLanguage,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};