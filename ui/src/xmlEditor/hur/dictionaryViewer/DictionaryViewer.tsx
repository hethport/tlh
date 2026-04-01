import { JSX, useState, useEffect } from 'react';
import { getStemWithoutFinalOpeningBracket, getStem, openingBracket } from '../common/splitter';
import { groupBy } from '../common/utils';
import { StemViewer, Stem, IStem } from './StemViewer';
import { Entry } from './Wordform';
import { DictionaryDownloader } from '../dict/files/DictionaryDownloader';
import { ChangesDownloader } from '../changes/ChangesDownloader';
import { writeMorphAnalysisValue } from '../../../model/morphologicalAnalysis';
import { SetDictionary, getGlobalDictionary } from '../dict/dictionary';
import { compare } from '../common/comparison';
import { blueButtonClasses } from '../../../defaultDesign';
import { useTranslation } from 'react-i18next';
import { getEnglishTranslationKey, EnglishTranslations, setGlobalEnglishTranslations,
  getGlobalEnglishTranslations
} from '../translations/englishTranslations';
import update from 'immutability-helper';
import { EnglishTranslationsDownloader } from '../translations/files/EnglishTranslationsDownloader';
import { DictionaryUploader } from '../dict/files/DictionaryUploader';
import { EnglishTranslationsUploader } from '../translations/files/EnglishTranslationsUploader';
import { rootMayBeOnlyPartiallyPreserved, shouldBeShownInTheDictionary } from './dictionaryFilter';
import { DictionaryConfig } from '../../dictionaryConfig';
import { LookupConfig } from '../../lookupConfig';
import { dictionaryConfigSelector, alphabetizationConfigSelector, lookupConfigSelector } from '../../../newStore';
import { useSelector } from 'react-redux';
import { SearchQuery, selectMatching } from '../search/searchQuery';
import { SearchForm } from '../search/SearchForm';

interface IProps {
  entries: Entry[];
  initialEnglishTranslations: EnglishTranslations;
  setDictionary: SetDictionary;
}

function keyFunc({morphologicalAnalysis}: Entry): string {
  return [getStemWithoutFinalOpeningBracket(morphologicalAnalysis.referenceWord),
          morphologicalAnalysis.translation,
          morphologicalAnalysis.paradigmClass].join('@');
}

function valueFunc(entry: Entry): Entry {
  return entry;
}

