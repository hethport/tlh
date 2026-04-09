import { convertDictionary } from '../common/utility';
import { add, remove, replaceKey, replaceKeyWithMultiple, updateSetValuedMapWithOverride,
  objectToSetValuedMap } from '../common/utils';
import { isValid, normalize } from '../dict/morphologicalAnalysisValidator';
import { writeMorphAnalysisValue, MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import { loadSetValuedMapFromLocalStorage, locallyStoreSetValuedMap }
  from '../dictLocalStorage/localStorageUtils';
import { hasMultipleOccurences } from '../corpus/basicCorpus';
import { addMorphologicalAnalysis } from '../dict/dictionaryUpdater';
import { deleteAnalysisFromHurrianDictionary } from '../dict/dictionary';
import { reserializeMorphologicalAnalysis } from '../morphologicalAnalysis/reserialization';
import { LookupConfig } from '../../lookupConfig';

export type Concordance = Map<string, Set<string>>;
export type ConcordanceObject = { [key: string]: string[] };

const sep = ',';

export class Attestation {
  text: string;
  line: string;
  constructor(text: string, line: string) {
    this.text = text;
    this.line = line;
  }
  toString(): string {
    return this.text + sep + this.line;
  }
}

const localStorageKey = 'HurrianConcordance';
let concordance: Concordance = loadSetValuedMapFromLocalStorage(localStorageKey);
export function locallyStoreHurrianConcordance(): void {
  locallyStoreSetValuedMap(concordance, localStorageKey);
}

function preprocess(analysis: string): string {
  analysis = normalize(analysis, true, false) || analysis;
  const ma = readMorphAnalysisValue(analysis);
  if (ma === undefined) {
    return analysis;
  } else {
    return writeMorphAnalysisValue(ma);
  }
}

export function addAttestation(transcription: string, analysis: string, attestation: Attestation,
                               lookupConfig: LookupConfig) {
  if (isValid(analysis)) {
    addMorphologicalAnalysis(transcription, analysis, lookupConfig);
    add(concordance, preprocess(analysis), attestation.toString());
  }
}

export function removeAttestation(transcription: string, analysis: string, attestation: Attestation) {
  const address = attestation.toString();
  if (!hasMultipleOccurences(analysis, address)) {
    const preprocessedAnalysis = preprocess(analysis);
    remove(concordance, preprocessedAnalysis, address);
    if (!concordance.has(preprocessedAnalysis)) {
      deleteAnalysisFromHurrianDictionary(transcription, preprocessedAnalysis);
    }
  }
}

const pattern = /(?<!\d)\d(?!\d)/g;

function padDigits(a: string): string {
  return a.replaceAll(pattern, digit => '0' + digit);
}

export function compareLineNumbers(a: string, b: string): number {
  const newA = padDigits(a);
  const newB = padDigits(b);
  if (newA < newB) {
    return -1;
  } else if (newA > newB) {
    return 1;
  } else {
    return 0;
  }
}

export function quickGetAttestations(morphologicalAnalysis: MorphologicalAnalysis): string[] {
  const analysis = writeMorphAnalysisValue(morphologicalAnalysis);
  const current = concordance.get(analysis);
  if (current === undefined) {
    return [];
  } else {
    return Array.from(current);
  }
}

export function getAttestations(morphologicalAnalysis: MorphologicalAnalysis): Attestation[] {
  const analysis = writeMorphAnalysisValue(morphologicalAnalysis);
  const current = concordance.get(analysis);
  if (current === undefined) {
    return [];
  } else {
    return Array.from(current).sort(compareLineNumbers).map((repr: string) => {
      const [text, line] = repr.split(sep);
      return new Attestation(text, line);
    });
  }
}

export function getConcordance(): ConcordanceObject {
  return convertDictionary(concordance);
}

export function updateConcordance(obj: ConcordanceObject) {
  updateSetValuedMapWithOverride(concordance, obj);
}

export function updateConcordanceKey(oldAnalysis: string, newAnalysis: string): void {
  replaceKey(concordance, oldAnalysis, newAnalysis);
}

export function replaceConcordanceKeyWithMultiple(oldAnalysis: string, newAnalyses: string[]): void {
  replaceKeyWithMultiple(concordance, oldAnalysis, newAnalyses);
}

export function inConcordance(ma: MorphologicalAnalysis): boolean {
  const value = writeMorphAnalysisValue(ma);
  return concordance.has(value);
}

export function setConcordance(obj: ConcordanceObject): void {
  concordance = new Map();
  for (const [analysis, attestations] of objectToSetValuedMap(obj)) {
    const reserialized = reserializeMorphologicalAnalysis(analysis);
    if (reserialized !== undefined) {
      concordance.set(reserialized, attestations);
    }
  }
}

export function getFrequency(morphologicalAnalysis: MorphologicalAnalysis): number {
  return quickGetAttestations(morphologicalAnalysis).length;
}

export function getFrequencyDifference(ma1: MorphologicalAnalysis, ma2: MorphologicalAnalysis): number {
  return getFrequency(ma1) - getFrequency(ma2);
}

export function getNegatedFrequencyDifference(ma1: MorphologicalAnalysis, ma2: MorphologicalAnalysis): number {
  return - getFrequencyDifference(ma1, ma2);
}
