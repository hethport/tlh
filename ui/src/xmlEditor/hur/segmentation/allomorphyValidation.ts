// Do not add the g or y flags to avoid changing
// the lastIndex property on the RegExp objects.
const finalVowelAfterCoronalSonorantOrDorsalFricative = /(?<=[lnrġḫ])[aeiouāēīōū]$/;
const finalVowel = /[aeiouāēīōū]$/;
const initialVowel = /^[-=]?[aeiouāēīōū]/;
const sumerogram = /^(\p{Lu}|[-.])+$/u;

function endsWithVowelNotAfterCoronalSonorantOrDorsalFricative(stem: string): boolean {
  return finalVowelAfterCoronalSonorantOrDorsalFricative.test(stem);
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

function finalVowelWadDeleted(underlyingForm: string, surfaceForm: string): boolean {
  return endsWithVowel(underlyingForm) && !endsWithVowel(surfaceForm);
}

function stemAllomorphyIsValid(surfaceStem: string, underlyingStem: string,
                               surfaceSuffixChain: string): boolean {
  if (isSumerogram(surfaceStem) && !isSumerogram(underlyingStem)) {
    // Any differences are allowed between Sumerograms
    // and their Hurrian readings.
    return true;
  }
  if (finalVowelWadDeleted(underlyingStem, surfaceStem)) {
    if (startsWithVowel(surfaceSuffixChain)) {
      return true;
    } else if (endsWithVowelNotAfterCoronalSonorantOrDorsalFricative(underlyingStem)) {
      return true;
    } else {
      return false;
    }
  }
  return true;
}

export function allomorphyIsValid(surfaceStem: string, underlyingStem: string,
                                  surfaceSuffixChain: string): boolean {
  return stemAllomorphyIsValid(surfaceStem, underlyingStem, surfaceSuffixChain);
}

export function suffixChainAllomorphyIsValidInSomeContext(surfaceSuffixChain: string,
                                                          underlyingSuffixChain: string) {
  if (startsWithVowel(underlyingSuffixChain) && !startsWithVowel(surfaceSuffixChain)) {
    return false;
  }
  return true;
}
