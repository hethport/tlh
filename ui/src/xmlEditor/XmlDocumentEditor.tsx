import {ReactElement, useEffect, useState, useRef} from 'react';
import {isXmlElementNode, XmlElementNode, XmlNode, xmlTextNode} from 'simple_xml';
import {XmlEditorConfig, XmlSingleEditableNodeConfig} from './editorConfig';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {editorKeyConfigSelector} from '../newStore';
import update, {Spec} from 'immutability-helper';
import {EditorLeftSide, EditorLeftSideProps} from './EditorLeftSide';
import {EditorEmptyRightSide} from './EditorEmptyRightSide';
import {calculateInsertablePositions, InsertablePositions, NodePath} from './insertablePositions';
import {tlhXmlEditorConfig} from './tlhXmlEditorConfig';
import {addNodeEditorState, compareChangesEditorState, defaultRightSideState, editNodeEditorState, EditorState, IEditNodeEditorState} from './editorState';
import {XmlComparator} from '../xmlComparator/XmlComparator';
import {NodeEditorRightSide} from './NodeEditorRightSide';
import {FontSizeSelectorProps} from './FontSizeSelector';
import {writeXml} from './StandAloneOXTED';
import {fetchCuneiform} from './elementEditors/LineBreakEditor';
import {getPriorSiblingPath} from '../nodeIterators';
import {coloredButtonClasses} from '../defaultDesign';
import {condenseXmlEvents} from './HeaderEditor';
import {postprocessNode} from './nodePostprocessing';

export function buildActionSpec(innerAction: Spec<XmlNode>, path: number[]): Spec<XmlNode> {
  return path.reduceRight(
    (acc, index) => ({children: {[index]: acc}}),
    innerAction
  );
}

export interface ButtonConfig {
  title: string;
  color: string;
  onClick: (rootNode: XmlElementNode) => void;
}

interface IProps {
  node: XmlNode;
  editorConfig?: XmlEditorConfig;
  filename: string;
  closeFile?: () => void;
  autoSave?: (rootNode: XmlNode) => void;
  exportDisabled?: boolean;
  onExportXml: (node: XmlElementNode) => void;
  onExportDict: () => void;
  otherButtonConfig?: ButtonConfig;
  children?: ReactElement;
}

interface IState {
  keyHandlingEnabled: boolean;
  rootNode: XmlNode;
  editorState: EditorState;
  changed: boolean;
  author?: string;
  rightSideFontSize: number;
  lbCuneiformDirtyPath?: number[];
  insertModeActive: boolean;
  deleteModeActive: boolean;
  markedForDeletion: string[];
}

function searchEditableNode(tagName: string, rootNode: XmlElementNode, currentPath: number[], forward: boolean): number[] | undefined {

  const go = (node: XmlElementNode, currentPath: number[]): number[] | undefined => {
    if (node.tagName === tagName) {
      return [];
    }

    const [pathHead, ...pathTail] = currentPath;

    let firstSearch: number;
    if (currentPath.length > 0) {
      firstSearch = pathTail.length === 0 ? (forward ? pathHead + 1 : pathHead - 1) : pathHead;
    } else {
      firstSearch = forward ? 0 : node.children.length - 1;
    }

    for (let i = firstSearch; i < node.children.length && i >= 0; forward ? i++ : i--) {
      const child = node.children[i];

      const pathRest = i === pathHead ? pathTail : [];

      const foundChild = isXmlElementNode(child)
        ? go(child, pathRest)
        : undefined;

      if (foundChild) {
        return [i, ...foundChild];
      }
    }
  };

  return go(rootNode, currentPath);
}

const findElement = (node: XmlElementNode, path: number[]): XmlElementNode =>
  path.reduce((nodeToUpdate, pathContent) => nodeToUpdate.children[pathContent] as XmlElementNode, node);

const buildSpec = (path: number  [], innerSpec: Spec<XmlNode>) => path.reduceRight<Spec<XmlNode>>(
  (acc, index) => ({children: {[index]: acc}}),
  innerSpec
);

// Convert DOM Element to XmlElementNode (simple_xml format)
const domElementToXmlNode = (element: Element): XmlElementNode => {
  const attributes: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }

  const children: XmlNode[] = [];
  element.childNodes.forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(domElementToXmlNode(child as Element));
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent !== null) {
      // Preserve all text content, including spaces - don't trim
      children.push(xmlTextNode(child.textContent));
    }
  });

  return {
    tagName: element.tagName,
    attributes,
    children
  };
};

