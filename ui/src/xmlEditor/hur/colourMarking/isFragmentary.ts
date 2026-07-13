import {XmlElementNode, isXmlElementNode, isXmlTextNode, XmlNode} from 'simple_xml';
import {getSiblingsUntil} from '../../../nodeIterators';

function containsClosingBracket(node: XmlNode): boolean {
  if (isXmlElementNode(node)) {
    for (const child of node.children) {
      if (isXmlElementNode(child)) {
        if (child.tagName === 'del_fin') {
          return true;
        }
      }
    }
  }
  return false;
}

export function isFragmentary(node: XmlElementNode<'w'>, path: number[],
                              rootNode: XmlElementNode | undefined): boolean {
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
    if (rootNode === undefined) {
      return true;
    }
    const followingWords = getSiblingsUntil(rootNode, path, 'lb');
    return !followingWords.some(followingWord => containsClosingBracket(followingWord));
  }
  return false;
}
