import { XmlElementNode } from 'simple_xml';
import { getText, getMrps } from '../common/xmlUtilities';
import { makeBoundTranscription } from '../transduction/transcribe';
import { makeStandardAnalyses } from '../transduction/standardAnalysis';
import { setGlosses, saveGloss } from '../translations/glossUpdater';
import { MorphologicalAnalysis, writeMorphAnalysisValue, readMorphologicalAnalysis }
  from '../../../model/morphologicalAnalysis';
import { convertDictionary } from '../common/utility';
import { isValid, normalize, isValidFor } from './morphologicalAnalysisValidator';
import { Segmenter, createSegmenter } from '../segmentation/segmenter';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import { objectToSetValuedMap, updateSetValuedMapWithOverride, remove } from '../common/utils';
import { locallyStoreSetValuedMap } from '../dictLocalStorage/localStorageUtils';
import { reserializeMorphologicalAnalysis } from '../morphologicalAnalysis/reserialization';
import { containsBrackets, removeBrackets } from '../common/brackets';
import { SegmenterInfo, IStem } from '../segmentation/segmenterInfo';
import { removeMacron, addMultiple, add } from '../common/utils';
import { isOnTheStopListFor } from '../stopList/stopList';
import { SuffixChainInventories, getSuffixChainInventories }
  from '../segmentation/suffixChainInventories';
import { newStore } from '../../../newStore';
import { LookupConfig } from '../../lookupConfig';

export type Dictionary = Map<string, Set<string>>;

export type ModifyDictionary = (dictionary: Dictionary) => Dictionary;

export type SetDictionary = (modifyDictionary: ModifyDictionary) => void;

export type DictionaryObject = { [key: string]: string[] };

let segmenter: Segmenter = new Segmenter();
let segmenterInfo: SegmenterInfo = new SegmenterInfo(segmenter);

function getLookupConfig(): LookupConfig {
  const state = newStore.getState();
  const lookupConfig = state.lookupConfig.lookupConfig;
  return lookupConfig;
}

export function simplifyTranscription(transcription: string, { ignorePlene }: LookupConfig): string {
  let simplifiedTranscription = transcription;
  if (ignorePlene) {
    simplifiedTranscription = removeMacron(transcription);
  }
  return simplifiedTranscription;
}

function simplifyDictionary(dictionary: Dictionary, lookupConfig: LookupConfig): Dictionary {
  simplifiedDictionary = new Map<string, Set<string>>();
  for (const [transcription, analyses] of dictionary) {
    const simplifiedTranscription = simplifyTranscription(transcription, lookupConfig);
    addMultiple(simplifiedDictionary, simplifiedTranscription, analyses);
  }
  return simplifiedDictionary;
}

export function rebuildSimplifiedDictionary(dictionary: Dictionary): void {
  const lookupConfig = getLookupConfig();
  simplifiedDictionary = simplifyDictionary(dictionary, lookupConfig);
}

let simplifiedDictionary: Dictionary = new Map();

function initializeDictionary(locStorKey: string): Dictionary {
  const locallyStoredDictionary = localStorage.getItem(locStorKey);
  if (locallyStoredDictionary === null) {
    return new Map();
  } else {
    const dictObject: { [key: string]: string[] } = JSON.parse(locallyStoredDictionary);
    const dict = objectToSetValuedMap(cleanUpDictionary(dictObject));
    segmenter = createSegmenter(dict);
    segmenterInfo = new SegmenterInfo(segmenter);
    rebuildSimplifiedDictionary(dict);
    return dict;
  }
}

const localStorageKey = 'HurrianDictionary';
export let dictionary: Dictionary = initializeDictionary(localStorageKey);
export function locallyStoreHurrianDictionary(): void {
  locallyStoreSetValuedMap(dictionary, localStorageKey);
}

/*fetch('PrecompiledDictionary.json')
  .then(response => response.json())
  .then(json => {
    updateSetValuedMapWithOverride(dictionary, json.dictionary);
    const {glosses} = json;
    upgradeGlosses(glosses);
  });*/

export function setGlobalDictionary(newDictionary: Dictionary): void {
  dictionary = newDictionary;
}

export function getGlobalDictionary(): Dictionary {
  return dictionary;
}

export function containsAnalysis(dictionary: Dictionary, analysis: string): boolean {
  return Array.from(dictionary.values()).some(analyses => analyses.has(analysis));
}

type LookupResult = Set<string> | undefined;

function lookup(dictionary: Dictionary, transcription: string): LookupResult {
  const analyses = dictionary.get(transcription);
  if (analyses === undefined && containsBrackets(transcription)) {
    return dictionary.get(removeBrackets(transcription));
  } else {
    return analyses;
  }
}

