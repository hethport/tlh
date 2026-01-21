/**
 * Determine whether the letter at the specified position
 * in the given word is enclosed in parentheses.
 */
function inParentheses(word: string, position: number): boolean {
  if (position < 1 || position >= word.length - 1) {
    return false;
  } else {
    return word[position - 1] === '(' && word[position + 1] === ')';
  }
}

export function findBoundary(segmentation: string): number {
  let i;
  for (i = 0; i < segmentation.length; i++) {
    const char: string = segmentation[i];
    if (char == '-' && !inParentheses(segmentation, i) || char == '=') {
      break;
    }
  }
  return i;
}

function findTagBoundary(segmentation: string): number {
  let i;
  for (i = 0; i < segmentation.length; i++) {
    const char: string = segmentation[i];
    if (char == '-' || char == '=' || char == '.' && i < segmentation.length - 1 &&
      segmentation.substring(i + 1).startsWith('ABS')) {
      break;
    }
  }
  return i;
}

export function getStem(segmentation: string): string {
  const i: number = findBoundary(segmentation);
  const stem: string = segmentation.substring(0, i);
  return stem.replaceAll('(', '').replaceAll(')', '');
}

function basicGetGrammaticalMorphemes(segmentation: string, i: number): string {
  if (i == segmentation.length) {
    return '-';
  }
  else {
    if (segmentation[i] === '=') {
      return '-' + segmentation.substring(i);
    }
    return segmentation.substring(i);
  }
}

export function getGrammaticalMorphemes(segmentation: string): string {
  const i: number = findBoundary(segmentation);
  return basicGetGrammaticalMorphemes(segmentation, i);
}

export function getStemAndGrammaticalMorphemes(segmentation: string): [string, string] {
  const i: number = findBoundary(segmentation);
  const stem: string = segmentation.substring(0, i);
  const grammaticalMorphemes = basicGetGrammaticalMorphemes(segmentation, i);
  return [stem, grammaticalMorphemes];
}

export function getGrammaticalMorphemesWithBoundary(segmentation: string): string {
  const i: number = findBoundary(segmentation);
  const grammaticalMorphemes = segmentation.substring(i);
  return grammaticalMorphemes;
}

export function getStemAndGrammaticalMorphemesWithBoundary(segmentation: string): [string, string] {
  const i: number = findBoundary(segmentation);
  const stem: string = segmentation.substring(0, i);
  const grammaticalMorphemes = segmentation.substring(i);
  return [stem, grammaticalMorphemes];
}

export function basicGetStem(segmentation: string): string {
  const i: number = findBoundary(segmentation);
  const stem: string = segmentation.substring(0, i);
  return stem;
}

export function getTranslationAndMorphTag(analysis: string): [string, string] {
  const i: number = findTagBoundary(analysis);
  const translation: string = analysis.substring(0, i);
  let tag = analysis.substring(i);
  if (tag.startsWith('-')) {
    tag = tag.substring(1);
  }
  return [translation, tag];
}
