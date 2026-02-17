import { Dictionary } from './dict/dictionary';
import { JSX, useState, useEffect } from 'react';
import { Entry } from './dictionaryViewer/Wordform';
import { extractEntries, removeEmptyEntries } from './dict/dictUtils';
import { WordlistViewer } from './WordlistViewer';
import { StopListDownloader } from './stopList/files/StopListDownloader';
import { StopListUploader } from './stopList/files/StopListUploader';
import update from 'immutability-helper';
import { writeMorphAnalysisValue } from '../../model/morphologicalAnalysis';
import { setGlobalStopList } from './stopList/stopList';

interface IProps {
  getInitialStopList: () => Dictionary;
}

export function StopListViewer({ getInitialStopList }: IProps): JSX.Element {
  const initialStopList = getInitialStopList();
  const [stopList, setStopList] = useState(initialStopList);
  useEffect(() => setGlobalStopList(stopList), [stopList]);
  const entries: Entry[] = extractEntries(stopList);
  const removeEntry = (entry: Entry) => {
    const { transcriptions, initialMorphologicalAnalysis } = entry;
    const transcription = transcriptions[0];
    const analysis = writeMorphAnalysisValue(initialMorphologicalAnalysis);
    setStopList((stopList: Dictionary) =>
      removeEmptyEntries(update(
        stopList,
        { [transcription]: { $remove: [analysis] } }
      ))
    );
  };
  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-2 gap-2 my-2 uneven-columns">
        <WordlistViewer entries={entries}
                        removeEntry={removeEntry}/>
        <div>
          <div className="button-stack">
            <StopListDownloader />
            <StopListUploader onUpload={() => {
              const globalStopList = getInitialStopList();
              setStopList(() => globalStopList);
            }}/>
          </div>
        </div>
      </div>
    </div>
  );
}
