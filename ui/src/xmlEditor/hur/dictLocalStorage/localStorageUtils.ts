import { objectToSetValuedMap, objectToMap } from '../common/utils';
import { convertDictionary, convertMapping } from '../common/utility';

export function loadSetValuedMapFromLocalStorage(localStorageKey: string): Map<string, Set<string>> {
  const locallyStoredMap = null; //localStorage.getItem(localStorageKey);
  if (locallyStoredMap === null) {
    return new Map();
  } else {
    const object = JSON.parse(locallyStoredMap);
    return objectToSetValuedMap(object);
  }
}

export function loadMapFromLocalStorage<TValue>(localStorageKey: string): Map<string, TValue> {
  const locallyStoredMap = null; //localStorage.getItem(localStorageKey);
  if (locallyStoredMap === null) {
    return new Map();
  } else {
    const object = JSON.parse(locallyStoredMap);
    return objectToMap(object);
  }
}

export function loadArrayFromLocalStorage<T>(localStorageKey: string, defaultArray: T[]): T[] {
  const locallyStoredArray = null; //localStorage.getItem(localStorageKey);
  if (locallyStoredArray === null) {
    return defaultArray;
  } else {
    const array = JSON.parse(locallyStoredArray);
    return array;
  }
}

export function locallyStoreSetValuedMap(map: Map<string, Set<string>>, localStorageKey: string): void {
  const object = convertDictionary(map);
  const jsonText = JSON.stringify(object);
  localStorage.setItem(localStorageKey, jsonText);
}

export function locallyStoreMap<TValue>(map: Map<string, TValue>, localStorageKey: string): void {
  const object = convertMapping(map);
  const jsonText = JSON.stringify(object);
  localStorage.setItem(localStorageKey, jsonText);
}

export function locallyStoreArray<TValue>(array: TValue[], localStorageKey: string): void {
  const jsonText = JSON.stringify(array);
  localStorage.setItem(localStorageKey, jsonText);
}
