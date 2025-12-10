import { JSX, useState } from 'react';
import { StemElement } from './Stem';
import { Entry, WordformElement } from './Wordform';
import { MorphologicalAnalysis, writeMorphAnalysisValue }
  from '../../../model/morphologicalAnalysis';
import update, { Spec } from 'immutability-helper';
import { findBoundary, getTranslationAndMorphTag } from '../common/splitter';
import { changeStem, changePos, changeTranslation } from '../translations/modifyTranslations';
import { Dictionary, SetDictionary, containsAnalysis } from '../dict/dictionary';
import { modifyAnalysis } from '../dict/analysisModifier';
import { addChange } from '../changes/changesAccumulator';
import { updateConcordanceKey } from '../concordance/concordance';
import { replaceMorphologicalAnalysis } from '../corpus/corpus';
import { areCorrect } from '../dict/morphologicalAnalysisValidator';
import { getMorphTags } from '../morphologicalAnalysis/auxiliary';
import { getEnglishTranslationKey } from '../translations/englishTranslations';
import { GrammaticalMorpheme } from './grammaticalMorpheme';

const errorSymbol = <>&#9876;</>;

function applySideEffects(origin: string, target: string, targetIsExtant: boolean): void {
  addChange(origin, target, targetIsExtant);
  // The corpus should be updated before the concordance
  // Since the old analysis is used to find the lines to update
  replaceMorphologicalAnalysis(origin, target);
  updateConcordanceKey(origin, target);
}

    
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

function replaceStem(newStem: string, segmentation: string) {
  return newStem + segmentation.substring(findBoundary(segmentation));
}

function modifyStem(newStem: string) {
  const setStem = (morphologicalAnalysis: MorphologicalAnalysis) => {
    const segmentation = morphologicalAnalysis.referenceWord;
    return update(morphologicalAnalysis,
      { referenceWord: { $set: replaceStem(newStem, segmentation)} });
  };
  return setStem;
}

function modifyTranslation(value: string) {
  const setTranslation = (morphologicalAnalysis: MorphologicalAnalysis) => {
    return update(morphologicalAnalysis, { translation: { $set: value } });
  };
  return setTranslation;
}

function handleSegmentationInput(entries: Entry[], index: number, value: string): Entry[] {
  const newEntries = update(entries,
    { [index]: { morphologicalAnalysis: { referenceWord: { $set: value } } } }
  );
  return newEntries;
}

function handleSegmentationBlur(dictionary: Dictionary,
  entries: Entry[], index: number, value: string, 
  initialAnalysis: string): Dictionary {
  const entry = entries[index];
  const { transcriptions, morphologicalAnalysis } = entry;
  const target = writeMorphAnalysisValue(morphologicalAnalysis);
  applySideEffects(initialAnalysis, target, containsAnalysis(dictionary, target));
  return modifyAnalysis(dictionary, transcriptions, initialAnalysis, morphologicalAnalysis);
}

function handleAnalysisInput(entries: Entry[], index: number, value: string,
  optionIndex: number): Entry[] {
  const entry = entries[index];
  const { morphologicalAnalysis } = entry;
  const [translation, morphTag] = getTranslationAndMorphTag(value);
  switch (morphologicalAnalysis._type) {
    case 'SingleMorphAnalysisWithoutEnclitics': {
        const newEntries = update(entries, {
          [index]: { 
            morphologicalAnalysis: {
              translation: { $set: translation },
              analysis: { $set: morphTag } 
            } 
          } 
        });
        return newEntries;
    }
    case 'MultiMorphAnalysisWithoutEnclitics': {
        const newEntries = update(entries, {
          [index]: { 
            morphologicalAnalysis: {
              translation: { $set: translation },
              analysisOptions: { [optionIndex]: { analysis: { $set: morphTag } } }
            } 
          } 
        });
        return newEntries;
    }
    default:
      return entries;
  }
}

function handleAnalysisBlur(dictionary: Dictionary,
  entries: Entry[], index: number, value: string,
  optionIndex: number, initialAnalysis: string): Dictionary {
  const entry = entries[index];
  const { transcriptions, morphologicalAnalysis } = entry;
  const target = writeMorphAnalysisValue(morphologicalAnalysis);
  applySideEffects(initialAnalysis, target, containsAnalysis(dictionary, target));
  return modifyAnalysis(dictionary, transcriptions, initialAnalysis, morphologicalAnalysis);
}

function modifyLocalEntries(entries: Entry[],
  modification: (ma: MorphologicalAnalysis) => MorphologicalAnalysis): Entry[] {
  const newEntries: Entry[] = [];
  for (const {transcriptions, morphologicalAnalysis} of entries) {
    const newAnalysis = modification(morphologicalAnalysis);
    if (newAnalysis !== undefined) {
      newEntries.push({transcriptions, morphologicalAnalysis: newAnalysis});
    }
  }
  return newEntries;
}

