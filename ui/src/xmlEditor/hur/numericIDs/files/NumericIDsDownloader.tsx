import { useTranslation } from 'react-i18next';
import { downloadNumericIDs } from './numericIDsFileManager';
import { blueButtonClasses } from '../../../../defaultDesign';

export function NumericIDsDownloader() {
  
  const {t} = useTranslation('common');
  
  return (
    <button
      type="button"
      className={blueButtonClasses}
      onClick={downloadNumericIDs}>
      {t('exportStems')}
    </button>
  );
}
