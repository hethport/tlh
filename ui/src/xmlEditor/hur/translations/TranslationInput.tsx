import {JSX} from 'react';
import {getTranslations} from './glossProvider';

const defaultInputSize = 20;

interface IProps {
  stem: string;
  pos: string;
  value: string;
  onChange: (newTranslation: string) => void;
  inputElementSize?: number;
}

export function TranslationInput({stem, pos, value, onChange, inputElementSize}: IProps): JSX.Element {

  const translations = getTranslations(stem, pos) || [];

  return (
    <div>
      <input value={value} list="translations"
        onChange={event => onChange(event.target.value)}
        size={inputElementSize || defaultInputSize}/>

      <datalist id="translations">
        {translations.map((translation: string) => <option key={translation} value={translation}>
          {translation}
        </option>)}
      </datalist>
    </div>
  );
}
