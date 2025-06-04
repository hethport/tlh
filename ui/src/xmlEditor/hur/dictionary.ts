import { XmlElementNode } from 'simple_xml';
import { getText, getMrps } from './xmlUtilities';
import { makeBoundTranscription } from './transcribe';
import { makeStandardAnalyses } from './standardAnalysis';
import { setGlosses, saveGloss } from './glossUpdater';
import { MorphologicalAnalysis, writeMorphAnalysisValue }
  from '../../model/morphologicalAnalysis';
import { getHurrianDictionaryUrl } from '../../urls';
import { convertDictionary, updateAndValidateDictionary } from './utility';
import { isValid, normalize } from './morphologicalAnalysisValidator';
import { sendMorphologicalAnalysisToTheServer } from './sendToTheServer';

const dictionary: Map<string, Set<string>> = new Map();

fetch(getHurrianDictionaryUrl, {method: 'GET'}).then(response => {
  response.json().then(obj => {
    upgradeDictionary(obj);
  });
});

export function annotateHurrianWord(node: XmlElementNode): void {
  const transliteration: string = getText(node);
  const transcription: string = makeBoundTranscription(transliteration);

  node.attributes.trans = transcription;
  if (node.attributes.mrp0sel === 'HURR') {
    node.attributes.mrp0sel = '';
  }

  if (dictionary.has(transcription)) {
    setGlosses(node);
    const possibilities: Set<string> | undefined = dictionary.get(transcription);
    if (possibilities === undefined) {
      throw new Error();
    }
    if (node.attributes.firstAnalysisIsPlaceholder === 'true') {
      delete node.attributes.mrp1;
      delete node.attributes.firstAnalysisIsPlaceholder;
    }
    const mrps: Map<string, string> = getMrps(node);
    const analyses: Set<string> = new Set(
      Array.from(mrps.values()).map((an: string) => an.replaceAll(' ', ''))
    );
    let i: number;
    if (mrps.size > 0) {
      i = Math.max(...Array.from(mrps.keys()).map(num => parseInt(num, 10)));
    }
    else {
      i = 0;
    }
    for (const analysis of possibilities) {
      if (!analyses.has(analysis.replaceAll(' ', ''))) {
        i++;
        node.attributes['mrp' + i.toString()] = analysis;
      }
    }
  } else {
    const mrps: Map<string, string> = getMrps(node);
    if (mrps.size == 0) {
      const analyses: MorphologicalAnalysis[] = makeStandardAnalyses(transcription);
      if (analyses.length > 0) {
        for (const ma of analyses) {
          node.attributes['mrp' + ma.number.toString()]
            = writeMorphAnalysisValue(ma);
        }
      }
      else {
        node.attributes.mrp1 = transcription + '@@@@';
        node.attributes.firstAnalysisIsPlaceholder = 'true';
      }
    }
    setGlosses(node);
  }
}

export function sendMorphologicalAnalysisToTheServer(word: string, analysis: string) {
  const formData = new FormData();
  formData.append('word', word);
  formData.append('analysis', analysis);

  fetch(updateHurrianDictionaryUrl, {method: 'POST', body: formData});
}

export function updateHurrianDictionary(node: XmlElementNode, number: number, value: string): void {
  if (isValid(value)) {
    value = normalize(value, false);
    if (number === 1) {
      delete node.attributes.firstAnalysisIsPlaceholder;
    }
    const transcription: string = node.attributes.trans || '';
    let possibilities: Set<string> | undefined;
    if (dictionary.has(transcription)) {
      possibilities = dictionary.get(transcription);
    }
    else {
      possibilities = new Set<string>();
      dictionary.set(transcription, possibilities);
    }
    if (possibilities === undefined) {
      throw new Error();
    }
    possibilities.add(value);
    sendMorphologicalAnalysisToTheServer(transcription, value);
    saveGloss(number, value);
  }
}

export function getDictionary(): { [key: string]: string[] } {
  return convertDictionary(dictionary);
}

export function upgradeDictionary(object: { [key: string]: string[] }): void {
  updateAndValidateDictionary(dictionary, object);
}
