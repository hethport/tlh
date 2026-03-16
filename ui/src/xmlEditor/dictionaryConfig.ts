export interface DictionaryConfig {
  fragmInSuffixDict: boolean;
  showUnclearForms: boolean;
  alphabetizeIAsE: boolean;
  alphabetizeOAsU: boolean;
  alphabetizeVoicedConsonantsAsVoiceless: boolean;
}

export const defaultDictionaryConfig: DictionaryConfig = {
  fragmInSuffixDict: false,
  showUnclearForms: false,
  alphabetizeIAsE: false,
  alphabetizeOAsU: false,
  alphabetizeVoicedConsonantsAsVoiceless: false,
};
