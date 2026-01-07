import { JSX } from 'react';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { SelectableLetteredAnalysisOption } from '../../../model/analysisOptions';
import { MorphologicalAnalysisViewer } from './MorphologicalAnalysisViewer';

const rightArrow = <>&#10159;</>;

interface IProps {
  source: MorphologicalAnalysis;
  targets: Array<MorphologicalAnalysis | string>;
}

export function MorphologicalAnalysisComparator({ source, targets }: IProps): JSX.Element {
  
  return (
    <div className="flex">
      <div className="first">
        <MorphologicalAnalysisViewer morphologicalAnalysis={source} />
      </div>
      {targets.map((target: MorphologicalAnalysis | string) =>
        typeof target === 'string' ?
        (<>
          <div></div>
          <div>{target}</div>
        </>) :
        (<>
          <div>
            {source.referenceWord !== target.referenceWord && rightArrow} <br/>
            { source._type === 'SingleMorphAnalysisWithoutEnclitics' ?
              (<>
                {target._type === 'SingleMorphAnalysisWithoutEnclitics' &&
                 (source.analysis !== target.analysis ||
                  source.translation !== target.translation) &&
                 rightArrow} <br/>
              </>) :
              (source._type === 'MultiMorphAnalysisWithoutEnclitics' &&
               target._type === 'MultiMorphAnalysisWithoutEnclitics') &&
               target.analysisOptions.map(
                (option: SelectableLetteredAnalysisOption) => {
                  const matchingOption = source.analysisOptions.find(
                    ({ letter }) => letter === option.letter
                  );
                  return (<>
                    {(matchingOption !== undefined &&
                      option.analysis !== matchingOption.analysis ||
                      source.translation !== target.translation) &&
                      rightArrow} <br/>
                  </>);
                })
            }
            {source.paradigmClass !== target.paradigmClass && rightArrow} <br/>
          </div>
          <div>
            <MorphologicalAnalysisViewer morphologicalAnalysis={target} />
          </div>
        </>)
      )}
      <br/>
    </div>
  );
}
