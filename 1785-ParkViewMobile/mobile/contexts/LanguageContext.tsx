import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

type Locale = 'en' | 'zh';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@parkview_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en'); // 默认英语

  // 加载保存的语言设置
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh')) {
        setLocaleState(savedLanguage as Locale);
        i18n.locale = savedLanguage;
      } else {
        // 默认使用英语
        i18n.locale = 'en';
        setLocaleState('en');
      }
    } catch (error) {
      console.error('Failed to load language:', error);
      i18n.locale = 'en';
      setLocaleState('en');
    }
  };

  const setLocale = async (newLocale: Locale) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);
      i18n.locale = newLocale;
      setLocaleState(newLocale);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const t = (key: string, params?: Record<string, any>) => {
    return i18n.t(key, params);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
