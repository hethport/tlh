import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { hurrianDictionaryDownloadUrl } from '../../../../urls';

export function HurrianDictionaryDownloadLink() {
  
  const {t} = useTranslation('common');
  
  return (
    <div className="p-2 rounded border border-slate-500 w-full hurrian-dictionary-download-link">
      <Link
        to={hurrianDictionaryDownloadUrl}>
        {t('downloadHurrianDictionary')}
      </Link>
    </div>
  );
}
