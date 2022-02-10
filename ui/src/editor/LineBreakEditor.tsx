import {XmlEditableNodeIProps} from './editorConfig/editorConfig';
import {useTranslation} from 'react-i18next';
import {LineBreakData} from './editorConfig/lineBreakData';
import {UpdatePrevNextButtons} from './morphAnalysisOption/UpdatePrevNextButtons';
import {LanguageInput} from './LanguageInput';

export function LineBreakEditor({
  data,
  changed,
  updateNode,
  deleteNode,
  jumpEditableNodes,
  setKeyHandlingEnabled,
  initiateSubmit
}: XmlEditableNodeIProps<LineBreakData>): JSX.Element {

  const {t} = useTranslation('common');

  return (
    <>
      <div className="field">
        <label htmlFor="textId" className="label">{t('textId')}:</label>
        <div className="control">
          <input type="text" id="textId" className="input is-static" defaultValue={data.textId} readOnly/>
        </div>
      </div>

      <div className="field">
        <label htmlFor="lineNumber" className="label">{t('lineNumber')}:</label>
        <div className="control">
          <input type="text" id="lineNumber" className="input" defaultValue={data.lineNumber} onFocus={() => setKeyHandlingEnabled(false)}
                 onBlur={(event) => updateNode({lineNumber: {$set: event.target.value}})}/>
        </div>
      </div>

      <LanguageInput initialValue={data.lg} onBlur={(value) => updateNode({lg: {$set: value}})}/>

      <div className="my-3">
        <UpdatePrevNextButtons changed={changed} initiateUpdate={initiateSubmit} initiateJumpElement={(forward) => jumpEditableNodes('lb', forward)}>
          <div className="control is-expanded">
            <button type="button" className="button is-danger is-fullwidth" onClick={deleteNode}>{t('delete')}</button>
          </div>
        </UpdatePrevNextButtons>
      </div>

    </>
  );
}