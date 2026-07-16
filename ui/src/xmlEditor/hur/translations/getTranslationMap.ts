import {MorphologicalAnalysis} from '../../../model/morphologicalAnalysis';
import {Dictionary} from '../dict/dictionary';
import {readMorphAnalysisValue} from '../morphologicalAnalysis/auxiliary';
import {getStem} from '../common/splitter';
import {getKey} from './glossProvider';
import {add} from '../common/utils';

export type TranslationMap = Map<string, Set<string>>;

/**
 * Extracts the stem with its part of speech
 * from a morphological analysis and adds its
 * translation to the translation map.
 */
export function addTranslationFromMorphology(translationMap: TranslationMap, ma: MorphologicalAnalysis): void {
  const {referenceWord, translation} = ma;
  const stem = getStem(referenceWord);
  const pos = ma.paradigmClass;
  const key = getKey(stem, pos);
  add(translationMap, key, translation);
}

export function getTranslationMap(dictionary: Dictionary): TranslationMap {
  const translationMap: TranslationMap = new Map();
  for (const analyses of dictionary.values()) {
    for (const analysis of analyses) {
      const ma = readMorphAnalysisValue(analysis);
      if (ma !== undefined) {
        addTranslationFromMorphology(translationMap, ma);
      }
    }
  }
  return translationMap;
}
