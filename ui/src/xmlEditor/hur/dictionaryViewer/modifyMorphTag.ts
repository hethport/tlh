import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import update from 'immutability-helper';

type MorphTagModification = (segmentation: string, morphTag: string) => string;

export default function modifyMorphTag(morphTagModification: MorphTagModification) {
  const setMorphTag = (morphologicalAnalysis: MorphologicalAnalysis) => {
    switch(morphologicalAnalysis._type) {
      case 'SingleMorphAnalysisWithoutEnclitics': {
        const segmentation = morphologicalAnalysis.referenceWord;
        const morphTag = morphologicalAnalysis.analysis;
        return update(morphologicalAnalysis,
                      { analysis: { $set: morphTagModification(segmentation, morphTag) } });
      }
      case 'MultiMorphAnalysisWithoutEnclitics': {
        const segmentation = morphologicalAnalysis.referenceWord;
        const { analysisOptions } =  morphologicalAnalysis;
        return update(morphologicalAnalysis, {
          analysisOptions: {
            $set: analysisOptions.map(option => update(option, {
              analysis: {
                $set: morphTagModification(segmentation, option.analysis)
              }
            }))
          }
        });
      }
      default:
        return morphologicalAnalysis;
    }
  };
  return setMorphTag;
}
