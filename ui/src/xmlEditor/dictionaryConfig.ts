export interface DictionaryConfig {
  ignorePlene: boolean;
  fragmInSuffixDict: boolean;
  showUnclearForms: boolean;
}

export const defaultDictionaryConfig: DictionaryConfig = {
  ignorePlene: false,
  fragmInSuffixDict: false,
  showUnclearForms: false,
};
