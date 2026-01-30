import { Entry } from './Wordform';
import { getStem, openingBracket } from '../common/splitter';

const unknownMeaningSymbol = 'u.B.';
const embracketedFragmentarySigns = /\[x+\]/;
function containsEmbracketedFragmentarySigns(stem: string): boolean {
  return stem.search(embracketedFragmentarySigns) !== -1;
}

export function stemIsFragmentary(stem: string) {
  return stem === '' || stem === '[' || stem.startsWith(']') ||
    containsEmbracketedFragmentarySigns(stem);
}

export function rootMayBeOnlyPartiallyPreserved(stem: string, translation: string, entries: Entry[]): boolean {
  const isFragmentary = entries.every(entry => {
    return getStem(entry.morphologicalAnalysis.referenceWord).endsWith(openingBracket);
  });
  return isFragmentary && !stem.includes('+') &&
    (translation === unknownMeaningSymbol || translation === '');
}
