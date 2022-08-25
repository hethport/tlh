import {XmlEditorConfig} from './editorConfig';
import {XmlElementNode} from '../xmlModel/xmlModel';
import {reCountNodeNumbers} from './elementEditors/NoteNodeEditor';
import {aoManuscriptsConfig} from './elementEditors/aoManuscriptsConfigData';
import {lineBreakNodeConfig} from './elementEditors/lineBreakData';
import {clbNodeConfig} from './elementEditors/clbData';
import {wordNodeConfig} from './elementEditors/wordNodeData';
import {gapConfig} from './elementEditors/gapConfigData';
import {paragraphSeparatorConfig} from './elementEditors/paragraphSeparatorConfig';
import {noteNodeConfig} from './elementEditors/noteData';
import {clEditorConfig} from './elementEditors/ClEditor';

export const selectedNodeClass = 'bg-teal-400';

export const tlhXmlEditorConfig: XmlEditorConfig = {
  nodeConfigs: {
    docID: {replace: () => <span/>},
    'AO:Manuscripts': aoManuscriptsConfig,
    'AO:ParagrNr': {
      replace: (node) => <div className="mt-4 font-bold italic">{node.attributes.c}</div>
    },
    lb: lineBreakNodeConfig,

    clb: clbNodeConfig,
    cl: clEditorConfig,

    // Words
    w: wordNodeConfig,

    // Word contents
    aGr: {styling: () => ['akkadogramm']},
    sGr: {styling: () => ['sumerogramm']},
    d: {styling: () => ['determinativ']},

    del_in: {replace: () => <span>[</span>},
    del_fin: {replace: () => <span>]</span>},
    ras_in: {replace: () => <span>*</span>},
    ras_fin: {replace: () => <span>*</span>},
    laes_in: {replace: () => <span>⸢</span>},
    laes_fin: {replace: () => <span>⸣</span>},

    gap: gapConfig,
    subscr: {replace: (node) => <sub>{node.attributes.c}</sub>},

    space: {
      replace: (node) => <>
        {Array.from({length: parseInt(node.attributes.c) || 0}).map((_, i) => <span key={i}>&nbsp;</span>)}
      </>
    },

    parsep: paragraphSeparatorConfig,
    parsep_dbl: paragraphSeparatorConfig,

    corr: {
      styling: () => ['corr'],
      replace: (node) => <span>{node.attributes.c}</span>
    },
    note: noteNodeConfig
  },
  beforeExport: (rootNode: XmlElementNode) => {
    reCountNodeNumbers(rootNode, 'node', 'n');
    reCountNodeNumbers(rootNode, 'clb', 'nr');
    return rootNode;
  },
  afterExport: (exported: string) => exported
    .replaceAll('®', '\n\t')
    // FIXME: collides with fragments! {€1}
    .replaceAll('{', '\n\t\t{')
    .replaceAll('+=', '\n\t\t   += ')
    .replaceAll('<w', '\n <w')
    .replaceAll('<lb', '\n\n<lb')
    .replaceAll(' mrp', '\n\tmrp')
    .replaceAll('@', ' @ ')

};