function parameterizedLookup(transcription: string, lookupConfig: LookupConfig): LookupResult {
  const simplifiedTranscription = simplifyTranscription(transcription, lookupConfig);
  return lookup(simplifiedDictionary, simplifiedTranscription);
}

function isAppropriateFor(analysis: string, transcription: string): boolean {
  if (isValidFor(analysis, transcription)) {
    const ma = readMorphAnalysisValue(analysis);
    if (ma !== undefined && !isOnTheStopListFor(ma, transcription)) {
      return true;
    }
  }
  return false;
}

export function annotateHurrianWord(node: XmlElementNode, lookupConfig: LookupConfig): void {

  const transliteration: string = getText(node);
  const transcription: string = makeBoundTranscription(transliteration);

  node.attributes.trans = transcription;
  if (node.attributes.mrp0sel === 'HURR') {
    node.attributes.mrp0sel = '';
  }

  const possibilities: Set<string> | undefined = parameterizedLookup(transcription, lookupConfig);
  if (possibilities !== undefined) {
    setGlosses(node);
    if (node.attributes.firstAnalysisIsPlaceholder === 'true') {
      delete node.attributes.mrp1;
      delete node.attributes.firstAnalysisIsPlaceholder;
    }
    const mrps: Map<string, string> = getMrps(node);
    if (mrps.size === 0) {
      let i = 1;
      for (const analysis of possibilities) {
        if (isAppropriateFor(analysis, transcription)) {
          node.attributes['mrp' + i.toString()] = analysis;
          i++;
        }
      }
    }
  } else {
    const mrps: Map<string, string> = getMrps(node);
    if (mrps.size === 0) {
      const results: MorphologicalAnalysis[] = segmenter.segment(transcription)
        .filter(ma => !isOnTheStopListFor(ma, transcription));
      if (results.length > 0) {
        let i = 1;
        for (const ma of results) {
          node.attributes['mrp' + i.toString()] = writeMorphAnalysisValue(ma);
          i++;
        }
      } else {
        const analyses: MorphologicalAnalysis[] = makeStandardAnalyses(transcription)
          .filter(ma => !isOnTheStopListFor(ma, transcription));
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
}

export function updateHurrianDictionary(
  node: XmlElementNode, number: number, value: string
): void {
  if (number === 1) {
    delete node.attributes.firstAnalysisIsPlaceholder;
  }
  const transcription: string = node.attributes.trans || '';
  basicUpdateHurrianDictionary(transcription, value);
  saveGloss(number, value);
}

export function basicUpdateHurrianDictionary(
  transcription: string, value: string
): void {
  if (!isValid(value)) {
    return;
  }
  const normalized = normalize(value, true, false);
  if (normalized !== null) {
    add(dictionary, transcription, normalized);
    const noPleneTranscription = removeMacron(transcription);
    add(simplifiedDictionary, noPleneTranscription, normalized);
    const ma = readMorphologicalAnalysis(1, normalized, []);
    if (ma !== undefined) {
      segmenter.add(transcription, ma);
    }
  }
}

export function deleteAnalysisFromHurrianDictionary(transcription: string, analysis: string) {
  remove(dictionary, transcription, analysis);
}

export function getDictionary(): { [key: string]: string[] } {
  return convertDictionary(dictionary);
}

export function upgradeDictionary(object: { [key: string]: string[] }): void {
  updateSetValuedMapWithOverride(dictionary, object);
  segmenter = createSegmenter(dictionary);
}

export function cleanUpDictionary(object: { [key: string]: string[] }): { [key: string]: string[] } {
  const newObject: { [key: string]: string[] } = {};
  for (const [key, values] of Object.entries(object)) {
    const newValues = values.filter(analysis => {
      const ma = readMorphAnalysisValue(analysis);
      return ma !== undefined;
    });
    if (newValues.length > 0) {
      newObject[key] = newValues;
    }
  }
  return newObject;
}

export function setDictionary(obj: { [key: string]: string[] }): void {
  const newObj: { [key: string]: string[] } = {};
  for (const [transcription, analyses] of Object.entries(obj)) {
    const newAnalyses: string[] = [];
    for (const analysis of analyses) {
      const reserialized = reserializeMorphologicalAnalysis(analysis);
      if (reserialized !== undefined) {
        newAnalyses.push(reserialized);
      }
    }
    if (newAnalyses.length > 0) {
      newObj[transcription] = newAnalyses;
    }
  }
  dictionary = objectToSetValuedMap(newObj);
  segmenter = createSegmenter(dictionary);
  segmenterInfo = new SegmenterInfo(segmenter);
  rebuildSimplifiedDictionary(dictionary);
}

export function getStemVariants(stem: IStem): Set<string> {
  return segmenterInfo.getStemVariants(stem);
}

export function getSuffixChains(): SuffixChainInventories {
  return getSuffixChainInventories(segmenter);
}
