import {XmlEditableNodeIProps, XmlSingleInsertableEditableNodeConfig} from '../editorConfig';
import {JSX} from 'react';
import {selectedNodeClass} from '../tlhXmlEditorConfig';

const separatorTypes: ('parsep' | 'parsep_dbl')[] = ['parsep', 'parsep_dbl'];

export const paragraphSeparatorConfig: XmlSingleInsertableEditableNodeConfig = {
  replace: ({node, isSelected}) =>
    <span className={isSelected ? selectedNodeClass : ''}>{node.tagName === 'parsep' ? '¬¬¬' : '==='}</span>,
  insertablePositions: {
    beforeElement: ['w'],
    afterElement: ['lb', 'w'],
    asLastChildOf: ['div1']
  },
  edit: (props) => <ParagraphSeparatorEditor {...props}/>
};

function ParagraphSeparatorEditor({node, updateEditedNode}: XmlEditableNodeIProps): JSX.Element {
  return (
    <select className="p-2 rounded border border-slate-500 bg-white w-full" defaultValue={node.tagName}
            onChange={(event) => updateEditedNode({tagName: {$set: event.target.value as 'parsep' | 'parsep_dbl'}})}>
      {separatorTypes.map((st) => <option key={st}>{st}</option>)}
    </select>
  );
}