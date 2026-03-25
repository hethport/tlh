// Do not add the g or y flags to avoid changing
// the lastIndex property on the RegExp objects.
const finalVowelNotAfterCoronalSonorant = /(?<![lnr])[aeiouāēīōū]$/;
const finalVowel = /[aeiouāēīōū]$/;
const initialVowel = /^[-=]?[aeiouāēīōū]/;
const sumerogram = /^(\p{Lu}|[-.])+$/u;

function endsWithVowelNotAfterCoronalSonorant(stem: string): boolean {
  return finalVowelNotAfterCoronalSonorant.test(stem);
}

function endsWithVowel(stem: string): boolean {
  return finalVowel.test(stem);
}

function startsWithVowel(ending: string): boolean {
  return initialVowel.test(ending);
}

function isSumerogram(stem: string): boolean {
  return sumerogram.test(stem);
}

function stemAllomorphyIsValid(surfaceStem: string, underlyingStem: string,
                               surfaceSuffixChain: string): boolean {
  if (isSumerogram(surfaceStem) && !isSumerogram(underlyingStem)) {
    // Any differences are allowed between Sumerograms
    // and their Hurrian readings.
    return true;
  }
  if (endsWithVowelNotAfterCoronalSonorant(underlyingStem) && !endsWithVowel(surfaceStem)) {
    // The final vowel of the stem was deleted, and it is not after l, n or r.
    return startsWithVowel(surfaceSuffixChain);
  }
  return true;
}

export function allomorphyIsValid(surfaceStem: string, underlyingStem: string,
                                  surfaceSuffixChain: string): boolean {
  return stemAllomorphyIsValid(surfaceStem, underlyingStem, surfaceSuffixChain);
}
