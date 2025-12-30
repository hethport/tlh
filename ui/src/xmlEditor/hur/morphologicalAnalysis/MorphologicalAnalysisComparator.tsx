import { JSX } from 'react';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { SelectableLetteredAnalysisOption } from '../../../model/analysisOptions';
import { MorphologicalAnalysisViewer } from './MorphologicalAnalysisViewer';

const rightArrow = <>&#10159;</>;
const movedMorphTagSymbol = '';

interface IProps {
  source: MorphologicalAnalysis;
  targets: Array<MorphologicalAnalysis | string>;
}

export function MorphologicalAnalysisComparator({ source, targets }: IProps): JSX.Element {
  
  return (
    <div className="display: table-row">
      <div className="display: table-cell">
        <MorphologicalAnalysisViewer morphologicalAnalysis={source} />
      </div>
      {targets.map((target: MorphologicalAnalysis | string) =>
        typeof target === 'string' ?
        (<>
          <div className="display: table-cell"></div>
          <div className="display: table-cell">{target}</div>
        </>) :
        (<>
          <div className="display: table-cell">
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
               source.analysisOptions.map(
                (option: SelectableLetteredAnalysisOption, index: number) =>
                  (<>
                  {(option.analysis !== (target.analysisOptions[index] || movedMorphTagSymbol).analysis ||
                    source.translation !== target.translation) &&
                    rightArrow} <br/>
                  </>)
                )
            }
            {source.paradigmClass !== target.paradigmClass && rightArrow} <br/>
          </div>
          <div className="display: table-cell">
            <MorphologicalAnalysisViewer morphologicalAnalysis={target} />
          </div>
        </>)
      )}
      <br/>
    </div>
  );
}
