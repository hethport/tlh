import { JSX } from 'react';
import { PartOfSpeechSelector } from '../partsOfSpeech/PartOfSpeechSelector';

interface IProps {
  index: number;
  form: string;
  translation: string;
  englishTranslation: string;
  reference: string;
  pos: string;
  numericIDs: number[];
  handleClick: () => void;
  onFormChange: (newStem: string) => void;
  onFormBlur: (newStem: string) => void;
  onTranslationChange: (translation: string) => void;
  onTranslationBlur: (translation: string) => void;
  onEnglishTranslationBlur: (translation: string) => void;
  onReferenceBlur: (reference: string) => void;
  onPartOfSpeechChange: (value: string) => void;
}

export function StemElement({index, form, translation, englishTranslation, pos,
                             reference,
                             numericIDs,
                             handleClick,
                             onFormChange, onFormBlur,
                             onTranslationChange, onTranslationBlur,
                             onEnglishTranslationBlur,
                             onReferenceBlur,
                             onPartOfSpeechChange}: IProps): JSX.Element {
  
  return (
    <div className="flex flex-row">
      <button onClick={handleClick}
              className="p-2 border-y border-l border-r border-slate-500">
        {index.toString() + '.'}
      </button>
      <input type="text" value={form}
             className="p-2 border-y border-r border-slate-500"
             onChange={event => onFormChange(event.target.value)}
             onBlur={event => onFormBlur(event.target.value)} />
      <input type="text" value={translation}
             className="p-2 border-y border-r border-slate-500"
             onChange={event => onTranslationChange(event.target.value)}
             onBlur={event => onTranslationBlur(event.target.value)} />
      <input type="text" defaultValue={englishTranslation}
             className="p-2 border-y border-r border-slate-500"
             onBlur={event => onEnglishTranslationBlur(event.target.value)} />
      <input type="text" defaultValue={reference}
             className="p-2 border-y border-r border-slate-500"
             onBlur={event => onReferenceBlur(event.target.value)} />
      <div className="p-2 border-y border-r border-slate-500">
        <PartOfSpeechSelector partOfSpeech={pos}
                              onChange={onPartOfSpeechChange} />
      </div>
      <div className="p-2 border-y border-r border-slate-500">
        {numericIDs.join(', ')}
      </div>
      <button onClick={handleClick}
              className="p-2 border-y border-r border-slate-500 unfold-button">&#8744;</button>
    </div>
  );
}
