import {JSX, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {SingleMorphAnalysisOptionButton} from './SingleMorphAnalysisOptionButton';
import {isSingleMorphologicalAnalysis, MorphologicalAnalysis, MultiMorphologicalAnalysis, writeMorphAnalysisValue} from '../../model/morphologicalAnalysis';
import {CanToggleAnalysisSelection} from './MorphAnalysisOptionContainer';
import {MultiMorphAnalysisOptionButtons} from './MultiMorphAnalysisOptionButtons';
import classNames from 'classnames';
import {analysisIsInNumerus, numeri, NumerusOption, stringifyNumerus} from './numerusOption';
import update from 'immutability-helper';
import { getPartsOfSpeech, getPos } from '../hur/partsOfSpeech/partsOfSpeech';
import {TranslationEditor} from '../hur/translations/TranslationEditor';
import {getStem} from '../hur/common/splitter';
import { addToTheStopListFor } from '../hur/stopList/stopList';

interface IProps extends CanToggleAnalysisSelection {
  morphologicalAnalysis: MorphologicalAnalysis;
  enableEditMode: () => void;
  updateMorphology: (ma: MorphologicalAnalysis) => void;
  hurrian: boolean;
  transcription: string;
  deleteMorphology: (ma: MorphologicalAnalysis) => void;
}

export function MorphAnalysisOptionButtons({morphologicalAnalysis, toggleAnalysisSelection, enableEditMode, updateMorphology, hurrian, transcription, deleteMorphology}: IProps): JSX.Element {

  const {t} = useTranslation('common');
  const [isReduced, setIsReduced] = useState(false);
  const [lastNumerusSelected, setLastNumerusSelected] = useState<NumerusOption>();

  const setTranslation = (value: string): void => {
    updateMorphology(update(morphologicalAnalysis, { translation: { $set: value } }));
  };

  const setParadigmClass = (value: string): void => {
    updateMorphology(update(morphologicalAnalysis, { paradigmClass: { $set: value } }));
  };

  const {number, translation, referenceWord, paradigmClass, determinative} = morphologicalAnalysis;
  let actualParadigmClass: string = paradigmClass;

  if (hurrian) {
    const newParadigmClass = getPos(paradigmClass, getSomeMorphTag(morphologicalAnalysis), translation);
    if (newParadigmClass !== paradigmClass) {
      setParadigmClass(newParadigmClass);
      actualParadigmClass = newParadigmClass;
    }
  }

  const isSingleAnalysisOption = isSingleMorphologicalAnalysis(morphologicalAnalysis);

  function selectAll(ma: MultiMorphologicalAnalysis, numerus: NumerusOption): void {
    const targetState: boolean = lastNumerusSelected === undefined || lastNumerusSelected !== numerus;

    setLastNumerusSelected((current) => current === numerus ? undefined : numerus);

    ma.analysisOptions.forEach(({letter, analysis}) => {
      if (numerus === undefined || analysisIsInNumerus(analysis, numerus)) {
        toggleAnalysisSelection(letter, undefined, targetState);
      }
    });
  }

  function isSelected(morphologicalAnalysis: MorphologicalAnalysis) {
    switch (morphologicalAnalysis._type) {
      case 'SingleMorphAnalysisWithoutEnclitics':
        return morphologicalAnalysis.selected;
      case 'SingleMorphAnalysisWithSingleEnclitics':
        return morphologicalAnalysis.selected;
      case 'SingleMorphAnalysisWithMultiEnclitics':
        return morphologicalAnalysis.encliticsAnalysis.analysisOptions.some(({selected}) => selected);
      case 'MultiMorphAnalysisWithoutEnclitics':
        return morphologicalAnalysis.analysisOptions.some(({selected}) => selected);
      case 'MultiMorphAnalysisWithSingleEnclitics':
        return morphologicalAnalysis.analysisOptions.some(({selected}) => selected);
      case 'MultiMorphAnalysisWithMultiEnclitics':
        return morphologicalAnalysis.selectedAnalysisCombinations.length > 0;
    }
  }

  const deleteNodeMorphology = () => {
    if (isSelected(morphologicalAnalysis)) {
      alert('You should unselect the analysis before deletion.');
    }
    else {
      deleteMorphology(morphologicalAnalysis);
    }
  };

  const deleteNodeMorphologyAndItToTheStopList = () => {
    if (isSelected(morphologicalAnalysis)) {
      alert('You should unselect the analysis before deletion.');
    }
    else {
      deleteMorphology(morphologicalAnalysis);
      addToTheStopListFor(morphologicalAnalysis, transcription);
    }
  };

  function getSomeMorphTag(morphAnalysis: MorphologicalAnalysis): string | null {
    switch (morphAnalysis._type) {
      case 'SingleMorphAnalysisWithoutEnclitics':
        return morphAnalysis.analysis;
      case 'MultiMorphAnalysisWithoutEnclitics':
        return morphAnalysis.analysisOptions[0].analysis;
      default:
        return null;
    }
  }
  
  const handleTranslationChange = (newTranslation: string) => {
    setTranslation(newTranslation);
  };

  return (
    <div className="mt-2">
      <div className="flex flex-row">
        <button onClick={() => setIsReduced((value) => !value)} className="p-2 rounded-l border-l border-y border-slate-500 font-bold text-lg">
          {isReduced ? <span>&gt;</span> : <span>&or;</span>}
        </button>

        <span className="p-2 border-l border-y border-slate-500">{number}</span>

        <div className="flex-grow p-2 border-l border-y border-slate-500 bg-gray-100">
          <span className="text-red-600">
          {
            hurrian ?
            <TranslationEditor stem={getStem(referenceWord)} 
                               partOfSpeech={paradigmClass}
                               translation={translation}
                               handleChange={handleTranslationChange} /> :
            translation
          }
          </span>&nbsp;({referenceWord},&nbsp;
          {hurrian ? 'Wortart' : t('paradigmClass')}:&nbsp;
            <span className="text-red-600">
            {
              hurrian ?
              <select
                defaultValue={actualParadigmClass}
                onChange={(event) => {
                  setParadigmClass(event.target.value);
                }}>
                {getPartsOfSpeech().map((partOfSpeech: string) => {
                  return (<option key={partOfSpeech} value={partOfSpeech}>{partOfSpeech}</option>);
                })}
              </select> :
              paradigmClass
            }
            </span>
          {determinative && <span>, {t('determinative')}:&nbsp;<span className="text-red-600">{determinative}</span></span>})&nbsp;
        </div>

        {!isSingleAnalysisOption && <>
          {numeri.map((numerus) =>
            <button key={numerus} type="button" className={classNames('p-2', 'border', 'border-teal-300', {'bg-teal-300': lastNumerusSelected === numerus})}
                    onClick={() => selectAll(morphologicalAnalysis, numerus)} tabIndex={-1}>
              {stringifyNumerus(numerus, t)}
            </button>)}
        </>}

        <button type="button" className="p-2 rounded-r border border-slate-500"
                onClick={deleteNodeMorphology}
                title={t('deleteMorphologicalAnalysis')}>
        &#9960;
        </button>

        <button type="button" className="p-2 rounded-r border border-slate-500"
                onClick={deleteNodeMorphologyAndItToTheStopList}
                title={t('deleteMorphologicalAnalysisAndAddItToTheStopList')}>
        &#10754;
        </button>

        <button type="button" className="p-2 rounded-r border border-slate-500"
                onClick={enableEditMode}
                title={t('editMorphologicalAnalyses') || 'editMorphologicalAnalyses'}>
          &#x2699;
        </button>
      </div>

      {!isReduced && <div className="mt-2">
        {isSingleAnalysisOption
          ? <SingleMorphAnalysisOptionButton morphAnalysis={morphologicalAnalysis}
                                             toggleAnalysisSelection={(encLetter) => toggleAnalysisSelection(undefined, encLetter, undefined)}
                                             hurrian={hurrian}
                                             updateMorphology={updateMorphology}/>
          : <MultiMorphAnalysisOptionButtons morphAnalysis={morphologicalAnalysis}
                                             toggleAnalysisSelection={(letter, encLetter) => toggleAnalysisSelection(letter, encLetter, undefined)}
                                             hurrian={hurrian}
                                             updateMorphology={updateMorphology}/>}

      </div>}
    </div>
  );
}
