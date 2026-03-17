import { DictionaryObject } from '../dict/dictionary';
import { GlossaryObject } from '../translations/glossProvider';
import { ConcordanceObject } from '../concordance/concordance';
import { CorpusObject } from '../corpus/basicCorpus';
import { PartsOfSpeech } from '../partsOfSpeech/partsOfSpeech';
import { EnglishTranslationsObject } from '../translations/englishTranslations';
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
