import { JSX } from 'react';
import { Attestation } from '../concordance/concordance';
import { Line } from '../corpus/lineConstructor';
import { LineViewer } from './LineViewer';
import { getCTH } from '../concordance/cthProvider';
import { Link } from 'react-router-dom';

interface IProps {
  attestation: Attestation;
  words: Line;
}

const viewManuscriptLinkSymbol = <>&#128270;</>;

export function AttestationViewer({ attestation, words }: IProps): JSX.Element {
  const { text, line } = attestation;
  return (
    <div className="display: table-row">
      <div className="info-box">{text}<br/>{getCTH(text)}<br />
        <Link to={`/texts/${encodeURIComponent(text)}`}>{viewManuscriptLinkSymbol}</Link>
      </div>
      <div className="info-box">{line}</div>
      <div className="display: table-cell">
        <LineViewer line={words.filter(word => word !== null)} />
      </div>
    </div>
  );
}
