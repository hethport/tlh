import { JSX } from 'react';
import { GrammaticalMorpheme } from './grammaticalMorpheme';

interface IProps {
  index: number;
  label: string;
  form: string;
  handleClick: () => void;
  onLabelChange: (newLabel: string) => void;
  onLabelBlur: (newLabel: string) => void;
  onFormChange: (newForm: string) => void;
  onFormBlur: (newForm: string) => void;
}

export function GrammaticalMorphemeEditor({index, label, form, handleClick,
                                           onLabelChange, onLabelBlur,
                                           onFormChange, onFormBlur}: IProps): JSX.Element {

  return (
    <div className="flex flex-row">
      <button onClick={handleClick}
              className="p-2 border-y border-l border-r border-slate-500">
        {index.toString()}
      </button>
      <input type="text" value={form}
             className="p-2 border-y border-r border-slate-500"
             onChange={event => onFormChange(event.target.value)}
             onBlur={event => onFormBlur(event.target.value)} />
      <input type="text" value={label}
             className="p-2 border-y border-r border-slate-500"
             onChange={event => onLabelChange(event.target.value)}
             onBlur={event => onLabelBlur(event.target.value)} />
      <button onClick={handleClick}
              className="p-2 border-y border-r border-slate-500 unfold-button">&#8744;</button>
    </div>
  );
}
