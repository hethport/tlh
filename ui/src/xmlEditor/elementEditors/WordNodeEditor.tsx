import {XmlEditableNodeIProps} from '../editorConfig';
import {useTranslation} from 'react-i18next';
import {useState} from 'react';
import {MorphologicalAnalysis, readMorphologiesFromNode, writeMorphAnalysisValue} from '../../model/morphologicalAnalysis';
import {MorphAnalysisOptionContainer} from '../morphAnalysisOption/MorphAnalysisOptionContainer';
import {isXmlElementNode, lastChildNode, xmlElementNode, XmlElementNode} from 'simple_xml';
import {MorphAnalysisOptionEditor} from '../morphAnalysisOption/MorphAnalysisOptionEditor';
import {WordContentEditor} from './WordContentEditor';
import {readWordNodeData} from './wordNodeData';
import {LanguageInput} from '../LanguageInput';
import {readSelectedMorphology, SelectedMorphAnalysis} from '../../model/selectedMorphologicalAnalysis';
import {WordStringChildEditor} from './WordStringChildEditor';

type States = 'DefaultState' | 'AddMorphology' | 'EditEditingQuestion' | 'EditFootNoteState' | 'EditContent';

export function WordNodeEditor({data, updateEditedNode, setKeyHandlingEnabled}: XmlEditableNodeIProps<XmlElementNode<'w'>>): JSX.Element {

  const {t} = useTranslation('common');
  const [state, setState] = useState<States>('DefaultState');

  // TODO
  const selectedMorphologies: SelectedMorphAnalysis[] = data.attributes.mrp0sel !== undefined
    ? readSelectedMorphology(data.attributes.mrp0sel)
    : [];

  const morphologies: MorphologicalAnalysis[] = readMorphologiesFromNode(data, selectedMorphologies);

  function toggleMorphology(currentMrp0sel: string, morphNumber: number, letter: string | undefined, encLetter: string | undefined, targetState: boolean | undefined): string {

    const value = morphNumber + (letter !== undefined ? letter : '') + (encLetter !== undefined ? encLetter : '');

    // Check if selected
    const selected = currentMrp0sel.includes(value);

    if (targetState !== undefined && targetState === selected) {
      // Nothing to do...
      return currentMrp0sel;
    } else {
      // targetState === undefined || (targetState !== undefined && targetState !== selected)
      return selected
        ? currentMrp0sel.replace(value, '').replaceAll(/\s+/g, ' ')
        : currentMrp0sel + ' ' + value;
    }
  }


  function toggleAnalysisSelection(morphNumber: number, letter: string | undefined, encLetter: string | undefined, targetState: boolean | undefined): void {
    return updateEditedNode({
      attributes: {mrp0sel: (value) => toggleMorphology(value || '', morphNumber, letter, encLetter, targetState)}
    });
  }

  function enableEditWordState(): void {
    setKeyHandlingEnabled(false);
    setState('EditContent');
  }

  function handleEditUpdate(node: XmlElementNode): void {
    updateEditedNode({$set: readWordNodeData(node)});
    cancelEdit();
  }

  function cancelEdit(): void {
    setKeyHandlingEnabled(true);
    setState('DefaultState');
  }

  function updateMorphology(number: number, newMa: MorphologicalAnalysis): void {
    const key = `mrp${number}`;
    const newValue = writeMorphAnalysisValue(newMa);

    console.info(key + ' :: ' + newValue);

    updateEditedNode({attributes: {[key]: {$set: newValue}}});
    setState('DefaultState');
  }

  function toggleAddMorphology(): void {
    setKeyHandlingEnabled(state === 'AddMorphology');
    setState(state === 'AddMorphology' ? 'DefaultState' : 'AddMorphology');
  }

  function nextMorphAnalysis(): MorphologicalAnalysis {
    const number = Math.max(0, ...morphologies.map(({number}) => number)) + 1;

    return {
      _type: 'MultiMorphAnalysisWithoutEnclitics',
      number,
      translation: '',
      referenceWord: '',
      analysisOptions: [],
      encliticsAnalysis: undefined,
      determinative: undefined,
      paradigmClass: ''
    };
  }

  const updateAttribute = (name: string, value: string | undefined): void => updateEditedNode({attributes: {[name]: {$set: value}}});

  // editing question

  const setEditingQuestion = (value: string | undefined) => updateAttribute('editingQuestion', value);

  const onEditingQuestionSubmit = (value: string): void => {
    setEditingQuestion(value);
    setState('DefaultState');
  };

  const onEditEditingQuestionButtonClick = (): void => setState((oldState) => oldState === 'EditEditingQuestion' ? 'DefaultState' : 'EditEditingQuestion');

  const onRemoveEditingQuestion = (): void => {
    setEditingQuestion(undefined);
    setState('DefaultState');
  };

  // footnote

  const lastChild = lastChildNode(data);

  const footNote = lastChild !== undefined && isXmlElementNode(lastChild) && lastChild.tagName === 'note'
    ? lastChild.attributes.c
    : undefined;

  const onEditFootNoteButtonClick = (): void => setState((oldState) => oldState === 'EditFootNoteState' ? 'DefaultState' : 'EditFootNoteState');

  const addOrUpdateFootNote = (value: string): void => updateEditedNode(
    footNote === undefined
      ? {children: {$push: [xmlElementNode('note', {c: value})]}}
      : {children: {[data.children.length - 1]: {attributes: {c: {$set: value}}}}});

  const onFootNoteSubmit = (value: string): void => {
    addOrUpdateFootNote(value);
    setState('DefaultState');
  };

  const onRemoveFootNote = (): void => {
    if (footNote !== undefined) {
      updateEditedNode({children: {$splice: [[data.children.length - 1, 1]]}});
    }
    setState('DefaultState');
  };

  // Html

  const onFocus = () => setKeyHandlingEnabled(false);
  const onBlur = () => setKeyHandlingEnabled(true);
  const onCancel = () => setState('DefaultState');

  if (state === 'EditContent') {
    return <WordContentEditor oldNode={data} cancelEdit={cancelEdit} updateNode={handleEditUpdate}/>;
  }

  return (
    <>
      <div className="mt-2">
        <LanguageInput initialValue={data.attributes.lg} onChange={(lg) => updateAttribute('lg', lg.trim() || '')} onFocus={onFocus} onBlur={onBlur}/>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <button type="button" className="p-2 rounded bg-blue-500 text-white w-full" onClick={enableEditWordState}>
          &#9998; {t('editContent')}
        </button>
        <button type="button" onClick={onEditEditingQuestionButtonClick} className="p-2 rounded bg-teal-400 text-white w-full">
          &#10068; {t('editEditingQuestion')}
        </button>
        <button type="button" onClick={onEditFootNoteButtonClick} className="p-2 rounded bg-slate-400 text-white w-full">
          {t('editFootNote')}
        </button>
      </div>

      {state === 'EditEditingQuestion' &&
        <WordStringChildEditor title={t('editingQuestion')} initialValue={data.attributes.editingQuestion} onDelete={onRemoveEditingQuestion}
                               onCancel={onCancel} onSubmit={onEditingQuestionSubmit} onFocus={onFocus} onBlur={onBlur}/>}

      {state === 'EditFootNoteState' &&
        <WordStringChildEditor title={t('footNote')} initialValue={footNote} onDelete={onRemoveFootNote} onCancel={onCancel} onSubmit={onFootNoteSubmit}
                               onFocus={onFocus} onBlur={onBlur}/>}

      {data.attributes.editingQuestion && /* TODO: styling... */
        <div className="p-2 text-center">{t('editingQuestion')}: {data.attributes.editingQuestion}!</div>}

      {footNote && /* TODO: styling... */ <div className="p-2 text-center">{t('footNote')}: {footNote}</div>}

      <hr className="my-2"/>

      <section>
        <h2 className="mb-2 font-bold text-center">
          {t('morphologicalAnalysis_plural')}
          {data.attributes.mrp0sel !== undefined && <span>(mrp0sel=&quot;{data.attributes.mrp0sel}&quot;)</span>}
        </h2>

        {morphologies.length === 0
          ? (
            <div>
              <div className="p-2 rounded bg-amber-400 text-center">{t('noMorphologicalAnalysesFound')}</div>

              {data.attributes.mrp0sel === 'DEL'
                ? <div className="mt-2 p-2 rounded bg-blue-600 text-white text-center w-full">mrp0sel=&quot;DEL&quot;</div>
                : (
                  <button type="button" className="mt-2 p-2 rounded border border-slate-500 text-center w-full"
                          onClick={() => updateAttribute('mrp0sel', 'DEL')}>
                    {t('set_mrp0sel=DEL')}
                  </button>
                )}
            </div>
          )
          : morphologies.map((m) =>
            <div className="mt-2" key={m.number}>
              <MorphAnalysisOptionContainer
                morphologicalAnalysis={m}
                toggleAnalysisSelection={(letter, encLetter, targetState) => toggleAnalysisSelection(m.number, letter, encLetter, targetState)}
                updateMorphology={(newMa) => updateMorphology(m.number, newMa)}
                setKeyHandlingEnabled={setKeyHandlingEnabled}
              />
            </div>
          )}

        {state === 'AddMorphology'
          ? <MorphAnalysisOptionEditor initialMorphologicalAnalysis={nextMorphAnalysis()}
                                       onSubmit={(newMa) => updateMorphology(morphologies.length, newMa)}
                                       cancelUpdate={toggleAddMorphology}/>
          : (
            <button type="button" className="mt-4 p-2 rounded bg-cyan-300 text-white w-full" onClick={toggleAddMorphology}>
              {t('addMorphologicalAnalysis')}
            </button>
          )}
      </section>
    </>
  );
}
