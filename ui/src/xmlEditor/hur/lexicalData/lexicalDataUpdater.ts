import {LookupConfig} from '../../lookupConfig';
import {Attestation, addAttestation} from '../concordance/concordance';
import {readMorphAnalysisValue} from '../morphologicalAnalysis/auxiliary';
import {addToTranslationMap} from '../translations/translationProvider';
import {addToGrammaticalGlossMap} from '../autoglossing/grammaticalGlossProvider';

export function updateLexicalData(transcription: string, analysis: string, attestation: Attestation,
                                  lookupConfig: LookupConfig) {
  addAttestation(transcription, analysis, attestation, lookupConfig);
  const ma = readMorphAnalysisValue(analysis);
  if (ma !== undefined) {
    addToTranslationMap(ma);
    addToGrammaticalGlossMap(ma);
  }
}
