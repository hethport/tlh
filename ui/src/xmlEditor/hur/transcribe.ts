function removeAuxiliarySymbols(word: string): string {
  word = word
    .replaceAll('〈', '')
    .replaceAll('〉', '');
  return word;
}
function removeDiacritics(word: string): string {
  word = word
    .replaceAll('á', 'a')
    .replaceAll('é', 'e')
    .replaceAll('í', 'i')
    .replaceAll('à', 'a')
    .replaceAll('è', 'e')
    .replaceAll('ì', 'i')
    .replaceAll(/[\u2080-\u2089]/g, '');
  return word;
}
function processVowels(word: string): string {
  word = word
    .replaceAll(/(?<=[aei])-ú(?=$|-)/g, 'V')
    .replaceAll(/(?<=u)-ú(?=-[aei])/g, 'V')

    .replaceAll(/a-a-a/g, 'ā')
    .replaceAll('a-a-', 'ā-')
    .replaceAll('-a-a', '-ā')
    .replace(/^a-a/, 'ā')
    .replace(/a-a$/, 'ā')
    .replaceAll('a-a', 'a')

    .replaceAll(/[e|i]-e-[e|i]/g, 'ē')
    .replaceAll(/^e-[e|i]/g, 'ē')
    .replaceAll('e-e-', 'ē-')
    .replaceAll('-e-e', '-ē')
    .replace(/^e-e/, 'ē')
    .replace(/e-e$/, 'ē')
    .replaceAll('e-e', 'e')

    .replaceAll(/[e|i]-i-i/g, 'ī')
    .replaceAll(/^i-[e|i]/g, 'ī')
    .replaceAll(/[e|i]-i-/g, 'ī-')
    .replaceAll('-i-i', '-ī')
    .replace(/^i-i/, 'ī')
    .replace(/i-i$/, 'ī')
    .replaceAll('i-i', 'i')

    .replaceAll(/[ou]-u-[uú]/g, 'ō')
    .replaceAll('u-u-', 'ō-')
    .replaceAll('-u-u', '-ō')
    .replace(/^u-u/, 'ō')
    .replace(/u-u$/, 'ō')
    .replaceAll(/o-[uú]/g, 'o')

    .replaceAll(/u-ú-[uú]/g, 'ū')
    .replace(/^ú-ú-/, 'ū-')
    .replaceAll('u-ú-', 'ū-')
    .replaceAll(/-ú-[uú]/g, '-ū')
    .replace(/^ú-u/, 'ū')
    .replace(/u-ú$/, 'ū')
    .replaceAll(/u-[uú]/g, 'u')

    .replaceAll('i-e-', 'ē-')
    .replaceAll('i-e', 'e')
    .replaceAll('e-i', 'e')

    .replaceAll('ú', 'u');
  return word;
}
const voicedCorrelate: { [key: string]: string } = {
  p: 'b',
  t: 'd',
  k: 'g',
  f: 'v',
  s: 'z',
  š: 'ž',
  ḫ: 'ġ',
};
function processConsonants(word: string): string {
  word = word
    .replaceAll('s', 'c')
    .replaceAll('b', 'p')
    .replaceAll('d', 't')
    .replaceAll('g', 'k')
    .replaceAll('w', 'f')
    .replaceAll('z', 's')
    .replaceAll(/(?<=[aeiouāēīōū])[ptkfsšḫ](?=[aeiouāēīōū])/g, (voicelessConsonant: string) => voicedCorrelate[voicelessConsonant])
    .replaceAll(/(?<=[rlmn])[ptkfsšḫ]/g, (voicelessConsonant: string) => voicedCorrelate[voicelessConsonant])
    .replaceAll(/[ptkfsšḫ](?=[rlmn])/g, (voicelessConsonant: string) => voicedCorrelate[voicelessConsonant])
    .replaceAll(/[ptkfsšḫ]$/g, (voicelessConsonant: string) => voicedCorrelate[voicelessConsonant])
    .replaceAll('V', 'w')
    .replaceAll(/(?<=[uū])v/g, 'w')
    .replace('pf', 'ff');
  return word;
}
export function makeBoundTranscription(word: string): string {
  word = removeAuxiliarySymbols(word);
  word = removeDiacritics(word);
  word = processVowels(word);
  word = word.replaceAll(/(?<![x(A-UW-ZŠ\d])-(?![)xA-UW-ZŠ])/g, '');
  word = processConsonants(word);
  return word;
}
