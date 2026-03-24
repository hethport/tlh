import { LookupConfig } from '../../lookupConfig';
import { removeMacron } from '../common/utils';

function convertLabialFricativesToStops(word: string): string {
  return word.replaceAll('f', 'p').replaceAll('v', 'b');
}

function convertMidVowelsToHigh(word: string): string {
  return word.replaceAll('e', 'i').replaceAll('o', 'u')
             .replaceAll('ii', 'i');
}

function convertVoicedConsonantsToVoiceless(word: string): string {
  return word.replaceAll('b', 'p')
             .replaceAll('d', 't')
             .replaceAll('g', 'k')
             .replaceAll('v', 'f')
             .replaceAll('z', 's')
             .replaceAll('ž', 'š')
             .replaceAll('ġ', 'ḫ');
}

export function simplifyTranscription(transcription: string, lookupConfig: LookupConfig): string {
  const { ignorePlene, mergeLabials, mergeMidAndHighVowels, ignoreVoice } = lookupConfig;
  let simplifiedTranscription = transcription;
  if (ignorePlene) {
    simplifiedTranscription = removeMacron(simplifiedTranscription);
  }
  if (mergeLabials) {
    simplifiedTranscription = convertLabialFricativesToStops(simplifiedTranscription);
  }
  if (mergeMidAndHighVowels) {
    simplifiedTranscription = convertMidVowelsToHigh(simplifiedTranscription);
  }
  if (ignoreVoice) {
    simplifiedTranscription = convertVoicedConsonantsToVoiceless(simplifiedTranscription);
  }
  return simplifiedTranscription;
}
