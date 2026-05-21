import { locallyStoreHurrianDictionary } from '../dict/dictionary';
import { locallyStoreHurrianStemTranslations } from '../translations/glossProvider';
import { locallyStoreHurrianPartsOfSpeech } from '../partsOfSpeech/partsOfSpeech';
import { locallyStoreHurrianDictionaryChanges,
         locallyStoreHurrianMorphologicalAnalysisSources } from '../changes/changesAccumulator';
import { locallyStoreHurrianConcordance } from '../concordance/concordance';
import { deleteHurrianCorpusFromLocalStorage } from '../corpus/basicCorpus';

export function locallyStoreHurrianData() {
  deleteHurrianCorpusFromLocalStorage();
  locallyStoreHurrianDictionary();
  locallyStoreHurrianStemTranslations();
  locallyStoreHurrianPartsOfSpeech();
  locallyStoreHurrianDictionaryChanges();
  locallyStoreHurrianMorphologicalAnalysisSources();
  locallyStoreHurrianConcordance();
}
