import {GlossMap, getGlossMap, getKey} from './getGlossMap';
import {getGlobalDictionary} from '../dict/dictionary';

/**
 * Generates a grammatical gloss map from
 * the global dictionary.
 */
function generateGrammaticalGlossMap(): GlossMap {
  return getGlossMap(getGlobalDictionary());
}

let glossMap: GlossMap = generateGrammaticalGlossMap();

/**
 * Regenerates the grammatical gloss map from
 * the global dictionary.
 * Should be called after dictionary
 * upload or download.
 */
export function regenerateGrammaticalGlossMap(): void {
  glossMap = generateGrammaticalGlossMap();
}

/**
 * Retrives the set of possible glosses for a
 * grammatical morpheme with the given form.
 * The morpheme form should start with a morpheme
 * boundary ("-" or "=").
 */
export function getGrammaticalGlosses(morphemeForm: string, pos: string): string[] {
  const key = getKey(morphemeForm, pos);
  const glosses = glossMap.get(key);
  if (glosses === undefined) {
    return [];
  } else {
    return Array.from(glosses);
  }
}
