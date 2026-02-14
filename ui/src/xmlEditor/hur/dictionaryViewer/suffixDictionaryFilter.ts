import { GrammaticalMorpheme } from './grammaticalMorpheme';

const unicodeLetter = /[\p{Alphabetic}\p{Decimal_Number}\p{Mark}\p{Connector_Punctuation}\p{Join_Control}']/u;

function containsLetter(s: string): boolean {
  return s.search(unicodeLetter) !== -1;
}

export function hasContent(grammaticalMorpheme: GrammaticalMorpheme): boolean {
  const { label, form } = grammaticalMorpheme;
  return containsLetter(label) || containsLetter(form);
}
