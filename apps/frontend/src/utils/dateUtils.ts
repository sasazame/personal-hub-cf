import { format, formatDistanceToNow, isToday, isYesterday, parseISO, Locale } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';
import i18n from '@/i18n/config';

// Locale mapping for date-fns
const locales: Record<string, Locale> = {
  en: enUS,
  ja: ja,
};

// Get current locale from i18n
export function getCurrentLocale(): Locale {
  const currentLang = i18n.language;
  return locales[currentLang] || enUS;
}

// Format date with locale support
export function formatDate(date: Date | string, formatStr: string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: getCurrentLocale() });
}

// Format relative time with locale support
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: getCurrentLocale() 
  });
}

// Format date header with i18n support
export function formatDateHeader(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return i18n.t('date.today');
  }
  if (isYesterday(dateObj)) {
    return i18n.t('date.yesterday');
  }
  
  return formatDate(dateObj, 'MMMM d, yyyy');
}

// Format time with locale support
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const use24Hour = localStorage.getItem('use24Hour') === 'true';
  const timeFormat = use24Hour ? 'HH:mm' : 'h:mm a';
  
  return format(dateObj, timeFormat, { locale: getCurrentLocale() });
}

// Format date and time with locale support
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const use24Hour = localStorage.getItem('use24Hour') === 'true';
  const dateTimeFormat = use24Hour ? 'PPP HH:mm' : 'PPP h:mm a';
  
  return format(dateObj, dateTimeFormat, { locale: getCurrentLocale() });
}

// Format month and year with locale support
export function formatMonthYear(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMMM yyyy', { locale: getCurrentLocale() });
}

// Format day of week with locale support
export function formatDayOfWeek(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'EEEE', { locale: getCurrentLocale() });
}

// Format short date with locale support
export function formatShortDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const currentLang = i18n.language;
  
  // Use locale-specific short date format
  const shortDateFormat = currentLang === 'ja' ? 'yyyy/MM/dd' : 'MM/dd/yyyy';
  return format(dateObj, shortDateFormat, { locale: getCurrentLocale() });
}

// Export function to update locale when language changes
export function updateDateLocale(): void {
  // This function can be called when the language changes
  // The getCurrentLocale function will automatically use the new language
  console.log('Date locale updated to:', i18n.language);
}