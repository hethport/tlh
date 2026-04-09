import { MorphologicalAnalysis, MultiMorphologicalAnalysisWithoutEnclitics as MultiMorph }
  from '../../../model/morphologicalAnalysis';
import update from 'immutability-helper';

type SegmentationModification = (segmentation: string, morphTag: string) => string;

export default function modifySegmentation(segmentationModification: SegmentationModification) {
  const setSegmentation = (morphologicalAnalysis: MorphologicalAnalysis) => {
    switch(morphologicalAnalysis._type) {
      case 'SingleMorphAnalysisWithoutEnclitics': {
        const segmentation = morphologicalAnalysis.referenceWord;
        const morphTag = morphologicalAnalysis.analysis;
        return [update(morphologicalAnalysis,
                      { referenceWord: { $set: segmentationModification(segmentation, morphTag) } })];
      }
      case 'MultiMorphAnalysisWithoutEnclitics': {
        const segmentation = morphologicalAnalysis.referenceWord;
        const { analysisOptions } =  morphologicalAnalysis;
        const morphs: Map<string, MultiMorph> = new Map();
        for (const analysisOption of analysisOptions) {
          const newSegmentation = segmentationModification(segmentation, analysisOption.analysis);
          let morph = morphs.get(newSegmentation);
          if (morph === undefined) {
            morph = update(
              morphologicalAnalysis,
              { referenceWord: { $set: newSegmentation },
                analysisOptions: { $set: [analysisOption] }}
            );
            morphs.set(newSegmentation, morph);
          } else {
            morph.analysisOptions.push(analysisOption);
          }
        }
        return Array.from(morphs.values());
      }
      default:
        return [morphologicalAnalysis];
    }
  };
  return setSegmentation;
}
