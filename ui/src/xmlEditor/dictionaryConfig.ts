export interface DictionaryConfig {
  ignorePlene: boolean;
  fragmInSuffixDict: boolean;
}

export const defaultDictionaryConfig: DictionaryConfig = {
  ignorePlene: false,
  fragmInSuffixDict: false,
};
