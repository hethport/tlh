import {XmlElementNode, isXmlElementNode, isXmlTextNode} from 'simple_xml';

export function isFragmentary(node: XmlElementNode<'w'>): boolean {
  let bracketOpen = false;
  for (const child of node.children) {
    if (isXmlElementNode(child)) {
      switch(child.tagName) {
        case 'del_in':
          bracketOpen = true;
          break;
        case 'del_fin':
          if (!bracketOpen) {
            return true;
          }
          bracketOpen = false;
          break;
      }
    } else if (isXmlTextNode(child)) {
      if (child.textContent.includes('x')) {
        return true;
      }
    }
  }
  if (bracketOpen) {
    return true;
  }
  return false;
}
