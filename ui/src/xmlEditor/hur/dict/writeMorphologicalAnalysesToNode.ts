import { MorphologicalAnalysis, writeMorphAnalysisValue } from '../../../model/morphologicalAnalysis';
import { XmlElementNode } from 'simple_xml';

/*
 * Write an array of morphological analyses as numbered
 * mrp attributes of an XML word node (<w>).
 */
export function writeMorphologicalAnalysesToNode(morphologicalAnalyses: MorphologicalAnalysis[], node: XmlElementNode): void {
  let index = 1;
  for (const morphologicalAnalysis of morphologicalAnalyses) {
    const attributeName = 'mrp' + index.toString();
    const analysis = writeMorphAnalysisValue(morphologicalAnalysis);
    node.attributes[attributeName] = analysis;
    index++;
  }
}
