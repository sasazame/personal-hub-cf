import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enTodos from '../locales/en/todos.json';
import enCalendar from '../locales/en/calendar.json';
import enNotes from '../locales/en/notes.json';
import enGoals from '../locales/en/goals.json';
import enMoments from '../locales/en/moments.json';
import enPomodoro from '../locales/en/pomodoro.json';
import enAnalytics from '../locales/en/analytics.json';
import enSettings from '../locales/en/settings.json';
import enErrors from '../locales/en/errors.json';

import jaCommon from '../locales/ja/common.json';
import jaAuth from '../locales/ja/auth.json';
import jaTodos from '../locales/ja/todos.json';
import jaCalendar from '../locales/ja/calendar.json';
import jaNotes from '../locales/ja/notes.json';
import jaGoals from '../locales/ja/goals.json';
import jaMoments from '../locales/ja/moments.json';
import jaPomodoro from '../locales/ja/pomodoro.json';
import jaAnalytics from '../locales/ja/analytics.json';
import jaSettings from '../locales/ja/settings.json';
import jaErrors from '../locales/ja/errors.json';

export const defaultNS = 'common';
export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    todos: enTodos,
    calendar: enCalendar,
    notes: enNotes,
    goals: enGoals,
    moments: enMoments,
    pomodoro: enPomodoro,
    analytics: enAnalytics,
    settings: enSettings,
    errors: enErrors,
  },
  ja: {
    common: jaCommon,
    auth: jaAuth,
    todos: jaTodos,
    calendar: jaCalendar,
    notes: jaNotes,
    goals: jaGoals,
    moments: jaMoments,
    pomodoro: jaPomodoro,
    analytics: jaAnalytics,
    settings: jaSettings,
    errors: jaErrors,
  },
} as const;

// Safe localStorage access
const getInitialLanguage = (): string => {
  try {
    return localStorage.getItem('i18nextLng') || 'en';
  } catch {
    return 'en';
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: getInitialLanguage(),
    debug: false,
    ns: ['common', 'auth', 'todos', 'calendar', 'notes', 'goals', 'moments', 'pomodoro', 'analytics', 'settings', 'errors'],
    defaultNS,
    resources,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Type definitions for TypeScript
export type Languages = keyof typeof resources;
export type Namespaces = keyof typeof resources.en;