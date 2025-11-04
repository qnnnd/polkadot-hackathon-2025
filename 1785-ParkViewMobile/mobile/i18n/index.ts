import en from './locales/en';
import zh from './locales/zh';

type Locale = 'en' | 'zh';
type TranslationValue = string | Record<string, any>;
type Translations = Record<string, TranslationValue>;

class SimpleI18n {
  private translations: Record<Locale, Translations>;
  public locale: Locale;
  public defaultLocale: Locale;
  public enableFallback: boolean;

  constructor(translations: Record<Locale, Translations>) {
    this.translations = translations;
    this.locale = 'en';
    this.defaultLocale = 'en';
    this.enableFallback = true;
  }

  t(key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let value: any = this.translations[this.locale];

    // 尝试获取翻译
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else if (this.enableFallback && this.locale !== this.defaultLocale) {
        // 回退到默认语言
        value = this.translations[this.defaultLocale];
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return key; // 如果都找不到，返回 key
          }
        }
        break;
      } else {
        return key; // 找不到翻译，返回 key
      }
    }

    // 如果 value 不是字符串，返回 key
    if (typeof value !== 'string') {
      return key;
    }

    // 替换参数
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }

    return value;
  }
}

// 创建 i18n 实例
const i18n = new SimpleI18n({
  en,
  zh,
});

// 设置默认语言为英语
i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

export default i18n;

