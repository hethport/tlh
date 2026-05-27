import { ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

export interface ReplacementProposal {
  /** Unique ID for this proposal */
  id: string;
  /** Path to the node in the XML tree */
  path: number[];
  /** Line number or context for display */
  context: string;
  /** Original text */
  original: string;
  /** Proposed replacement */
  replacement: string;
  /** Which category made this replacement */
  category: string;
  /** Whether this replacement is accepted */
  accepted: boolean;
}

interface IProps {
  proposals: ReplacementProposal[];
  onConfirm: (acceptedIds: string[]) => void;
  onCancel: () => void;
}

export function LegacyReplacementModal({
  proposals,
  onConfirm,
  onCancel,
}: IProps): ReactElement {
  const { t } = useTranslation('common');

  // Track which proposals are accepted
  const [acceptedMap, setAcceptedMap] = useState<Record<string, boolean>>(
    Object.fromEntries(proposals.map(p => [p.id, p.accepted]))
  );

  const toggleAccepted = (id: string) => {
    setAcceptedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (accept: boolean) => {
    setAcceptedMap(
      Object.fromEntries(proposals.map(p => [p.id, accept]))
    );
  };

  const handleConfirm = () => {
    const acceptedIds = Object.entries(acceptedMap)
      .filter(([, accepted]) => accepted)
      .map(([id]) => id);
    onConfirm(acceptedIds);
  };

  const acceptedCount = Object.values(acceptedMap).filter(Boolean).length;
  const totalCount = proposals.length;

  // Group proposals by category
  const groupedProposals = proposals.reduce((acc, proposal) => {
    if (!acc[proposal.category]) {
      acc[proposal.category] = [];
    }
    acc[proposal.category].push(proposal);
    return acc;
  }, {} as Record<string, ReplacementProposal[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-300 flex-shrink-0">
          <h2 className="text-xl font-bold">
            {t('legacyReplacements') || 'Legacy Text Replacements'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {totalCount === 0
              ? (t('noReplacementsFound') || 'No replacements found')
              : (t('legacyReplacementsDescription') || `Found ${totalCount} potential replacement${totalCount !== 1 ? 's' : ''}. Review and select which changes to apply.`)
                .replace('{{count}}', String(totalCount))
                .replace('{{plural}}', totalCount !== 1 ? 's' : '')
            }
          </p>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="space-x-2">
            <button
              type="button"
              className="px-3 py-1 text-sm rounded bg-green-500 text-white font-medium hover:bg-green-600"
              onClick={() => toggleAll(true)}
            >
              {t('selectAll') || 'Select All'}
            </button>
            <button
              type="button"
              className="px-3 py-1 text-sm rounded bg-gray-400 text-white font-medium hover:bg-gray-500"
              onClick={() => toggleAll(false)}
            >
              {t('deselectAll') || 'Deselect All'}
            </button>
          </div>
          <div className="text-sm font-medium text-gray-700">
            {acceptedCount} / {totalCount} {t('selected') || 'selected'}
          </div>
        </div>

        {/* Proposals list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {totalCount === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium">
                {t('noReplacementsFound') || 'No replacements found'}
              </p>
              <p className="text-sm mt-2">
                {t('noReplacementsFoundDescription') ||
                  'The document appears to already use the current format, or no legacy patterns were detected.'}
              </p>
            </div>
          ) : (
            Object.entries(groupedProposals).map(([category, categoryProposals]) => (
              <div key={category} className="space-y-2">
                <h3 className="font-bold text-gray-700 border-b pb-1">
                  {category.toUpperCase()}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({categoryProposals.length} {t('changes') || 'changes'})
                  </span>
                </h3>
                <div className="space-y-2">
                  {categoryProposals.map((proposal) => (
                    <label
                      key={proposal.id}
                      className={classNames(
                        'flex items-start p-3 rounded border-2 cursor-pointer transition-colors',
                        acceptedMap[proposal.id]
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={acceptedMap[proposal.id] || false}
                        onChange={() => toggleAccepted(proposal.id)}
                        className="mt-1 mr-3 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">
                          {proposal.context}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-600 mb-0.5">
                              {t('original') || 'Original'}:
                            </div>
                            <code className="block px-2 py-1 bg-red-100 text-red-800 rounded text-sm break-all">
                              {proposal.original}
                            </code>
                          </div>
                          <div className="text-gray-400 text-lg flex-shrink-0 self-center">
                            →
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-600 mb-0.5">
                              {t('replacement') || 'Replacement'}:
                            </div>
                            <code className="block px-2 py-1 bg-green-100 text-green-800 rounded text-sm break-all">
                              {proposal.replacement}
                            </code>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-300 flex justify-end space-x-3 flex-shrink-0">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-400 text-white font-bold hover:bg-gray-500"
            onClick={onCancel}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConfirm}
            disabled={acceptedCount === 0}
          >
            {acceptedCount === 0
              ? (t('applyChanges') || 'Apply Changes')
              : (t('applyChanges') || `Apply ${acceptedCount} Change${acceptedCount !== 1 ? 's' : ''}`)
                .replace('{{count}}', String(acceptedCount))
                .replace('{{plural}}', acceptedCount !== 1 ? 's' : '')
            }
          </button>
        </div>
      </div>
    </div>
  );
}
