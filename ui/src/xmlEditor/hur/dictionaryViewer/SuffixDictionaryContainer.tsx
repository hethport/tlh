import { JSX, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import { DictionaryUploader } from '../dict/files/DictionaryUploader';
import { SuffixDictionary } from './SuffixDictionary';
import { Entry } from './Wordform';
import { groupBy } from '../common/utils';
import { Dictionary, setGlobalDictionary, getGlobalDictionary } from '../dict/dictionary';
import { locallyStoreHurrianData } from '../dictLocalStorage/hurrianDataLocalStorage';
import { Subentry } from './DictionaryViewerContainer';

interface IProps {
  getInitialDictionary: () => Dictionary;
}

export function SuffixDictionaryContainer({getInitialDictionary,}: IProps): JSX.Element {

  const {t} = useTranslation('common');
  const initialDictionary = getInitialDictionary();
  const [dictionary, setDictionary] = useState(initialDictionary);
  const loaded = dictionary.size > 0;

  const subentries: Subentry[] = [];

  for (const [transcription, analyses] of dictionary.entries()) {
    for (const analysis of analyses) {
      subentries.push({transcription, analysis});
    }
  }

  const grouped = groupBy(subentries,
                          (subentry: Subentry) => subentry.analysis,
                          (subentry: Subentry) => subentry.transcription
  );

  const entries: Entry[] = [];

  for (const [analysis, transcriptionSet] of grouped.entries()) {
    const morphologicalAnalysis = readMorphAnalysisValue(analysis);
    if (morphologicalAnalysis !== undefined) {
      const transcriptions = Array.from(transcriptionSet).sort();
      const initialMorphologicalAnalysis = morphologicalAnalysis;
      entries.push({transcriptions, morphologicalAnalysis, initialMorphologicalAnalysis});
    }
  }

  useEffect(() => {
    setGlobalDictionary(dictionary);
    locallyStoreHurrianData();
  });

  return (
    <div className="container mx-auto">
    <h1 className="font-bold text-2xl text-center">{t('dictionaryViewer')}</h1>
    {!loaded ? <DictionaryUploader onUpload={() => {
      const globalDictionary = getGlobalDictionary();
      setDictionary(() => globalDictionary);
    }} /> :
    <SuffixDictionary entries={entries} setDictionary={setDictionary}/>}
    </div>
  );
}
