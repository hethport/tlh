import { basicUpdateHurrianDictionary } from '../dict/dictionary';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import { basicSaveGloss } from '../translations/glossUpdater';
import { containsBrackets, removeBrackets } from '../common/brackets';
import { LookupConfig } from '../../lookupConfig';

export function addMorphologicalAnalysis(transcription: string, analysis: string, lookupConfig: LookupConfig) {
  const morphologicalAnalysis = readMorphAnalysisValue(analysis);
  if (morphologicalAnalysis !== undefined) {
    const segmentation = morphologicalAnalysis.referenceWord;
    let normalizedTranscription;
    // Words should be added to the dictionary without brackets
    // because the same word can occur with brackets
    // in different positions.
    // However, if the segmentation contains brackets,
    // it should only be suggested for words with
    // identical bracketing, so in this case,
    // brackets in the transcription should be preserved.
    if (containsBrackets(transcription) && !containsBrackets(segmentation)) {
      normalizedTranscription = removeBrackets(transcription);
    } else {
      normalizedTranscription = transcription;
    }
    basicUpdateHurrianDictionary(normalizedTranscription, analysis, lookupConfig);
    basicSaveGloss(morphologicalAnalysis);
  }
}
