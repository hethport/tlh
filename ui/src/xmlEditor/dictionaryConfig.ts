export const dictionaryConfigKey = 'dictionaryPreferences';

export interface DictionaryConfig {
  fragmInSuffixDict: boolean;
  showUnclearForms: boolean;
}

export const defaultDictionaryConfig: DictionaryConfig = {
  fragmInSuffixDict: false,
  showUnclearForms: false,
};

export const dictionaryConfigKeys = Object.keys(defaultDictionaryConfig);
