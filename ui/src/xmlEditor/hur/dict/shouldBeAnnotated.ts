const finalOpeningBracketWithOneOptionalLetter = /(?<!\(-\))\[\p{Ll}?$/u;
const fragmentWithClosingBracket = /^\p{Ll}\]\p{Ll}$/u;
const shortFragmentInitialClosingBracket = /^\]\p{Ll}{1,3}$/u;

function endsWithOpeningBracketWithOneOptionalLetter(form: string): boolean {
  return finalOpeningBracketWithOneOptionalLetter.test(form);
}

function isFragmentWithClosingBracket(form: string): boolean {
  return fragmentWithClosingBracket.test(form);
}

function isShortFragmentWithInitialClosingBracket(form: string): boolean {
  return shortFragmentInitialClosingBracket.test(form);
}

export function shouldBeAnnotated(word: string): boolean {
  if (endsWithOpeningBracketWithOneOptionalLetter(word)) {
    return false;
  }
  if (isFragmentWithClosingBracket(word)) {
    return false;
  }
  if (isShortFragmentWithInitialClosingBracket(word)) {
    return false;
  }
  return true;
}
