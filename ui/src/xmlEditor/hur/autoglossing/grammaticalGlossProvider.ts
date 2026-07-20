import {getKey, addGlossesFromMorphology} from './getGlossMap';
import {glossMap} from '../dict/dictionary';
import {MorphologicalAnalysis} from '../../../model/morphologicalAnalysis';

/**
 * Updates the global grammatical gloss map
 * using the given morphological analysis.
 */
export function addToGrammaticalGlossMap(ma: MorphologicalAnalysis): void {
  addGlossesFromMorphology(glossMap, ma);
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
