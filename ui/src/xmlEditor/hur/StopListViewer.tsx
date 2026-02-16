import { Dictionary } from './dict/dictionary';
import { JSX } from 'react';
import { Entry } from './dictionaryViewer/Wordform';
import { extractEntries } from './dict/dictUtils';
import { WordlistViewer } from './WordlistViewer';

interface IProps {
  getInitialStopList: () => Dictionary;
}

export function StopListViewer({ getInitialStopList }: IProps): JSX.Element {
  const stopList = getInitialStopList();
  const entries: Entry[] = extractEntries(stopList);
  return (
    <WordlistViewer entries={entries}/>
  );
}
