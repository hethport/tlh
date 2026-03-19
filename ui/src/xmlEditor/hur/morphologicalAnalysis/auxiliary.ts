import { MorphologicalAnalysis, readMorphologicalAnalysis,
         SingleMorphologicalAnalysisWithoutEnclitics,
         MultiMorphologicalAnalysisWithoutEnclitics }
  from '../../../model/morphologicalAnalysis';

export function readMorphAnalysisValue(value: string): MorphologicalAnalysis | undefined {
  return readMorphologicalAnalysis(1, value, []);
}

export function isSelected(morphologicalAnalysis: MorphologicalAnalysis): boolean {
  switch (morphologicalAnalysis._type) {
    case 'SingleMorphAnalysisWithoutEnclitics':
      return morphologicalAnalysis.selected;
    case 'MultiMorphAnalysisWithoutEnclitics':
      return morphologicalAnalysis.analysisOptions.some(analysisOption => analysisOption.selected);
    default:
      return false;
  }
}

export function getFirstSelectedMorphTag(morphologicalAnalysis: MorphologicalAnalysis):
  string | undefined {
  switch (morphologicalAnalysis._type) {
    case 'SingleMorphAnalysisWithoutEnclitics': {
      return morphologicalAnalysis.analysis;
    }
    case 'MultiMorphAnalysisWithoutEnclitics': {
      const analysisOption = morphologicalAnalysis
        .analysisOptions
        .find(analysisOption => analysisOption.selected);
      if (analysisOption !== undefined) {
        return analysisOption.analysis;
      } else {
        return undefined;
      }
    }
    default:
      return undefined;
  }
}

export function getMorphTags(analysis: MorphologicalAnalysis): string[] {
  switch (analysis._type) {
    case 'SingleMorphAnalysisWithoutEnclitics':
      return [analysis.analysis];
    case 'MultiMorphAnalysisWithoutEnclitics':
      return analysis.analysisOptions.map(({analysis}) => analysis);
    default:
      return [];
  }
}

function convertToSingle(multi: MultiMorphologicalAnalysisWithoutEnclitics): 
  SingleMorphologicalAnalysisWithoutEnclitics {
  const { number, referenceWord, translation, paradigmClass, determinative, encliticsAnalysis } = multi;
  const analysisOption = multi.analysisOptions[0];
  const { analysis, selected } = analysisOption;
  const single: SingleMorphologicalAnalysisWithoutEnclitics = {
    _type: 'SingleMorphAnalysisWithoutEnclitics',
    number,
    referenceWord,
    translation,
    analysis,
    paradigmClass,
    determinative,
    encliticsAnalysis,
    selected
  };
  return single;
}

export function convertToSingleIfAppropriate(ma: MorphologicalAnalysis): MorphologicalAnalysis {
  if (ma._type === 'MultiMorphAnalysisWithoutEnclitics' && ma.analysisOptions.length === 1) {
    return convertToSingle(ma);
  } else {
    return ma;
  }
}
