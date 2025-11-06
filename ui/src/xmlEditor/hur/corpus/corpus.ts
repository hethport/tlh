import { updateMapping, convertMapping } from '../common/utility';
import { Attestation, quickGetAttestations } from '../concordance/concordance';
import { XmlElementNode, getElementByPath } from 'simple_xml';
import { Line, makeLine } from './lineConstructor';
import { makeWord, updateMorphologicalAnalysis, hasGivenAnalysis } from './wordConstructor';
import { findLine, findLineStart, getParent } from './lineFinder';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import { loadMapFromLocalStorage, locallyStoreMap } from '../dictLocalStorage/localStorageUtils';
import { makeGlossFromMorphologicalAnalysis, objectToMap } from '../common/utils';

const localStorageKey = 'HurrianCorpus';
let corpus: Map<string, Line> = loadMapFromLocalStorage(localStorageKey);
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

/*fetch('Concordance.json')
  .then(response => response.json())
  .then(json => {
    const {concordance, corpus} = json;
    updateConcordance(concordance);
    updateCorpus(corpus);
  });*/

function addLine(address: string, nodes: XmlElementNode[]): void {
  const line = makeLine(nodes);
  corpus.set(address, line);
}

function updateLine(line: Line, position: number, node: XmlElementNode): void {
  const word = makeWord(node);
  if (word !== undefined) {
    line[position] = word;
  }
}

export function addOrUpdateLineBySingleNodePath(address: Attestation,
                                                rootNode: XmlElementNode, path: number[]) {
  const key = address.toString();
  const storedLine = corpus.get(key);
  const nodes = findLine(rootNode, path);
  if (storedLine !== undefined && storedLine.length === nodes.length) {
    const current = path[path.length - 1];
    const parent = getParent(rootNode, path);
    const start = findLineStart(current, parent);
    const position = current - (start + 1);
    const node = getElementByPath(rootNode, path);
    updateLine(storedLine, position, node);
  } else {
    addLine(key, nodes);
  }
}

export function updateCorpus(object: { [key: string]: Line }) {
  updateMapping(corpus, object);
  cleanUpCorpus();
}

export function getCorpus(): { [key: string]: Line } {
  cleanUpCorpus();
  return convertMapping(corpus);
}

export function getLine(attestation: Attestation): Line {
  return corpus.get(attestation.toString()) || [];
}

export function replaceMorphologicalAnalysis(oldAnalysis: string, newAnalysis: string): void {
  const oldMa = readMorphAnalysisValue(oldAnalysis);
  if (oldMa !== undefined) {
    const newMa = readMorphAnalysisValue(newAnalysis);
    for (const attestation of quickGetAttestations(oldMa)) {
      const line = corpus.get(attestation);
      if (line !== undefined) {
        for (let i = 0; i < line.length; i++) {
          const word = line[i];
          line[i] = updateMorphologicalAnalysis(word, oldMa, newMa);
        }
      }
    }
  }
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

export function setCorpus(obj: { [key: string]: Line }): void {
  corpus = objectToMap(obj);
}
