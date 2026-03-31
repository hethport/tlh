import { removeMacron } from './utils';
import { removeBrackets } from './brackets';
import { AlphabetizationConfig } from '../../alphabetizationConfig';

function preprocessString(s: string,
  { alphabetizeFAsP, alphabetizeVAsB,
    alphabetizeIAsE, alphabetizeOAsU,
    alphabetizeVoicedConsonantsAsVoiceless }: AlphabetizationConfig): string {
  s = removeBrackets(removeMacron(s))
    .toLowerCase()
    .replaceAll('+', '');
  if (alphabetizeFAsP) {
    s = s.replaceAll('f', 'p');
  }
  if (alphabetizeVAsB) {
    s = s.replaceAll('v', 'b');
  }
  if (alphabetizeIAsE) {
    s = s.replaceAll('i', 'e');
  }
  if (alphabetizeOAsU) {
    s = s.replaceAll('o', 'u');
  }
  if (alphabetizeVoicedConsonantsAsVoiceless) {
    s = s.replaceAll('b', 'p')
      .replaceAll('d', 't')
      .replaceAll('g', 'k');
  }
  return s;
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

export const englishCompare = new Intl.Collator('en').compare;
export const germanCompare = new Intl.Collator('de').compare;

export function compare(a: string, b: string, options: AlphabetizationConfig): number {
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
