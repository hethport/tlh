// Do not add the g or y flags to avoid changing
// the lastIndex property on the RegExp objects.
const finalVowelAfterCoronalSonorantOrDorsalFricative = /(?<=[lnrġḫ])[aeiouāēīōū]$/;
const finalVowel = /[aeiouāēīōū]$/;
const initialVowel = /^[-=]?[aeiouāēīōū]/;
const initialCoronalSonorantOrDorsalFricativeBeforeVowel = /^[-=]?[lnrġḫ][-=]?[aeiouāēīōū]/;
const initialVowelBeforeIntervocalicLateral = /^[-=]?[aeiouāēīōū][-=]?l[-=]?[aeiouāēīōū]/u;
const initialPrevocalicCoronalSonorant = /^[-=]?[lnr][-=]?[aeiouāēīōū]/u;
const finalCoronalSonorant = /[lnr]$/u;
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

function startsWithCoronalSonorantOrDorsalFricativeBeforeVowel(suffixChain: string): boolean {
  return initialCoronalSonorantOrDorsalFricativeBeforeVowel.test(suffixChain);
}

function startsWithVowelBeforeIntervocalicLateral(suffixChain: string): boolean {
  return initialVowelBeforeIntervocalicLateral.test(suffixChain);
}

function endsWithCoronalSonorant(form: string): boolean {
  return finalCoronalSonorant.test(form);
}

function startsWithPrevocalicCoronalSonorant(form: string): boolean {
  return initialPrevocalicCoronalSonorant.test(form);
}

function isSumerogram(stem: string): boolean {
  return sumerogram.test(stem);
}

function finalVowelWasDeleted(underlyingForm: string, surfaceForm: string): boolean {
  return endsWithVowel(underlyingForm) && !endsWithVowel(surfaceForm);
}

function initialVowelWasDeleted(underlyingForm: string, surfaceForm: string): boolean {
  return startsWithVowel(underlyingForm) && !startsWithVowel(surfaceForm);
}

function initialVowelWasInserted(underlyingForm: string, surfaceForm: string): boolean {
  return !startsWithVowel(underlyingForm) && startsWithVowel(surfaceForm);
}

function stemAllomorphyIsValid(surfaceStem: string, underlyingStem: string,
                               surfaceSuffixChain: string): boolean {
  if (isSumerogram(surfaceStem) && !isSumerogram(underlyingStem)) {
    // Any differences are allowed between Sumerograms
    // and their Hurrian readings.
    return true;
  }
  if (finalVowelWasDeleted(underlyingStem, surfaceStem)) {
    if (startsWithVowel(surfaceSuffixChain)) {
      return true;
    } else if (endsWithVowelNotAfterCoronalSonorantOrDorsalFricative(underlyingStem)) {
      return startsWithCoronalSonorantOrDorsalFricativeBeforeVowel(surfaceSuffixChain);
    } else {
      return false;
    }
  }
  return true;
}

function suffixChainAllomorphyIsValid(surfaceSuffixChain: string,
                                      underlyingSuffixChain: string,
                                      surfaceStem: string,
                                      underlyingStem: string): boolean {
  if (initialVowelWasDeleted(underlyingSuffixChain, surfaceSuffixChain)) {
    return endsWithCoronalSonorant(surfaceStem) && endsWithCoronalSonorant(underlyingStem);
  }
  return true;
}

export function allomorphyIsValid(surfaceStem: string, underlyingStem: string,
                                  surfaceSuffixChain: string, underlyingSuffixChain: string): boolean {
  return stemAllomorphyIsValid(surfaceStem, underlyingStem, surfaceSuffixChain) &&
         suffixChainAllomorphyIsValid(surfaceSuffixChain, underlyingSuffixChain, surfaceStem, underlyingStem);
}

export function suffixChainAllomorphyIsValidInSomeContext(surfaceSuffixChain: string,
                                                          underlyingSuffixChain: string) {
  if (initialVowelWasInserted(underlyingSuffixChain, surfaceSuffixChain)) {
    return false;
  }
  if (initialVowelWasDeleted(underlyingSuffixChain, surfaceSuffixChain)) {
    return startsWithVowelBeforeIntervocalicLateral(underlyingSuffixChain) &&
           startsWithPrevocalicCoronalSonorant(surfaceSuffixChain);
  }
  return true;
}
