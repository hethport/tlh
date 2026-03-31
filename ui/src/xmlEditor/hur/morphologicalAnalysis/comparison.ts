import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { getMorphTags } from './auxiliary';
import { getNegatedFrequencyDifference } from '../concordance/concordance';
import { compare, englishCompare, germanCompare } from '../common/comparison';
import { removeBrackets } from '../common/brackets';
import { comparePartsOfSpeech } from '../partsOfSpeech/comparison';
import { AlphabetizationConfig } from '../../alphabetizationConfig';

const alphabetizationOptions: AlphabetizationConfig = {
  alphabetizeIAsE: true,
  alphabetizeOAsU: true,
  alphabetizeVoicedConsonantsAsVoiceless: true,
};

function getJoinedMorphTags(analysis: MorphologicalAnalysis): string {
  const morphTags = getMorphTags(analysis);
  return morphTags.join('$');
}

export function compareMorphologicalAnalyses(ma1: MorphologicalAnalysis, ma2: MorphologicalAnalysis): number {
  const negatedFrequencyDifference = getNegatedFrequencyDifference(ma1, ma2);
  if (negatedFrequencyDifference !== 0) {
    return negatedFrequencyDifference;
  }
  const segmLenDiff = removeBrackets(ma1.referenceWord).length - removeBrackets(ma2.referenceWord).length;
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
  const posComp = comparePartsOfSpeech(ma1.paradigmClass, ma2.paradigmClass);
  if (posComp !== 0) {
    return posComp;
  }
  return englishCompare(getJoinedMorphTags(ma1), getJoinedMorphTags(ma2));
}
