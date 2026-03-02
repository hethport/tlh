import { JSX, useState } from 'react';
import { NodeDisplay, NodeDisplayIProps } from './NodeDisplay';
import { useTranslation } from 'react-i18next';
import { parseNewXml, XmlElementNode } from 'simple_xml';
import classNames from 'classnames';
import { writeXml } from './StandAloneOXTED';
import update from 'immutability-helper';
import { FontSizeSelector } from './FontSizeSelector';
import { NodePath } from './insertablePositions';
import { tlhXmlEditorConfig } from './tlhXmlEditorConfig';
import { XmlSourceEditor } from './XmlSourceEditor';
import { HeaderEditor } from './HeaderEditor';

export interface EditorLeftSideProps extends NodeDisplayIProps {
  filename: string;
  onNodeSelect: (node: XmlElementNode, path: NodePath) => void;
  updateNode: (node: XmlElementNode) => void;
  setKeyHandlingEnabled: (value: boolean) => void;
  closeFile: (() => void) | undefined;
  deleteModeActive?: boolean;
  markedForDeletion?: string[];
  onToggleMarkForDeletion?: (path: NodePath) => void;
}

interface IState {
  fontSize: number;
  useSerifFont: boolean;
  xmlSource: string | undefined;
  headerEditorOpen: boolean;
}

