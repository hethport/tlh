import {MorphologicalAnalysis, SingleMorphologicalAnalysis, SingleMorphologicalAnalysisWithoutEnclitics,
  SingleMorphologicalAnalysisWithSingleEnclitics, SingleMorphologicalAnalysisWithMultiEnclitics
} from '../../model/morphologicalAnalysis';
import {SelectableButton} from '../../genericElements/Buttons';
import {JSX} from 'react';
import {MorphemesEditor} from './MorphemesEditor';
import update, { Spec } from 'immutability-helper';

interface IProps {
  morphAnalysis: SingleMorphologicalAnalysis;
  toggleAnalysisSelection: (encLetter: string | undefined) => void;
  hurrian: boolean;
  updateMorphology: (ma: MorphologicalAnalysis) => void;
}

export function EncliticsAnalysisDisplay({enclitics, analysis}: { enclitics: string, analysis: string }): JSX.Element {
  return (
    <>&nbsp;+=&nbsp; {enclitics} @ {analysis}</>
  );
}

const otherClasses = ['p-2', 'rounded', 'w-full'];

export function SingleMorphAnalysisOptionButton({
  morphAnalysis,
  toggleAnalysisSelection,
  hurrian,
  updateMorphology
}: IProps
): JSX.Element {

  const partialUpdateMorphology = (spec: Spec<MorphologicalAnalysis>,
                                   analysis: string | null): void => {
    if (analysis === null) {
      updateMorphology(update(morphAnalysis, spec));
    } else {
      updateMorphology(update(morphAnalysis, {...spec, analysis: { $set: analysis }}));
    }
  };

  switch (morphAnalysis._type) {
    case 'SingleMorphAnalysisWithoutEnclitics':
      return (
        <div>
          <SelectableButton
            selected={(morphAnalysis as SingleMorphologicalAnalysisWithoutEnclitics).selected}
            otherClasses={otherClasses}
            onClick={() => toggleAnalysisSelection(undefined)}>
            <>{morphAnalysis.analysis || morphAnalysis.paradigmClass}</>
          </SelectableButton>
          {hurrian && <MorphemesEditor
            analysisOptionID={morphAnalysis.number.toString()}
            segmentation={morphAnalysis.referenceWord}
            translation={morphAnalysis.translation}
            analysis={morphAnalysis.analysis}
            updateMorphology={partialUpdateMorphology}
            paradigmClass={morphAnalysis.paradigmClass}
          />}
        </div>
      );

    case 'SingleMorphAnalysisWithSingleEnclitics':
      {
        const ma = morphAnalysis as SingleMorphologicalAnalysisWithSingleEnclitics;
        return (
          <SelectableButton selected={ma.selected} otherClasses={otherClasses} onClick={() => toggleAnalysisSelection(undefined)}>
            <>{ma.analysis} <EncliticsAnalysisDisplay enclitics={ma.encliticsAnalysis.enclitics}
                                                                analysis={ma.encliticsAnalysis.analysis}/></>
          </SelectableButton>
        );
      }

    case 'SingleMorphAnalysisWithMultiEnclitics':
      {
        const ma = morphAnalysis as SingleMorphologicalAnalysisWithMultiEnclitics;
        return (
          <>
            {ma.encliticsAnalysis.analysisOptions.map(({letter, analysis, selected}) =>
              <SelectableButton key={letter} selected={selected} otherClasses={['mb-1', ...otherClasses]} onClick={() => toggleAnalysisSelection(letter)}>
                <>{letter} - {ma.analysis} <EncliticsAnalysisDisplay enclitics={ma.encliticsAnalysis.enclitics} analysis={analysis}/></>
              </SelectableButton>
            )}
          </>
        );
      }
  }
}