function modifyGlobalEntries(dictionary: Dictionary, initialEntries: Entry[],
  currentEntries: Entry[]): Dictionary {
  const specification = new Map<string, [string[], string[]]>();
  for (let i = 0; i < currentEntries.length; i++) {
    const initialEntry = initialEntries[i];
    const currentEntry = currentEntries[i];
    const transcriptions = initialEntry.transcriptions;
    const initialMorphologicalAnalysis = initialEntry.morphologicalAnalysis;
    const currentMorphologicalAnalysis = currentEntry.morphologicalAnalysis;
    const initialAnalysis = writeMorphAnalysisValue(initialMorphologicalAnalysis);
    const currentAnalysis = writeMorphAnalysisValue(currentMorphologicalAnalysis);
    applySideEffects(initialAnalysis, currentAnalysis, containsAnalysis(dictionary, currentAnalysis));
    for (const transcription of transcriptions) {
      const entrySpec = specification.get(transcription);
      if (entrySpec === undefined) {
        specification.set(transcription, [[initialAnalysis], [currentAnalysis]]);
      } else {
        const [toRemove, toAdd] = entrySpec;
        toRemove.push(initialAnalysis);
        toAdd.push(currentAnalysis);
      }
    }
  }
  const spec: Spec<Dictionary> = {};
  for (const [transcription, entrySpec] of specification.entries()) {
    const [toRemove, toAdd] = entrySpec;
    spec[transcription] = {$remove: toRemove, $add: toAdd};
  }
  return update(dictionary, spec);
}

function modifyGlobalPartOfSpeech(dictionary: Dictionary, initialEntries: Entry[],
  value: string): Dictionary {
  const specification = new Map<string, [string[], string[]]>();
  for (let i = 0; i < initialEntries.length; i++) {
    const initialEntry = initialEntries[i];
    const transcriptions = initialEntry.transcriptions;
    const initialMorphologicalAnalysis = initialEntry.morphologicalAnalysis;
    const currentMorphologicalAnalysis = update(initialMorphologicalAnalysis,
      { paradigmClass: { $set: value } }
    );
    const initialAnalysis = writeMorphAnalysisValue(initialMorphologicalAnalysis);
    const currentAnalysis = writeMorphAnalysisValue(currentMorphologicalAnalysis);
    applySideEffects(initialAnalysis, currentAnalysis, containsAnalysis(dictionary, currentAnalysis));
    for (const transcription of transcriptions) {
      const entrySpec = specification.get(transcription);
      if (entrySpec === undefined) {
        specification.set(transcription, [[initialAnalysis], [currentAnalysis]]);
      } else {
        const [toRemove, toAdd] = entrySpec;
        toRemove.push(initialAnalysis);
        toAdd.push(currentAnalysis);
      }
    }
  }
  const spec: Spec<Dictionary> = {};
  for (const [transcription, entrySpec] of specification.entries()) {
    const [toRemove, toAdd] = entrySpec;
    spec[transcription] = {$remove: toRemove, $add: toAdd};
  }
  return update(dictionary, spec);
}

type StemViewerState = {
  stemForm: string;
  translation: string;
  entries: Entry[];
}

export function GrammaticalMorphemeViewer({index, grammaticalMorpheme, initialEntries, setDictionary, initialUnfolded,
                            allUnfolded, englishTranslation,
                            onEnglishTranslationBlur,
                            updateEnglishTranslationKey }: IProps): JSX.Element {
  
  const [unfolded, setUnfolded] = useState(initialUnfolded);
  const initialState: StemViewerState = {
    stemForm: grammaticalMorpheme.label,
    translation: grammaticalMorpheme.form,
    entries: initialEntries
  };
  const [state, setState] = useState(initialState);
  const { stemForm, translation, entries } = state;
  const partOfSpeech = '';
  
  const isCorrect = entries.every(entry => 
    getMorphTags(entry.morphologicalAnalysis).every(morphTag =>
      areCorrect(entry.morphologicalAnalysis.referenceWord, morphTag)
    )
  );
  
  return (
    <div className="flex flex-row">
      <div>
        <StemElement
          index={index.toString()}
          form={stemForm} 
          translation={translation}
          pos={partOfSpeech}
          handleClick={() => setUnfolded(!unfolded)}
          onFormChange={(value: string) => {
            setState(update(state,
              { stemForm: { $set: value },
                entries: { $set: modifyLocalEntries(entries, modifyStem(value)) } }
            ));
          }}
          onFormBlur={(value: string) => {
            if (value !== grammaticalMorpheme.label) {
              changeStem(grammaticalMorpheme.label, value, partOfSpeech, translation);
              setDictionary((dictionary: Dictionary) => {
                return modifyGlobalEntries(dictionary, initialEntries, entries);
              });
              updateEnglishTranslationKey(getEnglishTranslationKey(value, partOfSpeech, translation));
            }
          }}        
          onTranslationChange={(value: string) => {
            setState(update(state,
              { translation: { $set: value },
                entries: { $set: modifyLocalEntries(entries, modifyTranslation(value)) } }
            ));
          }}
          onTranslationBlur={(value: string) => {
            if (value !== grammaticalMorpheme.form) {
              changeTranslation(stemForm, partOfSpeech, grammaticalMorpheme.form, value);
              setDictionary((dictionary: Dictionary) => {
                return modifyGlobalEntries(dictionary, initialEntries, entries);
              });
              updateEnglishTranslationKey(getEnglishTranslationKey(stemForm, partOfSpeech, value));
            }
          }}
          onPartOfSpeechChange={(value: string) => {
            // do nothing
          }}
          englishTranslation={englishTranslation}
          onEnglishTranslationBlur={onEnglishTranslationBlur} />
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
