export type SearchMode = 'substring' | 'whole word' | 'pattern';

export type SearchQueryField<F extends string> = {
  name: F;
  value: string;
  mode: SearchMode;
}

export const searchModes = ['substring', 'whole word', 'pattern'];

export function matchesField<F extends string>(obj: { [key in F]: string }, field: SearchQueryField<F>): boolean {
  switch (field.mode) {
    case 'substring': {
      return obj[field.name] === field.value;
    }
    case 'whole word': {
      return obj[field.name] === field.value;
    }
    case 'pattern': {
      const regExp = new RegExp(field.value, 'iu');
      return regExp.test(obj[field.name]);
    }
  }
}
