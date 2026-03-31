export const alphabetizationConfigKey = 'aphabetizationPreferences';

export interface AlphabetizationConfig {
  alphabetizeIAsE: boolean;
  alphabetizeOAsU: boolean;
  alphabetizeVoicedConsonantsAsVoiceless: boolean;
}

export const defaultAlphabetizationConfig: AlphabetizationConfig = {
  alphabetizeIAsE: false,
  alphabetizeOAsU: false,
  alphabetizeVoicedConsonantsAsVoiceless: false,
};

export const alphabetizationConfigKeys = Object.keys(defaultAlphabetizationConfig);
