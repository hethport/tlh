import { locallyStoreMapWithNumericKeys, loadMapWithNumericKeysFromLocalStorage } from '../dictLocalStorage/localStorageUtils';
import { convertMappingWithNumericKeys } from '../common/utility';
import { objectWithNumericKeysToMap } from '../common/utils';

export type References = Map<number, string>;
export type ReferencesObject = { [key: number]: string };

const localStorageKey = 'references';
let references: References;
try {
  references = loadMapWithNumericKeysFromLocalStorage(localStorageKey);
} catch(SyntaxError) {
  console.log('The English translations could not be loaded from the local storage.');
  references = new Map();
}
function locallyStoreReferences() {
  locallyStoreMapWithNumericKeys(references, localStorageKey);
}

// Accessors for the dictionary editor

export function getGlobalReferences(): References {
  return references;
}

export function setGlobalReferences(newReferences: References): void {
  references = newReferences;
  locallyStoreReferences();
}

// Accessors for saving and loading JSON files

export function getReferences(): ReferencesObject {
  return convertMappingWithNumericKeys(references);
}

export function setReferences(newReferences: ReferencesObject): void {
  references = objectWithNumericKeysToMap(newReferences);
  locallyStoreReferences();
}
