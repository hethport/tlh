import { useTranslation } from 'react-i18next';
import { FileLoader } from '../../../../forms/FileLoader';
import { readStopList } from './stopListFileManager';

interface IProps {
  onUpload: () => void;
}

export function StopListUploader({onUpload}: IProps) {

  const {t} = useTranslation('common');

  const onLoad = async (f: File) => {
    return readStopList(f).then(onUpload);
  };

  return (
    <FileLoader accept="application/JSON" onLoad={onLoad} text={t('uploadStopList')}/>
  );
}
