import {LetteredAnalysisOption, SelectableLetteredAnalysisOption} from '../../model/analysisOptions';
import {SelectableButton} from '../../genericElements/Buttons';
import {selectedMultiMorphAnalysisWithEnclitics, stringifyMultiMorphAnalysisWithEnclitics} from '../../model/selectedMorphologicalAnalysis';
import {EncliticsAnalysisDisplay} from './SingleMorphAnalysisOptionButton';
import {MultiMorphologicalAnalysisWithMultiEnclitics} from '../../model/morphologicalAnalysis';
import {JSX} from 'react';

interface IProps {
  ma: MultiMorphologicalAnalysisWithMultiEnclitics;
  morphAnalysisOption: LetteredAnalysisOption;
  enclitics: string;
  encliticsAnalysisOptions: SelectableLetteredAnalysisOption[];
  toggleAnalysisSelection: (letter: string) => void;
}

const otherClasses = ['p-2', 'rounded', 'w-full'];

export function MultiMorphMultiSelectionButton({ma, morphAnalysisOption, enclitics, encliticsAnalysisOptions, toggleAnalysisSelection}: IProps): JSX.Element {

  const {letter, analysis} = morphAnalysisOption;

  function encLetterIsSelected(encLetter: string): boolean {

    const str = stringifyMultiMorphAnalysisWithEnclitics(selectedMultiMorphAnalysisWithEnclitics(ma.number, letter, encLetter));

    return ma.selectedAnalysisCombinations.map(stringifyMultiMorphAnalysisWithEnclitics).includes(str);
  }

  function selectAllEncLetters(): void {
    encliticsAnalysisOptions.forEach((ea) => toggleAnalysisSelection(ea.letter));
  }

  const morphLetterIsSelected = encliticsAnalysisOptions.some(({letter}) => encLetterIsSelected(letter));

  return (
    <div className="my-1 flex">
      <SelectableButton selected={morphLetterIsSelected} otherClasses={otherClasses} onClick={selectAllEncLetters}>
        <>{letter} - {analysis}</>
      </SelectableButton>

      {encliticsAnalysisOptions.map(({analysis: encAnalysis, letter: encLetter}) =>
        <SelectableButton key={encLetter} selected={encLetterIsSelected(encLetter)} otherClasses={['ml-1', ...otherClasses]}
                          onClick={() => toggleAnalysisSelection(encLetter)}>
          <>{encLetter} <EncliticsAnalysisDisplay enclitics={enclitics} analysis={encAnalysis}/></>
        </SelectableButton>
      )}
    </div>
  );
}
