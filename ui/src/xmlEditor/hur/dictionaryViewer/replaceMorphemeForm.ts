import { getInflectionalSuffixesAndEnclitics } from './morphemics';
import { GrammaticalMorpheme } from './grammaticalMorpheme';
import { getStemAndGrammaticalMorphemesWithBoundary } from '../common/splitter';

function startsWithBoundary(form: string): boolean {
  return form.startsWith('-') || form.startsWith('=');
}

function preprocessForm(form: string): string {
  if (!startsWithBoundary(form)) {
    return '-' + form;
  } else {
    return form;
  }
}

export default function replaceMorphemeForm(label: string, oldForm: string, newForm: string) {
  return (segmentation: string, morphTag: string) => {
    const [stem, grammaticalMorphemeString] = getStemAndGrammaticalMorphemesWithBoundary(
      segmentation
    );
    const grammaticalMorphemes = getInflectionalSuffixesAndEnclitics(
      morphTag, grammaticalMorphemeString
    );
    const newGrammaticalMorphemes: GrammaticalMorpheme[] = [];
    for (const grammaticalMorpheme of grammaticalMorphemes) {
      if (grammaticalMorpheme.label === label && grammaticalMorpheme.form === preprocessForm(oldForm)
        && startsWithBoundary(newForm)) {
        const newGrammaticalMorpheme = new GrammaticalMorpheme(label, newForm);
        newGrammaticalMorphemes.push(newGrammaticalMorpheme);
      } else {
        newGrammaticalMorphemes.push(grammaticalMorpheme);
      }
    }
    return stem + newGrammaticalMorphemes.map(gram => gram.form).join('');
  };
}
