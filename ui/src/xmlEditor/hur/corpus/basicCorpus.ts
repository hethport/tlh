import { loadMapFromLocalStorage, locallyStoreMap } from '../dictLocalStorage/localStorageUtils';
import { hasGivenAnalysis } from './wordType';
import { Line } from './lineType';
import { updateMapping, convertMapping } from '../common/utility';
import { objectToMap, addToArrayValuedMap, makeGlossFromMorphologicalAnalysis } from '../common/utils';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import { compareLineNumbers } from './lineNumberComparer';

const localStorageKey = 'HurrianCorpus';

export type Corpus = Map<string, Line>;
export type CorpusObject = { [key: string]: Line };
type LineNumbers = Map<string, string[]>;
export type LineNumbersObject = { [key: string]: string[] };

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

export function deleteHurrianCorpusFromLocalStorage(): void {
  localStorage.removeItem(localStorageKey);
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
    addToArrayValuedMap(lineNums, text, line);
  }
}

function defineLineNumbers(): LineNumbers {
  const lineNumbers = new Map<string, Array<string>>();
  for (const key of corpus.keys()) {
    addLineNumber(lineNumbers, key);
  }
  for (const value of lineNumbers.values()) {
    value.sort(compareLineNumbers);
  }
  return lineNumbers;
}

export let lineNumbers = defineLineNumbers();

export function compareListedLineNumbers(text: string, first: string, second: string): number {
  const lineOrder = lineNumbers.get(text);
  if (lineOrder !== undefined) {
    const firstIndex = lineOrder.findIndex(lineNumber => lineNumber === first);
    const secondIndex = lineOrder.findIndex(lineNumber => lineNumber === second);
    if (firstIndex !== -1 && secondIndex !== -1) {
      return firstIndex - secondIndex;
    }
  }
  return compareLineNumbers(first, second);
}

export function setCorpus(obj: CorpusObject, lineNumbersObject?: LineNumbersObject): void {
  corpus = objectToMap(obj);
  if (lineNumbersObject === undefined) {
    lineNumbers = defineLineNumbers();
  } else {
    lineNumbers = objectToMap(lineNumbersObject);
  }
}

export function getCorpus(): CorpusObject {
  cleanUpCorpus();
  return convertMapping(corpus);
}

export function updateCorpus(obj: CorpusObject) {
  updateMapping(corpus, obj);
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
