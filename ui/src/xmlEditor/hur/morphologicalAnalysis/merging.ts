import { MultiMorphologicalAnalysisWithoutEnclitics } from '../../../model/morphologicalAnalysis';
import { SelectableLetteredAnalysisOption} from '../../../model/analysisOptions';
import update from 'immutability-helper';

const collator = Intl.Collator('en');
const compare = collator.compare;

export function mergeMultiMorphologicalAnalyses(
  first: MultiMorphologicalAnalysisWithoutEnclitics,
  second: MultiMorphologicalAnalysisWithoutEnclitics):
  MultiMorphologicalAnalysisWithoutEnclitics {
  const analysisOptions: SelectableLetteredAnalysisOption[] =
    first.analysisOptions.concat(second.analysisOptions);
  analysisOptions.sort((firstOption, secondOption) =>
    compare(firstOption.letter, secondOption.letter));
  return update(first, { analysisOptions: { $set: analysisOptions } });
}
