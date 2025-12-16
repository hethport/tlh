import { JSX, useState } from 'react';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { getMorphTags } from '../common/utils';
import { getAttestations } from '../concordance/concordance';
import { getLine } from '../corpus/corpus';
import { ConcordanceEntryViewer } from '../concordanceEntryViewer/ConcordanceEntryViewer';
import { areCorrect } from '../dict/morphologicalAnalysisValidator';

const errorSymbol = <>&#9876;</>;

export interface Entry {
  transcriptions: string[];
  morphologicalAnalysis: MorphologicalAnalysis;
  initialMorphologicalAnalysis: MorphologicalAnalysis;
}

interface IProps {
  entry: Entry;
  handleSegmentationInput: (value: string) => void;
  handleSegmentationBlur: (value: string) => void;
  handleAnalysisInput: (value: string, optionIndex: number) => void;
  handleAnalysisBlur: (value: string, optionIndex: number) => void;
  initialShowAttestations: boolean;
}

export function WordformElement({ entry, handleSegmentationInput,
  handleSegmentationBlur, handleAnalysisInput, handleAnalysisBlur,
  initialShowAttestations }: IProps): JSX.Element {
  
  const [showAttestations, setShowAttestations] = useState(initialShowAttestations);
  
  const { transcriptions, morphologicalAnalysis, initialMorphologicalAnalysis } = entry;
  const segmentation = morphologicalAnalysis.referenceWord;
  const { translation } = morphologicalAnalysis;
  const morphTags = getMorphTags(morphologicalAnalysis) || [];
  
  const attestations = getAttestations(initialMorphologicalAnalysis);
  
  const isCorrect = morphTags.every(morphTag => {
    return areCorrect(segmentation, morphTag);
  });
  
  return (
    <div>
      <div className="flex flex-row">
        <pre className="dict-entry">
          <input value={segmentation}
                 onInput={event => handleSegmentationInput(event.currentTarget.value)}
                 onBlur={event => handleSegmentationBlur(event.target.value)} />
          {(morphTags).map((tag: string, index: number) => {
              const gloss = translation + 
                ((tag.startsWith('=') || tag.startsWith('.') || tag === '') ? '' : '-') +
                tag;
              return (
                <input value={gloss}
                       onInput={event => handleAnalysisInput(event.currentTarget.value, index)}
                       onBlur={event => handleAnalysisBlur(event.target.value, index)}
                       key={index} />
              );
            })
          }
          <label>({transcriptions.join(', ')})</label>
          <br />
        </pre>
        <div className="p-2 vertical-align: top">
          <button onClick={() => setShowAttestations(!showAttestations)}>&#8744;</button>
        </div>
        {!isCorrect &&
          <div className="p-2 error-mark">{errorSymbol}</div>
        }
      </div>
      {showAttestations &&
        <ConcordanceEntryViewer attestations={attestations} getLine={getLine} />}
    </div>
  );
}
