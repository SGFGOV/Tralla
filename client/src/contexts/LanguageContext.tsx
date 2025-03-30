import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Language, LanguageNames } from '../../../shared/i18n';
import { LanguagePreference } from '../../../shared/schema';
import { useToast } from '@/hooks/use-toast';

interface LanguageContextType {
  currentLanguage: Language;
  supportedLanguages: typeof LanguageNames;
  changeLanguage: (language: Language) => void;
  translate: (text: string, targetLanguage?: Language) => Promise<string>;
  isTranslating: boolean;
  preferences: LanguagePreference | null;
  updatePreferences: (preferences: Partial<LanguagePreference>) => Promise<void>;
  isLoadingPreferences: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.ENGLISH);
  const [isTranslating, setIsTranslating] = useState(false);
  const [preferences, setPreferences] = useState<LanguagePreference | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const { toast } = useToast();
  
  // Load language preference from localStorage or default to browser language
  useEffect(() => {
    const savedLanguage = localStorage.getItem('userLanguage');
    if (savedLanguage && Object.values(Language).includes(savedLanguage as Language)) {
      setCurrentLanguage(savedLanguage as Language);
    } else {
      // Try to detect from browser
      const browserLang = navigator.language.split('-')[0];
      if (Object.values(Language).includes(browserLang as Language)) {
        setCurrentLanguage(browserLang as Language);
      }
    }
    
    // Fetch user's language preferences if logged in
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchLanguagePreferences(parseInt(userId));
    }
  }, []);
  
  const fetchLanguagePreferences = async (userId: number) => {
    try {
      setIsLoadingPreferences(true);
      const response = await apiRequest('GET', `/api/users/${userId}/language-preferences`);
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Failed to fetch language preferences:', error);
    } finally {
      setIsLoadingPreferences(false);
    }
  };
  
  const updatePreferences = async (newPreferences: Partial<LanguagePreference>) => {
    try {
      if (!preferences) return;
      
      setIsLoadingPreferences(true);
      const response = await apiRequest('PATCH', `/api/users/${preferences.userId}/language-preferences`, newPreferences);
      const data = await response.json();
      setPreferences(data);
      
      // Update current language if primary language was changed
      if (newPreferences.primaryLanguage) {
        setCurrentLanguage(newPreferences.primaryLanguage);
        localStorage.setItem('userLanguage', newPreferences.primaryLanguage);
      }
      
      toast({
        title: "Settings updated",
        description: "Your language preferences have been saved.",
      });
    } catch (error) {
      console.error('Failed to update language preferences:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your language preferences.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreferences(false);
    }
  };
  
  const changeLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('userLanguage', language);
    
    // If logged in, also update preferences
    if (preferences) {
      updatePreferences({ primaryLanguage: language });
    }
  }, [preferences]);
  
  const translate = useCallback(async (text: string, targetLanguage?: Language) => {
    const target = targetLanguage || currentLanguage;
    
    // Don't translate if text is empty or target is same as source (we're guessing source is English)
    if (!text || (target === Language.ENGLISH && !preferences?.autoDetectLanguage)) {
      return text;
    }
    
    try {
      setIsTranslating(true);
      
      // Call translation API
      const response = await apiRequest('POST', '/api/translate', {
        text,
        targetLanguage: target,
        autoDetect: preferences?.autoDetectLanguage || true
      });
      
      const data = await response.json();
      return data.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage, preferences]);
  
  const contextValue: LanguageContextType = {
    currentLanguage,
    supportedLanguages: LanguageNames,
    changeLanguage,
    translate,
    isTranslating,
    preferences,
    updatePreferences,
    isLoadingPreferences
  };
  
  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}