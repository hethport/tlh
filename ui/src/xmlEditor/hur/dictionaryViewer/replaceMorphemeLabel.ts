import { getInflectionalSuffixesAndEnclitics } from './morphemics';
import { GrammaticalMorpheme } from './grammaticalMorpheme';
import { getGrammaticalMorphemesWithBoundary } from '../common/splitter';
import { removePrefix } from '../common/auxiliary';

function startsWithBoundary(label: string): boolean {
  return label.startsWith('-') || label.startsWith('=') || label.startsWith('.');
}

function preprocessLabel(label: string) {
  if (!startsWithBoundary(label)) {
    return '-' + label;
  } else {
    return label;
  }
}

export default function replaceMorphemeLabel(oldLabel: string, newLabel: string, form: string) {
  return (segmentation: string, morphTag: string) => {
    const grammaticalMorphemeString = getGrammaticalMorphemesWithBoundary(segmentation);
    const grammaticalMorphemes = getInflectionalSuffixesAndEnclitics(morphTag, grammaticalMorphemeString);
    const newGrammaticalMorphemes: GrammaticalMorpheme[] = [];
    for (const grammaticalMorpheme of grammaticalMorphemes) {
      if (grammaticalMorpheme.label === preprocessLabel(oldLabel) && grammaticalMorpheme.form === form) {
        const newGrammaticalMorpheme = new GrammaticalMorpheme(newLabel, form);
        newGrammaticalMorphemes.push(newGrammaticalMorpheme);
      } else {
        newGrammaticalMorphemes.push(grammaticalMorpheme);
      }
    }
    return removePrefix('-', newGrammaticalMorphemes.map(gram => gram.label).join(''));
  };
}
