import {JSX} from 'react';
import {getTranslations} from './glossProvider';

const defaultInputSize = 20;

interface IProps {
  stem: string;
  pos: string;
  value: string;
  onChange: (newTranslation: string) => void;
  inputElementSize?: number;
  divClassName?: string;
  inputClassName?: string;
}

export function TranslationInput({stem, pos, value, onChange, inputElementSize,
                                  divClassName, inputClassName}: IProps): JSX.Element {

  const translations = getTranslations(stem, pos) || [];

  return (
    <div className={divClassName || ''}>
      <input value={value} list="translations"
        onChange={event => onChange(event.target.value)}
        size={inputElementSize || defaultInputSize}
        className={inputClassName || ''}/>

      <datalist id="translations">
        {translations.map((translation: string) => <option key={translation} value={translation}>
          {translation}
        </option>)}
      </datalist>
    </div>
  );
}
