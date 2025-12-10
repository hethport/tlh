import { GrammaticalMorpheme } from './grammaticalMorpheme';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { getStemAndGrammaticalMorphemesWithBoundary } from '../common/splitter';
import { getMorphTags } from '../morphologicalAnalysis/auxiliary';

const derivationalSuffixBoundary = '+';
const grammaticalMorphemeSplitPattern = /(?=[-=])/;

export function getGrammaticalMorphemes(morphologicalAnalysis: MorphologicalAnalysis): GrammaticalMorpheme[] {
  const [stem, grammaticalMorphemeString] = getStemAndGrammaticalMorphemesWithBoundary(
    morphologicalAnalysis.referenceWord
  );
  const grammaticalMorphemes = getDerivationalSuffixes(stem);
  for (const morphTag of getMorphTags(morphologicalAnalysis)) {
    for (const gram of getInflectionalSuffixesAndEnclitics(grammaticalMorphemeString, morphTag))
      grammaticalMorphemes.push(gram);
  }
  return grammaticalMorphemes;
}

function getDerivationalSuffixes(stem: string): GrammaticalMorpheme[] {
  return stem.split(derivationalSuffixBoundary).slice(1).map(suffix =>
    new GrammaticalMorpheme('', derivationalSuffixBoundary + suffix)
  );
}

function getInflectionalSuffixesAndEnclitics(grammaticalMorphemeString: string,
                                             morphTag: string): GrammaticalMorpheme[] {
  if (!(morphTag.startsWith('=') || morphTag.startsWith('.'))) {
    morphTag = '-' + morphTag;
  }
  const labels = morphTag.split(grammaticalMorphemeSplitPattern)
    .filter(label => label !== '');
  const forms = grammaticalMorphemeString.split(grammaticalMorphemeSplitPattern)
    .filter(form => form !== '');
  const grammaticalMorphemes: GrammaticalMorpheme[] = [];
  for (let i = 0; i < Math.max(labels.length, forms.length); i++) {
    const label = labels[i] || '';
    const form = forms[i] || '';
    const gram = new GrammaticalMorpheme(label, form);
    grammaticalMorphemes.push(gram);
  }
  return grammaticalMorphemes;
}
