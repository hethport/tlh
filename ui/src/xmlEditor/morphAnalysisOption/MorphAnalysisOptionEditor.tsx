import {Field, FieldArray, Form, Formik} from 'formik';
import {MorphologicalAnalysis, MultiMorphologicalAnalysis} from '../../model/morphologicalAnalysis';
import {LetteredAnalysisOption} from '../../model/analysisOptions';
import {useTranslation} from 'react-i18next';

interface IProps {
  morphologicalAnalysis: MorphologicalAnalysis;
  onSubmit: (ma: MorphologicalAnalysis) => void;
  cancelUpdate: () => void;
}

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

export function MorphAnalysisOptionEditor({morphologicalAnalysis, onSubmit, cancelUpdate}: IProps): JSX.Element {

  const {t} = useTranslation('common');

  function nextAnalysisOption(lma: MultiMorphologicalAnalysis): LetteredAnalysisOption {
    const usedLetters = lma.analysisOptions.map(({letter}) => letter);

    const letter = alphabet.find((l) => !usedLetters.includes(l));

    if (!letter) {
      throw new Error('All letters are used!');
    }

    return {letter, analysis: '', selected: false};
  }

  if ('analysis' in morphologicalAnalysis) {
    // TODO: disabled until further notice...
    return <div className="notification is-warning has-text-centered">This should be disabled and not selectable...</div>;
  }

  // FIXME: validationSchema for morphological analysis?!

  return (
    <Formik initialValues={morphologicalAnalysis} onSubmit={onSubmit}>
      {({values}) =>
        <Form>

          <div className="flex flex-row">
            <button type="button" className="px-4 py-2 rounded-l bg-gray-100 border-l border-y border-slate-500">{morphologicalAnalysis.number}</button>

            <Field name="translation" className="flex-grow p-2 border border-slate-500" placeholder={t('translation')}/>

            <Field name="referenceWord" className="flex-grow p-2 border-r border-y border-slate-500" placeholder={t('referenceWord')}/>

            <Field name="determinativ" className="flex-1 p-2 border-r border-y border-slate-500" placeholder={t('determinativ')}/>

            <Field name="paradigmClass" className="flex-1 p-2 rounded-r border-r border-y border-slate-500" placeholder={t('paradigmClass')}/>
          </div>

          <FieldArray name={'analysisOptions'}>
            {(arrayHelpers) => <div>

              {(values.analysisOptions as LetteredAnalysisOption[]).map(({letter}, index) =>
                <div className="mt-2 flex flex-row" key={letter}>
                  <button className="px-4 py-2 rounded-l bg-gray-100 border-l border-y border-slate-500">{letter}</button>
                  <Field name={`analysisOptions.${index}.analysis`} className="flex-grow p-2 border-l border-y border-slate-500" placeholder={t('analysis')}/>
                  <button type="button" className="px-4 py-2 rounded-r bg-red-500 text-white" onClick={() => arrayHelpers.remove(index)}>-</button>
                </div>
              )}

              <div className="mt-2">
                <button type="button" className="px-4 py-2 rounded bg-teal-500 text-white" onClick={() => arrayHelpers.push(nextAnalysisOption(values))}>+
                </button>
                <button type="button" className="ml-2 px-4 py-2 rounded bg-amber-400" onClick={cancelUpdate}>{t('cancelEdit')}</button>
                <button type="submit" className="ml-2 px-4 py-2 rounded bg-blue-600 text-white">{t('updateAnalyses')}</button>
              </div>
            </div>}

          </FieldArray>
        </Form>
      }
    </Formik>
  );
}