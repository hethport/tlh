import { useTranslation } from 'react-i18next';
import { FileLoader } from '../../../../forms/FileLoader';
import { readEnglishTranslations } from './englishTranslationsFileManager';

interface IProps {
  onUpload: () => void;
}

export function EnglishTranslationsUploader({onUpload}: IProps) {
  
  const {t} = useTranslation('common');
  
  const onLoad = async (f: File) => {
      return readEnglishTranslations(f).then(onUpload);
  };
  
  return (
    <FileLoader accept="application/JSON" onLoad={onLoad}
    text={t('uploadEnglishTranslations')}/>
  );
}
