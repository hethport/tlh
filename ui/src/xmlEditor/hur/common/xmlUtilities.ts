import { isXmlTextNode, XmlTextNode, XmlElementNode } from 'simple_xml';
import { removePotentiallyImproperPrefix, removePotentiallyImproperSuffix } from '../common/auxiliary';

const mrpRegex = /^mrp(\d+)$/;

export function getMrps(node: XmlElementNode): Map<string, string> {
  const mrps: Map<string, string> = new Map();

  for (const attribute of Object.keys(node.attributes)) {
    const match = attribute.trim().match(mrpRegex);

    if (match !== null) {
      const key: string = match[1];
      const value: string = node.attributes[attribute] || '';
      mrps.set(key, value);
    }
  }

  return mrps;
}

function substitution(vowel: string): string {
  if (vowel == 'u')
    return 'o';
  else if (vowel == 'ú')
    return 'u';
  else
    return vowel;
}

export function basicGetText(node: XmlElementNode): string {
  const parts: string[] = [];
  for (const child of node.children) {
    if (isXmlTextNode(child)) {
      const textChild: XmlTextNode = child as XmlTextNode;
      if (textChild.textContent !== undefined) {
        parts.push(textChild.textContent);
      }
    }
  }
  const result: string = parts.join('');
  return result;
}

export function getText(node: XmlElementNode): string {
  const parts: string[] = [];
  let removeInitialHyphen = false;

  for (const child of node.children) {
    let newPart: string | null = null;
    let nextRemoveInitialHyphen = false;
    if (isXmlTextNode(child)) {
      const textChild: XmlTextNode = child as XmlTextNode;
      if (textChild.textContent !== undefined) {
        newPart = textChild.textContent;
      }
    } else {
      const elementChild: XmlElementNode = child as XmlElementNode;
      const vowel: string | undefined = elementChild.attributes.c;
      switch (elementChild.tagName) {
        case 'subscr':
          if (vowel !== undefined && parts.length > 0) {
            const last: string = parts[parts.length - 1];
            const length: number = last.length;
            parts[parts.length - 1] = last.substring(0, length - 1) + substitution(vowel);
          }
          break;
        case 'aGr':
          newPart = getText(elementChild);
          break;
        case 'sGr':
          newPart = getText(elementChild);
          break;
        case 'del_in':
          newPart = '[';
          break;
        case 'del_fin':
          newPart = ']';
          break;
        case 'c':
          if (elementChild.attributes.type === 'sign') {
            if (parts.length > 0) {
              const previous = parts[parts.length - 1];
              parts[parts.length - 1] = removePotentiallyImproperSuffix(previous, '-');
            }
            nextRemoveInitialHyphen = true;
            newPart = getText(elementChild);
          }
        case 'num':
          newPart = getText(elementChild);
          break;
      }
    }
    if (newPart !== null) {
      if (removeInitialHyphen) {
        newPart = removePotentiallyImproperPrefix(newPart, '-');
      }
      parts.push(newPart);
      // If the element we are processing is ignored,
      // that is, newPart is null,
      // removeInitialHyphen should keep its value.
      removeInitialHyphen = nextRemoveInitialHyphen;
    }
  }
  const result: string = parts.join('');
  return result;
}
