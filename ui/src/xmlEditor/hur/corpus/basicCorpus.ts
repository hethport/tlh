import { loadMapFromLocalStorage, locallyStoreMap } from '../dictLocalStorage/localStorageUtils';
import { hasGivenAnalysis } from './wordType';
import { Line } from './lineType';
import { updateMapping, convertMapping } from '../common/utility';
import { objectToMap, add, makeGlossFromMorphologicalAnalysis } from '../common/utils';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';

const localStorageKey = 'HurrianCorpus';

type Corpus = Map<string, Line>;
type LineNumbers = Map<string, Set<string>>;

export let corpus: Corpus;
try {
  corpus = loadMapFromLocalStorage(localStorageKey);
} catch(SyntaxError) {
  console.log('The corpus could not be loaded from the local storage.');
  corpus = new Map();
}
cleanUpCorpus();
export function locallyStoreHurrianCorpus(): void {
  locallyStoreMap(corpus, localStorageKey);
}

function cleanUpCorpus(): void {
  for (const [key, line] of corpus.entries()) {
    const newLine = line.filter(word => word !== null);
    corpus.set(key, newLine);
  }
}

export function addLineNumber(lineNums: LineNumbers, attestation: string): void {
  if (attestation.includes(',')) {
    const [text, line] = attestation.split(',', 2);
    add(lineNums, text, line);
  }
}

function defineLineNumbers(): LineNumbers {
  const lineNumbers = new Map<string, Set<string>>();
  for (const key of corpus.keys()) {
    addLineNumber(lineNumbers, key);
  }
  return lineNumbers;
}

export let lineNumbers = defineLineNumbers();

export function setCorpus(obj: { [key: string]: Line }): void {
  corpus = objectToMap(obj);
  lineNumbers = defineLineNumbers();
}

export function getCorpus(): { [key: string]: Line } {
  cleanUpCorpus();
  return convertMapping(corpus);
}

export function updateCorpus(object: { [key: string]: Line }) {
  updateMapping(corpus, object);
  cleanUpCorpus();
}

/* Check whether an analysis occurs in multiple positions in the specified line.
 */
export function hasMultipleOccurences(analysis: string, attestation: string): boolean {
  const line = corpus.get(attestation);
  if (line !== undefined) {
    const morphologicalAnalysis = readMorphAnalysisValue(analysis);
    if (morphologicalAnalysis !== undefined) {
      const gloss = makeGlossFromMorphologicalAnalysis(morphologicalAnalysis);
      for (let i = 0, counter = 0; i < line.length; i++) {
        const word = line[i];
        const hasSameAnalysis = hasGivenAnalysis(word, gloss, morphologicalAnalysis);
        if (hasSameAnalysis) {
          counter++;
        }
        if (counter > 1) {
          return true;
        }
      }
    }
  }
  return false;
}
