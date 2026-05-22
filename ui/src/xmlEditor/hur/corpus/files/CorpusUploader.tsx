import { useTranslation } from 'react-i18next';
import { FileLoader } from '../../../../forms/FileLoader';
import { readCorpus } from './corpusFileManager';

interface IProps {
  onUpload: () => void;
}

export function CorpusUploader({onUpload}: IProps) {
  
  const {t} = useTranslation('common');
  
  const onLoad = async (f: File) => {
      return readCorpus(f).then(onUpload);
  };
  
  return (
    <FileLoader accept="application/JSON" onLoad={onLoad} text={t('uploadCorpus')}/>
  );
}
