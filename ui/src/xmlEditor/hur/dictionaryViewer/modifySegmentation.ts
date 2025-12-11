import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import update from 'immutability-helper';

type SegmentationModification = (segmentation: string, morphTag: string) => string;

export default function modifySegmentation(segmentationModification: SegmentationModification) {
  const setSegmentation = (morphologicalAnalysis: MorphologicalAnalysis) => {
    switch(morphologicalAnalysis._type) {
      case 'SingleMorphAnalysisWithoutEnclitics': {
        const segmentation = morphologicalAnalysis.referenceWord;
        const morphTag = morphologicalAnalysis.analysis;
        return update(morphologicalAnalysis,
                      { referenceWord: { $set: segmentationModification(segmentation, morphTag) } });
      }
      case 'MultiMorphAnalysisWithoutEnclitics': {
        const segmentation = morphologicalAnalysis.referenceWord;
        const { analysisOptions } =  morphologicalAnalysis;
        const newSegmentations: string[] = analysisOptions.map(option =>
          segmentationModification(segmentation, option.analysis)
        );
        if (newSegmentations.length > 1 && newSegmentations.slice(1).every(newSegmentation =>
          newSegmentation === newSegmentations[0])) {
          return update(morphologicalAnalysis,
            { referenceWord: { $set: newSegmentations[0] } });
        } else {
          return morphologicalAnalysis;
        }
      }
      default:
        return morphologicalAnalysis;
    }
  };
  return setSegmentation;
}
