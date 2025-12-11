import { GrammaticalMorpheme } from './grammaticalMorpheme';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { getStemAndGrammaticalMorphemesWithBoundary } from '../common/splitter';
import { getMorphTags } from '../morphologicalAnalysis/auxiliary';

const derivationalSuffixBoundary = '+';
const grammaticalMorphemeStringSplitPattern = /(?=[-=])/;
const morphTagSplitPattern = /(?=[-=])|(?<![123](?:SG|PL))(?=.ABS)/;
const errorForm = '';
const errorLabel = '';

export function getGrammaticalMorphemes(morphologicalAnalysis: MorphologicalAnalysis): GrammaticalMorpheme[] {
  const [stem, grammaticalMorphemeString] = getStemAndGrammaticalMorphemesWithBoundary(
    morphologicalAnalysis.referenceWord
  );
  const grammaticalMorphemes = getDerivationalSuffixes(stem);
  for (const morphTag of getMorphTags(morphologicalAnalysis)) {
    for (const gram of getInflectionalSuffixesAndEnclitics(morphTag, grammaticalMorphemeString))
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

export function getInflectionalSuffixesAndEnclitics(morphTag: string, grammaticalMorphemeString: string): GrammaticalMorpheme[] {
  morphTag = preprocessMorphTag(morphTag);
  const labels = morphTag.split(morphTagSplitPattern);
  const forms = grammaticalMorphemeString.split(grammaticalMorphemeStringSplitPattern);
  const grammaticalMorphemes: GrammaticalMorpheme[] = [];
  let labelIndex = 0, formIndex = 0;
  while (labelIndex < labels.length || formIndex < forms.length) {
    const label = labelIndex < labels.length ? labels[labelIndex] : errorLabel;
    labelIndex += 1;
    let form: string;
    if (label === '.ABS') {
      form = '';
    } else {
      form = formIndex < forms.length ? forms[formIndex] : errorForm;
      formIndex += 1;
    }
    const gram = new GrammaticalMorpheme(label, form);
    grammaticalMorphemes.push(gram);
  }
  return grammaticalMorphemes;
}
