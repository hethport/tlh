export const dictionaryConfigKey = 'dictionaryPreferences';

export interface DictionaryConfig {
  fragmInSuffixDict: boolean;
  showUnclearForms: boolean;
  showFragmentaryGrammaticalMorphemes: boolean;
}

export const defaultDictionaryConfig: DictionaryConfig = {
  fragmInSuffixDict: false,
  showUnclearForms: false,
  showFragmentaryGrammaticalMorphemes: false,
};

export const dictionaryConfigKeys = Object.keys(defaultDictionaryConfig);
