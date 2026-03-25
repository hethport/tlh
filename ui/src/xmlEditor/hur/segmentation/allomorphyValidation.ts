// Do not add the g or y flags to avoid changing
// the lastIndex property on the RegExp objects.
const finalVowelNotAfterCoronalSonorant = /(?<![lnr])[aeiouāēīōū]$/;
const finalVowel = /[aeiouāēīōū]$/;
const initialVowel = /^[-=]?[aeiouāēīōū]/;

function endsWithVowelNotAfterCoronalSonorant(stem: string): boolean {
  return finalVowelNotAfterCoronalSonorant.test(stem);
}

function endsWithVowel(stem: string): boolean {
  return finalVowel.test(stem);
}

function startsWithVowel(ending: string): boolean {
  return initialVowel.test(ending);
}

export function allomorphyIsValid(surfaceStem: string, underlyingStem: string,
                                  surfaceSuffixChain: string): boolean {
  if (endsWithVowelNotAfterCoronalSonorant(underlyingStem) && !endsWithVowel(surfaceStem)) {
    // The final vowel of the stem was deleted, and it is not after l, n or r.
    return startsWithVowel(surfaceSuffixChain);
  }
  return true;
}
