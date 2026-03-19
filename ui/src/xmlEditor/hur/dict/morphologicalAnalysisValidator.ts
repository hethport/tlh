import { formIsFragment } from '../common/utils';
import { getPos } from '../partsOfSpeech/partsOfSpeech';
import { splitSegmentation } from '../common/morphemeSplitting';
import { containsBrackets } from '../common/brackets';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';

const sep = /(?<!\()-(?!\))|=/;

function haveMatchingNumberOfMorphemes(segmentation: string, analysis: string) {
  const morphemes = splitSegmentation(segmentation);
  const grammaticalMorphemes = morphemes.slice(1)
    .map(([morpheme]) => morpheme)
    .filter((grammaticalMorpheme: string) => !formIsFragment(grammaticalMorpheme));
  const segmentationLength = grammaticalMorphemes.length + 1;
  const morphemeLabels = analysis.split(sep)
    .filter(label => label !== '' && !formIsFragment(label));
  const analysisLength = morphemeLabels.filter(tag => tag !== '.ABS').length;
  return segmentationLength === analysisLength + 1
      || segmentationLength === analysisLength
      && (analysis.startsWith('=') || analysis === '');
}

export function areCorrect(segmentation: string, morphTag: string): boolean {
  return !morphTag.startsWith('-') && haveMatchingNumberOfMorphemes(segmentation, morphTag); 
}

export function isValidForm(form: string): boolean {
  if (formIsFragment(form)) {
    return false;
  }
  return true;
}

const inflecting = new Set<string>(['noun', 'verb', 'PRON', 'NF']);

/*
 * Determine whether a morphological analysis is valid
 * for a word with the given transcription.
 */
export function isValidFor(ma: MorphologicalAnalysis, transcription: string): boolean {
  // Analyses with brackets should never be proposed for words which contain no brackets.
  return !(containsBrackets(ma.referenceWord) && !containsBrackets(transcription));
}

export function isValid(analysis: string): boolean {
  const fields: string[] = analysis.split('@').map(field => field.trim());
  if (fields.length !== 5) {
    return false;
  }
  const segmentation = fields[0];
  const gloss = fields[1];
  const morphTag = fields[2];
  const pos = fields[3];
  if (!isValidForm(segmentation)) {
    return false;
  }
  if (gloss === '' || morphTag === '' && inflecting.has(pos)) {
    return false;
  }
  if (!(morphTag.startsWith('{') && morphTag.endsWith('}'))) {
    if (!areCorrect(segmentation, morphTag)) {
      return false;
    }
  }
  return true;
}
function normalizeOption(option: string): string {
  if (option.startsWith('-')) {
    return option.substring(1);
  }
  return option;
}
function normalizePairs(pairs: string[], unify: boolean, segmentation: string,
  ensureMatchingNumberOfMorphemes: boolean): string[][] {
  let result: string[][] = pairs.map((option: string) => option.split('→').map(s => s.trim()));
  if (unify) {
    result = result.filter((pair: string[]) => pair[1] !== '');
    if (ensureMatchingNumberOfMorphemes) {
      result = result.filter(pair => haveMatchingNumberOfMorphemes(segmentation, pair[1]));
    }
  }
  return result;
}
function normalizeMorphTag(morphTag: string, unify: boolean, segmentation: string,
  ensureMatchingNumberOfMorphemes: boolean): string | null {
  if (morphTag.startsWith('{') && morphTag.endsWith('}')) {
    const options: string[][] = normalizePairs(morphTag
      .substring(1, morphTag.length - 1)
      .replaceAll(' ', '')
      .replaceAll('\n', '')
      .split('}{'), unify, segmentation, ensureMatchingNumberOfMorphemes);
    if (options.length === 0) {
      return null;
    }
    if (unify && options.length === 1) {
      return normalizeOption(options[0][1].trim());
    }
    else {
      return '{ ' + options
        .map((pair: string[]) => pair[0] + ' → ' + normalizeOption(pair[1]))
        .join('} { ') +
      '}';
    }
  } else {
    return normalizeOption(morphTag);
  }
}
export function normalize(analysis: string, unify: boolean,
  ensureMatchingNumberOfMorphemes: boolean): string | null {
  const fields: string[] = analysis.split('@').map(field => field.trim());
  const segmentation = fields[0];
  const translation = fields[1];
  const morphTag = fields[2];
  const pos = fields[3];
  const normalizedMorphTag = normalizeMorphTag(morphTag, unify, segmentation,
    ensureMatchingNumberOfMorphemes);
  if (normalizedMorphTag === null) {
    return null;
  }
  fields[2] = normalizedMorphTag;
  const normalizedPos = getPos(pos, normalizedMorphTag, translation);
  fields[3] = normalizedPos;
  return fields.join(' @ ');
}
