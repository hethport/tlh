import { ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import update from 'immutability-helper';
import { TransliterationTextArea } from './TransliterationTextArea';
import { XmlCreationValues } from './xmlConversion/createCompleteDocument';
import { inputClasses } from '../defaultDesign';
import {ManuscriptIdentifierType} from '../graphql';

interface IState {
  mainIdentifierType: ManuscriptIdentifierType;
  mainIdentifier: string;
  input: string;
  author: string;
  lang: string;
}

export function AnonymousTransliterationInput(): ReactElement {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const [state, setState] = useState<IState>({
    mainIdentifierType: ManuscriptIdentifierType.CollectionNumber,
    mainIdentifier: 'anonymous-manuscript',
    input: '',
    author: 'Anonymous',
    lang: 'Hit'
  });

  const updateMainIdentifierType = (value: ManuscriptIdentifierType): void =>
    setState((state) => update(state, { mainIdentifierType: { $set: value } }));

  const updateMainIdentifier = (value: string): void =>
    setState((state) => update(state, { mainIdentifier: { $set: value } }));

  const updateAuthor = (value: string): void =>
    setState((state) => update(state, { author: { $set: value } }));

  const updateLang = (value: string): void =>
    setState((state) => update(state, { lang: { $set: value } }));

  const updateTransliteration = (value: string): void =>
    setState((state) => update(state, { input: { $set: value } }));

  const xmlCreationValues: XmlCreationValues = {
    mainIdentifierType: state.mainIdentifierType,
    mainIdentifier: state.mainIdentifier,
    author: state.author,
    creationDate: new Date().toISOString(),
    lang: state.lang,
    transliterationReleaseDate: undefined
  };

  return (
    <div className="container mx-auto">
      <div className="my-4 flex items-center justify-between">
        <h1 className="font-bold text-xl text-center flex-grow">
          {t('anonymousTransliteration') || 'Anonymous Transliteration Parser'}
        </h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
        >
          {t('close') || 'Close'}
        </button>
      </div>

      <div className="my-4 p-4 rounded border border-slate-500 bg-slate-50">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="mainIdentifierType" className="block font-bold mb-2">
              {t('mainIdentifierType') || 'Identifier Type'}:
            </label>
            <select
              id="mainIdentifierType"
              value={state.mainIdentifierType}
              onChange={(e) => updateMainIdentifierType(e.target.value as ManuscriptIdentifierType)}
              className={inputClasses(true, false)}
            >
              <option value={ManuscriptIdentifierType.InventoryNumber}>Inventory Number</option>
              <option value={ManuscriptIdentifierType.PublicationNumber}>Publication Number</option>
              {/*  <option value={ManuscriptIdentifierType.PublicationShortReference}>Publication Short Reference</option> */}
            </select>
          </div>

          <div>
            <label htmlFor="mainIdentifier" className="block font-bold mb-2">
              {t('mainIdentifier') || 'Main Identifier'}:
            </label>
            <input
              id="mainIdentifier"
              type="text"
              value={state.mainIdentifier}
              onChange={(e) => updateMainIdentifier(e.target.value)}
              className={inputClasses(true, false)}
              placeholder={t('mainIdentifier') || 'Main Identifier'}
            />
          </div>

          <div>
            <label htmlFor="author" className="block font-bold mb-2">
              {t('author') || 'Author'}:
            </label>
            <input
              id="author"
              type="text"
              value={state.author}
              onChange={(e) => updateAuthor(e.target.value)}
              className={inputClasses(true, false)}
              placeholder={t('author') || 'Author'}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label htmlFor="language" className="block font-bold mb-2">
              {t('language') || 'Language'}:
            </label>
            <select
              id="language"
              value={state.lang}
              onChange={(e) => updateLang(e.target.value)}
              className={inputClasses(true, false)}
            >
              <option value="Hit">Hit</option>
              <option value="Akk">Akk</option>
              <option value="Sum">Sum</option>
              <option value="Luw">Luw</option>
              <option value="Pal">Pal</option>
              <option value="Hur">Hur</option>
              <option value="Hat">Hat</option>
            </select>
          </div>
        </div>
      </div>

      <TransliterationTextArea
        xmlCreationValues={xmlCreationValues}
        initialInput={state.input}
        onChange={updateTransliteration}
        disabled={false}
      />

      <div className="my-4 p-2 rounded border border-blue-300 bg-blue-50">
        <p className="text-sm text-blue-700 text-center">
          <strong>{t('anonymousNote') || 'Note'}:</strong>{' '}
          {t('anonymousTransliterationInfo') ||
            'This is an anonymous parser. You can view the parse result and export XML, but cannot save to the database.'}
        </p>
      </div>
    </div>
  );
}
