import { JSX } from 'react';
import { Replacement } from './replacement';
import { MorphologicalAnalysisComparator }
  from '../morphologicalAnalysis/MorphologicalAnalysisComparator';

interface IProps {
  replacement: Replacement;
}

export function ReplacementViewer({ replacement }: IProps): JSX.Element {
  const { text, line, source, targets } = replacement;
  return (
    <div className="display: table-row">
      <div className="info-box">{text}</div>
      <div className="info-box">{line}</div>
      <div className="display: table-cell">
        <MorphologicalAnalysisComparator source={source} targets={targets} />
      </div>
    </div>
  );
}
