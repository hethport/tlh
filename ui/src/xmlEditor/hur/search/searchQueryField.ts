import { LookupConfig } from '../../lookupConfig';
import { simplifyTranscription } from '../transduction/simplifyTranscription';

export type SearchMode = 'substring' | 'whole word' | 'pattern';

export type SearchQueryField<F extends string> = {
  name: F;
  value: string;
  mode: SearchMode;
  fuzzy: boolean;
}

export const searchModes = ['substring', 'whole word', 'pattern'];
export const regExpFlags = 'iu';

export function matchesField<F extends string>(obj: { [key in F]: string }, field: SearchQueryField<F>,
                                               lookupConfig: LookupConfig): boolean {
  if (field.value === '') {
    return true;
  }
  let inputObjectValue = obj[field.name];
  let searchedValue = field.value;
  if (field.fuzzy) {
    inputObjectValue = simplifyTranscription(inputObjectValue, lookupConfig);
    searchedValue = simplifyTranscription(searchedValue, lookupConfig);
  }
  switch (field.mode) {
    case 'substring': {
      return inputObjectValue.includes(searchedValue);
    }
    case 'whole word': {
      return inputObjectValue === searchedValue;
    }
    case 'pattern': {
      const regExp = new RegExp(searchedValue, regExpFlags);
      return regExp.test(inputObjectValue);
    }
  }
}
