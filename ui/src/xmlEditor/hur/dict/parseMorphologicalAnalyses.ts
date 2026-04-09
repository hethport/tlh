import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';

/*
 * Convert a set of morphological analysis string representations
 * to an array of corresponding objects.
 */
export function parseMorphologicalAnalyses(analyses: Set<string>): MorphologicalAnalysis[] {
  const morphologicalAnalyses: MorphologicalAnalysis[] = [];
  for (const analysis of analyses) {
    const morphologicalAnalysis = readMorphAnalysisValue(analysis);
    if (morphologicalAnalysis !== undefined) {
      morphologicalAnalyses.push(morphologicalAnalysis);
    }
  }
  return morphologicalAnalyses;
}
