import {XmlElementNode} from 'simple_xml';
import {getMorphologicalAnalyses} from '../../../model/morphologicalAnalysis';
import {determineWordNodeLanguage} from '../../nodeLanguage';
import {isDeprecated} from './deprecatedMorphologicalAnalyses';

/**
 * Determines whether an XML word-node has any deprecated morphological analyses.
 */
export function hasDeprecatedAnalyses(node: XmlElementNode<'w'>,
                                      path: number[],
                                      rootNode: XmlElementNode | undefined): boolean {
  const morphologies = getMorphologicalAnalyses(node);
  const language = determineWordNodeLanguage(node, path, rootNode);
  return morphologies.some(morphology => isDeprecated(morphology, language));
}
