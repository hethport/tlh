import {MorphologicalAnalysis} from '../../../model/morphologicalAnalysis';
import {SelectableLetteredAnalysisOption} from '../../../model/analysisOptions';
import {getPartsOfSpeech} from '../partsOfSpeech/partsOfSpeech';

const hurrianLanguageMarker = 'HURR';
const hurrianLanguageSymbol = 'Hur';
const partsOfSpeech = new Set(getPartsOfSpeech());

/**
 * Determines whether a morphological tag marks Hurrian language.
 */
function marksHurrian(morphTag: string): boolean {
  return morphTag.includes(hurrianLanguageMarker);
}

/**
 * Determines whether an analysis option is selected.
 */
function isSelected(option: SelectableLetteredAnalysisOption): boolean {
  return option.selected;
}

/**
 * Determines whether an analysis option is selected and marks Hurrian language.
 */
function isSelectedAndMarksHurrian(option: SelectableLetteredAnalysisOption): boolean {
  return option.selected && marksHurrian(option.analysis);
}

/**
 * Determines whether a morphological analysis of a Hurrian word
 * is of the older HFR annotation style (such analyses are
 * being replaced by newer Tive-style ones).
 */
export function isDeprecated(ma: MorphologicalAnalysis, language: string): boolean {
  return marksHurrianLanguage(ma) || (
    language === hurrianLanguageSymbol &&
    (containsLemma(ma) || containsParadigmClass(ma))
  );
}

/**
 * Determines whether an analysis marks the Hurrian laguage in the morphological tag.
 */
function marksHurrianLanguage(ma: MorphologicalAnalysis): boolean {
  if (ma._type === 'SingleMorphAnalysisWithoutEnclitics' ||
      ma._type === 'SingleMorphAnalysisWithSingleEnclitics')  {
    return ma.selected && marksHurrian(ma.analysis);
  } else if (ma._type === 'SingleMorphAnalysisWithMultiEnclitics') {
    return marksHurrian(ma.analysis) &&
           ma.encliticsAnalysis.analysisOptions.some(isSelected);
  } else if (ma._type === 'MultiMorphAnalysisWithoutEnclitics' ||
             ma._type === 'MultiMorphAnalysisWithSingleEnclitics') {
    return ma.analysisOptions.some(isSelectedAndMarksHurrian);
  } else if (ma._type === 'MultiMorphAnalysisWithMultiEnclitics') {
    for (const combination of ma.selectedAnalysisCombinations) {
      const option = ma.analysisOptions.find(option => option.letter === combination.morphLetter);
      if (option !== undefined && marksHurrian(option.analysis)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Determines whether a morphological analysis contains a lemma instead
 * of a morphophonemic transcription (morpheme segmentation).
 */
function containsLemma(ma: MorphologicalAnalysis): boolean {
  const lemmaOrSegmentation = ma.referenceWord;
  return lemmaOrSegmentation.endsWith('-') || lemmaOrSegmentation.endsWith('=');
}

/**
 * Determines whether a morphological analysis contains a paradigm class
 * instead of a part of speech.
 */
function containsParadigmClass(ma: MorphologicalAnalysis): boolean {
  const paradigmClassOrPartOfSpeech = ma.paradigmClass;
  return !partsOfSpeech.has(paradigmClassOrPartOfSpeech);
}
