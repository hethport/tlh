import {convertDictionary, updateGlossesLexicon} from '../common/utility';
import { objectToSetValuedMap } from '../common/utils';
import { loadSetValuedMapFromLocalStorage, locallyStoreSetValuedMap }
  from '../dictLocalStorage/localStorageUtils';

//Dieses Modul kann Bedeutungen von Stämmen speichern und nachschlagen.
const localStorageKey = 'HurrianStemTranslations';
export let glosses: Map<string, Set<string>> = loadSetValuedMapFromLocalStorage(localStorageKey);
export function locallyStoreHurrianStemTranslations(): void {
  locallyStoreSetValuedMap(glosses, localStorageKey);
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

export function getGlosses(): {[key: string]: string[]}
{
  return convertDictionary(glosses);
}

export function upgradeGlosses(object: {[key: string]: string[]}): void
{
  updateGlossesLexicon(glosses, object);
  normalizeTranslationLexicon();
}

export function setGlosses(obj: { [key: string]: string[] }): void {
  glosses = objectToSetValuedMap(obj);
}
