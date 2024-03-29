import {JSX, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {blueButtonClasses} from '../../defaultDesign';
import {XmlSourceEditor} from '../../xmlEditor/XmlSourceEditor';

interface IProps {
  initialXml: string;
  loading: boolean;
  annotated: boolean;
  onSubmit: (value: string) => void;
}

export function XmlCheck({initialXml, loading, annotated, onSubmit}: IProps): JSX.Element {

  const {t} = useTranslation('common');
  const [xmlContent, setXmlContent] = useState(initialXml);

  return (
    <>
      <div className="p-2 rounded border border-slate-500">
        <XmlSourceEditor source={xmlContent} onChange={setXmlContent}/>
      </div>

      <div className="text-center">
        <button type="button" className={blueButtonClasses} onClick={() => onSubmit(xmlContent)} disabled={loading}>
          {annotated ? t('submit') : t('annotate')}
        </button>
      </div>
    </>
  );
}