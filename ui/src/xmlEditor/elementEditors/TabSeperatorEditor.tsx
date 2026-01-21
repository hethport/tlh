import {XmlEditableNodeIProps, XmlSingleInsertableEditableNodeConfig} from '../editorConfig';
import {JSX} from 'react';
import {selectedNodeClass} from '../tlhXmlEditorConfig';

const separatorTypes: ('tabsep')[] = ['tabsep'];

export const tabSeparatorConfig: XmlSingleInsertableEditableNodeConfig = {
  replace: ({node, isSelected}) =>
    <span className={isSelected ? selectedNodeClass : ''}>{node.tagName === 'tabsep' ? '‖' : '==='}</span>,
  insertablePositions: {
    beforeElement: ['w'],
    afterElement: ['lb', 'w'],
    asLastChildOf: ['div1']
  },
  edit: (props) => <TabSeparatorEditor {...props}/>
};

function TabSeparatorEditor({node, updateEditedNode}: XmlEditableNodeIProps): JSX.Element {
  return (
    <select className="p-2 rounded border border-slate-500 bg-white w-full" defaultValue={node.tagName}
            onChange={(event) => updateEditedNode({tagName: {$set: event.target.value as 'tabsep'}})}>
      {separatorTypes.map((st) => <option key={st}>{st}</option>)}
    </select>
  );
}