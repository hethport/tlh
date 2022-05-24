import { XmlEditableNodeIProps, XmlInsertableSingleEditableNodeConfig } from '../editorConfig/editorConfig';
import { useTranslation } from 'react-i18next';
import { NodeEditorRightSide } from '../NodeEditorRightSide';

export const colonEditorConfig: XmlInsertableSingleEditableNodeConfig = {
  replace: (node, renderedChildren, isSelected, isLeftSide) => (
    <div>
      <span className="px-1 cl">{node.attributes.id}</span>&nbsp;{isLeftSide && renderedChildren}
    </div>
  ),
  edit: (props) => <ColonEditor {...props} />,
  readNode: (n) => n,
  writeNode: (n) => n,
  insertablePositions: {
    beforeElement: ['cl', 'w'],
    afterElement: ['cl', 'w']
  }

};

export function ColonEditor({
  data,
  originalNode,
  changed,
  updateNode,
  deleteNode,
  setKeyHandlingEnabled,
  initiateSubmit,
  initiateJumpElement,
  fontSizeSelectorProps,
  cancelSelection
}: XmlEditableNodeIProps): JSX.Element {
  const { t } = useTranslation('common');

  console.info(originalNode.attributes.id);

  return (
    <NodeEditorRightSide originalNode={originalNode} changed={changed} initiateSubmit={initiateSubmit} jumpElement={initiateJumpElement}
      deleteNode={deleteNode} fontSizeSelectorProps={fontSizeSelectorProps} cancelSelection={cancelSelection}>

      <div>
        <label htmlFor="id" className="fontBold">{t('id')}:</label>
        <input id="id" defaultValue={originalNode.attributes.id}
          className="p-2 rounded border border-slate-200 w-full mt-2"
          onFocus={() => setKeyHandlingEnabled(false)}
          onChange={(event) => updateNode({ attributes: { id: { $set: event.target.value } } })} />
      </div>

    </NodeEditorRightSide>
  );
}