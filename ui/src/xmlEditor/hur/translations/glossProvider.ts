import {convertDictionary, updateGlossesLexicon} from '../common/utility';
import { objectToSetValuedMap } from '../common/utils';
import { loadSetValuedMapFromLocalStorage, locallyStoreSetValuedMap }
  from '../dictLocalStorage/localStorageUtils';
import { TranslationMap, getTranslationMap, addTranslationFromMorphology } from './getTranslationMap';
import { getGlobalDictionary } from '../dict/dictionary';
import {MorphologicalAnalysis} from '../../../model/morphologicalAnalysis';

export type Glossary = Map<string, Set<string>>;
export type GlossaryObject = { [key: string]: string[] };

//Dieses Modul kann Bedeutungen von Stämmen speichern und nachschlagen.
const localStorageKey = 'HurrianStemTranslations';
export let glosses: Glossary = loadSetValuedMapFromLocalStorage(localStorageKey);
export function locallyStoreHurrianStemTranslations(): void {
  locallyStoreSetValuedMap(glosses, localStorageKey);
}

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

const translationWordSeparator = '; ';
const meaningUnknown = 'u.B.';

export function joinTranslationWords(translationWords: string[]): string {
  return translationWords.sort().join(translationWordSeparator);
}

export function splitTranslationIntoWords(translation: string): string[] {
  return translation.split(translationWordSeparator).sort();
}

function normalizeTranslationLexicon(): void {
  for (const [key, oldValueSet] of glosses) {
    const newValueSet = new Set<string>();
    for (const value of oldValueSet) {
      for (const translationWord of value.split(translationWordSeparator)) {
        newValueSet.add(translationWord);
      }
    }
    if (newValueSet.size > 1) {
      newValueSet.delete(meaningUnknown);
    }    
    glosses.set(key, newValueSet);
  }
}

normalizeTranslationLexicon();

export function getKey(word: string, pos: string): string
{
	return word + ',' + pos;
}

export function storeGloss(word: string, pos: string, gloss: string): void {
	const key: string = getKey(word, pos);
	let current: Set<string> | undefined = glosses.get(key);
  if (current === undefined) {
    current = new Set<string>();
		glosses.set(key, current);
  }
  for (const translationWord of gloss.split(translationWordSeparator)) {
    current.add(translationWord);
  }
}

export function retrieveGloss(word: string, pos: string): Set<string> | null
{
	const key: string = getKey(word, pos);
	if (glosses.has(key))
	{
		const value = glosses.get(key);
		if (value === undefined)
		{
			throw new Error();
		}
		return value;
	}
	else
	{
		return null;
	}
}

export function getTranslations(stem: string, pos: string): string[] {
  const translationSet = translationMap.get(getKey(stem, pos));
  if (translationSet === undefined) {
    return [];
  } else {
    return Array.from(translationSet);
  }
}

export function getGlosses(): GlossaryObject {
  return convertDictionary(glosses);
}

export function upgradeGlosses(obj: GlossaryObject): void {
  updateGlossesLexicon(glosses, obj);
  normalizeTranslationLexicon();
}

export function setGlosses(obj: GlossaryObject): void {
  glosses = objectToSetValuedMap(obj);
}
