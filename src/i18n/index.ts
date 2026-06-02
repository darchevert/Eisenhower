import { getLocales } from 'expo-localization';
import en, { type Translations } from './locales/en';
import fr from './locales/fr';
import es from './locales/es';
import de from './locales/de';
import pt from './locales/pt';
import it from './locales/it';
import ja from './locales/ja';
import zh from './locales/zh';
import ar from './locales/ar';
import ko from './locales/ko';
import ru from './locales/ru';
import nl from './locales/nl';

const catalog: Record<string, Translations> = {
  en, fr, es, de, pt, it, ja, zh, ar, ko, ru, nl,
};

function detectLocale(): string {
  try {
    const locales = getLocales();
    for (const l of locales) {
      const code = l.languageCode ?? '';
      if (catalog[code]) return code;
    }
  } catch {}
  return 'en';
}

let _locale = detectLocale();

export function getLocale(): string {
  return _locale;
}

export function setLocale(code: string): void {
  if (catalog[code]) _locale = code;
}

function resolve(obj: any, keys: string[]): string | undefined {
  let cur = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[k];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  const value =
    resolve(catalog[_locale], keys) ??
    resolve(catalog.en, keys) ??
    key;

  if (!params) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? ''));
}
