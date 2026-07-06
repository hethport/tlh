import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { Spec } from 'immutability-helper';
import { getStem } from '../common/splitter';
import { retrieveGloss, joinTranslationWords } from './glossProvider';

const stemWithFinalBoundary = /^[^-=]+[-=]$/;
function stemWasTypedInCompletely(segmentation: string) {
  return stemWithFinalBoundary.test(segmentation);
}

// Falls der Benutzer eine neue Segmentierung eingegeben hat, muss diese neu analysiert werden.
export function updateHurrianAnalysis(referenceWord: string, paradigmClass: string): Spec<MorphologicalAnalysis> {
  if (stemWasTypedInCompletely(referenceWord)) {
    const stem = getStem(referenceWord);
    const pos = paradigmClass;
    const glosses: Set<string> | null = retrieveGloss(stem, pos);
    if (glosses != null) {
      const newTranslation: string = Array.from(glosses).sort().join('; ');
      return {
        referenceWord: { $set: referenceWord },
        translation: { $set: newTranslation }
      };
    }
  }
  return {
    referenceWord: { $set: referenceWord },
  };
}

export function updateHurrianPartOfSpeech(segmentation: string, translation: string, partOfSpeech: string): Spec<MorphologicalAnalysis> {
  if (translation === '') {
    const stem = getStem(segmentation);
    const glosses = retrieveGloss(stem, partOfSpeech);
    if (glosses !== null) {
      const newTranslation = joinTranslationWords(Array.from(glosses));
      return {
        paradigmClass: { $set: partOfSpeech },
        translation: { $set: newTranslation }
      };
    }
  }
  return {
    paradigmClass: { $set: partOfSpeech }
  };
}
