import { SuffixChain } from './basicSegmenter';
import { getInflectionalSuffixesAndEnclitics } from '../dictionaryViewer/morphemics';
import { startsWithVowel, initialVowel } from './allomorphyValidation';
import { getGrammaticalGlosses } from '../autoglossing/grammaticalGlossProvider';
import { removePotentiallyImproperPrefix } from '../common/auxiliary';

function removeInitialVowel(form: string): string {
  return form.replace(initialVowel, '');
}

/**
 * Determines whether a morpheme has a lexical allomorph beginning with a consonant.
 */
export function startsWithVowelInitialLexicalAllomorph(suffixChain: SuffixChain,
                                                       pos: string): boolean {
  const {segmentation, morphTag} = suffixChain;
  const morphemes = getInflectionalSuffixesAndEnclitics(morphTag, segmentation);
  if (morphemes.length > 0) {
    const morpheme = morphemes[0];
    const {form, label} = morpheme;
    if (startsWithVowel(form)) {
      const consonantalAllomorph = removeInitialVowel(form);
      const consonantalAllomorphLabels = getGrammaticalGlosses(consonantalAllomorph, pos);
      const preprocessedLabel = removePotentiallyImproperPrefix(removePotentiallyImproperPrefix(label, '-'), '=');
      return consonantalAllomorphLabels.includes(preprocessedLabel);
    }
  }
  return false;
}
