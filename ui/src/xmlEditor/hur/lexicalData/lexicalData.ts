import { DictionaryObject, getDictionary, setDictionary, getSuffixChains } from '../dict/dictionary';
import { GlossaryObject, getGlosses, setGlosses } from '../translations/glossProvider';
import { ConcordanceObject, getConcordance, setConcordance } from '../concordance/concordance';
import { CorpusObject, getCorpus, setCorpus } from '../corpus/basicCorpus';
import { PartsOfSpeech, getPartsOfSpeech, setPartsOfSpeech } from '../partsOfSpeech/partsOfSpeech';
import { EnglishTranslationsObject, getEnglishTranslations, updateEnglishTranslations }
  from '../translations/englishTranslations';
import { SuffixChainInventories } from '../segmentation/suffixChainInventories';

export type LexicalData = {
  dictionary: DictionaryObject;
  glosses: GlossaryObject;
  concordance: ConcordanceObject;
  corpus: CorpusObject;
  partsOfSpeech?: PartsOfSpeech;
  englishTranslations?: EnglishTranslationsObject;
  suffixChains?: SuffixChainInventories;
}

export function getLexicalData(): LexicalData {
  const dictionary = getDictionary();
  const glosses = getGlosses();
  const partsOfSpeech = getPartsOfSpeech();
  const concordance = getConcordance();
  const corpus = getCorpus();
  const englishTranslations = getEnglishTranslations();
  const suffixChains = getSuffixChains();
  const lexicalData: LexicalData = {partsOfSpeech, dictionary, glosses, concordance,
    corpus, englishTranslations, suffixChains};
  return lexicalData;
}

export function setLexicalData(lexicalData: LexicalData): void {
  const {dictionary, glosses, concordance, corpus, partsOfSpeech, englishTranslations} = lexicalData;
  // The undefined checks for required fields are needed for the case the user
  // uploads a JSON file with another structure.
  // The concordance should be initialized before the dictionary,
  // because the frequency couns for segmenter initialization are
  // taken from the concordance and the segmenter is initialized
  // together with the dictionary.
  if (concordance !== undefined) {
    setConcordance(concordance);
  }
  if (dictionary !== undefined) {
    setDictionary(dictionary);
  }
  if (glosses !== undefined) {
    setGlosses(glosses);
  }
  if (corpus !== undefined) {
    setCorpus(corpus);
  }
  if (partsOfSpeech !== undefined) {
    setPartsOfSpeech(partsOfSpeech);
  }
  if (englishTranslations !== undefined) {
    updateEnglishTranslations(englishTranslations);
  }
}
