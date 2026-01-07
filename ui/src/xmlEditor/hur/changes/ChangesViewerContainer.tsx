import { JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChangesUploader } from '../changes/ChangesUploader';
import { ChangesViewer } from './ChangesViewer';

interface IProps {
  changes: Map<string, string[]>;
}

export function ChangesViewerContainer({ changes }: IProps): JSX.Element {
  
  const [loaded, setLoaded] = useState(changes.size > 0);
  const {t} = useTranslation('common');
  
  return (
    <div className="container mx-auto">
      <br/>
      {!loaded ? <ChangesUploader onUpload={() => setLoaded(true)} /> :
      <ChangesViewer changes={changes} />}
    </div>
  );
}
