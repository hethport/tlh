import {displayReplace, XmlEditableNodeIProps, XmlInsertableSingleEditableNodeConfig} from '../editorConfig';
import {useTranslation} from 'react-i18next';
import {LanguageInput} from '../LanguageInput';
import classNames from 'classnames';
import {selectedNodeClass} from '../tlhXmlEditorConfig';
import {XmlElementNode} from '../../xmlModel/xmlModel';

export const lineBreakNodeConfig: XmlInsertableSingleEditableNodeConfig<XmlElementNode<'lb'>> = {
  replace: (node, _renderedChildren, isSelected, isLeftSide) => displayReplace(
    <>
      {isLeftSide && <br/>}
      <span className={classNames(isSelected ? [selectedNodeClass, 'text-black'] : ['text-gray-500'])}>{node.attributes.lnr}:</span>
      &nbsp;&nbsp;&nbsp;
    </>
  ),
  edit: (props) => <LineBreakEditor {...props} />,
  readNode: (node) => node as XmlElementNode<'lb'>,
  writeNode: (newNode) => newNode,
  insertablePositions: {
    beforeElement: ['lb', 'w', 'gap'],
    asLastChildOf: ['div1']
  }
};

export function LineBreakEditor({data, updateEditedNode, setKeyHandlingEnabled}: XmlEditableNodeIProps<XmlElementNode<'lb'>>): JSX.Element {

  const {t} = useTranslation('common');

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="txtId" className="font-bold">{t('textId')}:</label>
        <input type="text" id="txtId" className="p-2 rounded border border-slate-500 w-full mt-2" defaultValue={data.attributes.txtid} readOnly/>
      </div>

      <div className="mb-4">
        <label htmlFor="lineNumber" className="font-bold">{t('lineNumber')}:</label>
        <input type="text" id="lineNumber" className="p-2 rounded border border-slate-500 w-full mt-2" defaultValue={data.attributes.lnr?.trim()}
               onFocus={() => setKeyHandlingEnabled(false)} onChange={(event) => updateEditedNode({attributes: {lnr: {$set: event.target.value}}})}/>
      </div>

      <div className="mb-4">
        <LanguageInput initialValue={data.attributes.lg} onChange={(value) => updateEditedNode({attributes: {lg: {$set: value}}})}/>
      </div>
    </div>
  );
}