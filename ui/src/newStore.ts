import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Rights } from './graphql';
import { defaultEditorKeyConfig, EditorKeyConfig } from './xmlEditor/editorKeyConfig';
import { defaultDictionaryConfig, DictionaryConfig, dictionaryConfigKey } from './xmlEditor/dictionaryConfig';
import { defaultLookupConfig, LookupConfig, lookupConfigKey } from './xmlEditor/lookupConfig';

function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  const foundString = localStorage.getItem(key);
  return foundString ? JSON.parse(foundString) : defaultValue;
}

// User slice

const userKey = 'user';

function userFromToken(token: string): User {
  return {
    ...JSON.parse(
      // eslint-disable-next-line deprecation/deprecation
      atob(
        token.split('.')[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/'),
      )
    ),
    token
  };
}

export interface User {
  sub: string;
  rights: Rights;
  exp: number;
  iss: string;
  token: string;
}

const userSlice = createSlice({
  name: 'user',
  initialState: () => ({ user: loadFromLocalStorage<User | null>(userKey, null) }),
  reducers: {
    login(state, { payload }: PayloadAction<string>) {
      const user = userFromToken(payload);
      localStorage.setItem(userKey, JSON.stringify(user));
      state.user = user;
    },
    logout(state) {
      localStorage.removeItem(userKey);
      state.user = null;
    }
  }
});

export const { login, logout } = userSlice.actions;

export const activeUserSelector: (store: StoreState) => User | null = ({ user }) => user.user;

// Preferences

const editorKeyConfigKey = 'preferences';

const editorKeyConfigSlice = createSlice({
  name: 'editorKeyConfig',
  initialState: () => ({ editorKeyConfig: loadFromLocalStorage<EditorKeyConfig>(editorKeyConfigKey, defaultEditorKeyConfig) }),
  reducers: {
    updatePreferences(state, { payload }: PayloadAction<EditorKeyConfig>) {
      localStorage.setItem(editorKeyConfigKey, JSON.stringify(payload));
      state.editorKeyConfig = payload;
    }
  }
});

export const { updatePreferences } = editorKeyConfigSlice.actions;

export const editorKeyConfigSelector: (store: StoreState) => EditorKeyConfig = ({ editorKeyConfig }) => editorKeyConfig.editorKeyConfig;

// Dictionary display configuration

const dictionaryConfigSlice = createSlice({
  name: 'dictionaryConfig',
  initialState: () => ({ dictionaryConfig: loadFromLocalStorage<DictionaryConfig>(dictionaryConfigKey, defaultDictionaryConfig) }),
  reducers: {
    updateDictionaryPreferences(state, { payload }: PayloadAction<DictionaryConfig>) {
      localStorage.setItem(dictionaryConfigKey, JSON.stringify(payload));
      state.dictionaryConfig = payload;
    }
  }
});

export const { updateDictionaryPreferences } = dictionaryConfigSlice.actions;

export const dictionaryConfigSelector: (store: StoreState) => DictionaryConfig = ({ dictionaryConfig }) => dictionaryConfig.dictionaryConfig;

// Dictionary lookup configuration

const lookupConfigSlice = createSlice({
  name: 'lookupConfig',
  initialState: () => ({
    lookupConfig:
    loadFromLocalStorage<LookupConfig>(lookupConfigKey, defaultLookupConfig)
  }),
  reducers: {
    updateLookupPreferences(state, { payload }: PayloadAction<LookupConfig>) {
      localStorage.setItem(lookupConfigKey, JSON.stringify(payload));
      state.lookupConfig = payload;
    }
  }
});

export const { updateLookupPreferences } = lookupConfigSlice.actions;

export const lookupConfigSelector: (store: StoreState) => LookupConfig =
  ({ lookupConfig }) => lookupConfig.lookupConfig;

// Store

interface StoreState {
  user: { user: User | null };
  editorKeyConfig: { editorKeyConfig: EditorKeyConfig };
  dictionaryConfig: { dictionaryConfig: DictionaryConfig };
  lookupConfig: { lookupConfig: LookupConfig };
}

export const newStore = configureStore({
  reducer: {
    user: userSlice.reducer,
    editorKeyConfig: editorKeyConfigSlice.reducer,
    dictionaryConfig: dictionaryConfigSlice.reducer,
    lookupConfig: lookupConfigSlice.reducer,
  }
});

