import { JSX } from 'react';
import { PartOfSpeechSelector } from '../partsOfSpeech/PartOfSpeechSelector';

interface IProps {
  index: string;
  form: string;
  translation: string;
  englishTranslation: string;
  pos: string;
  handleClick: () => void;
  onFormChange: (newStem: string) => void;
  onFormBlur: (newStem: string) => void;
  onTranslationChange: (translation: string) => void;
  onTranslationBlur: (translation: string) => void;
  onEnglishTranslationBlur: (translation: string) => void;
  onPartOfSpeechChange: (value: string) => void;
}

export function StemElement({index, form, translation, englishTranslation, pos,
                             handleClick,
                             onFormChange, onFormBlur,
                             onTranslationChange, onTranslationBlur,
                             onEnglishTranslationBlur,
                             onPartOfSpeechChange}: IProps): JSX.Element {
  
  return (
    <div className="flex flex-row">
      <button onClick={handleClick}
              className="p-2 border-y border-l border-r border-slate-500">
        {index}
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
      <div className="p-2 border-y border-r border-slate-500">
        <PartOfSpeechSelector partOfSpeech={pos}
                              onChange={onPartOfSpeechChange} />
      </div>
      <button onClick={handleClick}
              className="p-2 border-y border-r border-slate-500 unfold-button">&#8744;</button>
    </div>
  );
}
