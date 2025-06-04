import { isXmlTextNode, XmlTextNode, XmlElementNode } from 'simple_xml';

function substitution(vowel: string): string {
  if (vowel == 'u')
    return 'o';
  else if (vowel == 'ú')
    return 'u';
  else
    return vowel;
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
      }
    }
  }
  const result: string = parts.join('').replace(/-$/, '');
  return result;
}
