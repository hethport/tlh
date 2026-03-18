import { MorphologicalAnalysis, readMorphologicalAnalysis,
         SingleMorphologicalAnalysisWithoutEnclitics,
         MultiMorphologicalAnalysisWithoutEnclitics }
  from '../../../model/morphologicalAnalysis';
import { compare, englishCompare, germanCompare, AlphabetizationOptions }
  from '../common/comparison';

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

export function getJoinedMorphTags(analysis: MorphologicalAnalysis): string {
  const morphTags = getMorphTags(analysis);
  return morphTags.join('$');
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

const alphabetizationOptions: AlphabetizationOptions = {
  alphabetizeIAsE: true,
  alphabetizeOAsU: true,
  alphabetizeVoicedConsonantsAsVoiceless: true,
};

export function compareMorphologicalAnalyses(ma1: MorphologicalAnalysis, ma2: MorphologicalAnalysis): number {
  const segmLenDiff = ma1.referenceWord.length - ma2.referenceWord.length;
  if (segmLenDiff !== 0) {
    return segmLenDiff;
  }
  const segmComp = compare(ma1.referenceWord, ma2.referenceWord, alphabetizationOptions);
  if (segmComp !== 0) {
    return segmComp;
  }
  const transComp = germanCompare(ma1.translation, ma2.translation);
  if (transComp !== 0) {
    return transComp;
  }
  const posComp = englishCompare(ma1.paradigmClass, ma2.paradigmClass);
  if (posComp !== 0) {
    return posComp;
  }
  return englishCompare(getJoinedMorphTags(ma1), getJoinedMorphTags(ma2));
}
