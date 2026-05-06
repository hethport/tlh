import { objectToSetValuedMap, objectToMap, objectWithNumericKeysToMap, objectToArrayMap } from '../common/utils';
import { convertDictionary, convertMapping, convertMappingWithNumericKeys } from '../common/utility';

export function loadSetValuedMapFromLocalStorage<TValue>(localStorageKey: string): Map<string, Set<TValue>> {
  const locallyStoredMap = localStorage.getItem(localStorageKey);
  if (locallyStoredMap === null) {
    return new Map();
  } else {
    const object = JSON.parse(locallyStoredMap);
    return objectToSetValuedMap(object);
  }
}

export function loadMapFromLocalStorage<TValue>(localStorageKey: string): Map<string, TValue> {
  const locallyStoredMap = localStorage.getItem(localStorageKey);
  if (locallyStoredMap === null) {
    return new Map();
  } else {
    const object = JSON.parse(locallyStoredMap);
    return objectToMap(object);
  }
}

export function loadMapWithNumericKeysFromLocalStorage<TValue>(localStorageKey: string): Map<number, TValue> {
  const locallyStoredMap = localStorage.getItem(localStorageKey);
  if (locallyStoredMap === null) {
    return new Map();
  } else {
    const object = JSON.parse(locallyStoredMap);
    return objectWithNumericKeysToMap(object);
  }
}

export function loadItemOrArrayMapFromLocalStorage<TValue>(localStorageKey: string): Map<string, TValue[]> {
  const locallyStoredMap = localStorage.getItem(localStorageKey);
  if (locallyStoredMap === null) {
    return new Map();
  } else {
    const object: { [key: string]: TValue[] | TValue } = JSON.parse(locallyStoredMap);
    return objectToArrayMap(object);
  }
}

export function loadArrayFromLocalStorage<T>(localStorageKey: string, defaultArray: T[]): T[] {
  const locallyStoredArray = localStorage.getItem(localStorageKey);
  if (locallyStoredArray === null) {
    return defaultArray;
  } else {
    const array = JSON.parse(locallyStoredArray);
    return array;
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  const foundString = localStorage.getItem(key);
  return foundString ? JSON.parse(foundString) : defaultValue;
}

export function locallyStoreSetValuedMap<TValue>(map: Map<string, Set<TValue>>, localStorageKey: string): void {
  const object = convertDictionary(map);
  const jsonText = JSON.stringify(object);
  localStorage.setItem(localStorageKey, jsonText);
}

export function locallyStoreMap<TValue>(map: Map<string, TValue>, localStorageKey: string): void {
  const object = convertMapping(map);
  const jsonText = JSON.stringify(object);
  localStorage.setItem(localStorageKey, jsonText);
}

export function locallyStoreMapWithNumericKeys<TValue>(map: Map<number, TValue>, localStorageKey: string): void {
  const object = convertMappingWithNumericKeys(map);
  const jsonText = JSON.stringify(object);
  localStorage.setItem(localStorageKey, jsonText);
}

export function locallyStoreArray<TValue>(array: TValue[], localStorageKey: string): void {
  const jsonText = JSON.stringify(array);
  localStorage.setItem(localStorageKey, jsonText);
}
