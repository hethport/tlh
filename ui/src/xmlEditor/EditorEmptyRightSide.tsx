import {isXmlSingleInsertableEditableNodeConfig, XmlEditorConfig, XmlSingleInsertableEditableNodeConfig} from './editorConfig';
import {ReactElement, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {InsertablePositions} from './insertablePositions';
import {SelectableButton} from '../genericElements/Buttons';
import {amberButtonClasses, blueButtonClasses, redButtonClasses} from '../defaultDesign';
import {LegacyReplacementModal} from '../legacyReplacements/LegacyReplacementModal';
import {useLegacyReplacements} from '../legacyReplacements/useLegacyReplacements';
import {XmlElementNode} from 'simple_xml';

interface IProps {
  editorConfig: XmlEditorConfig;
  currentInsertedElement?: string;
  toggleElementInsert: (tagName: string, ip: InsertablePositions) => void;
  toggleCompareChanges: () => void;
  onExportXml: (condenseEvents?: boolean) => void;
  onExportDict: () => void;
  exportDisabled: boolean;
  otherButton: ReactElement | undefined;
  children: ReactElement | undefined;
  insertModeActive: boolean;
  toggleInsertMode: () => void;
  cancelInsertMode: () => void;
  deleteModeActive: boolean;
  toggleDeleteMode: () => void;
  markedForDeletionCount: number;
  onDeleteMarked: () => void;
  onCancelDeleteMode: () => void;
  rootNode?: XmlElementNode;
  updateNode?: (node: XmlElementNode) => void;
}

export function EditorEmptyRightSide({
  editorConfig,
  currentInsertedElement,
  toggleElementInsert,
  toggleCompareChanges,
  onExportXml,
  onExportDict,
  exportDisabled,
  otherButton,
  children,
  insertModeActive,
  toggleInsertMode,
  cancelInsertMode,
  deleteModeActive,
  toggleDeleteMode,
  markedForDeletionCount,
  onDeleteMarked,
  onCancelDeleteMode,
  rootNode,
  updateNode,
}: IProps): ReactElement {

  const {t} = useTranslation('common');
  const [condenseOnExport, setCondenseOnExport] = useState(true);

  // Legacy replacement state
  const {
    isScanning,
    scanResult,
    scanDocument,
    applyReplacements,
    clearScanResult,
  } = useLegacyReplacements();
  const [showReplacementModal, setShowReplacementModal] = useState(false);

  const handleScanLegacyText = async () => {
    if (!rootNode) {
      alert('No document loaded');
      return;
    }

    const result = await scanDocument(rootNode);

    if (result.proposals.length === 0) {
      alert(t('noReplacementsFound') || 'No legacy text patterns found in this document.');
    } else {
      setShowReplacementModal(true);
    }
  };

  const handleConfirmReplacements = (acceptedIds: string[]) => {
    if (!rootNode || !updateNode) {
      return;
    }

    const updatedNode = applyReplacements(rootNode, acceptedIds);

    if (updatedNode) {
      updateNode(updatedNode);
      setShowReplacementModal(false);
      clearScanResult();

      const count = acceptedIds.length;
      alert(
        (t('replacementsApplied') || `Successfully applied ${count} replacement${count !== 1 ? 's' : ''}.`)
          .replace('{{count}}', String(count))
          .replace('{{plural}}', count !== 1 ? 's' : '')
      );
    }
  };

  const handleCancelReplacements = () => {
    setShowReplacementModal(false);
    clearScanResult();
  };

  const insertableTags: [string, InsertablePositions][] = Object.entries(editorConfig.nodeConfigs)
    .filter((c): c is [string, XmlSingleInsertableEditableNodeConfig] => isXmlSingleInsertableEditableNodeConfig(c[1]))
    .map<[string, InsertablePositions]>(([tagName, {insertablePositions}]) => [tagName, insertablePositions]);

  return (
    <div>
      {/* Legacy Replacement Modal */}
      {showReplacementModal && scanResult && (
        <LegacyReplacementModal
          proposals={scanResult.proposals}
          onConfirm={handleConfirmReplacements}
          onCancel={handleCancelReplacements}
        />
      )}

      <section className="p-2 rounded border border-slate-500">
        <h2 className="p-2 text-center font-bold text-lg">{t('insertableElements')}</h2>
        <div className="my-4 grid grid-cols-2 gap-2">
          {/* Insert Mode button */}
          <button
            type="button"
            className={insertModeActive ? 'p-2 rounded bg-blue-700 text-white font-bold ring-2 ring-blue-400' : blueButtonClasses}
            title={t('insertModeMouseOver')}
            onClick={toggleInsertMode}
          >
            {insertModeActive ? (t('insertModeActive') || '✚ Insert Mode ON') : t('insertModeMouseOver')}
          </button>
          <button
            type="button"
            className={deleteModeActive ? 'p-2 rounded bg-red-700 text-white font-bold ring-2 ring-red-400' : redButtonClasses}
            title={t('deleteModeMouseOver')}
            onClick={toggleDeleteMode}
          >
            {deleteModeActive ? (t('deleteModeActive') || '🗑 Delete Mode ON') : t('deleteModeMouseOver')}
          </button>
        </div>

        {/* Legacy Text Replacement button */}
        <div className="my-4">
          <button
            type="button"
            className="w-full p-2 rounded bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('scanLegacyText') || 'Scan and replace legacy text patterns'}
            onClick={handleScanLegacyText}
            disabled={!rootNode || !updateNode || isScanning || insertModeActive || deleteModeActive}
          >
            {isScanning
              ? (t('scanning') || '⏳ Scanning...')
              : (t('scanLegacyText') || '🔄 Scan for Legacy Text')}
          </button>
        </div>

        {deleteModeActive && (
          <div className="my-3 p-3 rounded border-2 border-red-400 bg-red-50 space-y-2">
            <p className="text-sm text-red-700 font-medium text-center">
              {markedForDeletionCount === 0
                ? (t('deleteModeInstructions') || 'Click nodes on the left to mark them for deletion.')
                : `${markedForDeletionCount} ${t('nodesMarkedForDeletion') || 'node(s) marked for deletion.'}`}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                className="px-3 py-1 rounded bg-red-600 text-white font-bold disabled:opacity-40"
                disabled={markedForDeletionCount === 0}
                onClick={onDeleteMarked}
              >
                🗑 {t('deleteMarked') || 'Delete marked'}
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded bg-gray-400 text-white font-bold"
                onClick={onCancelDeleteMode}
              >
                {t('cancel') || 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Insert mode: tag picker + status bar */}
        {insertModeActive && (
          <div className="my-3 p-3 rounded border-2 border-blue-400 bg-blue-50 space-y-3">
            <p className="text-sm text-blue-700 font-medium text-center">
              {currentInsertedElement
                ? (t('insertModeTagSelected') || `Tag «${currentInsertedElement}» selected — click ✚ buttons in the document to insert.`).replace('${currentInsertedElement}', currentInsertedElement)
                : (t('insertModePickTag') || 'Select a tag below, then click ✚ buttons in the document')}
            </p>

            <div className="grid grid-cols-4 gap-2">
              {insertableTags.map(([tagName, insertablePositions]) =>
                <SelectableButton
                  key={tagName}
                  title={tagName}
                  selected={tagName === currentInsertedElement}
                  onClick={() => toggleElementInsert(tagName, insertablePositions)}
                  otherClasses={['p-2', 'rounded']}
                >
                  <>{t(tagName)}</>
                </SelectableButton>
              )}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                className="px-3 py-1 rounded bg-gray-400 text-white font-bold"
                onClick={cancelInsertMode}
              >
                {t('leaveInsertMode') || 'Close Insertmode'}
              </button>
            </div>
          </div>
        )}

        {/* Default (non-insert-mode) tag grid — hidden while insert mode is active */}
        {!insertModeActive && (
          <div className="my-4 grid grid-cols-4 gap-2">
            {insertableTags.map(([tagName, insertablePositions]) =>
              <SelectableButton key={tagName} title={tagName} selected={tagName === currentInsertedElement}
                                onClick={() => toggleElementInsert(tagName, insertablePositions)} otherClasses={['p-2', 'rounded']}>
                <>{t(tagName)}</>
              </SelectableButton>
            )}
          </div>
        )}
      </section>

      {children}

      <div className="mt-4 space-y-3">
        {/* Condense events checkbox */}
        <div className="flex items-center justify-center">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={condenseOnExport}
              onChange={(e) => setCondenseOnExport(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {t('condenseEventsOnExport') || 'Condense events on export'}
            </span>
          </label>
        </div>

        {/* Export buttons */}
        <div className="flex space-x-4 justify-center">
          <button type="button" className={amberButtonClasses} onClick={toggleCompareChanges}>{t('compareChanges')}</button>
          <button
            type="button"
            className={blueButtonClasses}
            onClick={() => onExportXml(condenseOnExport)}
            disabled={exportDisabled}
          >
            {t('exportXml')}
          </button>
          <button type="button" className={blueButtonClasses} onClick={onExportDict} disabled={exportDisabled}>{'Wörterbuch exportieren'}</button>
          {otherButton}
        </div>
      </div>
    </div>
  );
}
