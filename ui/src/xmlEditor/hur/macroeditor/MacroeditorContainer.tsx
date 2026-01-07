import { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Macroeditor } from './Macroeditor';

interface IProps {
  getChanges: () => Map<string, string[]>;
}

export function MacroeditorContainer({ getChanges }: IProps): JSX.Element {

  const {t} = useTranslation('common');
  
  return (
    <div className="container mx-auto">
      <h2 className="font-bold text-2xl text-center">{t('changes')}</h2>
      <Macroeditor initialChanges={getChanges()} />
    </div>
  );
}
