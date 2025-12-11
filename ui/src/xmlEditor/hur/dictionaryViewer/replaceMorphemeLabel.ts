import { getInflectionalSuffixesAndEnclitics } from './morphemics';
import { GrammaticalMorpheme } from './grammaticalMorpheme';
import { getGrammaticalMorphemesWithBoundary } from '../common/splitter';
import { removePrefix } from '../common/auxiliary';

export default function replaceMorphemeLabel(oldLabel: string, newLabel: string, form: string) {
  return (segmentation: string, morphTag: string) => {
    const grammaticalMorphemeString = getGrammaticalMorphemesWithBoundary(segmentation);
    const grammaticalMorphemes = getInflectionalSuffixesAndEnclitics(morphTag, grammaticalMorphemeString);
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
