import { readMorphAnalysisValue } from './auxiliary';
import { writeMorphAnalysisValue } from '../../../model/morphologicalAnalysis';

export function reserializeMorphologicalAnalysis(analysis: string): string | undefined {
  const ma = readMorphAnalysisValue(analysis);
  if (ma === undefined) {
    return undefined;
  } else {
    return writeMorphAnalysisValue(ma);
  }
}
