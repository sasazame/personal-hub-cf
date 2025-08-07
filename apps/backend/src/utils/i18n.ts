import { Context } from 'hono';

/**
 * Internationalization utilities for backend error messages and responses
 */

// Supported languages
export type SupportedLanguage = 'en' | 'ja';

// Translation structure
interface Translations {
  [key: string]: {
    en: string;
    ja: string;
  };
}

// Error message translations
const errorTranslations: Translations = {
  VALIDATION_ERROR: {
    en: 'Invalid input',
    ja: '入力値が不正です'
  },
  AUTHENTICATION_FAILED: {
    en: 'Authentication failed',
    ja: '認証に失敗しました'
  },
  UNAUTHORIZED: {
    en: 'Unauthorized',
    ja: '認証が必要です'
  },
  USER_EXISTS: {
    en: 'This email address is already in use',
    ja: 'このメールアドレスは既に使用されています'
  },
  USER_NOT_FOUND: {
    en: 'User not found',
    ja: 'ユーザーが見つかりません'
  },
  INVALID_CREDENTIALS: {
    en: 'Invalid credentials',
    ja: '認証情報が無効です'
  },
  INVALID_TOKEN: {
    en: 'Invalid token',
    ja: 'トークンが無効です'
  },
  TOKEN_EXPIRED: {
    en: 'Token expired',
    ja: 'トークンの有効期限が切れました'
  },
  FORBIDDEN: {
    en: 'Access denied',
    ja: 'アクセス権限がありません'
  },
  NOT_FOUND: {
    en: 'Resource not found',
    ja: 'リソースが見つかりません'
  },
  INTERNAL_ERROR: {
    en: 'Server error occurred',
    ja: 'サーバーエラーが発生しました'
  },
  INVALID_JSON: {
    en: 'Invalid request format',
    ja: 'リクエストの形式が不正です'
  },
  RATE_LIMIT_EXCEEDED: {
    en: 'Rate limit exceeded',
    ja: 'レート制限を超えました'
  },
  TODO_NOT_FOUND: {
    en: 'TODO not found',
    ja: 'TODOが見つかりません'
  },
  MOMENT_NOT_FOUND: {
    en: 'Moment not found',
    ja: 'モーメントが見つかりません'
  },
  INVALID_PARAMETER: {
    en: 'Invalid parameter',
    ja: 'パラメータが無効です'
  },
  EMAIL_ALREADY_EXISTS: {
    en: 'This email address is already in use',
    ja: 'このメールアドレスは既に使用されています'
  },
  USERNAME_ALREADY_EXISTS: {
    en: 'Username is already taken',
    ja: 'ユーザー名は既に使用されています'
  },
  OAUTH_LOGIN_REQUIRED: {
    en: 'Please login using your social account',
    ja: 'ソーシャルアカウントでログインしてください'
  },
  OAUTH2_REQUIRED: {
    en: 'OAuth2 authentication required',
    ja: 'OAuth2認証が必要です'
  },
  DUPLICATE_AUTH_CODE: {
    en: 'The authorization code has already been used. Please try logging in again.',
    ja: '認証コードは既に使用されています。もう一度ログインしてください。'
  },
  TOKEN_DECRYPTION_FAILED: {
    en: 'Your authentication tokens could not be decrypted. Please re-authenticate with Google.',
    ja: '認証トークンの復号化に失敗しました。Googleで再認証してください。'
  },
  CONFLICT: {
    en: 'Resource already exists',
    ja: 'リソースは既に存在します'
  }
};

// Validation message translations
const validationTranslations: Translations = {
  EMAIL_REQUIRED: {
    en: 'Email is required',
    ja: 'メールアドレスは必須です'
  },
  EMAIL_INVALID: {
    en: 'Email should be valid',
    ja: '有効なメールアドレスを入力してください'
  },
  PASSWORD_REQUIRED: {
    en: 'Password is required',
    ja: 'パスワードは必須です'
  },
  PASSWORD_WEAK: {
    en: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
    ja: 'パスワードは8文字以上で、大文字、小文字、数字、特殊文字をそれぞれ1つ以上含む必要があります'
  },
  USERNAME_REQUIRED: {
    en: 'Username is required',
    ja: 'ユーザー名は必須です'
  },
  USERNAME_INVALID: {
    en: 'Username must be between 3 and 20 characters',
    ja: 'ユーザー名は3文字以上20文字以下である必要があります'
  }
};

