import { MorphologicalAnalysis, writeMorphAnalysisValue } from '../../../model/morphologicalAnalysis';

export function areLexicallyEquivalent(first: MorphologicalAnalysis, second: MorphologicalAnalysis): boolean {
  return (first.referenceWord === second.referenceWord &&
    first.translation === second.translation &&
    first.paradigmClass === second.paradigmClass &&
    first.determinative === second.determinative);
}

export function areEquivalent(first: MorphologicalAnalysis, second: MorphologicalAnalysis): boolean {
  return writeMorphAnalysisValue(first) === writeMorphAnalysisValue(second);
}
