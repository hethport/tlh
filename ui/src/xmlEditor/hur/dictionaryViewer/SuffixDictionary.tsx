import { JSX, useState, useEffect } from 'react';
import { groupByMany } from '../common/utils';
import { GrammaticalMorphemeViewer } from './GrammaticalMorphemeViewer';
import { Entry } from './Wordform';
import { DictionaryDownloader } from '../dict/files/DictionaryDownloader';
import { ChangesDownloader } from '../changes/ChangesDownloader';
import { writeMorphAnalysisValue } from '../../../model/morphologicalAnalysis';
import { SetDictionary, getGlobalDictionary } from '../dict/dictionary';
import { compare } from '../common/comparison';
import { DictionaryUploader } from '../dict/files/DictionaryUploader';
import { getGrammaticalMorphemes } from './morphemics';
import { parseGrammaticalMorpheme } from './grammaticalMorpheme';

interface IProps {
  entries: Entry[];
  setDictionary: SetDictionary;
}

function keyFunc({morphologicalAnalysis}: Entry): string[] {
  return getGrammaticalMorphemes(morphologicalAnalysis).map(gram => gram.toString());
}

function valueFunc(entry: Entry): Entry {
  return entry;
}

export function SuffixDictionary({entries, setDictionary}: IProps): JSX.Element {
  
  const [unfolded, setUnfolded] = useState(false);
  const allUnfolded = false;
  
  useEffect(() => {
    setUnfolded(true);
  });
  
  const grouped = groupByMany(entries, keyFunc, valueFunc);
  
  const grammaticalMorphemeReprs = Array.from(grouped.keys()).sort(compare);
  
  return (
    <div className="grid grid-cols-2 gap-2 my-2 uneven-columns">
      <div className="mt-2">
        Click on the button &quot;&#8744;&quot; or a stem&apos;s number to see its derivatives and inflected forms. <br /> 
        Click on a similar button next to a word to see its attestations. <br />
        <br />
        {grammaticalMorphemeReprs.map((grammaticalMorphemeRepr: string, index: number) => {
          const group = grouped.get(grammaticalMorphemeRepr);
          const entries: Entry[] = group === undefined ? [] : Array.from(group);
          const grammaticalMorpheme = parseGrammaticalMorpheme(grammaticalMorphemeRepr);
          const key = entries
            .map(entry => writeMorphAnalysisValue(entry.morphologicalAnalysis))
            .join('|');
          return (
            <GrammaticalMorphemeViewer
              index={index + 1}
              grammaticalMorpheme={grammaticalMorpheme}
              initialEntries={entries}
              key={key} 
              setDictionary={setDictionary}
              initialUnfolded={unfolded}
              allUnfolded={allUnfolded} />
          );
        })}
      </div>
      <div>
        <div className="button-stack">
          <DictionaryDownloader />
          <ChangesDownloader />
          <DictionaryUploader onUpload={() => {
            const globalDictionary = getGlobalDictionary();
            setDictionary(() => globalDictionary);
          }}/>
        </div>
      </div>
    </div>
  );
}
