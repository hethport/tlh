import { XmlElementNode, findFirstXmlElementByTagName } from 'simple_xml';
import { AOption } from '../myOption';
import { getPriorSibling } from '../nodeIterators';

const hurrianLanguageMarker = 'Hur';

export function determineWordNodeLanguage(node: XmlElementNode,
                                          path: number[], rootNode: XmlElementNode | undefined): string {
  if (rootNode === undefined) {
    return 'Hit';
  }

  const textLanguage = AOption.of(findFirstXmlElementByTagName(rootNode, 'text'))
  .map((textElement) => textElement.attributes['xml:lang'])
  .get();

  const lineBreakLanguage = AOption.of(getPriorSibling(rootNode, path, 'lb'))
  .map((lineBreakElement) => lineBreakElement.attributes.lg)
  .get();

  return node.attributes.lg || lineBreakLanguage || textLanguage || 'Hit';
}

export function isHurrian(node: XmlElementNode<'w'>,
                          path: number[], rootNode: XmlElementNode | undefined): boolean {
  return determineWordNodeLanguage(node, path, rootNode) === hurrianLanguageMarker;
}
