import {useTranslation} from 'react-i18next';
import {JSX} from 'react';

const FONT_STEP = 10;

export interface FontSizeSelectorProps {
  currentFontSize: number;
  updateFontSize: (delta: number) => void;
}

export function FontSizeSelector({updateFontSize}: FontSizeSelectorProps): JSX.Element {

  const {t} = useTranslation('common');

  return (
    <>
      <button type="button" className="px-2 border border-slate-500 rounded-l" onClick={() => updateFontSize(-FONT_STEP)}
              title={t('decreaseFontSize') || 'decreaseFontSize'}>
        -
      </button>
      <button className="px-2 border border-slate-500" disabled>{t('fontSize')}</button>
      <button type="button" className="mr-2 px-2 border border-slate-500 rounded-r" onClick={() => updateFontSize(FONT_STEP)}
              title={t('increaseFontSize') || 'increaseFontSize'}>
        +
      </button>
    </>
  );
}