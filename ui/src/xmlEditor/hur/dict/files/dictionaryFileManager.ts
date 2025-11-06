import { getDictionary, setDictionary, cleanUpDictionary } from '../dictionary';
import { getGlosses, setGlosses } from '../../translations/glossProvider';
import { getPartsOfSpeech, setPartsOfSpeech } from '../../partsOfSpeech/partsOfSpeech';
import { getConcordance, setConcordance } from '../../concordance/concordance';
import { getCorpus, setCorpus } from '../../corpus/corpus';
import { getEnglishTranslations, updateEnglishTranslations } from '../../translations/englishTranslations';
import { makeDownload } from '../../../../downloadHelper';

export function downloadDictionary() {
  const dictionary = getDictionary();
  const glosses = getGlosses();
  const partsOfSpeech = getPartsOfSpeech();
  const concordance = getConcordance();
  const corpus = getCorpus();
  const englishTranslations = getEnglishTranslations();
  const obj = {partsOfSpeech, dictionary, glosses, concordance, corpus, englishTranslations};
  const jsonText = JSON.stringify(obj, undefined, '\t');
  makeDownload(jsonText, 'Dictionary.json');
}

export async function readDict(file: File) {
  const source = await file.text();
  const parsed = JSON.parse(source);
  let {dictionary} = parsed;
  const {glosses} = parsed;
  if ('partsOfSpeech' in parsed) {
    setPartsOfSpeech(parsed.partsOfSpeech);
  }
  if ('concordance' in parsed) {
    setConcordance(parsed.concordance);
    dictionary = cleanUpDictionary(dictionary);
  }
  setDictionary(dictionary);
  setGlosses(glosses);
  if ('corpus' in parsed) {
    setCorpus(parsed.corpus);
  }
  if ('englishTranslations' in parsed) {
    updateEnglishTranslations(parsed.englishTranslations);
  }
}
