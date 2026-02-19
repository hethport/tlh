import { removeMacron } from './utils';

export function startsWithExceptForVowelLength(word: string, prefix: string): boolean {
  const wordWithoutMacron = removeMacron(word);
  const prefixWithoutMacron = removeMacron(prefix);
  return wordWithoutMacron.startsWith(prefixWithoutMacron);
}

export function endsWithExceptForVowelLength(word: string, suffix: string): boolean {
  const wordWithoutMacron = removeMacron(word);
  const suffixWithoutMacron = removeMacron(suffix);
  return wordWithoutMacron.endsWith(suffixWithoutMacron);
}
