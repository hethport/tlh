import {findFirstXmlElementByTagName, isXmlElementNode, isXmlTextNode, xmlElementNode, XmlElementNode, XmlNode, xmlTextNode} from 'simple_xml';
import {ZipWithOffsetResult} from './zipWithOffset';

export const txtPublicationRegex = /(?<publication>[\W\w]+)({€(?<lnr>\d+)})/;
export const lineNumberRegex = /{(?<index>€(?<numbers>\d+|\d+\+\d+))}\s*(?<lines>[\W\w]+)/;

export interface MergeLine {
  lineNumberNode: XmlElementNode;
  rest: XmlNode[];
}

export interface MergeDocument {
  prior: XmlNode[];
  header: XmlElementNode;
  lines: MergeLine[];
  publMap: Map<string, string[]>;
  MergedPublicationMapping: Map<string, string[]> | undefined;
}

let leftTxtId = '';

export function readMergeDocument(rootNode: XmlElementNode): MergeDocument {
  const element: XmlElementNode | undefined = findFirstXmlElementByTagName(rootNode, 'text');
  const aoManuscript: XmlElementNode | undefined = findFirstXmlElementByTagName(rootNode, 'AO:Manuscripts');

  if (!element || !aoManuscript) {
    throw new Error('could not read document!');
  }

  const publicationMap: Map<string, string[]> = new Map<string, string[]>();
  aoManuscript.children.forEach((node) => {
    if (isXmlElementNode(node) && (node.tagName === 'AO:TxtPubl' || node.tagName === 'AO:InvNr')) {
      node.children.forEach((nnode) => {
        if (isXmlTextNode(nnode)) {
          parsePublicationMapping(nnode.textContent, publicationMap);
        }
      });
    }
  });

  const result: MergeDocument = {prior: [], header: rootNode, lines: [], publMap: publicationMap, MergedPublicationMapping: undefined};

  element.children.forEach((node) => {
    if (isXmlElementNode(node) && node.tagName === 'lb') {
      node.attributes['lnr'] = replaceLNR(node, publicationMap);
      result.lines.push({lineNumberNode: node, rest: []});
    } else if (result.lines.length === 0) {
      result.prior.push(node);
    } else {
      result.lines[result.lines.length - 1].rest.push(node);
    }
  });

  const headerElement: XmlElementNode | undefined = findFirstXmlElementByTagName(rootNode, 'AOHeader');
  if (headerElement) {
    result.header = headerElement;
  }

  return result;
}

export function mergeLines(mls: ZipWithOffsetResult<MergeLine>): MergeLine[] {
  return mls.map(([left, right]) => {
    if (left && right) {
      return mergeLine(left, right);
    } else if (left && right == null) {
      return iterateTxtId(left);
    } else if (right && left == null) {
      return iterateTxtId(right);
    } else {
      throw new Error('TODO');
    }
  });
}

const mergeSeparatorElement: XmlElementNode = {
  tagName: 'w',
  attributes: {},
  children: []
};

function computeNewLineNumber(lnr: string | undefined, rnr: string | undefined): string | undefined {
  if (lnr === undefined || rnr === undefined || lnr == 'EMPTY LINE' || rnr == 'EMPTY LINE') {
    return undefined;
  }

  const leftMatch = lnr.match(lineNumberRegex);
  const rightMatch = rnr.match(lineNumberRegex);


  if (leftMatch && leftMatch.groups && rightMatch && rightMatch.groups) {
    const numbers: string[] = leftMatch.groups.numbers.split('+').concat(rightMatch.groups.numbers.split('+'));
    const lines: string[] = leftMatch.groups.lines.split('/').concat(rightMatch.groups.lines.split('/'));

    return `{€${numbers.join('+')}} ${lines.join('/')}`;
  } else {
    return undefined;
  }
}

function mergeLine(
  {lineNumberNode: leftLineNumberNode, rest: leftRest}: MergeLine,
  {lineNumberNode: rightLineNumberNode, rest: rightRest}: MergeLine
): MergeLine {

  const lnr = leftLineNumberNode.attributes.lnr || '';
  const rnr = rightLineNumberNode.attributes.lnr || '';

  const lineNumber = computeNewLineNumber(lnr, rnr) || (lnr + rnr);

  const language = leftLineNumberNode.attributes.lg || '';
  const txtid = (leftLineNumberNode.attributes.txtid + '+').replace('++','+') || '';
  leftTxtId = txtid;
  const lineNumberNode: XmlElementNode = {
    tagName: 'lb', children: [], attributes: {'txtid': txtid, 'lnr': lineNumber, 'lg': language}
  };

  return {lineNumberNode, rest: [...leftRest, mergeSeparatorElement, ...rightRest]};
}

function iterateTxtId({lineNumberNode: leftLineNumberNode, rest: leftRest}: MergeLine): MergeLine {

  const lineNumber = leftLineNumberNode.attributes.lnr || '';
  const language = leftLineNumberNode.attributes.lg || '';
  const lineNumberNode: XmlElementNode = {
    tagName: 'lb', children: [], attributes: {'txtid': leftTxtId, 'lnr': lineNumber, 'lg': language}
  };

  return {lineNumberNode, rest: [...leftRest]};
}

