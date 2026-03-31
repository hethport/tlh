import { XmlElementNode } from 'simple_xml';
import { getText, getMrps } from '../common/xmlUtilities';
import { makeBoundTranscription } from '../transduction/transcribe';
import { makeStandardAnalyses } from '../transduction/standardAnalysis';
import { setGlosses, saveGloss } from '../translations/glossUpdater';
import { MorphologicalAnalysis, readMorphologicalAnalysis }
  from '../../../model/morphologicalAnalysis';
import { convertDictionary } from '../common/utility';
import { isValid, normalize, isValidFor } from './morphologicalAnalysisValidator';
import { Segmenter, createSegmenter } from '../segmentation/segmenter';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import { objectToSetValuedMap, remove } from '../common/utils';
import { locallyStoreSetValuedMap, loadFromLocalStorage } from '../dictLocalStorage/localStorageUtils';
import { reserializeMorphologicalAnalysis } from '../morphologicalAnalysis/reserialization';
import { containsBrackets, removeBrackets } from '../common/brackets';
import { SegmenterInfo, IStem } from '../segmentation/segmenterInfo';
import { addMultiple, add } from '../common/utils';
import { isOnTheStopListFor } from '../stopList/stopList';
import { StemInventories, getStemInventories }
  from '../segmentation/stemInventories';
import { SuffixChainInventories, getSuffixChainInventories }
  from '../segmentation/suffixChainInventories';
import { LookupConfig, defaultLookupConfig } from '../../lookupConfig';
import { simplifyTranscription } from '../transduction/simplifyTranscription';
import { parseMorphologicalAnalyses } from './parseMorphologicalAnalyses';
import { writeMorphologicalAnalysesToNode } from './writeMorphologicalAnalysesToNode';
import { getNegatedFrequencyDifference } from '../concordance/concordance';
import { shouldBeAnnotated } from './shouldBeAnnotated';

export type Dictionary = Map<string, Set<string>>;

export type ModifyDictionary = (dictionary: Dictionary) => Dictionary;

export type SetDictionary = (modifyDictionary: ModifyDictionary) => void;

export type DictionaryObject = { [key: string]: string[] };

let segmenter: Segmenter = new Segmenter();
let segmenterInfo: SegmenterInfo = new SegmenterInfo(segmenter);

const lookupConfigKey = 'lookupPreferences';

export function getLookupConfig(): LookupConfig {
  const lookupConfig = loadFromLocalStorage<LookupConfig>(lookupConfigKey, defaultLookupConfig);
  return lookupConfig;
}

function simplifyDictionary(dictionary: Dictionary, lookupConfig: LookupConfig): Dictionary {
  simplifiedDictionary = new Map<string, Set<string>>();
  for (const [transcription, analyses] of dictionary) {
    const simplifiedTranscription = simplifyTranscription(transcription, lookupConfig);
    addMultiple(simplifiedDictionary, simplifiedTranscription, analyses);
  }
  return simplifiedDictionary;
}

function rebuildSimplifiedDictionary(dictionary: Dictionary, lookupConfig: LookupConfig): void {
  simplifiedDictionary = simplifyDictionary(dictionary, lookupConfig);
  segmenter = createSegmenter(dictionary, lookupConfig);
  segmenterInfo = new SegmenterInfo(segmenter);
}

export function rebuildSimplifiedDictionaryWithNewConfig(lookupConfig: LookupConfig): void {
  rebuildSimplifiedDictionary(dictionary, lookupConfig);
}

function readLookupConfigAndRebuildSimplifiedDictionary(dictionary: Dictionary): void {
  const lookupConfig = getLookupConfig();
  rebuildSimplifiedDictionary(dictionary, lookupConfig);
}

let simplifiedDictionary: Dictionary = new Map();

