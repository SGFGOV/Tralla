// Shared internationalization (i18n) and translation utilities

// Supported languages in the app
export enum Language {
  ENGLISH = 'en',
  HINDI = 'hi',
  TAMIL = 'ta',
  TELUGU = 'te',
  KANNADA = 'kn',
  MALAYALAM = 'ml',
  MARATHI = 'mr',
  BENGALI = 'bn',
  GUJARATI = 'gu',
  PUNJABI = 'pa',
  ODIA = 'or',
  ASSAMESE = 'as',
  URDU = 'ur'
}

// Language names for display in settings
export const LanguageNames = {
  [Language.ENGLISH]: 'English',
  [Language.HINDI]: 'हिन्दी', // Hindi
  [Language.TAMIL]: 'தமிழ்', // Tamil
  [Language.TELUGU]: 'తెలుగు', // Telugu
  [Language.KANNADA]: 'ಕನ್ನಡ', // Kannada
  [Language.MALAYALAM]: 'മലയാളം', // Malayalam
  [Language.MARATHI]: 'मराठी', // Marathi
  [Language.BENGALI]: 'বাংলা', // Bengali
  [Language.GUJARATI]: 'ગુજરાતી', // Gujarati
  [Language.PUNJABI]: 'ਪੰਜਾਬੀ', // Punjabi
  [Language.ODIA]: 'ଓଡ଼ିଆ', // Odia
  [Language.ASSAMESE]: 'অসমীয়া', // Assamese
  [Language.URDU]: 'اردو' // Urdu
};

// Interface for translation service
export interface TranslationService {
  translate(text: string, sourceLanguage: Language, targetLanguage: Language): Promise<string>;
  detectLanguage(text: string): Promise<Language>;
  isSupportedLanguage(language: string): boolean;
}

// User language preference interface
export interface LanguagePreference {
  userId: number;
  primaryLanguage: Language;
  secondaryLanguages: Language[];
  autoTranslate: boolean;
  autoDetectLanguage: boolean;
}

// Default language preference
export const defaultLanguagePreference: LanguagePreference = {
  userId: 0,
  primaryLanguage: Language.ENGLISH,
  secondaryLanguages: [],
  autoTranslate: true,
  autoDetectLanguage: true
};