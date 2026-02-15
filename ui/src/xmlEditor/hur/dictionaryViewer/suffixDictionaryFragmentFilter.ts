import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { DictionaryConfig } from '../../dictionaryConfig';
import { dictionaryConfigSelector } from '../../../newStore';
import { useSelector } from 'react-redux';
import { formIsFragment } from '../common/utils';

export function shouldBeInSuffixDict(ma: MorphologicalAnalysis): boolean {
  const currentDictionaryConfig: DictionaryConfig = useSelector(dictionaryConfigSelector);
  const { fragmInSuffixDict } = currentDictionaryConfig;
  if (fragmInSuffixDict) {
    return true;
  } else {
    const segmentation = ma.referenceWord;
    return !formIsFragment(segmentation);
  }
}
