const fieldSeparator = '@';

export class GrammaticalMorpheme {
  label: string;
  form: string;
  constructor(label: string, form: string) {
    this.label = label;
    this.form = form;
  }
  toString(): string {
    return this.form + fieldSeparator + this.label;
  }
}

export function parseGrammaticalMorpheme(repr: string): GrammaticalMorpheme {
  const [form, label] = repr.split(fieldSeparator);
  return new GrammaticalMorpheme(label, form);
}
