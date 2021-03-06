import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {allManuscriptLanguagesSelector} from '../store/store';

interface IProps {
  initialValue: string | undefined;
  onChange: (value: string) => void;
}

export function LanguageInput({initialValue, onChange}: IProps): JSX.Element {

  const {t} = useTranslation('common');
  const allManuscriptLanguages = useSelector(allManuscriptLanguagesSelector);

  return (
    <div className="flex">
      <label htmlFor="language" className="p-2 rounded-l border-l border-y border-slate-500 bg-slate-100 font-bold">{t('language')}:</label>

      <input defaultValue={initialValue} id="language" className="flex-grow p-2 rounded-r border border-slate-500" placeholder={t('language')}
             list="languages" onChange={(event) => onChange(event.target.value)}/>

      <datalist id="languages">
        {allManuscriptLanguages.map(({abbreviation}) => <option key={abbreviation}>{abbreviation}</option>)}
      </datalist>
    </div>

  );
}