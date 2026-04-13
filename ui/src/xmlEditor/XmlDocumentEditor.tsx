import {ReactElement, useEffect, useState, useRef} from 'react';
import {isXmlElementNode, isXmlTextNode, XmlElementNode, XmlNode, xmlTextNode} from 'simple_xml';
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
  history: XmlNode[];
  historyIndex: number;
}

// Maximum number of undo states to keep in memory
const MAX_HISTORY_LENGTH = 50;

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
    markedForDeletion: [],
    history: [initialNode],
    historyIndex: 0
  });
  const globalUpdateButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    state.changed && autoSave && autoSave(state.rootNode);
  }, [state]);

  useEffect(() => {
    document.addEventListener('keydown', handleJumpKey);
    document.addEventListener('keydown', handleUndoRedoKey);
    return () => {
      document.removeEventListener('keydown', handleJumpKey);
      document.removeEventListener('keydown', handleUndoRedoKey);
    };
  });

  const undo = (): void => {
    setState((state) => {
      if (state.historyIndex > 0) {
        const previousNode = state.history[state.historyIndex - 1];
        return update(state, {
          rootNode: {$set: previousNode},
          historyIndex: {$set: state.historyIndex - 1},
          changed: {$set: true},
          editorState: {$set: defaultRightSideState} // Reset editor state on undo
        });
      }
      return state;
    });
  };

  const redo = (): void => {
    setState((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const nextNode = state.history[state.historyIndex + 1];
        return update(state, {
          rootNode: {$set: nextNode},
          historyIndex: {$set: state.historyIndex + 1},
          changed: {$set: true},
          editorState: {$set: defaultRightSideState} // Reset editor state on redo
        });
      }
      return state;
    });
  };

  const handleUndoRedoKey = (event: KeyboardEvent): void => {
    if (!state.keyHandlingEnabled) return;

    // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
    }
    // Redo: Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac)
    else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault();
      redo();
    }
  };

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

  const applyUpdates = (nextEditablePath?: number[]): void => {
    setState((state) => {
      if (state.editorState._type !== 'EditNodeRightState') {
        return state;
      }

      const newEditorState = nextEditablePath !== undefined
        ? editNodeEditorState(findElement(state.rootNode as XmlElementNode, nextEditablePath), editorConfig, nextEditablePath)
        : undefined;

      const newRootNode = update(state.rootNode, buildSpec(state.editorState.path, {$set: state.editorState.node}));

      const currentHistory = state.history.slice(0, state.historyIndex + 1);
      const newHistory = [...currentHistory, newRootNode].slice(-MAX_HISTORY_LENGTH);

      return update(state, {
        rootNode: {$set: newRootNode},
        editorState: newEditorState !== undefined ? {$set: newEditorState} : {changed: {$set: false}},
        changed: {$set: true},
        history: {$set: newHistory},
        historyIndex: {$set: newHistory.length - 1}
      });
    });
  };

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

    setState((state) => {
      const newRootNode = update(state.rootNode, buildSpec(path.slice(0, -1), {children: {$splice: [[path[path.length - 1], 1]]}}));

      const currentHistory = state.history.slice(0, state.historyIndex + 1);
      const newHistory = [...currentHistory, newRootNode].slice(-MAX_HISTORY_LENGTH);

      return update(state, {
        rootNode: {$set: newRootNode},
        editorState: {$set: defaultRightSideState},
        changed: {$set: true},
        lbCuneiformDirtyPath: {$set: lbCuneiformDirtyPath},
        history: {$set: newHistory},
        historyIndex: {$set: newHistory.length - 1}
      });
    });
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
                           deleteNode={() => deleteNode(path)} applyUpdates={() => applyUpdates()}
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

    // Never remove structural/marker tags
    const structuralTags = ['lb', 'clb', 'parsep', 'gap'];
    if (structuralTags.includes(node.tagName)) {
      return node;
    }

    const key = path.join('.');
    if (!affectedParentKeys.has(key)) {
      return node;
    }

    const cleanedChildren = node.children
      .map((child, i) => pruneEmptyAncestors(child, [...path, i], affectedParentKeys))
      .filter((c): c is XmlNode => c !== null);

    // Separate structural markers from regular content
    const structuralChildren = cleanedChildren.filter(child =>
      isXmlElementNode(child) && structuralTags.includes(child.tagName)
    );
    const regularChildren = cleanedChildren.filter(child =>
      !(isXmlElementNode(child) && structuralTags.includes(child.tagName))
    );

    // If there are any structural markers, ALWAYS keep the node
    if (structuralChildren.length > 0) {
      return {...node, children: cleanedChildren};
    }

    // No structural markers: check if only whitespace remains
    const isEffectivelyEmpty = regularChildren.length === 0 ||
      regularChildren.every(child =>
        isXmlTextNode(child) && child.textContent.trim() === ''
      );

    if (isEffectivelyEmpty) {
      return null;
    }

    return {...node, children: cleanedChildren};
  }

  function deleteMarkedNodes(): void {
    if (state.markedForDeletion.length === 0) return;
    if (!confirm(t('deleteThisElement'))) return;

    const sortedPaths = state.markedForDeletion
      .map((pathString) => pathString.split('.').map(Number))
      .sort((pathA: number[], pathB: number[]) => {
        for (let i = Math.max(pathA.length, pathB.length) - 1; i >= 0; i--) {
          const difference = (pathB[i] ?? -1) - (pathA[i] ?? -1);
          if (difference !== 0) return difference;
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
      let newRootNode = state.rootNode;
      for (const path of sortedPaths) {
        const spec = buildSpec(path.slice(0, -1), {children: {$splice: [[path[path.length - 1], 1]]}});
        newRootNode = update(newRootNode, spec);
      }
      // Prune only along the affected ancestor paths
      newRootNode = pruneEmptyAncestors(newRootNode, [], affectedParentKeys) ?? newRootNode;

      const currentHistory = state.history.slice(0, state.historyIndex + 1);
      const newHistory = [...currentHistory, newRootNode].slice(-MAX_HISTORY_LENGTH);

      return update(state, {
        rootNode: {$set: newRootNode},
        deleteModeActive: {$set: false},
        markedForDeletion: {$set: []},
        changed: {$set: true},
        history: {$set: newHistory},
        historyIndex: {$set: newHistory.length - 1}
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
      setState((state) => {
        const newRootNode = update(state.rootNode, actionSpec);

        const currentHistory = state.history.slice(0, state.historyIndex + 1);
        const newHistory = [...currentHistory, newRootNode].slice(-MAX_HISTORY_LENGTH);

        return update(state, {
          rootNode: {$set: newRootNode},
          changed: {$set: true},
          lbCuneiformDirtyPath: {$set: lbCuneiformDirtyPath},
          history: {$set: newHistory},
          historyIndex: {$set: newHistory.length - 1}
        });
      });
    } else {
      // Default behaviour: open the node editor after insertion
      setState((state) => {
        const newRootNode = update(state.rootNode, actionSpec);

        const currentHistory = state.history.slice(0, state.historyIndex + 1);
        const newHistory = [...currentHistory, newRootNode].slice(-MAX_HISTORY_LENGTH);

        return update(state, {
          rootNode: {$set: newRootNode},
          editorState: {$set: editNodeEditorState(newNode, editorConfig, path)},
          changed: {$set: true},
          lbCuneiformDirtyPath: {$set: lbCuneiformDirtyPath},
          history: {$set: newHistory},
          historyIndex: {$set: newHistory.length - 1}
        });
      });
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
    updateNode: (node) => {
      setState((state) => {
        const newRootNode = node;

        const currentHistory = state.history.slice(0, state.historyIndex + 1);
        const newHistory = [...currentHistory, newRootNode].slice(-MAX_HISTORY_LENGTH);

        return update(state, {
          rootNode: {$set: newRootNode},
          history: {$set: newHistory},
          historyIndex: {$set: newHistory.length - 1}
        });
      });
    },
    setKeyHandlingEnabled: (value) => setState((state) => update(state, {keyHandlingEnabled: {$set: value}})),
    isLeftSide: true,
    deleteModeActive: state.deleteModeActive,
    markedForDeletion: state.markedForDeletion,
    onToggleMarkForDeletion: toggleMarkForDeletion,
    // NEW: Pass undo/redo functions and state
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
    onUndo: undo,
    onRedo: redo
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