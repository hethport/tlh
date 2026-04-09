import { partsOfSpeech } from './partsOfSpeech';

function getIndex(pos: string): number {
  const index = partsOfSpeech.indexOf(pos);
  if (index === -1) {
    // Parts of speech which are not on the list should come last.
    return partsOfSpeech.length;
  } else {
    return index;
  }
}

export function comparePartsOfSpeech(pos1: string, pos2: string): number {
  const index1 = getIndex(pos1);
  const index2 = getIndex(pos2);
  return index1 - index2;
}