export function EditorLeftSide({
  filename,
  node,
  currentSelectedPath,
  onNodeSelect,
  insertionData,
  updateNode,
  setKeyHandlingEnabled,
  closeFile,
  deleteModeActive,
  markedForDeletion,
  onToggleMarkForDeletion,
}: EditorLeftSideProps): JSX.Element {
  const { t } = useTranslation('common');

  /* ---------- UI state ---------- */
  const [uiState, setUiState] = useState<IState>({
    fontSize: 100,
    useSerifFont: false,
    xmlSource: undefined,
    headerEditorOpen: false,
  });

  const openHeaderEditor = (): void => {
    setKeyHandlingEnabled(false);
    const xmlString = writeXml(node as XmlElementNode, true);
    setUiState((s) => update(s, {
      xmlSource: { $set: xmlString },
      headerEditorOpen: { $set: true }
    }));
  };

  const closeHeaderEditor = (): void => {
    setKeyHandlingEnabled(true);
    setUiState((s) => update(s, {
      xmlSource: { $set: undefined },
      headerEditorOpen: { $set: false }
    }));
  };

  const handleSave = (newXml: string): void => {
    console.log('saving new header');
    // Parse and apply the new XML
    parseNewXml(newXml, tlhXmlEditorConfig.readConfig).handle(
      (rootNode) => {
        updateNode(rootNode as XmlElementNode);
        console.log('Header saved successfully');
        // Close the header editor
        setKeyHandlingEnabled(true);
        setUiState((s) => update(s, {
          xmlSource: { $set: undefined },
          headerEditorOpen: { $set: false }
        }));
      },
      (err) => {
        console.error('Error parsing updated XML:', err);
        alert(`Error saving header: ${err}`);
      }
    );
  };

  const [hoveredPath, setHoveredPath] = useState<NodePath | null>(null);

  const handleHoverEnter = (path: NodePath) => setHoveredPath(path);

  const handleHoverLeave = () => setHoveredPath(null);

  const setXmlSource = (value: string | undefined) =>
    setUiState((s) => update(s, { xmlSource: { $set: value } }));

  const activateShowSource = (): void => {
    setKeyHandlingEnabled(false);
    setXmlSource(writeXml(node as XmlElementNode, true));
  };

  const deactivateShowSource = (): void => {
    setKeyHandlingEnabled(true);
    setXmlSource(undefined);
  };

  const onXmlSourceUpdate = (): void =>
    parseNewXml(uiState.xmlSource as string, tlhXmlEditorConfig.readConfig).handle(
      (rootNode) => {
        updateNode(rootNode as XmlElementNode);
        console.log(uiState.xmlSource);
        deactivateShowSource();
      },
      (err) => alert(err)
    );

  const changeFontSize = (delta: number) =>
    setUiState((s) => update(s, { fontSize: { $apply: (v) => v + delta } }));

  return (
    <div className="flex flex-col min-h-80 max-h-90 overflow-y-hidden">
      <div className="p-4 rounded-t border border-slate-300 shadow-md">
        <span className="font-bold">{filename}</span>

        <div className="float-right space-x-2">

          {uiState.xmlSource ? (
            <>
              {uiState.headerEditorOpen ? (
                <>
                  <button
                    className="px-2 rounded bg-red-500 text-white font-bold"
                    onClick={closeHeaderEditor}
                    title={t('Cancel')}>
                    &#x270e; {t('Cancel')}
                  </button>
                </>
              ) : (
                <>
                  <FontSizeSelector
                    currentFontSize={uiState.fontSize}
                    updateFontSize={changeFontSize}
                  />
                  <button className="px-2 rounded bg-green-500 text-white font-bold" onClick={openHeaderEditor}>Edit Header</button>
                  <button
                    className="px-2 rounded bg-red-500 text-white font-bold"
                    onClick={deactivateShowSource}
                    title={t('cancelEditXmlSource')}
                  >
                    &#x270e; {t('cancelEditXmlSourceButton')}
                  </button>

                  <button
                    className="px-2 rounded bg-blue-500 text-white font-bold"
                    onClick={onXmlSourceUpdate}
                    title={t('applyXmlSourceChange')}
                  >
                    &#x270e; {t('applyXmlSourceChangeButton')}
                  </button>
                </>
              )}
            </>
          ) : (
            <>

              <button className="px-2 rounded bg-green-500 text-white font-bold" onClick={openHeaderEditor}>Edit Header</button>
              <button
                onClick={() =>
                  setUiState((s) =>
                    update(s, { useSerifFont: { $apply: (u) => !u } })
                  )
                }
                className="mr-2 px-2 border border-slate-500 rounded"
              >
                {uiState.useSerifFont
                  ? t('useSerifLessFont')
                  : t('useSerifFont')}
              </button>

              <button
                className="px-2 rounded bg-blue-500 text-white font-bold"
                onClick={activateShowSource}
                title={t('editSource') || 'editSource'}
              >
                &#x270e; XML
              </button>
            </>
          )}

          {closeFile && (
            <button
              className="px-2 rounded bg-red-600 text-white font-bold"
              onClick={closeFile}
              title={t('closeFile') || 'closeFile'}
            >
              &#10799; {t('closeFileButton')}
            </button>
          )}
        </div>
      </div>

      <div className="flex p-4 rounded-b border border-slate-300 shadow-md flex-auto overflow-auto">
        {uiState.xmlSource ? (
          <>
            {uiState.headerEditorOpen ? (
              <HeaderEditor
                xml={uiState.xmlSource as string}
                onSave={handleSave}
                onCancel={closeHeaderEditor}
              />
            ) : (
              <XmlSourceEditor
                style={{ fontSize: `${uiState.fontSize}%` }}
                source={uiState.xmlSource}
                onChange={setXmlSource}
              />
            )}
          </>
        ) : (
          <div
            className={classNames(
              uiState.useSerifFont ? 'font-hpm-serif' : 'font-hpm'
            )}
            style={{ fontSize: `${uiState.fontSize}%` }}
          >

            <NodeDisplay
              rootNode={node as XmlElementNode}
              node={node}
              currentSelectedPath={currentSelectedPath}
              onSelect={onNodeSelect}
              insertionData={insertionData}
              isLeftSide={true}
              hoveredPath={hoveredPath}
              onHoverEnter={handleHoverEnter}
              onHoverLeave={handleHoverLeave}
              deleteModeActive={deleteModeActive}
              markedForDeletion={markedForDeletion}
              onToggleMarkForDeletion={onToggleMarkForDeletion}
            />
          </div>
        )}
      </div>
    </div>
  );
}
