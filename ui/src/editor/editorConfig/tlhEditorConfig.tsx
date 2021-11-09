import {XmlEditorConfig, XmlSingleEditableNodeConfig} from './editorConfig';
import {WordNodeEditor} from '../WordNodeEditor';
import {LineBreakEditor} from '../LineBreakEditor';
import classNames from 'classnames';
import {IoCloseSharp} from 'react-icons/io5';
import {readWordNodeData, WordNodeData, writeWordNodeData} from './wordNodeData';
import {LineBreakData, readLineBreakData, writeLineBreakData} from './lineBreakData';

const foreignLanguageColors: { [key: string]: string } = {
  HURR: 'Hur',
  HATT: 'Hat',
  // PAL: '',
  LUW: 'Luw'
};

const lb: XmlSingleEditableNodeConfig<LineBreakData> = {
  // TODO: only render <br/> if not first linebreak!
  replace: (node, _renderedChildren, path, currentSelectedPath) => {

    const isSelected = !!currentSelectedPath && currentSelectedPath.join('.') === path.join('.');

    return (
      <>
        <span className={classNames('lb', {'has-background-primary': isSelected})}><br/>{node.attributes.lnr}:</span>
        &nbsp;&nbsp;&nbsp;
      </>
    );
  },
  edit: (props) => <LineBreakEditor key={props.path.join('.')} {...props} />,
  readNode: readLineBreakData,
  writeNode: writeLineBreakData,
  insertablePositions: {
    beforeElement: ['lb'],
    asLastChildOf: ['div1']
  }
};


const w: XmlSingleEditableNodeConfig<WordNodeData> = {
  replace: (node, renderedChildren, path, currentSelectedPath) => {

    const notMarked = node.attributes.mrp0sel === 'DEL';

    const isForeignLanguage = Object.keys(foreignLanguageColors).includes(node.attributes.mrp0sel);

    const needsMorphology = !!node.attributes.mrp0sel;
    const hasNoMorphologySelected = needsMorphology && node.attributes.mrp0sel.trim().length === 0 || node.attributes.mrp0sel === '???';

    const hasMorphAnalyses = Object.keys(node.attributes)
      .filter((name) => name.startsWith('mrp') && !name.startsWith('mrp0'))
      .length > 0;

    const classes = classNames(node.attributes.lg || '', {
      'is-underlined': !notMarked && hasNoMorphologySelected,
      'has-background-primary': !notMarked && !!currentSelectedPath && currentSelectedPath.join('.') === path.join('.'),
      'has-background-warning': !notMarked && !isForeignLanguage && needsMorphology && !hasMorphAnalyses,
      [foreignLanguageColors[node.attributes.mrp0sel]]: isForeignLanguage,
      'has-text-weight-bold': isForeignLanguage,
      'has-text-danger': node.children.length === 0
    });

    return <>
        <span className={classes}>
          {node.children.length === 0 ? <IoCloseSharp/> : renderedChildren}
        </span>
      &nbsp;&nbsp;
    </>;
  },
  edit: (props) => <WordNodeEditor key={props.path.join('.')} {...props}/>,
  readNode: readWordNodeData,
  writeNode: writeWordNodeData,
  insertablePositions: {
    beforeElement: ['w'],
    afterElement: ['lb', 'w'],
    asLastChildOf: ['div1']
  }
};

export const tlhEditorConfig: XmlEditorConfig = {
  docID: {replace: () => <span/>},
  'AO:Manuscripts': {replace: () => <span/>},
  lb,

  // Words
  w,

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

  gap: {
    styling: () => ['gap'],
    replace: (node) => <>
      {'t' in node.attributes && node.attributes.t === 'line' && <br/>}
      <span>{node.attributes.c}</span>
    </>
  },

  space: {
    replace: (node) => <>{Array.from({length: parseInt(node.attributes.c) || 0}).map((_, i) => <span key={i}>&nbsp;</span>)}</>,
    styling: () => ['has-background-light']
  },

  parsep: {replace: () => <span>¬¬¬</span>},
  parsep_dbl: {replace: () => <span>===</span>},

  corr: {
    styling: () => ['corr'],
    replace: (node) => <span>{node.attributes.c}</span>
  },
  note: {
    replace: (node) => <sup title={node.attributes.c} className="has-text-weight-bold">x</sup>
  }
};
