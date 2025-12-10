import { GrammaticalMorpheme } from './grammaticalMorpheme';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { getStemAndGrammaticalMorphemesWithBoundary,
  getGrammaticalMorphemesWithBoundary } from '../common/splitter';
import { getMorphTags } from '../morphologicalAnalysis/auxiliary';
import { removePrefix } from '../common/auxiliary';

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

function preprocessMorphTag(morphTag: string): string {
  if (morphTag.startsWith('=') || morphTag.startsWith('.')) {
    return morphTag;
  } else {
    return '-' + morphTag;
  }
}

function getInflectionalSuffixesAndEnclitics(grammaticalMorphemeString: string,
                                             morphTag: string): GrammaticalMorpheme[] {
  morphTag = preprocessMorphTag(morphTag);
  const labels = morphTag.split(grammaticalMorphemeSplitPattern);
  const forms = grammaticalMorphemeString.split(grammaticalMorphemeSplitPattern);
  const grammaticalMorphemes: GrammaticalMorpheme[] = [];
  for (let i = 0; i < Math.max(labels.length, forms.length); i++) {
    const label = labels[i] || '';
    const form = forms[i] || '';
    const gram = new GrammaticalMorpheme(label, form);
    grammaticalMorphemes.push(gram);
  }
  return grammaticalMorphemes;
}

export function replaceMorphemeLabel(oldLabel: string, newLabel: string, form: string) {
  return (segmentation: string, morphTag: string) => {
    const grammaticalMorphemeString = getGrammaticalMorphemesWithBoundary(segmentation);
    const grammaticalMorphemes = getInflectionalSuffixesAndEnclitics(grammaticalMorphemeString, morphTag);
    const newGrammaticalMorphemes: GrammaticalMorpheme[] = [];
    for (const grammaticalMorpheme of grammaticalMorphemes) {
      if (grammaticalMorpheme.label === oldLabel && grammaticalMorpheme.form === form) {
        const newGrammaticalMorpheme = new GrammaticalMorpheme(newLabel, form);
        newGrammaticalMorphemes.push(newGrammaticalMorpheme);
      } else {
        newGrammaticalMorphemes.push(grammaticalMorpheme);
      }
    }
    return removePrefix('-', newGrammaticalMorphemes.map(gram => gram.label).join(''));
  };
}
