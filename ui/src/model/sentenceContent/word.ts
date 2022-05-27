import {AOWordContent, aoWordContentFormat, xmlifyAoWordContent} from '../wordContent/wordContent';
import {MorphologicalAnalysis, writeMorphAnalysisAttribute} from '../morphologicalAnalysis';
import {aoBasicText} from '../wordContent/basicText';
import {indent, XmlWriter} from '../../xmlModel/xmlWriting';
import {XmlElementNode} from '../../xmlModel/xmlModel';

export interface AOWord {
  content: AOWordContent[];
  language?: string;
  mrp0sel?: string;
  morphologies?: MorphologicalAnalysis[];
  transliteration?: string;
}

export const aoWordFormat: XmlWriter<AOWord> = ({content, mrp0sel, transliteration, morphologies, language}) => [
  '<w' + (transliteration ? ` trans="${transliteration}"` : '') + (mrp0sel ? ` mrp0sel="${mrp0sel || ''}"` : ''),
  ...(language ? [indent(`lg="${language}"`)] : []),
  ...(morphologies || []).flatMap(writeMorphAnalysisAttribute).map(indent),
  `>${content.map(aoWordContentFormat).join('')}</w>`
];

export function xmlifyAoWord({transliteration, content, language, mrp0sel, morphologies}: AOWord): XmlElementNode {

  const attributes: Record<string, string> = {};

  if (mrp0sel) {
    attributes.mrp0sel = mrp0sel;
  }

  if (transliteration) {
    attributes.transliteration = transliteration;
  }

  if (language) {
    attributes.lng = language;
  }

  if (morphologies) {
    for (const morph of morphologies) {
      attributes[`mrp${morph.number}`] = 'TODO!';
    }
  }

  return {
    tagName: 'w',
    attributes,
    children: content.map(xmlifyAoWordContent)
  };
}

export function parsedWord(...content: (AOWordContent | string)[]): AOWord {
  return {content: content.map((c) => typeof c === 'string' ? aoBasicText(c) : c)};
}
