import { useTranslation } from 'react-i18next';
import { downloadReferences } from './referencesFileManager';
import { blueButtonClasses } from '../../../../defaultDesign';

export function ReferencesDownloader() {
  
  const {t} = useTranslation('common');
  
  return (
    <button
      type="button"
      className={blueButtonClasses}
      onClick={downloadReferences}>
      {t('exportReferences')}
    </button>
  );
}
