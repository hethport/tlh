import { LookupConfig } from '../../lookupConfig';
import { simplifyTranscription } from '../transduction/simplifyTranscription';
import { startsWithVowelInitialLexicalAllomorph } from './vowelInitialAllomorphs';
import { SuffixChain } from './basicSegmenter';

// Do not add the g or y flags to avoid changing
// the lastIndex property on the RegExp objects.
const finalVowelAfterCoronalSonorantOrDorsalFricative = /(?<=[lnrġḫ])[aeiouāēīōū]$/;
const finalVowel = /[aeiouāēīōū]$/;
export const initialVowel = /(?<=^[-=]?)[aeiouāēīōū]/;
const initialCoronalSonorantOrDorsalFricativeBeforeVowel = /^[-=]?[lnrġḫ][-=]?[aeiouāēīōū]/;
const initialVowelBeforeIntervocalicLateral = /^[-=]?[aeiouāēīōū][-=]?l[-=]?[aeiouāēīōū]/u;
const initialPrevocalicCoronalSonorant = /^[-=]?[lnr][-=]?[aeiouāēīōū]/u;
const finalCoronalSonorant = /[lnr]$/u;
const initialConsonant = /^[-=]?([ptkbdgfsšḫvzžġmnlrwW])/;
const sumerogram = /^(\p{Lu}|[-.])+$/u;

function endsWithVowelNotAfterCoronalSonorantOrDorsalFricative(stem: string): boolean {
  return finalVowelAfterCoronalSonorantOrDorsalFricative.test(stem);
}

function endsWithVowel(stem: string): boolean {
  return finalVowel.test(stem);
}

export function startsWithVowel(ending: string): boolean {
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

function startsWithConsonant(form: string): boolean {
  return initialConsonant.test(form);
}

function getInitialConsonant(form: string): string | null {
  const match = form.match(initialConsonant);
  if (match !== null) {
    return match[1];
  }
  return null;
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

function initialConsonantWasDeleted(underlyingForm: string, surfaceForm: string): boolean {
  return startsWithConsonant(underlyingForm) && !startsWithConsonant(surfaceForm);
}

function preprocessTranscription(form: string): string {
  return form.replaceAll('w', 'v').replaceAll('m', 'b')
    .replaceAll('W', 'v');
}

function areEqualInSimplifiedTranscription(a: string, b: string, lookupConfig: LookupConfig) {
  const newLookupConfig: LookupConfig = { ...lookupConfig, ignoreVoice: true };
  return simplifyTranscription(preprocessTranscription(a), newLookupConfig) ===
    simplifyTranscription(preprocessTranscription(b), newLookupConfig);
}

function stemAllomorphyIsValid(surfaceStem: string, underlyingStem: string,
                               surfaceSuffixChain: string, suffixChain: SuffixChain,
                               pos: string): boolean {
  if (isSumerogram(surfaceStem) && !isSumerogram(underlyingStem)) {
    // Any differences are allowed between Sumerograms
    // and their Hurrian readings.
    return true;
  }
  if (finalVowelWasDeleted(underlyingStem, surfaceStem)) {
    if (startsWithVowel(surfaceSuffixChain)) {
      // Vowel deletion is not allowed before vowel-initial lexical allomorphs,
      // because such allomorphs are only expected after stems ending in consonants.
      return !startsWithVowelInitialLexicalAllomorph(suffixChain, pos);
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
                                      underlyingStem: string,
                                      lookupConfig: LookupConfig): boolean {
  if (initialVowelWasDeleted(underlyingSuffixChain, surfaceSuffixChain)) {
    return endsWithCoronalSonorant(surfaceStem) && endsWithCoronalSonorant(underlyingStem);
  }
  const surfaceSuffixChainInitialConsonant = getInitialConsonant(surfaceSuffixChain);
  const underlyingSuffixChainInitialConsonant = getInitialConsonant(underlyingSuffixChain
                                                                    .replaceAll('ž=l', 'l'));
  if (surfaceSuffixChainInitialConsonant !== null &&
    underlyingSuffixChainInitialConsonant !== null &&
    !areEqualInSimplifiedTranscription(surfaceSuffixChainInitialConsonant,
                                       underlyingSuffixChainInitialConsonant,
                                       lookupConfig)) {
    return isSumerogram(surfaceStem) || surfaceStem.length > 0 && areEqualInSimplifiedTranscription(
      surfaceStem[surfaceStem.length - 1], surfaceSuffixChainInitialConsonant, lookupConfig
    );
  }
  return true;
}

export function allomorphyIsValid(surfaceStem: string, underlyingStem: string,
                                  surfaceSuffixChain: string, underlyingSuffixChain: string,
                                  lookupConfig: LookupConfig,
                                  suffixChain: SuffixChain, pos: string): boolean {
  return stemAllomorphyIsValid(surfaceStem, underlyingStem, surfaceSuffixChain, suffixChain, pos) &&
         suffixChainAllomorphyIsValid(surfaceSuffixChain, underlyingSuffixChain, surfaceStem, underlyingStem,
                                      lookupConfig);
}

export function suffixChainAllomorphyIsValidInSomeContext(surfaceSuffixChain: string,
                                                          underlyingSuffixChain: string) {
  if (initialVowelWasInserted(underlyingSuffixChain, surfaceSuffixChain)) {
    return false;
  }
  if (initialConsonantWasDeleted(underlyingSuffixChain, surfaceSuffixChain)) {
    return false;
  }
  if (initialVowelWasDeleted(underlyingSuffixChain, surfaceSuffixChain)) {
    return startsWithVowelBeforeIntervocalicLateral(underlyingSuffixChain) &&
           startsWithPrevocalicCoronalSonorant(surfaceSuffixChain);
  }
  return true;
}
