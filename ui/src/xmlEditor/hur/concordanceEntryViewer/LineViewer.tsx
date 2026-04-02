import { JSX } from 'react';
import { Line } from '../corpus/lineType';
import { Word } from '../corpus/wordType';
import { WordViewer } from './WordViewer';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';

interface IProps {
  line: Line;
  highlightedMa?: MorphologicalAnalysis;
}

export function LineViewer({ line, highlightedMa }: IProps): JSX.Element {
  return (
    <div className="corpus-line">
      {line
        .filter((word: Word) =>
          word.transliteration !== undefined &&
          !word.transliteration.startsWith('<AO:ParagrNr'))
        .map((word: Word, index: number) => <WordViewer key={index} word={word}
                                                        highlightedMa={highlightedMa} />)}
    </div>
  );
}
