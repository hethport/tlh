import { XmlElementNode, findFirstXmlElementByTagName } from 'simple_xml';
import { AOption } from '../myOption';
import { getPriorSibling } from '../nodeIterators';

export function determineWordNodeLanguage(node: XmlElementNode,
                                          path: number[], rootNode: XmlElementNode): string {
  const textLanguage = AOption.of(findFirstXmlElementByTagName(rootNode, 'text'))
  .map((textElement) => textElement.attributes['xml:lang'])
  .get();

  const lineBreakLanguage = AOption.of(getPriorSibling(rootNode, path, 'lb'))
  .map((lineBreakElement) => lineBreakElement.attributes.lg)
  .get();

  return node.attributes.lg || lineBreakLanguage || textLanguage || 'Hit';
}
