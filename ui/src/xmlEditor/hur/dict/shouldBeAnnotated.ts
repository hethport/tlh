const finalOpeningBracketWithOneOptionalLetter = /(?<!\(-\))\[\p{Ll}?$/u;

function endsWithOpeningBracketWithOneOptionalLetter(form: string): boolean {
  return finalOpeningBracketWithOneOptionalLetter.test(form);
}

export function shouldBeAnnotated(word: string): boolean {
  if (endsWithOpeningBracketWithOneOptionalLetter(word)) {
    return false;
  }
  return true;
}
