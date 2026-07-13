import {XmlElementNode} from 'simple_xml';

export function isNotAnnotated(node: XmlElementNode<'w'>): boolean {
  const selection = node.attributes.mrp0sel?.trim();
  return selection === undefined || selection === '' || selection === 'HURR';
}
