import {StrictMode} from 'react';
import './index.css';
import {RouterProvider} from 'react-router-dom';
import {registerSW} from 'virtual:pwa-register';
import {ApolloProvider} from '@apollo/client';
import {Provider as StoreProvider} from 'react-redux';
import i18n from 'i18next';
import {I18nextProvider, initReactI18next} from 'react-i18next';
import {createRoot} from 'react-dom/client';
import {newStore} from './newStore';
import common_de from './locales/common_de.json';
import common_en from './locales/common_en.json';
import {router} from './routes';
import {apolloClient} from './apolloClient';

// noinspection JSIgnoredPromiseFromCall
i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'de',
    resources: {
      de: {common: common_de},
      en: {common: common_en}
    },
  });

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <ApolloProvider client={apolloClient}>
        <StoreProvider store={newStore}>
          <RouterProvider router={router}/>
        </StoreProvider>
      </ApolloProvider>
    </I18nextProvider>
  </StrictMode>
);

// Registers the precaching service worker so the app (in particular /OXTED)
// keeps working fully offline once the shell has been loaded once.
registerSW({immediate: true});
