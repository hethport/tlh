import { locallyStoreHurrianDictionary } from '../dict/dictionary';
import { locallyStoreHurrianStemTranslations } from '../translations/glossProvider';
import { locallyStoreHurrianPartsOfSpeech } from '../partsOfSpeech/partsOfSpeech';
import { locallyStoreHurrianDictionaryChanges,
         locallyStoreHurrianMorphologicalAnalysisSources } from '../changes/changesAccumulator';
import { deleteHurrianCorpusFromLocalStorage } from '../corpus/basicCorpus';
import { deleteHurrianConcordanceFromLocalStorage } from '../concordance/concordance';

export function locallyStoreHurrianData() {
  deleteHurrianCorpusFromLocalStorage();
  deleteHurrianConcordanceFromLocalStorage();
  locallyStoreHurrianDictionary();
  locallyStoreHurrianStemTranslations();
  locallyStoreHurrianPartsOfSpeech();
  locallyStoreHurrianDictionaryChanges();
  locallyStoreHurrianMorphologicalAnalysisSources();
}
