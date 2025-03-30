import axios from 'axios';
import { Language, TranslationService } from '../../shared/i18n';

/**
 * BhashiniTranslationService implements the TranslationService interface
 * using the Bhashini API for Indian language translations.
 * 
 * Bhashini is a national language translation mission by the Government of India
 * that provides APIs for Indian language translation.
 * 
 * Documentation: https://bhashini.gov.in/
 */
export class BhashiniTranslationService implements TranslationService {
  private apiKey: string;
  private userId: string;
  private ulcaApiEndpoint: string = 'https://api.bhashini.gov.in/ulca/apis/v1';
  private supportedLanguages: Set<string>;

  constructor(apiKey: string, userId: string) {
    this.apiKey = apiKey;
    this.userId = userId;
    
    // All languages supported by Bhashini
    this.supportedLanguages = new Set(Object.values(Language));
  }

  /**
   * Translates text from source language to target language
   */
  async translate(text: string, sourceLanguage: Language, targetLanguage: Language): Promise<string> {
    try {
      if (!text || text.trim() === '') {
        return '';
      }

      if (sourceLanguage === targetLanguage) {
        return text;
      }

      const payload = {
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: {
                sourceLanguage,
                targetLanguage
              }
            }
          }
        ],
        inputData: {
          input: [
            {
              source: text
            }
          ]
        }
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-ID': this.userId
      };

      const response = await axios.post(
        `${this.ulcaApiEndpoint}/translation/v1/translate`,
        payload,
        { headers }
      );

      if (response.data && 
          response.data.pipelineResponse && 
          response.data.pipelineResponse[0] && 
          response.data.pipelineResponse[0].output) {
        return response.data.pipelineResponse[0].output[0].target;
      } else {
        console.error('Unexpected Bhashini API response structure', response.data);
        return text; // Return original text as fallback
      }
    } catch (error) {
      console.error('Bhashini translation error:', error);
      // Return original text when translation fails
      return text;
    }
  }

  /**
   * Detects the language of the given text
   */
  async detectLanguage(text: string): Promise<Language> {
    try {
      if (!text || text.trim() === '') {
        return Language.ENGLISH;
      }

      const payload = {
        pipelineTasks: [
          {
            taskType: 'language-detection'
          }
        ],
        inputData: {
          input: [
            {
              source: text
            }
          ]
        }
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-ID': this.userId
      };

      const response = await axios.post(
        `${this.ulcaApiEndpoint}/language-detection/v1/detect`,
        payload,
        { headers }
      );

      if (response.data && 
          response.data.pipelineResponse && 
          response.data.pipelineResponse[0] && 
          response.data.pipelineResponse[0].output) {
        const detectedLanguage = response.data.pipelineResponse[0].output[0].langCode;
        // Convert to our enum if supported
        return this.isSupportedLanguage(detectedLanguage) 
          ? detectedLanguage as Language 
          : Language.ENGLISH;
      } else {
        console.error('Unexpected Bhashini API response structure', response.data);
        return Language.ENGLISH;
      }
    } catch (error) {
      console.error('Bhashini language detection error:', error);
      return Language.ENGLISH;
    }
  }

  /**
   * Checks if the given language is supported
   */
  isSupportedLanguage(language: string): boolean {
    return this.supportedLanguages.has(language);
  }
}

// Create and export a singleton instance
// Note: API key and user ID should be provided via environment variables in production
export const bhashiniTranslation = new BhashiniTranslationService(
  process.env.BHASHINI_API_KEY || '', 
  process.env.BHASHINI_USER_ID || ''
);

export default bhashiniTranslation;