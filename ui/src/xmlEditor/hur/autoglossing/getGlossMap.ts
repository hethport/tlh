import {Dictionary} from '../dict/dictionary';
import {readMorphAnalysisValue} from '../morphologicalAnalysis/auxiliary';
import {getGrammaticalMorphemes} from '../dictionaryViewer/morphemics';
import {removePotentiallyImproperPrefix} from '../common/auxiliary';
import {add} from '../common/utils';

export type GlossMap = Map<string, Set<string>>;

/**
 * Creates a map from forms of grammatical morphemes
 * to sets of their possible glosses.
 */
export function getGlossMap(dictionary: Dictionary): GlossMap {
  const glossMap: GlossMap = new Map();
  for (const analyses of dictionary.values()) {
    for (const analysis of analyses) {
      const ma = readMorphAnalysisValue(analysis);
      if (ma !== undefined) {
        const grammaticalMorphemes = getGrammaticalMorphemes(ma);
        for (const grammaticalMorpheme of grammaticalMorphemes) {
          const {form, label} = grammaticalMorpheme;
          const grammaticalGloss = removePotentiallyImproperPrefix(
            removePotentiallyImproperPrefix(label, '-'), '='
          );
          add(glossMap, form, grammaticalGloss);
        }
      }
    }
  }
  return glossMap;
}
