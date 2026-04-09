import { Attestation, quickGetAttestations } from '../concordance/concordance';
import { XmlElementNode, getElementByPath } from 'simple_xml';
import { Line } from './lineType';
import { makeLine } from './lineConstructor';
import { makeWord, updateMorphologicalAnalysis } from './wordConstructor';
import { findLine, findLineStart, getParent } from './lineFinder';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import { compareLineNumbers } from './lineNumberComparer';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { corpus, lineNumbers, addLineNumber } from './basicCorpus';

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
  addLineNumber(lineNumbers, address);
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

export function getLine(attestation: Attestation): Line {
  return corpus.get(attestation.toString()) || [];
}

export function replaceMorphologicalAnalysis(oldAnalysis: string, newAnalyses: string[]): void {
  const oldMa = readMorphAnalysisValue(oldAnalysis);
  if (oldMa !== undefined) {
    const newMas: MorphologicalAnalysis[] = [];
    for (const newAnalysis of newAnalyses) {
      const newMa = readMorphAnalysisValue(newAnalysis);
      if (newMa !== undefined) {
        newMas.push(newMa);
      }
    }
    for (const attestation of quickGetAttestations(oldMa)) {
      const line = corpus.get(attestation);
      if (line !== undefined) {
        for (let i = 0; i < line.length; i++) {
          const word = line[i];
          line[i] = updateMorphologicalAnalysis(word, oldMa, newMas);
        }
      }
    }
  }
}

type TaggedLine = {
  id: string;
  line: Line;
}

export function getText(text: string): TaggedLine[] {
  const textLines = lineNumbers.get(text);
  if (textLines === undefined) {
    return [];
  } else {
    return Array.from(textLines).sort(compareLineNumbers).map(line => {
      return {id: line, line: getLine(new Attestation(text, line))};
    });
  }
}
