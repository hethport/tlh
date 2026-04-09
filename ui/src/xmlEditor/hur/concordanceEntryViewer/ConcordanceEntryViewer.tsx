import { JSX } from 'react';
import { Attestation } from '../concordance/concordance';
import { Line } from '../corpus/lineType';
import { AttestationViewer } from './AttestationViewer';

interface IProps {
  attestations: Attestation[];
  getLine: (attestation: Attestation) => Line;
}

export function ConcordanceEntryViewer({attestations, getLine}: IProps): JSX.Element {
  return (
    <div className="display: table">
      {attestations.map((attestation: Attestation) => {
        const line = getLine(attestation);
        return (
          <AttestationViewer key={attestation.toString()}
                             attestation={attestation}
                             words={line} />
        );
      })}
    </div>
  );
}
