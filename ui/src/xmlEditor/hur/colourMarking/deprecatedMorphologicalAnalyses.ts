import {MorphologicalAnalysis} from '../../../model/morphologicalAnalysis';
import {getMorphTags} from '../morphologicalAnalysis/auxiliary';
import {getPartsOfSpeech} from '../partsOfSpeech/partsOfSpeech';

const hurrianLanguageMarker = 'HURR';
const hurrianLanguageSymbol = 'Hur';
const partsOfSpeech = new Set(getPartsOfSpeech());

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
  const morphTags = getMorphTags(ma);
  return morphTags.some(morphTag => morphTag.includes(hurrianLanguageMarker));
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
