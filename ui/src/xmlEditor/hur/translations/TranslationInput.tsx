import {JSX} from 'react';
import {getTranslations} from './translationProvider';

const defaultInputSize = 20;

interface IProps {
  datalistID: string;
  stem: string;
  pos: string;
  value: string;
  onChange: (newTranslation: string) => void;
  inputElementSize?: number;
  divClassName?: string;
  inputClassName?: string;
}

export function TranslationInput({datalistID, stem, pos, value, onChange, inputElementSize,
                                  divClassName, inputClassName}: IProps): JSX.Element {

  const translations = getTranslations(stem, pos) || [];

  return (
    <div className={divClassName || ''}>
      <input value={value} list={datalistID}
        onChange={event => onChange(event.target.value)}
        size={inputElementSize || defaultInputSize}
        className={inputClassName || ''}/>

      <datalist id={datalistID}>
        {translations.map((translation: string) => <option key={translation} value={translation}>
          {translation}
        </option>)}
      </datalist>
    </div>
  );
}
