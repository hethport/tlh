import { JSX, useState } from 'react';
import { GrammaticalMorphemeEditor } from './GrammaticalMorphemeEditor';
import { Entry, WordformElement } from './StatefulWordform';
import { writeMorphAnalysisValue } from '../../../model/morphologicalAnalysis';
import update from 'immutability-helper';
import { Dictionary, SetDictionary } from '../dict/dictionary';
import { areCorrect } from '../dict/morphologicalAnalysisValidator';
import { getMorphTags } from '../morphologicalAnalysis/auxiliary';
import { GrammaticalMorpheme } from './grammaticalMorpheme';
import { errorSymbol, handleSegmentationInput, handleSegmentationBlur,
  handleAnalysisInput, handleAnalysisBlur, modifyLocalEntries, modifyGlobalEntries
} from './StemViewer';
import modifyMorphTag from './modifyMorphTag';
import replaceMorphemeLabel from './replaceMorphemeLabel';
import modifySegmentation from './modifySegmentation';
import replaceMorphemeForm from './replaceMorphemeForm';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';

interface IProps {
  index: number;
  grammaticalMorpheme: GrammaticalMorpheme;
  initialEntries: Entry[];
  setDictionary: SetDictionary;
  initialUnfolded: boolean;
}

type GrammaticalMorphemeViewerState = {
  label: string;
  form: string;
}

export function modifyLocalEntriesWithArray(
  entries: Entry[], modification: (ma: MorphologicalAnalysis) => MorphologicalAnalysis[]): Entry[] {
  const newEntries: Entry[] = [];
  for (const {transcriptions, morphologicalAnalysis, initialMorphologicalAnalysis} of entries) {
    const newAnalyses = modification(morphologicalAnalysis);
    for (const newAnalysis of newAnalyses) {
      newEntries.push({transcriptions, morphologicalAnalysis: newAnalysis, initialMorphologicalAnalysis});
    }
  }
  return newEntries;
}

export function GrammaticalMorphemeViewer({index, grammaticalMorpheme, initialEntries, setDictionary, initialUnfolded }: IProps): JSX.Element {
  
  const [unfolded, setUnfolded] = useState(initialUnfolded);

  const initialLabel = grammaticalMorpheme.label;
  const initialForm = grammaticalMorpheme.form;

  const initialState: GrammaticalMorphemeViewerState = {
    label: grammaticalMorpheme.label,
    form: grammaticalMorpheme.form,
  };
  const [state, setState] = useState(initialState);
  const { label, form } = state;
  const entries = initialEntries;
  
  const isCorrect = entries.every(entry => 
    getMorphTags(entry.morphologicalAnalysis).every(morphTag =>
      areCorrect(entry.morphologicalAnalysis.referenceWord, morphTag)
    )
  );
  
  return (
    <div className="flex flex-row">
      <div>
        <GrammaticalMorphemeEditor
          index={index}
          label={label}
          form={form}
          handleClick={() => setUnfolded(!unfolded)}
          onLabelChange={(newLabel: string) => {
            setState(update(state, {
              label: { $set: newLabel },
            }));
          }}
          onLabelBlur={(newLabel: string) => {
            const newEntries = modifyLocalEntries(
              entries,
              modifyMorphTag(replaceMorphemeLabel(initialLabel, newLabel, form))
            );
            if (newLabel !== grammaticalMorpheme.label) {
              setDictionary((dictionary: Dictionary) => {
                return modifyGlobalEntries(dictionary, newEntries);
              });
            }
          }}
          onFormChange={(newForm: string) => {
            setState(update(state, {
              form: { $set: newForm },
            }));
          }}
          onFormBlur={(newForm: string) => {
            const newEntries = modifyLocalEntriesWithArray(
              entries,
              modifySegmentation(replaceMorphemeForm(label, initialForm, newForm))
            );
            if (newForm !== grammaticalMorpheme.form) {
              setDictionary((dictionary: Dictionary) => {
                return modifyGlobalEntries(dictionary, newEntries);
              });
            }
          }} />
        <br />
        {unfolded && entries.map(
          (entry: Entry, index: number) => {
            const initialEntry = initialEntries[index] || entry;
            const morphAnalysisValue = writeMorphAnalysisValue(
              initialEntry.morphologicalAnalysis
            );
            const key = grammaticalMorpheme.toString() + '@' + morphAnalysisValue;

            return (
                <WordformElement entry={entry} key={key}
                initialShowAttestations={false}
                handleSegmentationBlur={(value: string) => {
                  const newEntries = handleSegmentationInput(entries, index, value);
                  setDictionary((dictionary: Dictionary) =>
                    handleSegmentationBlur(dictionary, newEntries, index, value, morphAnalysisValue)
                  ); 
                }}
                handleAnalysisBlur={(value: string, optionIndex: number) => {
                  const newEntries = handleAnalysisInput(entries, index, value, optionIndex);
                  setDictionary((dictionary: Dictionary) =>
                    handleAnalysisBlur(dictionary, newEntries, index, value, optionIndex, morphAnalysisValue)
                  );
                }} />
              );
            }
        )}
      </div>
      {!isCorrect &&
        <div className="p-2 error-mark">{errorSymbol}</div>
      }
    </div>
  );
}
