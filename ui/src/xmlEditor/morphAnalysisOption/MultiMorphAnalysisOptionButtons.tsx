import {MorphologicalAnalysis, MultiMorphologicalAnalysis, MultiMorphologicalAnalysisWithoutEnclitics,
  MultiMorphologicalAnalysisWithSingleEnclitics, MultiMorphologicalAnalysisWithMultiEnclitics
} from '../../model/morphologicalAnalysis';
import {JSX} from 'react';
import {EncliticsAnalysisDisplay} from './SingleMorphAnalysisOptionButton';
import {MultiMorphAnalysisSelection} from './MultiMorphAnalysisSelection';
import {MultiMorphMultiEncAnalysisSelection} from './MultiMorphMultiEncAnalysisSelection';
import {SelectableButton} from '../../genericElements/Buttons';
import {MultiMorphMultiSelectionButton} from './MultiMorphMultiSelectionButton';
import {MorphemesEditor} from './MorphemesEditor';
import update, { Spec } from 'immutability-helper';


const otherClasses = ['p-2', 'rounded', 'w-full'];

interface IProps {
  morphAnalysis: MultiMorphologicalAnalysis;
  toggleAnalysisSelection: (letter: string, encLetter: string | undefined) => void;
  hurrian: boolean;
  updateMorphology: (ma: MorphologicalAnalysis) => void;
}

export function MultiMorphAnalysisOptionButtons({morphAnalysis, toggleAnalysisSelection, hurrian, updateMorphology}: IProps): JSX.Element {

  const partialUpdateMorphology = (spec: Spec<MorphologicalAnalysis>, analysis: string | null, index: number): void => {
    if (analysis === null) {
      updateMorphology(update(morphAnalysis, spec));
    } else {
      updateMorphology(update(morphAnalysis, {
        ...spec,
        analysisOptions: { [index]: { analysis: { $set: analysis } } }
      }));
    }
  };

  switch (morphAnalysis._type) {
    case 'MultiMorphAnalysisWithoutEnclitics':
      return (
        <div>
          <MultiMorphAnalysisSelection ma={morphAnalysis}/>

          {morphAnalysis.analysisOptions.map(({letter, analysis}, index) => {
            const options = (morphAnalysis as MultiMorphologicalAnalysisWithoutEnclitics).analysisOptions;
            const selected = options && index < options.length ? options[index].selected : false;
            return (
              <div key={index} className="mb-1">
                <SelectableButton selected={selected} otherClasses={otherClasses} onClick={() => toggleAnalysisSelection(letter, undefined)}>
                  <>{letter} - {analysis}</>
                </SelectableButton>
                {hurrian && <MorphemesEditor
                  analysisOptionID={morphAnalysis.number.toString() + letter}
                  segmentation={morphAnalysis.referenceWord}
                  translation={morphAnalysis.translation}
                  analysis={analysis}
                  updateMorphology={(spec: Spec<MorphologicalAnalysis>, analysis: string | null) => {
                    partialUpdateMorphology(spec, analysis, index);
                  }
                  }
                  paradigmClass={morphAnalysis.paradigmClass}
                  />
                }
              </div>
            );
          })
          }
        </div>
      );

    case 'MultiMorphAnalysisWithSingleEnclitics':
      {
        const ma = morphAnalysis as MultiMorphologicalAnalysisWithSingleEnclitics;
        return (
          <div>
            <MultiMorphAnalysisSelection ma={ma}/>

            {ma.analysisOptions.map(({letter, analysis, selected}, index) => <div key={index} className="mb-1">
              <SelectableButton selected={selected} otherClasses={otherClasses} onClick={() => toggleAnalysisSelection(letter, undefined)}>
                <>{letter} - {analysis} <EncliticsAnalysisDisplay enclitics={ma.encliticsAnalysis.enclitics}
                                                                  analysis={ma.encliticsAnalysis.analysis}/></>
              </SelectableButton>
            </div>)}
          </div>
        );
      }

    case 'MultiMorphAnalysisWithMultiEnclitics':
      {
        const ma = morphAnalysis as MultiMorphologicalAnalysisWithMultiEnclitics;
        return (
          <div>
            <MultiMorphMultiEncAnalysisSelection ma={ma}/>

            {ma.analysisOptions.map((morphAnalysisOption, index) =>
              <MultiMorphMultiSelectionButton key={index} ma={ma} morphAnalysisOption={morphAnalysisOption}
                                              enclitics={ma.encliticsAnalysis.enclitics}
                                              encliticsAnalysisOptions={ma.encliticsAnalysis.analysisOptions}
                                              toggleAnalysisSelection={(letterIndex) => toggleAnalysisSelection(morphAnalysisOption.letter, letterIndex)}/>
            )}
          </div>
        );
      }
  }
}
