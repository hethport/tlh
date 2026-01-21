import { loadArrayFromLocalStorage, locallyStoreArray } from '../dictLocalStorage/localStorageUtils';

const defaultPartsOfSpeech: string[] = [
  'ADV',
  'CONJ',
  'PREP',
  'POST',
  'INTJ',
  'NUM',
  'PRON',
  'NF',
  'ADJ',
  'noun',
  'verb',
  'unclear'
];

const localStorageKey = 'HurrianPartsOfSpeech';
let partsOfSpeech: string[] = loadArrayFromLocalStorage(localStorageKey, defaultPartsOfSpeech);
export function locallyStoreHurrianPartsOfSpeech(): void {
  locallyStoreArray(partsOfSpeech, localStorageKey);
}

export function getPartsOfSpeech(): string[] {
  return partsOfSpeech;
}

export function setPartsOfSpeech(value: string[]): void {
  partsOfSpeech = value;
}

const cases = /.*(?:ABS|ERG|GEN|DAT|DIR|ABL|COM|ESS|EQU|ASSOC).*/;
const indeclinable = /\.?(ADV|CONJ|PREP|INTJ).*/;

export function getPos(template: string, morphTag: string | null, translation: string): string
{
  if (morphTag !== null && morphTag.includes('=')) {
    morphTag = morphTag.split('=')[0];
  }
  if (translation.includes('PRON')) {
    return 'PRON';
  }
  if (morphTag !== null) {
    const match = morphTag.match(indeclinable);
    if (match) {
      return match[1];
    }
  }
  if (template === '') {
    if (morphTag === 'CVB' || morphTag === 'INF') {
      return 'NF';
    }
    if (morphTag !== null) {
      if (morphTag.includes('PRON')) {
        return 'PRON';
      }
      if (morphTag.match(cases)) {
        return 'noun';
      }
      return 'verb';
    }
    return 'unclear';
  }
  if (template === 'aspect' || template === 'modal' || template === 'voice')
  {
    return 'verb';
  }
  else
  {
    return template;
  }
}