export function DictionaryViewer({entries, setDictionary, initialEnglishTranslations}: IProps): JSX.Element {
  
  const {t} = useTranslation('common');
  
  const [unfolded, setUnfolded] = useState(false);
  const [allUnfolded, setAllUnfolded] = useState(false);
  const toggleAllUnfolded = () => setAllUnfolded((value: boolean) => !value);
  
  useEffect(() => {
    setUnfolded(true);
  });

  const [englishTranslations, setEnglishTranslations] = useState<EnglishTranslations>(initialEnglishTranslations);

  useEffect(() => {
    setGlobalEnglishTranslations(englishTranslations);
  }, [englishTranslations]);

  type StemQuery = SearchQuery<keyof IStem>;
  const initialStemQuery: StemQuery = [
    {
      name: 'form',
      value: '',
      mode: 'substring',
      fuzzy: true,
    },
    {
      name: 'translation',
      value: '',
      mode: 'substring',
      fuzzy: false,
    },
    {
      name: 'pos',
      value: '',
      mode: 'substring',
      fuzzy: false,
    },
  ];
  const [stemQuery, setStemQuery] = useState<StemQuery>(initialStemQuery);

  const currentDictionaryConfig: DictionaryConfig = useSelector(dictionaryConfigSelector);
  const { showUnclearForms } = currentDictionaryConfig;
  const alphabetizationConfig = useSelector(alphabetizationConfigSelector);
  const compareWithOptions = (a: string, b: string) => compare(a, b, alphabetizationConfig);

  const currentLookupConfig: LookupConfig = useSelector(lookupConfigSelector);

  const filteredEntries = entries.filter(entry => {
    const { morphologicalAnalysis } = entry;
    return shouldBeShownInTheDictionary(morphologicalAnalysis, showUnclearForms);
  });
  
  const grouped = groupBy(filteredEntries, keyFunc, valueFunc);
  
  const stems = Array.from(grouped.keys())
    .filter(repr => {
      const [stem, translation] = repr.split('@');
      const entries = grouped.get(repr);
      if (entries === undefined) {
        return false;
      }
      return !rootMayBeOnlyPartiallyPreserved(stem, translation, Array.from(entries));
    })
    .sort(compareWithOptions);

  const stemObjects = stems.map(repr => new Stem(repr));

  const matchingStems = selectMatching(stemObjects, stemQuery, currentLookupConfig);
  
  return (
    <div className="grid grid-cols-2 gap-2 my-2 uneven-columns">
      <div className="mt-2">
        <h2 className="search-form-header text-xl">{t('stemSearch')}</h2>
        <SearchForm initialQuery={stemQuery} onSubmit={(query: StemQuery) => setStemQuery(query)} />
        Click on the button &quot;&#8744;&quot; or a stem&apos;s number to see its derivatives and inflected forms. <br /> 
        Click on a similar button next to a word to see its attestations. <br />
        <br />
        {matchingStems.map((stemObject: Stem, index: number) => {
          const group = grouped.get(stemObject.toString());
          const entries: Entry[] = group === undefined ? [] : Array.from(group);
          const englishTranslationKey = getEnglishTranslationKey(stemObject.form,
                                                                 stemObject.pos,
                                                                 stemObject.translation);
          const englishTranslation = englishTranslations.get(englishTranslationKey) || '';
          const key = entries
            .map(entry => writeMorphAnalysisValue(entry.morphologicalAnalysis))
            .concat([englishTranslation])
            .join('|');
          const setEnglishTranslation = (newEnglishTranslation: string) => {
            if (!(englishTranslation === '' && newEnglishTranslation === '')) {
              setEnglishTranslations(oldEnglishTranslations => update(
                oldEnglishTranslations, {$add: [[englishTranslationKey, newEnglishTranslation]]}
              ));
            }
          };

          const updateEnglishTranslationKey = (newEnglishTranslationKey: string) =>
          setEnglishTranslations(oldEnglishTranslations => {
            if (oldEnglishTranslations.has(newEnglishTranslationKey) &&
                oldEnglishTranslations.get(newEnglishTranslationKey) !== '') {
              return update(oldEnglishTranslations, {$remove: [englishTranslationKey]});
            } else {
              return update(oldEnglishTranslations, {
                $add: [[newEnglishTranslationKey, englishTranslation]],
                $remove: [englishTranslationKey]
              });
            }
          });
          const isFragmentary = entries.every(entry => {
            return getStem(entry.morphologicalAnalysis.referenceWord).endsWith(openingBracket);
          });
          const form = isFragmentary ? stemObject.form + '[' : stemObject.form;
          return (
            <StemViewer
              index={index + 1}
              stem={{
                form,
                translation: stemObject.translation,
                pos: stemObject.pos
              }}
              initialEntries={entries}
              key={key} 
              setDictionary={setDictionary}
              initialUnfolded={unfolded}
              allUnfolded={allUnfolded}
              englishTranslation={englishTranslation}
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
          <EnglishTranslationsDownloader />
          <DictionaryUploader onUpload={() => {
            const globalDictionary = getGlobalDictionary();
            setDictionary(() => globalDictionary);
          }}/>
          <EnglishTranslationsUploader onUpload={() => {
            const globalEnglishTranslations = getGlobalEnglishTranslations();
            setEnglishTranslations(globalEnglishTranslations);
          }}/>
        </div>
      </div>
    </div>
  );
}
