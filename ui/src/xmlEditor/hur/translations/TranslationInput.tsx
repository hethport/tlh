import {JSX} from 'react';
import {getTranslations} from './glossProvider';

interface IProps {
  stem: string;
  pos: string;
  value: string;
  onChange: (newTranslation: string) => void;
}

export function TranslationInput({stem, pos, value, onChange}: IProps): JSX.Element {

  const translations = getTranslations(stem, pos) || [];

  return (
    <div className="flex rounded border border-slate-500">
      <input value={value} className="flex-grow p-2 rounded-r" list="translations"
        onChange={event => onChange(event.target.value)}/>

      <datalist id="translations">
        {translations.map((translation: string) => <option key={translation} value={translation}>
          {translation}
        </option>)}
      </datalist>
    </div>
  );
}
