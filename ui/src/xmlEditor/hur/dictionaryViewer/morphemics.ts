import { GrammaticalMorpheme } from './grammaticalMorpheme';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { getGrammaticalMorphemesWithBoundary } from '../common/splitter';
import { getMorphTags } from '../morphologicalAnalysis/auxiliary';

const grammaticalMorphemeStringSplitPattern = /(?=[-=])/;
const morphTagSplitPattern = /(?=[-=])|(?<![123](?:SG|PL))(?=.ABS)/;
const errorForm = '';
const errorLabel = '';

export function getGrammaticalMorphemes(morphologicalAnalysis: MorphologicalAnalysis): GrammaticalMorpheme[] {
  const grammaticalMorphemeString = getGrammaticalMorphemesWithBoundary(
    morphologicalAnalysis.referenceWord
  );
  const grammaticalMorphemes: GrammaticalMorpheme[] = [];
  for (const morphTag of getMorphTags(morphologicalAnalysis)) {
    for (const gram of getInflectionalSuffixesAndEnclitics(morphTag, grammaticalMorphemeString))
      grammaticalMorphemes.push(gram);
  }
  return grammaticalMorphemes;
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
  const labels = morphTag === '' ? [] : morphTag.split(morphTagSplitPattern);
  const forms = grammaticalMorphemeString === '' ? [] :
    grammaticalMorphemeString.split(grammaticalMorphemeStringSplitPattern);
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
