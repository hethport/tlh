import { JSX } from 'react';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { getMorphTags } from '../common/utils';
import { makeGloss } from '../common/auxiliary';

interface IProps {
  morphologicalAnalysis: MorphologicalAnalysis;
}

export function MorphologicalAnalysisViewer({ morphologicalAnalysis }: IProps): JSX.Element {
  const { referenceWord, translation, paradigmClass } = morphologicalAnalysis;
  const morphTags = getMorphTags(morphologicalAnalysis) || [];
  
  return (
    <pre className="morphological-analysis-viewer">
      <label>{referenceWord}</label>
      {(morphTags).map((tag: string, index: number) => {
          const gloss = makeGloss(translation, tag);
          return (
            <label key={index}>{gloss}</label>
          );
        })
      }
      <label>{paradigmClass}</label>
      <br />
    </pre>
  );
}
