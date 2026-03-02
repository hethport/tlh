import {XmlEditableNodeIProps} from '../editorConfig';
import {useTranslation} from 'react-i18next';
import {JSX, useState, useEffect, useRef} from 'react';
import {MorphologicalAnalysis, multiMorphAnalysisWithoutEnclitics, readMorphologiesFromNode, writeMorphAnalysisValue} from '../../model/morphologicalAnalysis';
import {MorphAnalysisOptionContainer} from '../morphAnalysisOption/MorphAnalysisOptionContainer';
import {findFirstXmlElementByTagName, isXmlElementNode, lastChildNode, xmlElementNode, XmlElementNode} from 'simple_xml';
import {WordContentEditor} from './wordContentEditor/WordContentEditor';
import {LanguageInput} from '../LanguageInput';
import {readSelectedMorphology, SelectedMorphAnalysis} from '../../model/selectedMorphologicalAnalysis';
import {WordStringChildEditor} from './WordStringChildEditor';
import {getPriorSibling, getPriorSiblingPath} from '../../nodeIterators';
import {AOption} from '../../myOption';
import {fetchCuneiform} from './LineBreakEditor';
import {annotateHurrianWord} from '../hur/dict/dictionary';
import {Attestation, addAttestation, removeAttestation} from '../hur/concordance/concordance';
import {basicGetText} from '../hur/common/xmlUtilities';
import {addOrUpdateLineBySingleNodePath} from '../hur/corpus/corpus';
import {isSelected} from '../hur/morphologicalAnalysis/auxiliary';

type States = 'DefaultState' | 'AddMorphology' | 'EditEditingQuestion' | 'EditFootNoteState' | 'EditContent';

const noTranscriptionMarker = 'no_transcription';

