import { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { getText } from '../corpus/corpus';
import { LineViewer } from './LineViewer';

export function TextDisplay(): ReactElement {
  const {text} = useParams<'text'>();
  const lines = text === undefined ? [] : getText(text);
  return (
    <div>{lines.map(({ id, line }) => {
      return (<div className="display: table-row" key={id}>
        <div className="info-box no-line-break">{id}</div>
        <div className="display: table-cell">
          <LineViewer line={line} />
        </div>
      </div>);
    })}
    </div>
  );
}