import {Field, Form, Formik} from 'formik';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {editorKeyConfigSelector, updatePreferences,
  dictionaryConfigSelector, updateDictionaryPreferences}
  from './newStore';
import {JSX, useState} from 'react';
import {EditorKeyConfig} from './xmlEditor/editorKeyConfig';
import {DictionaryConfig} from './xmlEditor/dictionaryConfig';

const splitKey = ',';

const dictionaryConfigKeys = ['alphabetizeIAsE', 'alphabetizeOAsU', 'alphabetizeVoicedConsonantsAsVoiceless'];

interface FormValues {
  updateAndNextNodeKeys: string;
  nextNodeKeys: string;
  updateAndPrevNodeKeys: string;
  prevNodeKeys: string;
  submitKeys: string;
  ignorePlene: boolean;
  fragmInSuffixDict: boolean;
  showUnclearForms: boolean;
  alphabetizeIAsE: boolean;
  alphabetizeOAsU: boolean;
  alphabetizeVoicedConsonantsAsVoiceless: boolean;
}

function dismantleFormEntry(entry: string): string[] {
  return Array.from(
    new Set(
      entry.split(splitKey)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    )
  );
}

export function Preferences(): JSX.Element {

  const {t} = useTranslation('common');
  const dispatch = useDispatch();
  const currentEditorConfig: EditorKeyConfig = useSelector(editorKeyConfigSelector);
  const currentDictionaryConfig: DictionaryConfig = useSelector(dictionaryConfigSelector);
  const [updated, setUpdated] = useState(false);

  const initialValues: FormValues = {
    updateAndNextNodeKeys: currentEditorConfig.updateAndNextEditableNodeKeys.join(splitKey),
    nextNodeKeys: currentEditorConfig.nextEditableNodeKeys.join(splitKey),
    updateAndPrevNodeKeys: currentEditorConfig.updateAndPreviousEditableNodeKeys.join(splitKey),
    prevNodeKeys: currentEditorConfig.previousEditableNodeKeys.join(splitKey),
    submitKeys: currentEditorConfig.submitChangeKeys.join(splitKey),
    ignorePlene: currentDictionaryConfig.ignorePlene,
    fragmInSuffixDict: currentDictionaryConfig.fragmInSuffixDict,
    showUnclearForms: currentDictionaryConfig.showUnclearForms,
    alphabetizeIAsE: currentDictionaryConfig.alphabetizeIAsE,
    alphabetizeOAsU: currentDictionaryConfig.alphabetizeOAsU,
    alphabetizeVoicedConsonantsAsVoiceless: currentDictionaryConfig.alphabetizeVoicedConsonantsAsVoiceless,
  };

  function onSubmit(newConfig: FormValues): void {
    const {updateAndNextNodeKeys, nextNodeKeys, updateAndPrevNodeKeys, prevNodeKeys, submitKeys,
           ignorePlene, fragmInSuffixDict, showUnclearForms, alphabetizeIAsE, alphabetizeOAsU,
           alphabetizeVoicedConsonantsAsVoiceless} = newConfig;

    const updateAndNextEditableNodeKeys = dismantleFormEntry(updateAndNextNodeKeys);
    const nextEditableNodeKeys = dismantleFormEntry(nextNodeKeys);
    const updateAndPreviousEditableNodeKeys = dismantleFormEntry(updateAndPrevNodeKeys);
    const previousEditableNodeKeys = dismantleFormEntry(prevNodeKeys);
    const submitChangeKeys = dismantleFormEntry(submitKeys);

    const differentKeysUsed = Array.from(
      new Set([
        ...updateAndNextEditableNodeKeys,
        ...nextEditableNodeKeys,
        ...updateAndPreviousEditableNodeKeys,
        ...previousEditableNodeKeys,
        ...submitChangeKeys
      ])
    );

    const completeKeysUsedCount = updateAndNextEditableNodeKeys.length
      + nextEditableNodeKeys.length
      + updateAndPreviousEditableNodeKeys.length
      + previousEditableNodeKeys.length
      + submitChangeKeys.length;

    if (differentKeysUsed.length !== completeKeysUsedCount) {
      alert(t('keyDefinitionOverlapping'));
      return;
    }

    dispatch(
      updatePreferences({
        updateAndNextEditableNodeKeys,
        nextEditableNodeKeys,
        updateAndPreviousEditableNodeKeys,
        previousEditableNodeKeys,
        submitChangeKeys
      })
    );

    dispatch(
      updateDictionaryPreferences({
        ignorePlene,
        fragmInSuffixDict,
        showUnclearForms,
        alphabetizeIAsE,
        alphabetizeOAsU,
        alphabetizeVoicedConsonantsAsVoiceless
      })
    );

    setUpdated(true);
  }

  return (
    <div className="container mx-auto">
      <h1 className="font-bold text-2xl text-center">{t('preferences')}</h1>

      <h2 className="font-bold text-xl">{t('xmlEditor')}</h2>

      <Formik initialValues={initialValues} onSubmit={onSubmit}>
        {() => <Form>

          <div className="mt-4">
            <label htmlFor="updateAndNextNodeKeys" className="font-bold">{t('updateAndNextEditableNode')}</label>
            <Field type="text" id="updateAndNextNodeKeys" name="updateAndNextNodeKeys" className="mt-2 p-2 rounded border border-slate-500 w-full"/>
          </div>

          <div className="mt-4">
            <label htmlFor="nextEditableNode" className="font-bold">{t('nextEditableNode')}</label>
            <Field type="text" id="nextEditableNode" name="nextNodeKeys" className="mt-2 p-2 rounded border border-slate-500 w-full"/>
          </div>

          <div className="mt-4">
            <label htmlFor="updateAndPrevEditableNode" className="font-bold">{t('updateAndPrevEditableNode')}</label>
            <Field type="text" id="updateAndPrevEditableNode" name="updateAndPrevNodeKeys" className="mt-2 p-2 rounded border border-slate-500 w-full"/>
          </div>

          <div className="mt-4">
            <label htmlFor="previousEditableNode" className="font-bold">{t('previousEditableNode')}</label>
            <Field type="text" id="previousEditableNode" name="prevNodeKeys" className="mt-2 p-2 rounded border border-slate-500 w-full"/>
          </div>

          <div className="mt-4">
            <label htmlFor="submitChangesKeys" className="font-bold">{t('submitChangesKeys')}</label>
            <Field type="text" id="submitChangesKeys" name="submitKeys" className="mt-2 p-2 rounded border border-slate-500 w-full"/>
          </div>

          <br/>

          <h2 className="font-bold text-xl">{t('hurrianDictionary')}</h2>

          <div className="mt-4">
            <label htmlFor="ignorePlene" className="font-bold checkbox-label">{t('ignorePlene')}</label>
            <Field type="checkbox" id="ignorePlene" name="ignorePlene" className="rounded border border-slate-500"/>
          </div>

          <div className="mt-4">
            <label htmlFor="fragmInSuffixDict" className="font-bold checkbox-label">{t('fragmInSuffixDict')}</label>
            <Field type="checkbox" id="fragmInSuffixDict" name="fragmInSuffixDict" className="rounded border border-slate-500"/>
          </div>

          <div className="mt-4">
            <label htmlFor="showUnclearForms" className="font-bold checkbox-label">{t('showFormsWithUnknownMeaningAndUnclearPos')}</label>
            <Field type="checkbox" id="showUnclearForms" name="showUnclearForms" className="rounded border border-slate-500"/>
          </div>

          <>
            {dictionaryConfigKeys.map((key: string) => (
              <div className="mt-4" key={key}>
                <label htmlFor={key} className="font-bold checkbox-label">{t(key)}</label>
                <Field type="checkbox" id={key} name={key} className="rounded border border-slate-500"/>
              </div>
            ))}
          </>

          {updated && <div className="mt-4 p-2 rounded bg-green-500 text-white text-center">{t('preferencesUpdated')}</div>}

          <button type="submit" className="mt-4 p-2 rounded bg-blue-600 text-white w-full">{t('updatePreferences')}</button>
        </Form>}
      </Formik>

    </div>
  );
}