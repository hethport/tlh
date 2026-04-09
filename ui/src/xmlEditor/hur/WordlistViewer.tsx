import { Entry, WordformElement } from './dictionaryViewer/Wordform';
import { JSX } from 'react';
import { writeMorphAnalysisValue } from '../../model/morphologicalAnalysis';
import { useTranslation } from 'react-i18next';

interface IProps {
  entries: Entry[];
  removeEntry: (entry: Entry) => void;
}

function doNothing(): void {
  // Do nothing
}

export function WordlistViewer({ entries, removeEntry }: IProps): JSX.Element {

  const { t } = useTranslation('common');
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
        <button type="button" className="p-2 rounded-r border border-slate-500 remove-button"
          onClick={() => removeEntry(entry)}
          title={t('removeFromTheList')}>
          &#10754;
        </button>
      </div>);
    })}
    </div>
  );
}
