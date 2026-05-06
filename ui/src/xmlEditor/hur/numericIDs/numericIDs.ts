import { locallyStoreSetValuedMap, loadSetValuedMapFromLocalStorage } from '../dictLocalStorage/localStorageUtils';
import { convertDictionary } from '../common/utility';
import { objectToSetValuedMap } from '../common/utils';

const fieldSeparator = ' @ ';
export function getNumericIDKey(stem: string, pos: string, germanTranslation: string): string {
  return [stem, pos, germanTranslation].join(fieldSeparator);
}

export type NumericIDs = Map<string, Set<number>>;
export type NumericIDsObject = { [key: string]: number[] };

const localStorageKey = 'numericIDs';
let numericIDs: NumericIDs;
try {
  numericIDs = loadSetValuedMapFromLocalStorage(localStorageKey);
} catch(SyntaxError) {
  console.log('The English translations could not be loaded from the local storage.');
  numericIDs = new Map();
}
function locallyStoreNumericIDs() {
  locallyStoreSetValuedMap(numericIDs, localStorageKey);
}

// Accessors for the dictionary editor

export function getGlobalNumericIDs(): NumericIDs {
  return numericIDs;
}

export function setGlobalNumericIDs(newNumericIDs: NumericIDs): void {
  numericIDs = newNumericIDs;
  locallyStoreNumericIDs();
}

// Accessors for saving and loading JSON files

export function getNumericIDs(): NumericIDsObject {
  return convertDictionary(numericIDs);
}

export function setNumericIDs(newNumericIDs: NumericIDsObject): void {
  numericIDs = objectToSetValuedMap(newNumericIDs);
  locallyStoreNumericIDs();
}