export function WordNodeEditor({node, path, updateEditedNode, setKeyHandlingEnabled, rootNode, updateOtherNode, globalUpdateButtonRef}: XmlEditableNodeIProps<'w'>): JSX.Element {

  const {t} = useTranslation('common');
  const [state, setState] = useState<States>('DefaultState');

  type EventHandler = (event: Event) => void;
  const toggleMorphologyConcordanceModifiers = useRef(new Map<number, EventHandler>());
  const updateMorphologyConcordanceModifiers = useRef(new Map<number, EventHandler>());
  const removers = useRef(new Map<number, EventHandler>());

  const textLanguage = AOption.of(findFirstXmlElementByTagName(rootNode, 'text'))
    .map((textElement) => textElement.attributes['xml:lang'])
    .get();

  const lineBreakLanguage = AOption.of(getPriorSibling(rootNode, path, 'lb'))
    .map((lineBreakElement) => lineBreakElement.attributes.lg)
    .get();

  const language: string = node.attributes.lg || lineBreakLanguage || textLanguage || 'Hit';
  const isHurrian: boolean = (language === 'Hur');
  if (isHurrian) {
    annotateHurrianWord(node);
  }
  const transcription = node.attributes.trans || noTranscriptionMarker;

  const selectedMorphologies: SelectedMorphAnalysis[] = node.attributes.mrp0sel !== undefined
    ? readSelectedMorphology(node.attributes.mrp0sel)
    : [];

  const morphologies: MorphologicalAnalysis[] = readMorphologiesFromNode(node, selectedMorphologies);
  
  const textName: string = AOption.of(findFirstXmlElementByTagName(rootNode, 'AO:TxtPubl'))
    .map((textElement) => basicGetText(textElement))
    .get() || '';

  const lineNumber: string = AOption.of(getPriorSibling(rootNode, path, 'lb'))
    .map((lineBreakElement) => lineBreakElement.attributes.lnr)
    .get() || '';
    
  const attestation = new Attestation(textName, lineNumber);

  function toggleMorphology(currentMrp0sel: string, morphNumber: number, letter: string | undefined, encLetter: string | undefined, targetState: boolean | undefined): string {

    const value = morphNumber + (letter !== undefined ? letter : '') + (encLetter !== undefined ? encLetter : '');

    // Check if selected
    const selected = currentMrp0sel.includes(value);
    
    if (isHurrian) {
      // Add to or remove from the concordance
      const attribute = 'mrp' + morphNumber;
      const analysis = node.attributes[attribute];
      if (analysis !== undefined) {
        if (!globalUpdateButtonRef) {
          throw new Error('No global update button passed.');
        }
        if (!globalUpdateButtonRef.current) {
          console.log('The global update button is null.');
        } else {
          let concordanceModifier;
          if (selected) {
            if (targetState === undefined || targetState === false) {
              concordanceModifier = () => removeAttestation(transcription, analysis, attestation);
            }
          } else {
            if (targetState === undefined || targetState === true) {
              concordanceModifier = () => addAttestation(transcription, analysis, attestation);
            }
          }
          if (concordanceModifier !== undefined) {
            const oldConcordanceModifier = toggleMorphologyConcordanceModifiers.current.get(morphNumber);
            if (oldConcordanceModifier !== undefined) {
              globalUpdateButtonRef.current.removeEventListener('click', oldConcordanceModifier);
            }
            toggleMorphologyConcordanceModifiers.current.set(morphNumber, concordanceModifier);
            globalUpdateButtonRef.current.addEventListener('click', concordanceModifier, {once: true});
          }
        }
      }
    }


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
  
  const corpusModifier = () => {
    const lineLanguage: string = lineBreakLanguage || textLanguage || 'Hit';
    if (isHurrian || lineLanguage === 'Hur') {
      addOrUpdateLineBySingleNodePath(attestation, rootNode, path);
    }
  };
  useEffect(corpusModifier); 

  const toggleAnalysisSelection = (morphNumber: number, letter: string | undefined, encLetter: string | undefined, targetState: boolean | undefined): void => updateEditedNode({
    attributes: {mrp0sel: (value) => toggleMorphology(value || '', morphNumber, letter, encLetter, targetState)}
  });

  function enableEditWordState(): void {
    setKeyHandlingEnabled(false);
    setState('EditContent');
  }

  async function handleEditUpdate(node: XmlElementNode<'w'>): Promise<void> {
    const maybeLineBreakPath = getPriorSiblingPath(rootNode, path, 'lb');

    // Update lb node...
    if (maybeLineBreakPath !== undefined) {
      const cuneiform = await fetchCuneiform(rootNode, maybeLineBreakPath);
      updateOtherNode(maybeLineBreakPath, {attributes: {cu: {$set: cuneiform}}});
    }

    updateEditedNode({$set: node});
    cancelEdit();
  }

  function cancelEdit(): void {
    setKeyHandlingEnabled(true);
    setState('DefaultState');
  }

  function updateMorphology(number: number, newMa: MorphologicalAnalysis): void {
    const attribute = 'mrp' + number;
    const oldValue = node.attributes[attribute];
    
    const value: string = writeMorphAnalysisValue(newMa);
    updateEditedNode({attributes: {[`mrp${number}`]: {$set: value}}});
    setState('DefaultState');
    
    if (isHurrian && isSelected(newMa)) {
      // Remove the old value from and add the new value to the concordance
      if (!globalUpdateButtonRef) {
        throw new Error('No global update button passed.');
      }
      if (!globalUpdateButtonRef.current) {
        console.log('The global update button is null.');
      } else {
        const remover = () => {
          if (oldValue !== undefined) {
            removeAttestation(transcription, oldValue, attestation);
            removers.current.delete(number);
          }
        };
        // The initial analysis, and not its modified versions, should be removed.
        if (!removers.current.has(number)) {
          removers.current.set(number, remover);
          globalUpdateButtonRef.current.addEventListener('click', remover, {once: true});
        }
        const concordanceModifier = () => {
          addAttestation(transcription, value, attestation);
        };
        const oldConcordanceModifier = updateMorphologyConcordanceModifiers.current.get(number);
        if (oldConcordanceModifier !== undefined) {
          globalUpdateButtonRef.current.removeEventListener('click', oldConcordanceModifier);
        }
        updateMorphologyConcordanceModifiers.current.set(number, concordanceModifier);
        globalUpdateButtonRef.current.addEventListener('click', concordanceModifier, {once: true});
      }
    }
  }

  function deleteMorphology(number: number): void {
    updateEditedNode({attributes: {$unset: [`mrp${number}`]}});
    setState('DefaultState');
  }

  const nextMorphAnalysis = (): MorphologicalAnalysis => multiMorphAnalysisWithoutEnclitics(Math.max(0, ...morphologies.map(({number}) => number)) + 1, node.attributes.trans || '');

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

  const lastChild = lastChildNode(node);

  const footNote = lastChild !== undefined && isXmlElementNode(lastChild) && lastChild.tagName === 'note'
    ? lastChild.attributes.c
    : undefined;

  const onEditFootNoteButtonClick = (): void => setState((oldState) => oldState === 'EditFootNoteState' ? 'DefaultState' : 'EditFootNoteState');

  const addOrUpdateFootNote = (value: string): void => updateEditedNode(
    footNote === undefined
      ? {children: {$push: [xmlElementNode('note', {c: value})]}}
      : {children: {[node.children.length - 1]: {attributes: {c: {$set: value}}}}});

  const onFootNoteSubmit = (value: string): void => {
    addOrUpdateFootNote(value);
    setState('DefaultState');
  };

  const onRemoveFootNote = (): void => {
    if (footNote !== undefined) {
      updateEditedNode({children: {$splice: [[node.children.length - 1, 1]]}});
    }
    setState('DefaultState');
  };

  // Html

  const onFocus = () => setKeyHandlingEnabled(false);
  const onBlur = () => setKeyHandlingEnabled(true);
  const onCancel = () => setState('DefaultState');

  if (state === 'EditContent') {
    return (
      <WordContentEditor
        oldNode={node}
        language={node.attributes.lg || lineBreakLanguage || textLanguage || 'Hit'}
        cancelEdit={cancelEdit}
        updateNode={handleEditUpdate}/>
    );
  }

  return (
    <>
      <div className="mt-2">
        <LanguageInput initialValue={node.attributes.lg} parentLanguages={{text: textLanguage, lb: lineBreakLanguage}}
                       onChange={(lg) => updateAttribute('lg', lg.trim() || '')} onFocus={onFocus} onBlur={onBlur}/>
      </div>
      <div className="mt-2 gap-2">
        <WordContentEditor
          oldNode={node}
          language={node.attributes.lg || lineBreakLanguage || textLanguage || 'Hit'}
          cancelEdit={cancelEdit}
          updateNode={handleEditUpdate}/>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {/* <button type="button" className="p-2 rounded bg-blue-500 text-white w-full" onClick={enableEditWordState}>
          &#9998; {t('editContent')}
        </button> */}
        <button type="button" onClick={onEditEditingQuestionButtonClick} className="p-2 rounded bg-teal-400 text-white w-full">
          &#10068; {t('editEditingQuestion')}
        </button>
        <button type="button" onClick={onEditFootNoteButtonClick} className="p-2 rounded bg-slate-400 text-white w-full">
          {t('editFootNote')}
        </button>
      </div>

      {state === 'EditEditingQuestion' &&
        <WordStringChildEditor title={t('editingQuestion')} initialValue={node.attributes.editingQuestion} onDelete={onRemoveEditingQuestion}
                               onCancel={onCancel} onSubmit={onEditingQuestionSubmit} onFocus={onFocus} onBlur={onBlur}/>}

      {state === 'EditFootNoteState' &&
        <WordStringChildEditor title={t('footNote')} initialValue={footNote} onDelete={onRemoveFootNote} onCancel={onCancel} onSubmit={onFootNoteSubmit}
                               onFocus={onFocus} onBlur={onBlur}/>}

      {node.attributes.editingQuestion && <div className="my-2 p-2 rounded bg-teal-400 text-white text-center">
        {t('editingQuestion')}: <span className="font-bold">{node.attributes.editingQuestion}</span>!
      </div>}

      {footNote && <div className="my-2 p-2 rounded bg-slate-400 text-white text-center">
        {t('footNote')}: <span className="font-bold">{footNote}</span>
      </div>}

      <hr className="my-2"/>

      <section>
        <h2 className="mb-2 font-bold text-center">
          {t('morphologicalAnalysis_plural')}
          {node.attributes.mrp0sel !== undefined && <span>(&quot;{node.attributes.mrp0sel}&quot;)</span>}
        </h2>

        {morphologies.length === 0
          ? (
            <div>
              <div className="p-2 rounded bg-amber-400 text-center">
          {t('noMorphologicalAnalysesFound')}</div>

              {node.attributes.mrp0sel === 'DEL'
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
				hurrian={language === 'Hur'}
				transcription={node.attributes.trans || ''}
				deleteMorphology={(ma: MorphologicalAnalysis) => deleteMorphology(ma.number)}
              />
            </div>
          )}
          <div className="text-center">
            <button
              type="button"
              className="my-4 px-4 py-2 rounded bg-cyan-400 text-white"
              onClick={() =>
                updateMorphology(Math.max(0, ...morphologies.map(({number}) => number)) + 1, nextMorphAnalysis())
              }>
              {t('manuallyAddMorphologicalAnalysis')}
            </button>
          </div>
      </section>
    </>
  );
}
