import {XmlElementNode} from 'simple_xml';
import {isHurrian} from '../../nodeLanguage';
import {isFragmentary} from './isFragmentary';
import {isNotAnnotated} from './isNotAnnotated';

export function isFullyPreservedNotAnnotatedHurrian(node: XmlElementNode<'w'>,
                                                    path: number[],
                                                    rootNode: XmlElementNode | undefined): boolean {
  return isNotAnnotated(node) && !isFragmentary(node, path, rootNode) && isHurrian(node, path, rootNode);
}
