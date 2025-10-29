import { locallyStoreMap, loadMapFromLocalStorage } from '../dictLocalStorage/localStorageUtils';
import { convertMapping } from '../common/utility';
import { objectToMap, updateMapWithoutOverride } from '../common/utils';

const fieldSeparator = ' @ ';
export function getEnglishTranslationKey(stem: string, pos: string, germanTranslation: string): string {
  return [stem, pos, germanTranslation].join(fieldSeparator);
}

export type EnglishTranslations = Map<string, string>;
type EnglishTranslationsObject = { [key: string]: string };

const localStorageKey = 'englishTranslations';
let englishTranslations: EnglishTranslations = loadMapFromLocalStorage(localStorageKey);
function locallyStoreEnglishTranslations() {
  locallyStoreMap(englishTranslations, localStorageKey);
}

// Accessors for the dictionary editor

export function getGlobalEnglishTranslations(): EnglishTranslations {
  return englishTranslations;
}

export function setGlobalEnglishTranslations(newEnglishTranslations: EnglishTranslations): void {
  englishTranslations = newEnglishTranslations;
  locallyStoreEnglishTranslations();
}

// Accessors for saving and loading JSON files

export function getEnglishTranslations(): EnglishTranslationsObject {
  return convertMapping(englishTranslations);
}

export function setEnglishTranslations(newEnglishTranslations: EnglishTranslationsObject): void {
  englishTranslations = objectToMap(newEnglishTranslations);
  locallyStoreEnglishTranslations();
}

export function updateEnglishTranslations(newEnglishTranslationsObject: EnglishTranslationsObject): void {
  const newEnglishTranslations = objectToMap(newEnglishTranslationsObject);
  englishTranslations = updateMapWithoutOverride(englishTranslations,
                                                 newEnglishTranslations);
  locallyStoreEnglishTranslations();
}
