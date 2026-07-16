import {TranslationMap, getTranslationMap, addTranslationFromMorphology} from './getTranslationMap';
import {getGlobalDictionary} from '../dict/dictionary';
import {MorphologicalAnalysis} from '../../../model/morphologicalAnalysis';
import {getKey} from './glossProvider';

/**
 * Generates a translation map from
 * the global dictionary.
 */
function generateTranslationMap(): TranslationMap {
  return getTranslationMap(getGlobalDictionary());
}

// Stores a set of complete translations
// (each may consist of several words)
// for each pair (stem, part of speech)
let translationMap = generateTranslationMap();

/**
 * Regenerates the translation map from
 * the global dictionary.
 * Should be called after dictionary
 * upload or download.
 */
export function regenerateTranslationMap(): void {
  translationMap = generateTranslationMap();
}

/**
 * Updates the global translation map
 * using the given morphological analysis.
 */
export function addToTranslationMap(ma: MorphologicalAnalysis): void {
  addTranslationFromMorphology(translationMap, ma);
}

export function getTranslations(stem: string, pos: string): string[] {
  const translationSet = translationMap.get(getKey(stem, pos));
  if (translationSet === undefined) {
    return [];
  } else {
    return Array.from(translationSet);
  }
}
