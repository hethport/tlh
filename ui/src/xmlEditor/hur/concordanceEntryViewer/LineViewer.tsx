import { JSX } from 'react';
import { Line } from '../corpus/lineConstructor';
import { Word } from '../corpus/wordConstructor';
import { WordViewer } from './WordViewer';

interface IProps {
  line: Line;
}

export function LineViewer({ line }: IProps): JSX.Element {
  return (
    <div className="corpus-line">
      {line
        .filter((word: Word) =>
          word.transliteration !== undefined &&
          !word.transliteration.startsWith('<AO:ParagrNr'))
        .map((word: Word, index: number) => <WordViewer key={index} word={word} />)}
    </div>
  );
}
