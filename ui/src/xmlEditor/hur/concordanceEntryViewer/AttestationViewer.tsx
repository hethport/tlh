import { JSX } from 'react';
import { Attestation } from '../concordance/concordance';
import { Line } from '../corpus/lineType';
import { LineViewer } from './LineViewer';
import { getCTH } from '../concordance/cthProvider';
import { Link } from 'react-router-dom';
import { MorphologicalAnalysis, writeMorphAnalysisValue } from '../../../model/morphologicalAnalysis';

interface IProps {
  attestation: Attestation;
  words: Line;
  highlightedMa?: MorphologicalAnalysis;
}

const viewManuscriptLinkSymbol = <>&#128270;</>;

export function AttestationViewer({ attestation, words, highlightedMa }: IProps): JSX.Element {
  const { text, line } = attestation;
  const textLink = highlightedMa === undefined
    ? `/texts/${encodeURIComponent(text)}`
    : `/texts/${encodeURIComponent(text)}/${encodeURIComponent(writeMorphAnalysisValue(highlightedMa))}`;
  return (
    <div className="display: table-row">
      <div className="info-box">{text}<br/>{getCTH(text)}<br />
        <Link to={textLink}>{viewManuscriptLinkSymbol}</Link>
      </div>
      <div className="info-box">{line}</div>
      <div className="display: table-cell">
        <LineViewer line={words.filter(word => word !== null)}
                    highlightedMa={highlightedMa} />
      </div>
    </div>
  );
}
