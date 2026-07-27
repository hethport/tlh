import { JSX, useState } from 'react';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { getMorphTags } from '../common/utils';
import { getAttestations } from '../concordance/concordance';
import { getLine } from '../corpus/corpus';
import { ConcordanceEntryViewer } from '../concordanceEntryViewer/ConcordanceEntryViewer';
import { areCorrect } from '../dict/morphologicalAnalysisValidator';
import update from 'immutability-helper';
import { getMorphTag } from '../common/splitter';

const errorSymbol = <>&#9876;</>;

export interface Entry {
  transcriptions: string[];
  morphologicalAnalysis: MorphologicalAnalysis;
  initialMorphologicalAnalysis: MorphologicalAnalysis;
}

interface IProps {
  entry: Entry;
  handleSegmentationBlur: (value: string) => void;
  handleAnalysisBlur: (value: string, optionIndex: number) => void;
  initialShowAttestations: boolean;
}

type WordformState = {
  showAttestations: boolean;
  segmentation: string;
  glosses: string[];
}

export function WordformElement({ entry,
  handleSegmentationBlur, handleAnalysisBlur,
  initialShowAttestations }: IProps): JSX.Element {

  const { transcriptions, morphologicalAnalysis, initialMorphologicalAnalysis } = entry;
  const { translation } = morphologicalAnalysis;
  const initialMorphTags = getMorphTags(morphologicalAnalysis) || [];

  const initialState: WordformState = {
    showAttestations: initialShowAttestations,
    segmentation: morphologicalAnalysis.referenceWord,
    glosses: initialMorphTags.map((tag: string) => {
      const gloss = translation +
        ((tag.startsWith('=') || tag.startsWith('.') || tag === '') ? '' : '-') +
        tag;
      return gloss;
    }),
  };
  const [state, setState] = useState(initialState);
  const {showAttestations, segmentation, glosses} = state;
  
  const attestations = getAttestations(initialMorphologicalAnalysis);
  
  const actualMorphTags = glosses.map((gloss: string) => getMorphTag(gloss));
  const isCorrect = actualMorphTags.every(morphTag => {
    return areCorrect(segmentation, morphTag);
  });
  
  return (
    <div className="wordform-element">
      <div className="flex flex-row">
        <pre className="dict-entry">
          <input value={segmentation}
                 onChange={event => setState(state => update(state, {
                   segmentation: {$set: event.target.value}
                }))}
                 onBlur={event => handleSegmentationBlur(event.target.value)} />
          {(glosses).map((gloss: string, index: number) => {
              return (
                <input value={gloss}
                       onChange={event => setState(state => update(state, {
                         glosses: {[index]: {$set: event.target.value}}
                      }))}
                       onBlur={event => handleAnalysisBlur(event.target.value, index)}
                       key={index} />
              );
            })
          }
          <label>({transcriptions.join(', ')})</label>
          <br />
        </pre>
        <div className="p-2 vertical-align: top">
          <button onClick={() => setState(state => update(state, {
            showAttestations: {$set: !state.showAttestations}
          }))}>&#8744;</button>
        </div>
        {!isCorrect &&
          <div className="p-2 error-mark">{errorSymbol}</div>
        }
      </div>
      {showAttestations &&
        <ConcordanceEntryViewer attestations={attestations} getLine={getLine}
                                highlightedMa={morphologicalAnalysis} />}
    </div>
  );
}
