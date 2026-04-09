import { JSX } from 'react';
import { Attestation } from '../concordance/concordance';
import { Line } from '../corpus/lineType';
import { AttestationViewer } from './AttestationViewer';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';

interface IProps {
  attestations: Attestation[];
  getLine: (attestation: Attestation) => Line;
  highlightedMa?: MorphologicalAnalysis;
}

export function ConcordanceEntryViewer({attestations, getLine, highlightedMa}: IProps): JSX.Element {
  return (
    <div className="display: table">
      {attestations.map((attestation: Attestation) => {
        const line = getLine(attestation);
        return (
          <AttestationViewer key={attestation.toString()}
                             attestation={attestation}
                             words={line}
                             highlightedMa={highlightedMa} />
        );
      })}
    </div>
  );
}