export function XmlDocumentEditor({
  node: initialNode,
  editorConfig = tlhXmlEditorConfig,
  onExportXml,
  onExportDict,
  filename,
  closeFile,
  autoSave,
  exportDisabled,
  otherButtonConfig,
  children
}: IProps): ReactElement {

  const {t} = useTranslation('common');
  const editorKeyConfig = useSelector(editorKeyConfigSelector);
  const [state, setState] = useState<IState>({
    keyHandlingEnabled: true,
    rootNode: initialNode,
    editorState: defaultRightSideState,
    changed: false,
    rightSideFontSize: 100,
    insertModeActive: false,
    deleteModeActive: false,
    markedForDeletion: []
  });
  const globalUpdateButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    state.changed && autoSave && autoSave(state.rootNode);
  }, [state]);

  useEffect(() => {
    document.addEventListener('keydown', handleJumpKey);
    return () => document.removeEventListener('keydown', handleJumpKey);
  });

  function exportXml(condenseEvents?: boolean): void {
    setState((state) => update(state, {changed: {$set: false}}));

    let nodeToExport = state.rootNode as XmlElementNode;

    // If condenseEvents is requested, process the XML through condenseXmlEvents
    if (condenseEvents) {
      try {
        const xmlString = writeXml(nodeToExport, true);
        const condensedXml = condenseXmlEvents(xmlString);

        // Parse the condensed XML back into XmlNode structure
        const parser = new DOMParser();
        const doc = parser.parseFromString(condensedXml, 'application/xml');

        if (doc.documentElement) {
          nodeToExport = domElementToXmlNode(doc.documentElement);
        }
      } catch (error) {
        console.error('Error condensing events:', error);
        // Fall back to original node if condensing fails
      }
    }

    onExportXml(nodeToExport);
  }

  const onNodeSelect = (node: XmlElementNode, path: number[]): void => setState((state) => update(state, {
    editorState: (currentEditorState) => currentEditorState._type === 'EditNodeRightState' && currentEditorState.path.join('.') === path.join('.')
      ? defaultRightSideState
      : editNodeEditorState(node, editorConfig, path)
  }));

  const applyUpdates = (nextEditablePath?: number[]): void => setState((state) => {
      if (state.editorState._type !== 'EditNodeRightState') {
        return state;
      }

      const newEditorState = nextEditablePath !== undefined
        ? editNodeEditorState(findElement(state.rootNode as XmlElementNode, nextEditablePath), editorConfig, nextEditablePath)
        : undefined;

      const editedNode = state.editorState.node;
      const resultingNode = postprocessNode(editedNode, state.editorState.path,
                                            state.rootNode as XmlElementNode);

      return update(state, {
        rootNode: buildSpec(state.editorState.path, {$set: resultingNode}),
        editorState: newEditorState !== undefined
          ? {$set: newEditorState}
          : {changed: {$set: false}, node: {$set: resultingNode}},
        changed: {$set: true}
      });
    }
  );

  const updateEditedNode = (updateSpec: Spec<XmlElementNode>): void => setState((state) => update(state, {
    editorState: (editorState) => editorState._type === 'EditNodeRightState'
      ? update(editorState, {node: updateSpec, changed: {$set: true}})
      : editorState
  }));

  const updateAttribute = (key: string, value: string | undefined): void => updateEditedNode({attributes: {[key]: {$set: value}}});

  function jumpEditableNodes(tagName: string, forward: boolean): void {
    if (state.editorState._type !== 'EditNodeRightState') {
      return;
    }

    const path = searchEditableNode(tagName, state.rootNode as XmlElementNode, state.editorState.path, forward);

    if (!path) {
      return;
    }

    const node = findElement(state.rootNode as XmlElementNode, path);

    setState((state) => update(state, {editorState: {$set: editNodeEditorState(node, editorConfig, path)}}));
  }

  function handleJumpKey(event: KeyboardEvent): void {
    if (state.editorState._type !== 'EditNodeRightState' || !state.keyHandlingEnabled) {
      return;
    }

    // Don't trigger shortcuts when user is typing in an input field
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      (activeElement as HTMLElement).isContentEditable
    )) {
      return;
    }

    const tagName = state.editorState.node.tagName;

    if (editorKeyConfig.updateAndNextEditableNodeKeys.includes(event.key)) {
      applyUpdates(
        searchEditableNode(tagName, state.rootNode as XmlElementNode, state.editorState.path, true)
      );
    } else if (editorKeyConfig.nextEditableNodeKeys.includes(event.key)) {
      jumpEditableNodes(tagName, true);
    } else if (editorKeyConfig.updateAndPreviousEditableNodeKeys.includes(event.key)) {
      applyUpdates(
        searchEditableNode(tagName, state.rootNode as XmlElementNode, state.editorState.path, false)
      );
    } else if (editorKeyConfig.previousEditableNodeKeys.includes(event.key)) {
      jumpEditableNodes(tagName, false);
    }
  }

  function deleteNode(path: number[]): void {
    if (!confirm(t('deleteThisElement'))) {
      return;
    }

    const lbCuneiformDirtyPath = findElement(state.rootNode as XmlElementNode, path).tagName === 'w'
      ? getPriorSiblingPath(state.rootNode as XmlElementNode, path, 'lb')
      : undefined;

    setState((state) => update(state, {
        rootNode: buildSpec(path.slice(0, -1), {children: {$splice: [[path[path.length - 1], 1]]}}),
        editorState: {$set: defaultRightSideState},
        changed: {$set: true},
        lbCuneiformDirtyPath: {$set: lbCuneiformDirtyPath}
      })
    );
  }

  function renderNodeEditor({node, path, changed}: IEditNodeEditorState): ReactElement {

    const fontSizeSelectorProps: FontSizeSelectorProps = {
      currentFontSize: state.rightSideFontSize,
      updateFontSize: (delta) => setState((state) => update(state, {rightSideFontSize: {$apply: (value) => value + delta}}))
    };

    const setKeyHandlingEnabled = (value: boolean) => setState((state) => update(state, {keyHandlingEnabled: {$set: value}}));

    const config = editorConfig.nodeConfigs[node.tagName] as XmlSingleEditableNodeConfig;

    const updateOtherNode = (path: number[], spec: Spec<XmlNode>): void => setState((state) => update(state, {rootNode: buildSpec(path, spec)}));

    return (
      <NodeEditorRightSide key={path.join('.')} rootNode={state.rootNode as XmlElementNode} originalNode={node} changed={changed}
                           deleteNode={() => deleteNode(path)} applyUpdates={() => { applyUpdates();
                                                                setState((state) => update(state, {editorState: {$set: defaultRightSideState}})); }}
                           cancelSelection={() => setState((state) => update(state, {editorState: {$set: defaultRightSideState}}))}
                           jumpElement={(forward) => jumpEditableNodes(node.tagName, forward)} fontSizeSelectorProps={fontSizeSelectorProps}
                           globalUpdateButtonRef={globalUpdateButtonRef}>
        {config.edit({node, path, updateEditedNode, updateAttribute, setKeyHandlingEnabled, rootNode: state.rootNode as XmlElementNode, updateOtherNode, globalUpdateButtonRef})}
      </NodeEditorRightSide>
    );
  }

  const toggleInsertMode = (): void => setState((state) => update(state, {
    insertModeActive: {$apply: (v) => !v},
    editorState: {$set: defaultRightSideState}
  }));

  const cancelInsertMode = (): void => setState((state) => update(state, {
    insertModeActive: {$set: false},
    editorState: {$set: defaultRightSideState}
  }));

  const toggleDeleteMode = (): void => setState((state) => update(state, {
    deleteModeActive: {$apply: (v) => !v},
    markedForDeletion: {$set: []},
    editorState: {$set: defaultRightSideState}
  }));

  const cancelDeleteMode = (): void => setState((state) => update(state, {
    deleteModeActive: {$set: false},
    markedForDeletion: {$set: []}
  }));

  const toggleMarkForDeletion = (path: NodePath): void => {
    const key = path.join('.');
    setState((state) => {
      const already = state.markedForDeletion.includes(key);
      return update(state, {
        markedForDeletion: already
          ? {$apply: (arr: string[]) => arr.filter((p) => p !== key)}
          : {$push: [key]}
      });
    });
  };

  /**
   * After bulk deletion, remove element nodes that have become empty,
   * but only along the ancestor paths of deleted nodes — not across the
   * whole tree (which would wrongly prune legitimate self-closing or
   * structurally-empty containers elsewhere).
   *
   * `affectedParentKeys` is a Set of path strings for every parent of a
   * deleted node (e.g. if "0.1.2" was deleted, "0.1" and "0" are affected).
   */
  function pruneEmptyAncestors(node: XmlNode, path: number[], affectedParentKeys: Set<string>): XmlNode | null {
    if (!isXmlElementNode(node)) {
      return node;
    }
    const key = path.join('.');
    if (!affectedParentKeys.has(key)) {
      // This subtree had no deletions — leave it entirely alone
      return node;
    }
    const cleanedChildren = node.children
      .map((child, i) => pruneEmptyAncestors(child, [...path, i], affectedParentKeys))
      .filter((c): c is XmlNode => c !== null);
    if (cleanedChildren.length === 0) {
      return null;
    }
    return {...node, children: cleanedChildren};
  }

  function deleteMarkedNodes(): void {
    if (state.markedForDeletion.length === 0) return;
    if (!confirm(t('deleteThisElement'))) return;

    const sortedPaths = state.markedForDeletion
      .map((s) => s.split('.').map(Number))
      .sort((a, b) => {
        for (let i = Math.max(a.length, b.length) - 1; i >= 0; i--) {
          const diff = (b[i] ?? -1) - (a[i] ?? -1);
          if (diff !== 0) return diff;
        }
        return 0;
      });

    // Build the set of all ancestor path keys for deleted nodes
    const affectedParentKeys = new Set<string>();
    for (const path of sortedPaths) {
      for (let len = 1; len < path.length; len++) {
        affectedParentKeys.add(path.slice(0, len).join('.'));
      }
      // Also add the root
      affectedParentKeys.add('');
    }

    setState((state) => {
      let rootNode = state.rootNode;
      for (const path of sortedPaths) {
        const spec = buildSpec(path.slice(0, -1), {children: {$splice: [[path[path.length - 1], 1]]}});
        rootNode = update(rootNode, spec);
      }
      // Prune only along the affected ancestor paths
      rootNode = pruneEmptyAncestors(rootNode, [], affectedParentKeys) ?? rootNode;
      return update(state, {
        rootNode: {$set: rootNode},
        deleteModeActive: {$set: false},
        markedForDeletion: {$set: []},
        changed: {$set: true}
      });
    });
  }

  const toggleElementInsert = (tagName: string, insertablePositions: InsertablePositions): void => setState((state) => {
      switch (state.editorState._type) {
        case 'DefaultEditorState':
          return update(state, {editorState: {$set: addNodeEditorState(tagName, insertablePositions)}});
        case 'AddNodeRightState':
          return update(state, {editorState: {$set: state.editorState.tagName !== tagName ? addNodeEditorState(tagName, insertablePositions) : defaultRightSideState}});
        case 'EditNodeRightState':
        case 'CompareChangesEditorState':
          return state;
      }
    }
  );

  const toggleCompareChanges = (): void => setState((state) => update(state, {editorState: {$set: compareChangesEditorState}}));

  const toggleDefaultMode = (): void => setState((state) => update(state, {editorState: {$set: defaultRightSideState}}));

  function initiateInsert(path: NodePath): void {
    if (state.editorState._type !== 'AddNodeRightState') {
      return;
    }

    const {newElement, insertAction} = state.editorState.insertablePositions;

    const newNode = newElement !== undefined ? newElement() : {tagName: state.editorState.tagName, attributes: {}, children: []};

    const actionSpec: Spec<XmlNode> = insertAction
      ? insertAction(path, newNode, state.rootNode as XmlElementNode)
      : buildActionSpec({children: {$splice: [[path[path.length - 1], 0, newNode]]}}, path.slice(0, -1));

    const lbCuneiformDirtyPath = newNode.tagName === 'w'
      ? getPriorSiblingPath(state.rootNode as XmlElementNode, path, 'lb')
      : undefined;

    if (state.insertModeActive) {
      // In insert mode: apply the node but stay in AddNodeRightState (no editor opened)
      setState((state) => update(state, {
        rootNode: actionSpec,
        changed: {$set: true},
        lbCuneiformDirtyPath: {$set: lbCuneiformDirtyPath}
      }));
    } else {
      // Default behaviour: open the node editor after insertion
      setState((state) => update(state, {
        rootNode: actionSpec,
        editorState: {$set: editNodeEditorState(newNode, editorConfig, path)},
        changed: {$set: true},
        lbCuneiformDirtyPath: {$set: lbCuneiformDirtyPath}
      }));
    }
  }

  const currentInsertedElement = 'tagName' in state.editorState
    ? state.editorState.tagName
    : undefined;

  const leftSideProps: Omit<EditorLeftSideProps, 'exportTitle' | 'filename' | 'node' | 'onNodeSelect' | 'onExport'> = {
    rootNode: state.rootNode as XmlElementNode,
    currentSelectedPath: 'path' in state.editorState
      ? state.editorState.path
      : undefined,
    insertionData: 'tagName' in state.editorState
      ? {
        insertablePaths: Array.from(new Set(calculateInsertablePositions(state.editorState.insertablePositions, state.rootNode))),
        insertAsLastChildOf: state.editorState.insertablePositions.asLastChildOf || [],
        initiateInsert
      }
      : undefined,
    closeFile: closeFile
      ? () => {
        if (!state.changed || confirm(t('closeFileOnUnfinishedChangesMessage'))) {
          closeFile();
        }
      }
      : undefined,
    updateNode: (node) => setState((state) => update(state, {rootNode: {$set: node}})),
    setKeyHandlingEnabled: (value) => setState((state) => update(state, {keyHandlingEnabled: {$set: value}})),
    isLeftSide: true,
    deleteModeActive: state.deleteModeActive,
    markedForDeletion: state.markedForDeletion,
    onToggleMarkForDeletion: toggleMarkForDeletion
  };

  if (state.lbCuneiformDirtyPath !== undefined) {
    const path = state.lbCuneiformDirtyPath;

    fetchCuneiform(state.rootNode as XmlElementNode, path)
      .then((cuneiform) => setState((state) => update(state, {
        rootNode: buildSpec(path, {attributes: {cu: {$set: cuneiform}}}),
        lbCuneiformDirtyPath: {$set: undefined}
      })));
  }

  const makeOtherButton = ({color, onClick, title}: ButtonConfig): ReactElement => (
    <button type="button" className={coloredButtonClasses(color)} onClick={() => onClick(state.rootNode as XmlElementNode)}>{title}</button>
  );

  const otherButton = otherButtonConfig
    ? makeOtherButton(otherButtonConfig)
    : undefined;

  return state.editorState._type === 'CompareChangesEditorState'
    ? (
      <div className="container mx-auto font-body-ullikumi">
        <button type="button" onClick={toggleDefaultMode} className="my-4 p-2 rounded bg-blue-500 text-white w-full">{t('close')}</button>
        <XmlComparator leftFile={{name: t('startingDocumentState'), baseContent: writeXml(initialNode as XmlElementNode, true)}}
                       rightFile={{name: t('currentDocumentState'), baseContent: writeXml(state.rootNode as XmlElementNode, true)}}/>
      </div>
    ) : (
      <div className="px-2 grid grid-cols-2 gap-4" style={{ height: 'calc(100vh - 5.5rem)' }}>
        <div className="max-h-full overflow-auto" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          <EditorLeftSide {...leftSideProps} filename={filename} node={state.rootNode} onNodeSelect={onNodeSelect}/>
        </div>

        {state.editorState._type === 'EditNodeRightState'
          ? (
            <div className="max-h-full overflow-auto" key={state.editorState.path.join('.')}>
              {renderNodeEditor(state.editorState) /* don't convert to a component! */}
            </div>
          )
          : (
            <EditorEmptyRightSide editorConfig={editorConfig} currentInsertedElement={currentInsertedElement} toggleElementInsert={toggleElementInsert}
                                  toggleCompareChanges={toggleCompareChanges} onExportXml={exportXml}
                                  onExportDict={onExportDict}
                                  exportDisabled={exportDisabled || false}
                                  otherButton={otherButton}
                                  insertModeActive={state.insertModeActive}
                                  toggleInsertMode={toggleInsertMode}
                                  cancelInsertMode={cancelInsertMode}
                                  deleteModeActive={state.deleteModeActive}
                                  toggleDeleteMode={toggleDeleteMode}
                                  markedForDeletionCount={state.markedForDeletion.length}
                                  onDeleteMarked={deleteMarkedNodes}
                                  onCancelDeleteMode={cancelDeleteMode}>
              {children}
            </EditorEmptyRightSide>
          )}
      </div>
    );
}