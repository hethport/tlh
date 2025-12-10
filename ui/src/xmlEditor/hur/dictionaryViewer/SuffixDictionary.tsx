import { JSX, useState, useEffect } from 'react';
import { groupByMany } from '../common/utils';
import { StemViewer, Stem } from './StemViewer';
import { Entry } from './Wordform';
import { DictionaryDownloader } from '../dict/files/DictionaryDownloader';
import { ChangesDownloader } from '../changes/ChangesDownloader';
import { writeMorphAnalysisValue } from '../../../model/morphologicalAnalysis';
import { SetDictionary, getGlobalDictionary } from '../dict/dictionary';
import { compare } from '../common/comparison';
import { blueButtonClasses } from '../../../defaultDesign';
import { useTranslation } from 'react-i18next';
import { DictionaryUploader } from '../dict/files/DictionaryUploader';
import { getGrammaticalMorphemes } from './morphemics';

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
  
  const {t} = useTranslation('common');
  
  const [unfolded, setUnfolded] = useState(false);
  const [allUnfolded, setAllUnfolded] = useState(false);
  const toggleAllUnfolded = () => setAllUnfolded((value: boolean) => !value);
  
  useEffect(() => {
    setUnfolded(true);
  });
  
  const grouped = groupByMany(entries, keyFunc, valueFunc);
  
  const stems = Array.from(grouped.keys()).sort(compare);
  
  return (
    <div className="grid grid-cols-2 gap-2 my-2 uneven-columns">
      <div className="mt-2">
        Click on the button &quot;&#8744;&quot; or a stem&apos;s number to see its derivatives and inflected forms. <br /> 
        Click on a similar button next to a word to see its attestations. <br />
        <br />
        {stems.map((stem: string, index: number) => {
          const group = grouped.get(stem);
          const entries: Entry[] = group === undefined ? [] : Array.from(group);
          const stemObject = new Stem((index + 1).toString() + '.@' + stem);
          const key = entries
            .map(entry => writeMorphAnalysisValue(entry.morphologicalAnalysis))
            .join('|');
          const setEnglishTranslation = () => {
            // do nothing
          };

          const updateEnglishTranslationKey = () => {
            // do nothing
          };
          return (
            <StemViewer
              stem={stemObject}
              initialEntries={entries}
              key={key} 
              setDictionary={setDictionary}
              initialUnfolded={unfolded}
              allUnfolded={allUnfolded}
              englishTranslation=""
              onEnglishTranslationBlur={setEnglishTranslation}
              updateEnglishTranslationKey={updateEnglishTranslationKey}/>
          );
        })}
      </div>
      <div>
        <div className="button-stack">
          <DictionaryDownloader />
          <ChangesDownloader />
          <button type="button" className={blueButtonClasses} onClick={toggleAllUnfolded}>
            {allUnfolded ? t('foldAll') : t('unfoldAll')}
          </button>
          <DictionaryUploader onUpload={() => {
            const globalDictionary = getGlobalDictionary();
            setDictionary(() => globalDictionary);
          }}/>
        </div>
      </div>
    </div>
  );
}
