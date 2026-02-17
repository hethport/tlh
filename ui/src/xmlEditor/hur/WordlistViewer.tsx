import { Entry, WordformElement } from './dictionaryViewer/Wordform';
import { JSX } from 'react';
import { writeMorphAnalysisValue } from '../../model/morphologicalAnalysis';

interface IProps {
  entries: Entry[];
  removeEntry: (entry: Entry) => void;
}

function doNothing(): void {
  // Do nothing
}

export function WordlistViewer({ entries, removeEntry }: IProps): JSX.Element {
  return (
    <div className="mt-2">
    {entries.map((entry: Entry) => {
      const { transcriptions, initialMorphologicalAnalysis } = entry;
      const analysis = writeMorphAnalysisValue(initialMorphologicalAnalysis);
      const key = transcriptions.join(',') + '@' + analysis;
      return (<div className="flex flex-row" key={key}>
        <WordformElement
          entry={entry}
          handleSegmentationInput={doNothing}
          handleSegmentationBlur={doNothing}
          handleAnalysisInput={doNothing}
          handleAnalysisBlur={doNothing}
          initialShowAttestations={false}/>
        <button type="button" className="p-2 rounded-r border border-slate-500"
          onClick={() => removeEntry(entry)}
          title={'removeFromTheList'}>
          &#10754;
        </button>
      </div>);
    })}
    </div>
  );
}
