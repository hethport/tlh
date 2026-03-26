import { Entry } from './Wordform';
import { getStem, openingBracket } from '../common/splitter';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';

const unknownMeaningSymbol = 'u.B.';
const unclearPartOfSpeechSymbol = 'unclear';
const embracketedFragmentarySigns = /\[x+\]/u;
const stemInUnopenedBracket = /^[^[]*\]$/u;

function containsEmbracketedFragmentarySigns(stem: string): boolean {
  return stem.search(embracketedFragmentarySigns) !== -1;
}

function endsInUnopenedBracket(stem: string): boolean {
  return stemInUnopenedBracket.test(stem);
}

function stemIsFragmentary(stem: string) {
  return stem === '[' || stem.startsWith(']') ||
    endsInUnopenedBracket(stem) ||
    containsEmbracketedFragmentarySigns(stem);
}

export function rootMayBeOnlyPartiallyPreserved(stem: string, translation: string, entries: Entry[]): boolean {
  const isFragmentary = entries.every(entry => {
    return getStem(entry.morphologicalAnalysis.referenceWord).endsWith(openingBracket);
  });
  return isFragmentary && !stem.includes('+') &&
    (translation === unknownMeaningSymbol || translation === '');
}

function hasUnclearMeaningAndPos(ma: MorphologicalAnalysis): boolean {
  return ma.translation === unknownMeaningSymbol && ma.paradigmClass === unclearPartOfSpeechSymbol;
}

export function shouldBeShownInTheDictionary(ma: MorphologicalAnalysis, showUnclearForms: boolean): boolean {
  if (!showUnclearForms && hasUnclearMeaningAndPos(ma)) {
    return false;
  }
  const segmentation = ma.referenceWord;
  const stem = getStem(segmentation);
  if (stemIsFragmentary(stem)) {
    return false;
  }
  return true;
}
