const fieldSeparator = '@';

export class GrammaticalMorpheme {
  label: string;
  form: string;
  constructor(label: string, form: string) {
    this.label = label;
    this.form = form;
  }
  toString(): string {
    return this.label + fieldSeparator + this.form;
  }
}

export function parseGrammaticalMorpheme(repr: string): GrammaticalMorpheme {
  const [label, form] = repr.split(fieldSeparator);
  return new GrammaticalMorpheme(label, form);
}
