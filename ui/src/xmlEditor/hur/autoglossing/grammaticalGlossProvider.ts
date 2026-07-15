import {GlossMap, getGlossMap} from './getGlossMap';
import {getGlobalDictionary} from '../dict/dictionary';

const glossMap: GlossMap = getGlossMap(getGlobalDictionary());

/**
 * Retrives the set of possible glosses for a
 * grammatical morpheme with the given form.
 * The morpheme form should start with a morpheme
 * boundary ("-" or "=").
 */
export function getGrammaticalGlosses(morphemeForm: string): string[] {
  const glosses = glossMap.get(morphemeForm);
  if (glosses === undefined) {
    return [];
  } else {
    return Array.from(glosses);
  }
}
