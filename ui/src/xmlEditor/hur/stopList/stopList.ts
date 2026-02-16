import { Dictionary } from '../dict/dictionary';
import { loadSetValuedMapFromLocalStorage, locallyStoreSetValuedMap }
  from '../dictLocalStorage/localStorageUtils';
import { MorphologicalAnalysis, writeMorphAnalysisValue }
  from '../../../model/morphologicalAnalysis';
import { add, has } from '../common/utils';

const localStorageKey = 'HurrianMorphologicalAnalysisStopList';
const stopList: Dictionary = loadSetValuedMapFromLocalStorage(localStorageKey);
function locallyStoreHurrianStopList(): void {
  locallyStoreSetValuedMap(stopList, localStorageKey);
}

export function addToTheStopListFor(ma: MorphologicalAnalysis, transcription: string): void {
  const analysis = writeMorphAnalysisValue(ma);
  add(stopList, transcription, analysis);
  locallyStoreHurrianStopList();
}

export function isOnTheStopListFor(ma: MorphologicalAnalysis, transcription: string): boolean {
  const analysis = writeMorphAnalysisValue(ma);
  return has(stopList, transcription, analysis);
}

export function getGlobalStopList(): Dictionary {
  return stopList;
}