function parsePublicationMapping(txtPublication: string, publMap: Map<string, string[]>) {
  // <publicationString, {oldPubNr, newPublNr}>
  const publMatch = txtPublication.match(txtPublicationRegex);
  let publName: string;
  let publNumber = 1;
  let oldPublNumber = publMap.size != 0 ? (parseInt(Array.from(publMap.keys())[publMap.size - 1]) + 1).toString() : '1';

  if (publMatch && publMatch.groups) {
    oldPublNumber = '' + publMatch.groups.lnr;
    publNumber = parseInt(publMatch.groups.lnr);
    publName = publMatch.groups.publication;
  } else {
    publName = txtPublication;
  }
  const indices = [];
  for (const value of Array.from(publMap.values())) {
    indices.push(value[0]);
  }
  while (indices.includes(publNumber.toString())) {
    publNumber++;
  }

  publMap.set(oldPublNumber, [publNumber.toString(), publName]);
  return publMap;
}

export function mergeHeader(firstDocumentHeader: XmlElementNode, secondDocumentHeader: XmlElementNode): XmlElementNode {
  const docID = findFirstXmlElementByTagName(firstDocumentHeader, 'docID');
  let newDocID = 'docID';
  if (docID && isXmlTextNode(docID.children[0])) {
    newDocID = docID.children[0].textContent + '+';
  }

  firstDocumentHeader.tagName = 'doc';
  firstDocumentHeader.children.forEach((node) => {
    if (isXmlElementNode(node) && node.tagName === 'docID') {
      node.tagName = 'mDocID';
    }
  });
  secondDocumentHeader.tagName = 'doc';
  secondDocumentHeader.children.forEach((node) => {
    if (isXmlElementNode(node) && node.tagName === 'docID') {
      node.tagName = 'mDocID';
    }
  });

  const merged: XmlElementNode = {
    tagName: 'merged',
    attributes: {},
    children: [firstDocumentHeader, secondDocumentHeader]
  };

  return {
    tagName: 'AOHeader',
    attributes: {},
    children: [xmlElementNode('docID', {}, [xmlTextNode(newDocID)]),
      xmlElementNode('meta', {}, [
        xmlElementNode('merge', {'date': new Date().toISOString(), 'editor':'DocumentMerger'}, []),
        xmlElementNode('annotation', {}, []),
        merged
      ])]
  };
}

export function replaceLNR(node: XmlElementNode, publicationMap: Map<string, string[]>) {
  let textLine: string = node.attributes['lnr'] ? node.attributes['lnr'] : 'empty';
  
  const lineMatch = textLine.match(lineNumberRegex);
  if (textLine && lineMatch && lineMatch.groups) {
    let lineIndex = lineMatch.groups.index;
    console.log(lineMatch.groups);
    if (lineIndex.includes('+')) {
      const lineIndices = lineIndex.replace('€', '').split('+');
      if (lineIndices.length == 2 && publicationMap.get(lineIndices[1]) && publicationMap.get(lineIndices[0])) {
        // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
        lineIndices[1] = lineIndices[1].replace(lineIndices[1], publicationMap.get(lineIndices[1])![0]);
        // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
        lineIndices[0] = lineIndices[0].replace(lineIndices[0], publicationMap.get(lineIndices[0])![0]);
        lineIndex = '€' + lineIndices.join('+');
      }
    } else {

      if (publicationMap.get(lineIndex.substring(1)) === undefined) {
        console.log(publicationMap);
        console.log(node);
        console.log(textLine);
        console.log(lineIndex.substring(1));
        console.log(publicationMap.get(lineIndex.substring(1)));
      }
      // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
      lineIndex = lineIndex.replace(lineIndex.substring(1), publicationMap.get(lineIndex.substring(1))![0]);
    }
    textLine = textLine.replace(lineMatch.groups.index, lineIndex);

  } else if (publicationMap.values()) {
    // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
    textLine = '{€' + Array.from(publicationMap.values()).pop()![0] + '} ' + textLine;
  }
  return textLine;
}

export function resetPublicationMap(publMap: Map<string, string[]>) {
  const updatedMappings: Map<string, string> = new Map<string, string>();
  Array.from(publMap.entries()).map((entry) => {
    const index = entry[0];
    const mapping = entry[1];
    if (index.toString() != mapping[0]) {
      updatedMappings.set(index, mapping[0]);
    }
  });
  if (updatedMappings) {
    Array.from(updatedMappings.entries()).map((mapping) => {
      const pMap: string[] | undefined = publMap.get(mapping[0]);
      if (pMap !== undefined) {
        publMap.set(mapping[1], pMap);
        publMap.delete(mapping[0]);
      }
    });
    Array.from(updatedMappings.entries()).map((entry) => {
      const index = entry[0];
      const mapping = entry[1];
      if (index.toString() != mapping[0]) {
        updatedMappings.set(index, mapping[0]);
      }
    });
  }

  return publMap;
}
