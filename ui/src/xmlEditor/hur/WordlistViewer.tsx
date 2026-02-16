import { Entry, WordformElement } from './dictionaryViewer/Wordform';
import { JSX } from 'react';
import { writeMorphAnalysisValue } from '../../model/morphologicalAnalysis';

interface IProps {
  entries: Entry[];
}

function doNothing(): void {
  // Do nothing
}

export function WordlistViewer({ entries }: IProps): JSX.Element {
  return (
    <div>
    {entries.map((entry: Entry) => {
      const { transcriptions, initialMorphologicalAnalysis } = entry;
      const analysis = writeMorphAnalysisValue(initialMorphologicalAnalysis);
      const key = transcriptions.join(',') + '@' + analysis;
      return (<WordformElement
        key={key}
        entry={entry}
        handleSegmentationInput={doNothing}
        handleSegmentationBlur={doNothing}
        handleAnalysisInput={doNothing}
        handleAnalysisBlur={doNothing}
        initialShowAttestations={false}
      />);
    })}
    </div>
  );
}
