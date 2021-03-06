import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {activeUserSelector} from '../store/store';
import {homeUrl} from '../urls';
import {TransliterationInput as TI, useUploadTransliterationMutation} from '../graphql';
import {ManuscriptBaseIProps} from './ManuscriptBase';
import {TransliterationSideInput} from './TransliterationSideInput';
import {Navigate} from 'react-router-dom';
import update from 'immutability-helper';

interface SideParseResultContainer {
  newSideParseResult?: TI;
}

interface IState {
  sideParseResults: SideParseResultContainer[];
}

export function TransliterationInput({manuscript}: ManuscriptBaseIProps): JSX.Element {

  const {t} = useTranslation('common');
  const [state, setState] = useState<IState>({sideParseResults: [{}]});
  const currentUser = useSelector(activeUserSelector);

  const [uploadTransliteration, {data, loading, error}] = useUploadTransliterationMutation();

  const mainIdentifier = manuscript.mainIdentifier.identifier;

  if (!currentUser || currentUser.username !== manuscript.creatorUsername) {
    return <Navigate to={homeUrl}/>;
  }

  if (data) {
    console.info(JSON.stringify(data, null, 2));
  }

  function upload(): void {
    const values = state.sideParseResults.flatMap(({newSideParseResult}) => newSideParseResult ? [newSideParseResult] : []);

    uploadTransliteration({variables: {mainIdentifier, values}})
      .catch((error) => console.error('Could not upload transliteration:\n' + error));
  }

  function addTransliterationSideInput(): void {
    setState((state) => update(state, {sideParseResults: {$push: [{}]}}));
  }

  function updateTransliteration(index: number, result: TI): void {
    setState((state) => update(state, {sideParseResults: {[index]: {newSideParseResult: {$set: result}}}}));
  }

  return (
    <div>
      <h1 className="font-bold text-xl text-center">{t('createTransliteration')}</h1>

      {state.sideParseResults.map((_, index) =>
        <TransliterationSideInput key={index} mainIdentifier={mainIdentifier} onTransliterationUpdate={(s) => updateTransliteration(index, s)}/>
      )}

      {error && <div className="mt-2 p-2 bg-red-500 text-white text-center">{error.message}</div>}

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" className="p-2 rounded bg-blue-500 text-white w-full" onClick={addTransliterationSideInput}>{t('additionalPage')}</button>
        <button type="button" className="p-2 rounded bg-blue-500 text-white w-full " onClick={upload} disabled={loading}>{t('uploadTransliteration')}</button>
      </div>
    </div>
  );
}
