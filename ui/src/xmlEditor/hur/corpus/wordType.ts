import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';

export type Word = {
  transliteration: string;
  segmentation: string;
  gloss: string;
}

/*
 * INFORMATIONAL REQUESTS
 */

export function hasGivenAnalysis(word: Word, gloss: string, morphologicalAnalysis: MorphologicalAnalysis): boolean {
  const hasGivenSegmentation = word.segmentation === morphologicalAnalysis.referenceWord;
  const hasGivenGloss = word.gloss === gloss;
  return hasGivenSegmentation && hasGivenGloss;
}
