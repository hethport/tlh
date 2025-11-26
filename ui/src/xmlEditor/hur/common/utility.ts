import { isValidForm } from '../dict/morphologicalAnalysisValidator';
import { addMultiple } from './utils';

export function convertMapping<TValue>(dictionary: Map<string, TValue>): { [key: string]: TValue } {
  const object: { [key: string]: TValue } = {};
  for (const [key, value] of dictionary) {
    object[key] = value;
  }
  return object;
}

export function updateMapping<TValue>(dictionary: Map<string, TValue>,
                                      object: { [key: string]: TValue }): void {
  for (const [key, value] of Object.entries(object)) {
    dictionary.set(key, value);
  }
}

export function convertDictionary(dictionary: Map<string, Set<string>>): { [key: string]: string[] } {
  const object: { [key: string]: string[] } = {};
  for (const [key, value] of dictionary) {
    object[key] = Array.from(value);
  }
  return object;
}

export function updateDictionary(dictionary: Map<string, Set<string>>, object: { [key: string]: string[] }): void {
  for (const [key, values] of Object.entries(object)) {
    addMultiple(dictionary, key, values);
  }
}

export function updateGlossesLexicon(dictionary: Map<string, Set<string>>, object: { [key: string]: string[] }): void {
  for (const [key, values] of Object.entries(object)) {
    if (isValidForm(key)) {
      const currSet = dictionary.get(key);
      if (currSet === undefined) {
        dictionary.set(key, new Set(values));
      }
      else {
        for (const value of values) {
          currSet.add(value);
        }
      }
    }
  }
}
