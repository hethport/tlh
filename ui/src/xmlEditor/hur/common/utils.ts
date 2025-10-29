import { SelectableLetteredAnalysisOption } from '../../../model/analysisOptions';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { makeGloss } from './auxiliary';

const errorTag = 'ERROR';

export function objectToMap<TValue>(object: {[key: string]: TValue}): Map<string, TValue> {
  const map = new Map<string, TValue>();
  for (const [key, value] of Object.entries(object)) {
    map.set(key, value);
  }
  return map;
}

export function objectToSetValuedMap<TValue>(object: {[key: string]: TValue[]}): Map<string, Set<TValue>> {
  const map = new Map<string, Set<TValue>>();
  for (const [key, values] of Object.entries(object)) {
    const collection = new Set<TValue>();
    for (const value of values) {
      collection.add(value);
    }
    map.set(key, collection);
  }
  return map;
}

export function updateMapWithoutOverride<TKey, TValue>(oldMap: Map<TKey, TValue>, newMap: Map<TKey, TValue>): Map<TKey, TValue> {
  const map = new Map<TKey, TValue>();
  for (const [key, value] of oldMap) {
    map.set(key, value);
  }
  for (const [key, value] of newMap) {
    if (!map.has(key)) {
      map.set(key, value);
    }
  }
  return map;
}

export function updateSetValuedMapWithOverride<TValue>(map: Map<string, Set<TValue>>,
                                               object: {[key: string]: TValue[]}): void {
  for (const [key, values] of Object.entries(object)) {
    const collection = new Set<TValue>();
    for (const value of values) {
      collection.add(value);
    }
    map.set(key, collection);
  }
}

function getValueSet<TKey, TValue>(map: Map<TKey, Set<TValue>>, key: TKey): Set<TValue> {
  let current = map.get(key);
  if (current === undefined) {
    current = new Set<TValue>;
    map.set(key, current);
  }
  return current;
}

export function add<TKey, TValue>(map: Map<TKey, Set<TValue>>, key: TKey, value: TValue) {
  const current = getValueSet(map, key);
  current.add(value);
}

export function remove<TKey, TValue>(map: Map<TKey, Set<TValue>>, key: TKey, value: TValue) {
  const current = map.get(key);
  if (current !== undefined) {
    current.delete(value);
    if (current.size === 0) {
      map.delete(key);
    }
  }
}

export function addMultiple<TKey, TValue>(map: Map<TKey, Set<TValue>>, key: TKey, values: TValue[]) {
  const current = getValueSet(map, key);
  for (const value of values) {
    current.add(value);
  }
}

export function replaceKey<TKey, TValue>(map: Map<TKey, Set<TValue>>, oldKey: TKey, newKey: TKey): void {
  const values = map.get(oldKey);
  if (values !== undefined) {
    map.delete(oldKey);
    const oldValues = map.get(newKey);
    if (oldValues === undefined) {
      // If no value is assigned to the new key
      map.set(newKey, values);
    } else {
      for (const value of values) {
        oldValues.add(value);
      }
    }
  }
}

export function removeMacron(s: string): string {
  return s
    .replaceAll('ā', 'a')
    .replaceAll('ē', 'e')
    .replaceAll('ī', 'i')
    .replaceAll('ō', 'o')
    .replaceAll('ū', 'u')
    .replaceAll('Ā', 'A')
    .replaceAll('Ē', 'E')
    .replaceAll('Ī', 'I')
    .replaceAll('Ō', 'O')
    .replaceAll('Ū', 'U');
}

export function formIsFragment(form: string): boolean {
  return form.includes('[') || form.includes(']') || form.includes('x');
}

export function makeAnalysisOptions(morphTags: string[]): SelectableLetteredAnalysisOption[] {
  const analysisOptions: SelectableLetteredAnalysisOption[] = [];
  let c = 97; // Code von 'a'
  for (const morphTag of morphTags) {
    const analysisOption: SelectableLetteredAnalysisOption =
    {
      letter: String.fromCodePoint(c),
      analysis: morphTag,
      selected: false
    };
    c++;
    analysisOptions.push(analysisOption);
  }
  return analysisOptions;
}

export function groupBy<TSource, TKey, TValue>(array: TSource[], getKey: (elem: TSource) => TKey, getValue: (elem: TSource) => TValue): Map<TKey, Set<TValue>> {
  const map = new Map<TKey, Set<TValue>>();
  for (const element of array) {
    const key = getKey(element);
    const value = getValue(element);
    add(map, key, value);
  }
  return map;
}

export function getMorphTags(analysis: MorphologicalAnalysis): string[] | null {
  switch (analysis._type) {
    case 'SingleMorphAnalysisWithoutEnclitics':
      return [analysis.analysis];
    case 'MultiMorphAnalysisWithoutEnclitics':
      return analysis.analysisOptions.map(({analysis}) => analysis);
    default:
      return null;
  }
}

export function makeGlossFromMorphologicalAnalysis(morphologicalAnalysis: MorphologicalAnalysis): string {
  const { translation } = morphologicalAnalysis;
  const morphTags = getMorphTags(morphologicalAnalysis);
  const hasValidTag = (morphTags !== null && morphTags.length > 0);
  const tag = hasValidTag ? morphTags[0] : errorTag;
  return makeGloss(translation, tag);
}
