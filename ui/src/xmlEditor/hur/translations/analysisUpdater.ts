import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { Spec } from 'immutability-helper';
import { getStem } from '../common/splitter';
import { retrieveGloss } from './glossProvider';

const stemWithFinalBoundary = /^[^-=]+[-=]$/;
function stemWasTypedInCompletely(segmentation: string) {
  return stemWithFinalBoundary.test(segmentation);
}

// Falls der Benutzer eine neue Segmentierung eingegeben hat, muss diese neu analysiert werden.
export function updateHurrianAnalysis(referenceWord: string, paradigmClass: string): Spec<MorphologicalAnalysis> {
  if (!stemWasTypedInCompletely(referenceWord)) {
    return {
      referenceWord: { $set: referenceWord },
    };
  }
  const stem = getStem(referenceWord);
  const pos = paradigmClass;
  const glosses: Set<string> | null = retrieveGloss(stem, pos);
  if (glosses === null) {
    return {
      referenceWord: { $set: referenceWord },
    };
  } else {
    const newTranslation: string = Array.from(glosses).sort().join('; ');
    return {
      referenceWord: { $set: referenceWord },
      translation: { $set: newTranslation }
    };
  }
}
