import {MorphologicalAnalysis} from '../../../model/morphologicalAnalysis';
import {Dictionary} from '../dict/dictionary';
import {readMorphAnalysisValue} from '../morphologicalAnalysis/auxiliary';
import {getGrammaticalMorphemes} from '../dictionaryViewer/morphemics';
import {removePotentiallyImproperPrefix} from '../common/auxiliary';
import {add} from '../common/utils';

export type GlossMap = Map<string, Set<string>>;

export function getKey(form: string, pos: string): string {
  return form +',' + pos;
}

export function addGlossesFromMorphology(glossMap: GlossMap, ma: MorphologicalAnalysis): void {
  const grammaticalMorphemes = getGrammaticalMorphemes(ma);
  const pos = ma.paradigmClass;
  for (const grammaticalMorpheme of grammaticalMorphemes) {
    const {form, label} = grammaticalMorpheme;
    const key = getKey(form, pos);
    const grammaticalGloss = removePotentiallyImproperPrefix(
      removePotentiallyImproperPrefix(label, '-'), '='
    );
    add(glossMap, key, grammaticalGloss);
  }
}

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
        addGlossesFromMorphology(glossMap, ma);
      }
    }
  }
  return glossMap;
}
