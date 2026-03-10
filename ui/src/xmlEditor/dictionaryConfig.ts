export interface DictionaryConfig {
  ignorePlene: boolean;
  fragmInSuffixDict: boolean;
  showUnclearForms: boolean;
  alphabetizeIAsE: boolean;
  alphabetizeOAsU: boolean;
  alphabetizeVoicedConsonantsAsVoiceless: boolean;
}

export const defaultDictionaryConfig: DictionaryConfig = {
  ignorePlene: false,
  fragmInSuffixDict: false,
  showUnclearForms: false,
  alphabetizeIAsE: false,
  alphabetizeOAsU: false,
  alphabetizeVoicedConsonantsAsVoiceless: false,
};
