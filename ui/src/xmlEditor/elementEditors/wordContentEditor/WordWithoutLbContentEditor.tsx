import {ChangeEvent, ReactElement} from 'react';
import {XmlNode} from 'simple_xml';
import {reconstructTransliterationForNodes} from '../../transliterationReconstruction';
import {readTransliteration, WordContentEditState} from './WordContentEditor';
import {useTranslation} from 'react-i18next';
import {redMessageClasses} from '../../../defaultDesign';

interface IProps {
  childNodes: XmlNode[];
  language: string;
  onNewParseResult: (content: WordContentEditState) => void;
}

export function WordWithoutLbContentEditor({childNodes, language, onNewParseResult}: IProps): ReactElement {

  const {t} = useTranslation('common');

  const {reconstruction, warnings} = reconstructTransliterationForNodes(childNodes);

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>): void => onNewParseResult(readTransliteration(event.target.value, language));

  return (
    <div>
      {warnings.length > 0 && <div className={redMessageClasses}>
        <p className="font-bold">{t('errorWhileTransliterationReconstruction')}:</p>
        <pre>{warnings}</pre>
      </div>}

      <div className="flex">
        <label htmlFor="newTransliteration" className="p-2 rounded-l border-l border-y border-slate-500 font-bold">
          {t('newTransliteration')} ({t('language')}: {language}):
        </label>

        <textarea defaultValue={reconstruction} id="newTransliteration"
                  className="flex-grow p-2 rounded-r border border-slate-500 resize-none overflow-hidden min-h-[2.5rem]"
                  placeholder={t('newTransliteration')} onChange={onChange}
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}/>
      </div>
    </div>
  );
}