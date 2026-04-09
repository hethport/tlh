import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';

export type Replacement = {
  text: string;
  line: string;
  source: MorphologicalAnalysis;
  targets: Array<MorphologicalAnalysis | string>;
}
