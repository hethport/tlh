export interface LookupConfig {
  ignorePlene: boolean;
  mergeLabials: boolean;
  mergeMidAndHighVowels: boolean;
  ignoreVoice: boolean;
}

export const defaultLookupConfig = {
  ignorePlene: false,
  mergeLabials: false,
  mergeMidAndHighVowels: false,
  ignoreVoice: false,
};

export const lookupConfigKeys = Object.keys(defaultLookupConfig);
