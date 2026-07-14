import {XmlElementNode, isXmlElementNode, isXmlTextNode, XmlNode} from 'simple_xml';
import {getSiblingsUntil, getPriorSiblingsUntil} from '../../../nodeIterators';

const openingBracket = 'del_in';
const closingBracket = 'del_fin';
const space = 'space';

function hasChildWithTagName(node: XmlNode, tagName: string): boolean {
  if (isXmlElementNode(node)) {
    for (const child of node.children) {
      if (isXmlElementNode(child)) {
        if (child.tagName === tagName) {
          return true;
        }
      }
    }
  }
  return false;
}

function startsWith(node: XmlNode, tagName: string): boolean {
  if (isXmlElementNode(node) && node.children.length > 0) {
    const child = node.children[0];
    if (isXmlElementNode(child)) {
      if (child.tagName === tagName) {
        return true;
      }
    }
  }
  return false;
}

function endsWith(node: XmlNode, tagName: string): boolean {
  if (isXmlElementNode(node) && node.children.length > 0) {
    const child = node.children[node.children.length - 1];
    if (isXmlElementNode(child)) {
      if (child.tagName === tagName) {
        return true;
      }
    }
  }
  return false;
}

function containsOpeningBracket(node: XmlNode): boolean {
  return hasChildWithTagName(node, openingBracket);
}

function containsClosingBracket(node: XmlNode): boolean {
  return hasChildWithTagName(node, closingBracket);
}

function containsSpace(node: XmlNode): boolean {
  return hasChildWithTagName(node, space);
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
            if (rootNode === undefined) {
              return true;
            }
            const precedingWords = getPriorSiblingsUntil(rootNode, path, 'lb');
            if (precedingWords.length > 0) {
              // getPriorSiblingsUntil reverses the array
              const previousWord = precedingWords[0];
              if (containsSpace(previousWord) && startsWith(node, closingBracket)) {
                return true;
              }
            }
            if (!precedingWords.some(precedingWord => containsOpeningBracket(precedingWord))) {
              return true;
            }
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
    if (followingWords.length > 0) {
      const nextWord= followingWords[0];
      if (containsSpace(nextWord) && endsWith(node, openingBracket)) {
        return true;
      }
    }
    return !followingWords.some(followingWord => containsClosingBracket(followingWord));
  }
  return false;
}
