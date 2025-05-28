import config from '../config/env.config';
import translatePkg from '@google-cloud/translate';

const { Translate } = translatePkg.v2;

export class TranslationService {

  private readonly translate = new Translate({
    projectId: config.googleTranslate.projectId,
    key: config.googleTranslate.apiKey,
  });

  public async translateToAllSupportedLanguages(text: string): Promise<{
    uk: string | null;
    ru: string | null;
  }> {
    const result = {
      uk: null as string | null,
      ru: null as string | null,
    };

    try {
      const [ukTranslation, ruTranslation] = await Promise.all([
        this.translateText(text, 'uk'),
        this.translateText(text, 'ru'),
      ]);

      result.uk = ukTranslation;
      result.ru = ruTranslation;
    } catch (error) {
      console.error('Error translating to all languages:', error);
    }

    return result;
  }

  private async translateText(
    text: string,
    targetLanguage: string,
  ): Promise<string | null> {
    try {
      const [translations] = await this.translate.translate(
        text,
        targetLanguage,
      );

      if (translations.length > 0) {
        return translations || null;
      }

      return null;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  }
}
