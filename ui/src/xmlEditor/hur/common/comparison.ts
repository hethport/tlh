import { removeMacron } from './utils';
import { removeBrackets } from './brackets';

export type AlphabetizationOptions = {
  alphabetizeIAsE: boolean;
  alphabetizeOAsU: boolean;
  alphabetizeVoicedConsonantsAsVoiceless: boolean;
}

function preprocessString(s: string, {alphabetizeIAsE, alphabetizeOAsU,
    alphabetizeVoicedConsonantsAsVoiceless}: AlphabetizationOptions): string {
  return removeBrackets(removeMacron(s))
    .toLowerCase()
    .replaceAll('+', '');
}

const lang = 'lv';
const latvianCompare = new Intl.Collator(lang).compare;
function compareLetter(a: string, b: string): number {
  if (a === 'g' && b === 'ġ') {
    return -1;
  } else if (a === 'ġ' && b === 'g') {
    return 1;
  } else {
    return latvianCompare(a, b);
  }
}

export function compare(a: string, b: string, options: AlphabetizationOptions): number {
  a = preprocessString(a, options);
  b = preprocessString(b, options);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const comparisonResult = compareLetter(a[i], b[i]);
    if (comparisonResult === 0) {
      continue;
    } else {
      return comparisonResult;
    }
  }
  return b.length - a.length;
}
