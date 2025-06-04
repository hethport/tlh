import { isValid, normalize } from './morphologicalAnalysisValidator';
import { sendMorphologicalAnalysisToTheServer } from './sendToTheServer';

export function convertDictionary(dictionary: Map<string, Set<string>>): { [key: string]: string[] } {
  const object: { [key: string]: string[] } = {};
  for (const [key, value] of dictionary) {
    object[key] = Array.from(value);
  }
  return object;
}

export function updateGlossesLexicon(dictionary: Map<string, Set<string>>, object: { [key: string]: string[] }): void {
  for (const [key, values] of Object.entries(object)) {
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

export function updateAndValidateDictionary(dictionary: Map<string, Set<string>>, object: { [key: string]: string[] }): void {
  for (const [key, values] of Object.entries(object)) {
    const currSet = dictionary.get(key);
    if (currSet === undefined) {
      const newSet: Set<string> = new Set();
      for (const value of values) {
        if (isValid(value)) {
          const normalized = normalize(value, true);
          newSet.add(normalize(value, true));
          sendMorphologicalAnalysisToTheServer(key, normalized);
        }
      }
      if (newSet.size > 0) {
        dictionary.set(key, newSet);
      }
    } else {
      for (const value of values) {
        if (isValid(value)) {
          const normalized = normalize(value, true);
          currSet.add(normalized);
          sendMorphologicalAnalysisToTheServer(key, normalized);
        }
      }
    }
  }
}