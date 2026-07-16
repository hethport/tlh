import {Dictionary} from '../dict/dictionary';
import {readMorphAnalysisValue} from '../morphologicalAnalysis/auxiliary';
import {getStem} from '../common/splitter';
import {getKey} from './glossProvider';
import {add} from '../common/utils';

export type TranslationMap = Map<string, Set<string>>;

export function getTranslationMap(dictionary: Dictionary): TranslationMap {
  const translationMap: TranslationMap = new Map();
  for (const analyses of dictionary.values()) {
    for (const analysis of analyses) {
      const ma = readMorphAnalysisValue(analysis);
      if (ma !== undefined) {
        const {referenceWord, translation} = ma;
        const stem = getStem(referenceWord);
        const pos = ma.paradigmClass;
        const key = getKey(stem, pos);
        add(translationMap, key, translation);
      }
    }
  }
  return translationMap;
}
