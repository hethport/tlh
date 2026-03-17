import { XmlElementNode } from 'simple_xml';
import { makeWord } from './wordConstructor';
import { Line } from './lineType';

export function makeLine(nodes: XmlElementNode[]): Line {
  const line: Line = [];
  for (const node of nodes) {
    const word = makeWord(node);
    line.push(word);
  }
  return line;
}
