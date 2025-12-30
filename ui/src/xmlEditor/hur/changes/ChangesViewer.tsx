import { JSX } from 'react';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import { MorphologicalAnalysisComparator }
  from '../morphologicalAnalysis/MorphologicalAnalysisComparator';

interface IProps {
  changes: Map<string, string[]>;
}

export function ChangesViewer({ changes }: IProps): JSX.Element {
  
  return (
    <div className="display: table">
      {Array.from(changes.entries()).map((entry: [string, string[]], index: number) => {
        const [sourceString, targetStrings] = entry;
        const source = readMorphAnalysisValue(sourceString);
        const targets: Array<MorphologicalAnalysis | string> = targetStrings.map(ma => readMorphAnalysisValue(ma) || ma);
        if (source !== undefined) {
          return (<>
            <MorphologicalAnalysisComparator source={source} targets={targets} key={index} />
            <br/>
          </>);
        } else {
          return (
            <div key={index}>
              At least one analysis is incorrect.<br/>
              Source: &quot;{sourceString}&quot;.<br/>
              Target: &quot;{targetStrings[0]}&quot;.<br/>
            </div>
          );
        }
      })}
    </div>
  );
}
