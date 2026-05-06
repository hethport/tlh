import { useTranslation } from 'react-i18next';
import { FileLoader } from '../../../../forms/FileLoader';
import { readNumericIDs } from './numericIDsFileManager';

interface IProps {
  onUpload: () => void;
}

export function NumericIDsUploader({onUpload}: IProps) {
  
  const {t} = useTranslation('common');
  
  const onLoad = async (f: File) => {
      return readNumericIDs(f).then(onUpload);
  };
  
  return (
    <FileLoader accept="application/JSON" onLoad={onLoad}
    text={t('uploadStems')}/>
  );
}
