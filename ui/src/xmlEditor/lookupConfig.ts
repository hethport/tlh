export interface LookupConfig {
  ignorePlene: boolean;
}

export const defaultLookupConfig = {
  ignorePlene: false,
};

export const lookupConfigKeys = Object.keys(defaultLookupConfig);
