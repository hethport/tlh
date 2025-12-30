import { JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChangesViewerContainer } from '../changes/ChangesViewerContainer';
import { ChangesListClearer } from '../textEditor/ChangesListClearer';

interface IProps {
  initialChanges: Map<string, string>;
}

export function Macroeditor({ initialChanges }: IProps): JSX.Element {
  const {t} = useTranslation('common');
  const [changes, setChanges] = useState(initialChanges);
  const clearChanges = () => setChanges(new Map<string, string>());
  return (
    <div className="grid grid-cols-2 gap-2 my-2">
      <ChangesViewerContainer changes={changes} />
      <div className="container mx-auto">
        <h2 className="font-bold text-2xl text-center">{t('textEditor')}</h2>
        <br/>
        <ChangesListClearer clearChanges={clearChanges} />
      </div>
    </div>
  );
}
