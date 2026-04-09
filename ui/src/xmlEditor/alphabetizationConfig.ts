export const alphabetizationConfigKey = 'aphabetizationPreferences';

export interface AlphabetizationConfig {
  alphabetizeFAsP: boolean;
  alphabetizeVAsB: boolean;
  alphabetizeIAsE: boolean;
  alphabetizeOAsU: boolean;
  alphabetizeVoicedConsonantsAsVoiceless: boolean;
}

export const defaultAlphabetizationConfig: AlphabetizationConfig = {
  alphabetizeFAsP: false,
  alphabetizeVAsB: false,
  alphabetizeIAsE: false,
  alphabetizeOAsU: false,
  alphabetizeVoicedConsonantsAsVoiceless: false,
};

export const alphabetizationConfigKeys = Object.keys(defaultAlphabetizationConfig);
