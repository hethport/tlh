import { isXmlTextNode, XmlTextNode, XmlElementNode } from 'simple_xml';

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

  for (const child of node.children) {
    if (isXmlTextNode(child)) {
      const textChild: XmlTextNode = child as XmlTextNode;
      if (textChild.textContent !== undefined) {
        parts.push(textChild.textContent);
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
          parts.push(getText(elementChild) + '-');
          break;
        case 'sGr':
          parts.push(getText(elementChild) + '-');
          break;
        case 'del_in':
          parts.push('[');
          break;
        case 'del_fin':
          parts.push(']');
          break;
        case 'c':
          if (elementChild.attributes.type === 'sign') {
            parts.push(getText(elementChild));
          }
      }
    }
  }
  const result: string = parts.join('').replace(/-$/, '');
  return result;
}
