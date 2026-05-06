import { useTranslation } from 'react-i18next';
import { FileLoader } from '../../../../forms/FileLoader';
import { readReferences } from './referencesFileManager';

interface IProps {
  onUpload: () => void;
}

export function ReferencesUploader({onUpload}: IProps) {
  
  const {t} = useTranslation('common');
  
  const onLoad = async (f: File) => {
      return readReferences(f).then(onUpload);
  };
  
  return (
    <FileLoader accept="application/JSON" onLoad={onLoad}
    text={t('uploadReferences')}/>
  );
}
