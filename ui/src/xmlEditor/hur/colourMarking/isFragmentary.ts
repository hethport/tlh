import {XmlElementNode, isXmlElementNode, isXmlTextNode} from 'simple_xml';

const fragmentaryFormMarkerElements = new Set(['del_in', 'del_fin']);

export function isFragmentary(node: XmlElementNode<'w'>): boolean {
  for (const child of node.children) {
    if (isXmlElementNode(child)) {
      if (fragmentaryFormMarkerElements.has(child.tagName)) {
        return true;
      }
    } else if (isXmlTextNode(child)) {
      if (child.textContent.includes('x')) {
        return true;
      }
    }
  }
  return false;
}
