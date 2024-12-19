import { franc } from 'franc';
import ISO6391 from 'iso-639-1';

export class LanguageDetector {
  private defaultLanguage = 'en';

  private containsHangul(text: string): boolean {
    return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
  }

  async detect(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return this.defaultLanguage;
    }

    try {
      // First check for Korean characters
      if (this.containsHangul(text)) {
        return 'ko';
      }

      // Detect language code using franc
      const langCode = franc(text);
      console.log('Detected raw language code:', langCode);

      if (langCode === 'und') {
        return this.defaultLanguage;
      }

      // Map common 3-letter codes to 2-letter codes
      const languageMap: { [key: string]: string } = {
        'kor': 'ko',
        'eng': 'en',
        'jpn': 'ja',
        'cmn': 'zh',
        'und': 'en'
      };

      // First try direct mapping
      if (languageMap[langCode]) {
        return languageMap[langCode];
      }

      // If no direct mapping, try ISO conversion
      const iso6391Code = ISO6391.getAllCodes().find(code => 
        ISO6391.getCode(ISO6391.getName(code)) === langCode
      );

      return iso6391Code || this.defaultLanguage;
    } catch (error) {
      console.error('Error detecting language:', error);
      return this.defaultLanguage;
    }
  }

  getLanguageName(code: string): string {
    return ISO6391.getName(code) || 'English';
  }
} 