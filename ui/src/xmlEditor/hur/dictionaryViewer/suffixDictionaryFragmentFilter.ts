import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { formIsFragment } from '../common/utils';

export function shouldBeInSuffixDict(ma: MorphologicalAnalysis, fragmInSuffixDict: boolean): boolean {
  if (fragmInSuffixDict) {
    return true;
  } else {
    const segmentation = ma.referenceWord;
    return !formIsFragment(segmentation);
  }
}
