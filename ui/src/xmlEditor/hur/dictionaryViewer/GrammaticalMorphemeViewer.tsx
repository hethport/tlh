import { JSX, useState } from 'react';
import { GrammaticalMorphemeEditor } from './GrammaticalMorphemeEditor';
import { Entry, WordformElement } from './Wordform';
import { writeMorphAnalysisValue } from '../../../model/morphologicalAnalysis';
import update from 'immutability-helper';
import { Dictionary, SetDictionary } from '../dict/dictionary';
import { areCorrect } from '../dict/morphologicalAnalysisValidator';
import { getMorphTags } from '../morphologicalAnalysis/auxiliary';
import { GrammaticalMorpheme } from './grammaticalMorpheme';
import replaceMorphemeLabel from './replaceMorphemeLabel';
import { errorSymbol, handleSegmentationInput, handleSegmentationBlur,
  handleAnalysisInput, handleAnalysisBlur, modifyLocalEntries, modifyGlobalEntries
} from './StemViewer';
import modifyMorphTag from './modifyMorphTag';

interface IProps {
  index: number;
  grammaticalMorpheme: GrammaticalMorpheme;
  initialEntries: Entry[];
  setDictionary: SetDictionary;
  initialUnfolded: boolean;
  allUnfolded: boolean;
  englishTranslation: string;
  onEnglishTranslationBlur: (eglishTranslation: string) => void;
  updateEnglishTranslationKey: (newEglishTranslationKey: string) => void;
}

type GrammaticalMorphemeViewerState = {
  label: string;
  form: string;
  entries: Entry[];
}

export function GrammaticalMorphemeViewer({index, grammaticalMorpheme, initialEntries, setDictionary, initialUnfolded,
                            allUnfolded, englishTranslation,
                            onEnglishTranslationBlur,
                            updateEnglishTranslationKey }: IProps): JSX.Element {
  
  const [unfolded, setUnfolded] = useState(initialUnfolded);
  const initialState: GrammaticalMorphemeViewerState = {
    label: grammaticalMorpheme.label,
    form: grammaticalMorpheme.form,
    entries: initialEntries
  };
  const [state, setState] = useState(initialState);
  const { label, form, entries } = state;
  const partOfSpeech = '';
  
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
              entries: {
                $set: modifyLocalEntries(
                  entries,
                  modifyMorphTag(replaceMorphemeLabel(label, newLabel, form))
                )
              }
            }));
          }}
          onLabelBlur={(value: string) => {
            if (value !== grammaticalMorpheme.label) {
              setDictionary((dictionary: Dictionary) => {
                return modifyGlobalEntries(dictionary, initialEntries, entries);
              });
            }
          }}
          onFormChange={(value: string) => {
            // do nothing
          }}
          onFormBlur={(value: string) => {
            // do nothing
          }} />
        <br />
        {(unfolded || allUnfolded) && entries.map(
          (entry: Entry, index: number) => {
            const morphAnalysisValue = writeMorphAnalysisValue(
              initialEntries[index].morphologicalAnalysis
            );

            return (
                <WordformElement entry={entry} key={morphAnalysisValue}
                initialShowAttestations={allUnfolded}
                initialMorphologicalAnalysis={initialEntries[index].morphologicalAnalysis}
                handleSegmentationInput={(value: string) =>
                  setState(update(state, { entries:
                    { $set: handleSegmentationInput(entries, index, value) }
                  }))
                }
                handleSegmentationBlur={(value: string) => {
                  setDictionary((dictionary: Dictionary) =>
                    handleSegmentationBlur(dictionary, entries, index, value, morphAnalysisValue)
                  ); 
                }}
                handleAnalysisInput={(value: string, optionIndex: number) =>
                  setState(update(state, { entries:
                    { $set: handleAnalysisInput(entries, index, value, optionIndex) }
                  }))
                }
                handleAnalysisBlur={(value: string, optionIndex: number) => {
                  setDictionary((dictionary: Dictionary) =>
                    handleAnalysisBlur(dictionary, entries, index, value, optionIndex, morphAnalysisValue)
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
