import {XmlEditableNodeIProps} from '../editorConfig';
import {WordNodeData} from './wordNodeData';
import {XmlElementNode} from '../../xmlModel/xmlModel';
import {useTranslation} from 'react-i18next';
import {NodeEditorRightSide} from '../NodeEditorRightSide';

export function SpacesEditor({data, updateNode, rightSideProps}: XmlEditableNodeIProps<WordNodeData>): JSX.Element {

  const {t} = useTranslation('common');

  function updateSpaceCount(count: string): void {
    updateNode({node: {children: {[0]: {attributes: {c: {$set: count}}}}}});
  }

  return (
    <NodeEditorRightSide {...rightSideProps}>
      <div>
        <label htmlFor="spacesCount" className="font-bold">{t('spacesCount')}:</label>

        <input type="number" id="spacesCount" defaultValue={(data.node.children[0] as XmlElementNode).attributes.c}
               className="p-2 rounded border border-slate-500 mt-2 w-full" onChange={(event) => updateSpaceCount(event.target.value)}/>
      </div>
    </NodeEditorRightSide>
  );
}