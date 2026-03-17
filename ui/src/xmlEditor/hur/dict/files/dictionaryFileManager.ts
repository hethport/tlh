import { getDictionary, setDictionary, getSuffixChains } from '../dictionary';
import { getGlosses, setGlosses } from '../../translations/glossProvider';
import { getPartsOfSpeech, setPartsOfSpeech } from '../../partsOfSpeech/partsOfSpeech';
import { getConcordance, setConcordance } from '../../concordance/concordance';
import { getCorpus, setCorpus } from '../../corpus/basicCorpus';
import { getEnglishTranslations, updateEnglishTranslations } from '../../translations/englishTranslations';
import { LexicalData } from '../../lexicalData/lexicalData';
import { makeDownload } from '../../../../downloadHelper';

export function downloadDictionary() {
  const dictionary = getDictionary();
  const glosses = getGlosses();
  const partsOfSpeech = getPartsOfSpeech();
  const concordance = getConcordance();
  const corpus = getCorpus();
  const englishTranslations = getEnglishTranslations();
  const suffixChains = getSuffixChains();
  const obj: LexicalData = {partsOfSpeech, dictionary, glosses, concordance, corpus, englishTranslations, suffixChains};
  const jsonText = JSON.stringify(obj, undefined, '\t');
  makeDownload(jsonText, 'Dictionary.json');
}

export async function readDict(file: File) {
  const source = await file.text();
  const parsed: LexicalData = JSON.parse(source);
  const {dictionary, glosses, partsOfSpeech, englishTranslations} = parsed;
  if (partsOfSpeech !== undefined) {
    setPartsOfSpeech(partsOfSpeech);
  }
  if ('concordance' in parsed) {
    setConcordance(parsed.concordance);
  }
  if (dictionary !== undefined) {
    setDictionary(dictionary);
  }
  if (glosses !== undefined) {
    setGlosses(glosses);
  }
  if ('corpus' in parsed) {
    setCorpus(parsed.corpus);
  }
  if (englishTranslations !== undefined) {
    updateEnglishTranslations(englishTranslations);
  }
}
