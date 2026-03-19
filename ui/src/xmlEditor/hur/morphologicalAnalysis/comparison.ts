import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { getMorphTags } from './auxiliary';
import { compare, englishCompare, germanCompare, AlphabetizationOptions }
  from '../common/comparison';

const alphabetizationOptions: AlphabetizationOptions = {
  alphabetizeIAsE: true,
  alphabetizeOAsU: true,
  alphabetizeVoicedConsonantsAsVoiceless: true,
};

function getJoinedMorphTags(analysis: MorphologicalAnalysis): string {
  const morphTags = getMorphTags(analysis);
  return morphTags.join('$');
}

export function compareMorphologicalAnalyses(ma1: MorphologicalAnalysis, ma2: MorphologicalAnalysis): number {
  const segmLenDiff = ma1.referenceWord.length - ma2.referenceWord.length;
  if (segmLenDiff !== 0) {
    return segmLenDiff;
  }
  const segmComp = compare(ma1.referenceWord, ma2.referenceWord, alphabetizationOptions);
  if (segmComp !== 0) {
    return segmComp;
  }
  const transComp = germanCompare(ma1.translation, ma2.translation);
  if (transComp !== 0) {
    return transComp;
  }
  const posComp = englishCompare(ma1.paradigmClass, ma2.paradigmClass);
  if (posComp !== 0) {
    return posComp;
  }
  return englishCompare(getJoinedMorphTags(ma1), getJoinedMorphTags(ma2));
}