function initializeDictionary(locStorKey: string): Dictionary {
  const locallyStoredDictionary = localStorage.getItem(locStorKey);
  if (locallyStoredDictionary === null) {
    return new Map();
  } else {
    const dictObject: { [key: string]: string[] } = JSON.parse(locallyStoredDictionary);
    const dict = objectToSetValuedMap(cleanUpDictionary(dictObject));
    readLookupConfigAndRebuildSimplifiedDictionary(dict);
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

/*
 * Repeat the lookup with brackets removed if it was unsuccessful.
 */
function lookup(dictionary: Dictionary, transcription: string): LookupResult {
  const analyses = dictionary.get(transcription);
  if (analyses === undefined && containsBrackets(transcription)) {
    return dictionary.get(removeBrackets(transcription));
  } else {
    return analyses;
  }
}

function isAppropriateFor(morphologicalAnalysis: MorphologicalAnalysis, transcription: string): boolean {
  return isValidFor(morphologicalAnalysis, transcription) &&
    !isOnTheStopListFor(morphologicalAnalysis, transcription);
}

export function annotateHurrianWord(node: XmlElementNode, lookupConfig: LookupConfig): void {

  const transliteration: string = getText(node);
  const transcription: string = makeBoundTranscription(transliteration);

  node.attributes.trans = transcription;
  if (node.attributes.mrp0sel === 'HURR') {
    node.attributes.mrp0sel = '';
  }
  const simplifiedTranscription = simplifyTranscription(transcription, lookupConfig);

  const possibilities: Set<string> | undefined = lookup(simplifiedDictionary, simplifiedTranscription);
  if (possibilities !== undefined) {
    setGlosses(node);
    if (node.attributes.firstAnalysisIsPlaceholder === 'true') {
      delete node.attributes.mrp1;
      delete node.attributes.firstAnalysisIsPlaceholder;
    }
    const mrps: Map<string, string> = getMrps(node);
    if (mrps.size === 0) {
      const morphologicalAnalyses = parseMorphologicalAnalyses(possibilities)
        .filter(morphologicalAnalysis => isAppropriateFor(morphologicalAnalysis, transcription))
        .sort(getNegatedFrequencyDifference);
      writeMorphologicalAnalysesToNode(morphologicalAnalyses, node);
    }
  } else {
    if (!shouldBeAnnotated(transcription)) {
      return;
    }
    const mrps: Map<string, string> = getMrps(node);
    if (mrps.size === 0) {
      const results: MorphologicalAnalysis[] = segmenter.segment(
        simplifiedTranscription, transcription, lookupConfig
      ).filter(ma => !isOnTheStopListFor(ma, transcription));
      if (results.length > 0) {
        writeMorphologicalAnalysesToNode(results, node);
      } else {
        const analyses: MorphologicalAnalysis[] = makeStandardAnalyses(transcription)
          .filter(ma => !isOnTheStopListFor(ma, transcription));
        if (analyses.length > 0) {
          writeMorphologicalAnalysesToNode(analyses, node);
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
  node: XmlElementNode, number: number, value: string, lookupConfig: LookupConfig
): void {
  if (number === 1) {
    delete node.attributes.firstAnalysisIsPlaceholder;
  }
  const transcription: string = node.attributes.trans || '';
  basicUpdateHurrianDictionary(transcription, value, lookupConfig);
  saveGloss(number, value);
}

export function basicUpdateHurrianDictionary(
  transcription: string, value: string, lookupConfig: LookupConfig
): void {
  if (!isValid(value)) {
    return;
  }
  const normalized = normalize(value, true, false);
  if (normalized !== null) {
    add(dictionary, transcription, normalized);
    const simplifiedTranscription = simplifyTranscription(transcription, lookupConfig);
    add(simplifiedDictionary, simplifiedTranscription, normalized);
    const ma = readMorphologicalAnalysis(1, normalized, []);
    if (ma !== undefined) {
      segmenter.add(simplifiedTranscription, ma, lookupConfig, transcription);
    }
  }
}

export function deleteAnalysisFromHurrianDictionary(transcription: string, analysis: string) {
  remove(dictionary, transcription, analysis);
}

export function getDictionary(): { [key: string]: string[] } {
  return convertDictionary(dictionary);
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
  readLookupConfigAndRebuildSimplifiedDictionary(dictionary);
}

export function getStemVariants(stem: IStem): Set<string> {
  return segmenterInfo.getStemVariants(stem);
}


export function getStems(): StemInventories {
  return getStemInventories(segmenter);
}

export function getSuffixChains(): SuffixChainInventories {
  return getSuffixChainInventories(segmenter);
}
