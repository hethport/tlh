import {findFirstXmlElementByTagName, isXmlElementNode, XmlElementNode, XmlNode} from '../xmlModel/xmlModel';
import {ZipWithOffsetResult} from './zipWithOffset';

const lineNumberRegex = /{€(?<fragment>\d)}\s*(?<lines>[\W\w]+)/;

export interface MergeLine {
  lineNumberNode: XmlElementNode;
  rest: XmlNode[];
}

export interface MergeDocument {
  prior: XmlNode[];
  lines: MergeLine[];
}

export function readMergeDocument(rootNode: XmlElementNode): MergeDocument {
  const element: XmlElementNode | undefined = findFirstXmlElementByTagName(rootNode, 'text');

  if (!element) {
    throw new Error('could not read document!');
  }

  const result: MergeDocument = {prior: [], lines: []};

  element.children.forEach((node) => {
    if (isXmlElementNode(node) && node.tagName === 'lb') {
      result.lines.push({lineNumberNode: node, rest: []});
    } else if (result.lines.length === 0) {
      result.prior.push(node);
    } else {
      result.lines[result.lines.length - 1].rest.push(node);
    }
  });

  return result;
}

export function mergeLines(mls: ZipWithOffsetResult<MergeLine>): MergeLine[] {
  return mls.map(([left, right]) => {
    if (left && right) {
      return mergeLine(left, right);
    } else if (left) {
      return left;
    } else if (right) {
      return right;
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
  if (lnr === undefined || rnr === undefined) {
    return undefined;
  }

  const leftMatch = lnr.match(lineNumberRegex);
  const rightMatch = rnr.match(lineNumberRegex);

  // TODO: make lineNumber a node!
  return leftMatch && leftMatch.groups && rightMatch && rightMatch.groups
    ? `{€${leftMatch.groups.fragment}+${rightMatch.groups.fragment}} ${leftMatch.groups.lines} / ${rightMatch.groups.lines}`
    : undefined;
}

function mergeLine(
  {lineNumberNode: leftLineNumberNode, rest: leftRest}: MergeLine,
  {lineNumberNode: rightLineNumberNode, rest: rightRest}: MergeLine
): MergeLine {

  const lnr = leftLineNumberNode.attributes.lnr || '';
  const rnr = rightLineNumberNode.attributes.lnr || '';

  const lineNumber = computeNewLineNumber(lnr, rnr) || (lnr + rnr);

  const lineNumberNode: XmlElementNode = {
    tagName: 'lb', children: [], attributes: {'lnr': lineNumber}
  };

  return {lineNumberNode, rest: [...leftRest, mergeSeparatorElement, ...rightRest]};
}