// Success message translations
const successTranslations: Translations = {
  LOGOUT_SUCCESS: {
    en: 'Logged out successfully',
    ja: 'ログアウトしました'
  },
  PASSWORD_RESET_SUCCESS: {
    en: 'Password has been reset successfully',
    ja: 'パスワードがリセットされました'
  },
  RESET_EMAIL_SENT: {
    en: 'If an account with this email exists, you will receive a password reset email.',
    ja: 'このメールアドレスのアカウントが存在する場合、パスワードリセット用のメールが送信されます。'
  },
  TODO_CREATED: {
    en: 'TODO created successfully',
    ja: 'TODOが作成されました'
  },
  TODO_UPDATED: {
    en: 'TODO updated successfully',
    ja: 'TODOが更新されました'
  },
  TODO_DELETED: {
    en: 'TODO deleted successfully',
    ja: 'TODOが削除されました'
  },
  NOTE_CREATED: {
    en: 'Note created successfully',
    ja: 'ノートが作成されました'
  },
  NOTE_UPDATED: {
    en: 'Note updated successfully',
    ja: 'ノートが更新されました'
  },
  NOTE_DELETED: {
    en: 'Note deleted successfully',
    ja: 'ノートが削除されました'
  }
};

// Combine all translations
const allTranslations: Translations = {
  ...errorTranslations,
  ...validationTranslations,
  ...successTranslations
};

/**
 * Parse Accept-Language header to determine user's preferred language
 * Examples:
 * - "en-US,en;q=0.9,ja;q=0.8" -> "en"
 * - "ja-JP,ja;q=0.9,en;q=0.8" -> "ja"
 */
export function parseAcceptLanguage(acceptLanguage: string | undefined): SupportedLanguage {
  if (!acceptLanguage) {
    return 'en';
  }

  // Parse the Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const parts = lang.trim().split(';');
      const locale = parts[0].toLowerCase();
      const quality = parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0;
      return { locale, quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find the first supported language
  for (const { locale } of languages) {
    // Check for exact match or language prefix match
    if (locale === 'ja' || locale.startsWith('ja-')) {
      return 'ja';
    }
    if (locale === 'en' || locale.startsWith('en-')) {
      return 'en';
    }
  }

  // Default to English
  return 'en';
}

/**
 * Get the user's preferred language from the context
 */
export function getUserLanguage(c: Context): SupportedLanguage {
  const acceptLanguage = c.req.header('Accept-Language');
  return parseAcceptLanguage(acceptLanguage);
}

/**
 * Translate a message key to the user's preferred language
 */
export function translate(key: string, language: SupportedLanguage): string {
  const translation = allTranslations[key];
  if (!translation) {
    // If translation not found, return the key itself
    return key;
  }
  return translation[language] || translation.en;
}

/**
 * Translate an error message
 */
export function translateError(errorCode: string, c: Context): string {
  const language = getUserLanguage(c);
  return translate(errorCode, language);
}

/**
 * Translate a validation message
 */
export function translateValidation(validationKey: string, c: Context): string {
  const language = getUserLanguage(c);
  return translate(validationKey, language);
}

/**
 * Translate a success message
 */
export function translateSuccess(successKey: string, c: Context): string {
  const language = getUserLanguage(c);
  return translate(successKey, language);
}

/**
 * Create a localized error response
 */
export function createLocalizedError(
  errorCode: string,
  c: Context,
  details: Record<string, unknown> | null = null
) {
  const language = getUserLanguage(c);
  const message = translate(errorCode, language);
  
  return {
    code: errorCode,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a localized validation error response
 */
export function createLocalizedValidationError(
  fieldErrors: Record<string, string>,
  c: Context
) {
  const language = getUserLanguage(c);
  
  // Translate field error messages
  const translatedErrors: Record<string, string> = {};
  for (const [field, errorKey] of Object.entries(fieldErrors)) {
    translatedErrors[field] = translate(errorKey, language);
  }
  
  return {
    code: 'VALIDATION_ERROR',
    message: translate('VALIDATION_ERROR', language),
    details: translatedErrors,
    timestamp: new Date().toISOString()
  };
}

/**
 * Middleware to set language preference in context
 */
export function i18nMiddleware() {
  return async (c: Context, next: () => Promise<void>) => {
    const language = getUserLanguage(c);
    c.set('language', language);
    await next();
  };
}