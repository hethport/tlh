import { useTranslation } from 'react-i18next';
import { downloadStopList } from './stopListFileManager';
import { blueButtonClasses } from '../../../../defaultDesign';

export function StopListDownloader() {

  const {t} = useTranslation('common');

  return (
    <button
      type="button"
      className={blueButtonClasses}
      onClick={downloadStopList}>
      {t('exportStopList')}
    </button>
  );
}
