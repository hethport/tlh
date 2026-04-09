import { XmlElementNode, isXmlElementNode, getElementByPath } from 'simple_xml';

const lineBreakTagName = 'lb';

function isLineElement(child: XmlElementNode): boolean {
  return child.tagName !== lineBreakTagName;
}

// Returns the position in parent.children of the closest line break on the left
// if it is present, else -1
export function findLineStart(current: number, parent: XmlElementNode): number {
  let start = current;
  while (start >= 0) {
    const child = parent.children[start];
    if (isXmlElementNode(child)) {
      if (isLineElement(child)) {
        start--;
      } else {
        break;
      }
    }
  }
  return start;
}

// Returns the position in parent.children of the closest line break on the right
// if it is present, else parent.children.length
function findLineEnd(current: number, parent: XmlElementNode): number {
  let end = current + 1;
  while (end < parent.children.length) {
    const child = parent.children[end];
    if (isXmlElementNode(child)) {
      if (isLineElement(child)) {
        end++;
      } else {
        break;
      }
    }
  }
  return end;
}

export function getParent(rootNode: XmlElementNode, path: number[]): XmlElementNode {
  return getElementByPath(rootNode, path.slice(0, -1));
}

export function findLine(rootNode: XmlElementNode, path: number[]): XmlElementNode[] {
  const parent = getParent(rootNode, path);
  
  const current = path[path.length  - 1];
  const start = findLineStart(current, parent);
  const end = findLineEnd(current, parent);
  
  const line: XmlElementNode[] = [];
  for (const xmlNode of parent.children.slice(start + 1, end)) {
    if (isXmlElementNode(xmlNode)) {
      line.push(xmlNode);
    }
  }
  return line;
}
