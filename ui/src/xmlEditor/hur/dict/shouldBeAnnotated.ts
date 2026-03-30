const finalOpeningBracketWithOneOptionalLetter = /(?<!\(-\))\[\p{Ll}?$/u;
const fragmentWithClosingBracket = /^\p{Ll}\]\p{Ll}$/u;

function endsWithOpeningBracketWithOneOptionalLetter(form: string): boolean {
  return finalOpeningBracketWithOneOptionalLetter.test(form);
}

function isFragmentWithClosingBracket(form: string): boolean {
  return fragmentWithClosingBracket.test(form);
}

export function shouldBeAnnotated(word: string): boolean {
  if (endsWithOpeningBracketWithOneOptionalLetter(word)) {
    return false;
  }
  if (isFragmentWithClosingBracket(word)) {
    return false;
  }
  return true;
}
