import { getEnglishTranslations, setEnglishTranslations } from '../../translations/englishTranslations';
import { makeDownload } from '../../../../downloadHelper';

export function downloadDictionary() {
  const englishTranslations = getEnglishTranslations();
  const obj = {englishTranslations};
  const jsonText = JSON.stringify(obj, undefined, '\t');
  makeDownload(jsonText, 'EnglishTranslations.json');
}

export async function readEnglishTranslations(file: File) {
  const source = await file.text();
  const parsed = JSON.parse(source);
  if ('englishTranslations' in parsed) {
    setEnglishTranslations(parsed.englishTranslations);
  }
}
