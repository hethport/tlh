import {useTranslation} from 'react-i18next';
import {JSX, useState} from 'react';
import {TLHParser} from 'simtex';
import {ParseResultComponent} from './ParseResultComponent';
import {convertLine} from './LineParseResult';
import {XmlCreationValues} from './xmlConversion/createCompleteDocument';
import {exportXmlFromParser} from './exportFromParser';
import {processLegacyDocument} from '../legacyReplacements/legacyReplacements';
import {blueButtonClasses} from '../defaultDesign';

interface IProps {
  xmlCreationValues: XmlCreationValues;
  initialInput: string;
  onChange: (value: string) => void;
  disabled: boolean;
  language: string;
}

export function TransliterationTextArea({xmlCreationValues, initialInput, onChange, disabled, language}: IProps): JSX.Element {

  const {t} = useTranslation('common');
  const [input, setInput] = useState(initialInput);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [replacementProposals, setReplacementProposals] = useState<Array<{id: string; original: string; replacement: string}>>([]);
  const [selectedReplacements, setSelectedReplacements] = useState<Set<string>>(new Set());
  const [preCalculatedReplacements, setPreCalculatedReplacements] = useState<Map<string, string>>(new Map());

  const inputWithLanguage = `@${language}\n${input}`;

  const xmlContent = exportXmlFromParser(new TLHParser(inputWithLanguage), xmlCreationValues);

  const parsed = new TLHParser(inputWithLanguage).getLines().map(convertLine);

  // Process replacements and show modal
  const handleInitiateReplacements = () => {
    console.log('=== INITIATING REPLACEMENTS ===');
    console.log('Input text:');
    input.split('\n').slice(0, 20).forEach((line, i) => {
      console.log(`  ${i}: "${line}"`);
    });

    // Use the actual replacement engine to detect what will be changed
    // isXmlContext=false because we're processing raw simtex, not XML
    const replacedText = processLegacyDocument(input, { isXmlContext: false });

    console.log('\nReplaced text:');
    replacedText.split('\n').slice(0, 20).forEach((line, i) => {
      console.log(`  ${i}: "${line}"`);
    });

    if (replacedText === input) {
      alert(t('noReplacementsFound') || 'No legacy patterns found in the text.');
      return;
    }

    // Count total replacements by comparing line by line
    const originalLines = input.split('\n');
    const replacedLines = replacedText.split('\n');

    const proposals: Array<{id: string; original: string; replacement: string}> = [];
    const replacementMap = new Map<string, string>();
    let id = 0;

    console.log('\nComparing lines:');
    originalLines.forEach((origLine, idx) => {
      const replLine = replacedLines[idx];
      if (origLine !== replLine) {
        const propId = `replacement_${id++}`;
        console.log(`  Line ${idx}: "${origLine}" -> "${replLine}"`);
        proposals.push({
          id: propId,
          original: origLine,
          replacement: replLine
        });
        replacementMap.set(propId, replLine);
      }
    });

    console.log(`\nFound ${proposals.length} changed lines`);

    if (proposals.length === 0) {
      alert(t('noReplacementsFound') || 'No legacy patterns found in the text.');
      return;
    }

    setReplacementProposals(proposals);
    setPreCalculatedReplacements(replacementMap);
    setSelectedReplacements(new Set(proposals.map(p => p.id))); // Select all by default
    setShowReplacementModal(true);
  };

  const handleApplyReplacements = () => {
    if (selectedReplacements.size === 0) {
      alert(t('selectAtLeastOne') || 'Please select at least one replacement.');
      return;
    }

    // Build result from selected lines using pre-calculated replacements
    const resultLines = input.split('\n');
    let totalReplacements = 0;

    replacementProposals.forEach((proposal) => {
      if (selectedReplacements.has(proposal.id)) {
        const newValue = preCalculatedReplacements.get(proposal.id);
        if (newValue !== undefined) {
          // Find and replace this line
          const lineIndex = resultLines.findIndex(line => line === proposal.original);
          if (lineIndex !== -1) {
            resultLines[lineIndex] = newValue;
            totalReplacements++;
          }
        }
      }
    });

    const resultText = resultLines.join('\n');

    if (resultText !== input) {
      setInput(resultText);
      onChange(resultText);
      setShowReplacementModal(false);

      const plural = totalReplacements === 1 ? '' : 's';
      alert(
        (t('replacementsApplied') || 'Successfully applied {{count}} replacement{{plural}}.')
          .replace('{{count}}', String(totalReplacements))
          .replace('{{plural}}', plural)
      );
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    onChange(value);
  };

  const toggleReplacement = (id: string) => {
    const newSelected = new Set(selectedReplacements);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedReplacements(newSelected);
  };

  const selectAll = () => {
    setSelectedReplacements(new Set(replacementProposals.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedReplacements(new Set());
  };

  return (
    <>
      <div className="my-4 p-4 rounded border border-blue-300 bg-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-blue-900 mb-2">
              {t('legacyReplacements') || 'Legacy Text Replacements'}
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              {t('legacyReplacementsInfo') ||
                'Apply legacy ODT format replacements to normalize your transliteration text (e.g., Vs‗ → Vs., character corrections, etc.)'}
            </p>
          </div>
          <button
            type="button"
            className={`${blueButtonClasses} whitespace-nowrap`}
            onClick={handleInitiateReplacements}
            disabled={disabled}
          >
            {t('applyLegacyReplacements') || 'Apply Replacements'}
          </button>
        </div>
      </div>

      {/* Replacement Review Modal */}
      {showReplacementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold mb-4">
              {t('legacyReplacements') || 'Legacy Text Replacements'}
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              {(t('legacyReplacementsDescription') || 'Found {{count}} replacement{{plural}}. Review and select which changes to apply.')
                .replace('{{count}}', String(replacementProposals.length))
                .replace('{{plural}}', replacementProposals.length === 1 ? '' : 's')}
            </p>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                onClick={selectAll}
              >
                {t('selectAll') || 'Select All'}
              </button>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                onClick={deselectAll}
              >
                {t('deselectAll') || 'Deselect All'}
              </button>
              <span className="text-sm text-gray-600 ml-auto">
                {selectedReplacements.size} {t('selected') || 'selected'}
              </span>
            </div>

            {/* Replacement List */}
            <div className="border rounded overflow-y-auto mb-4 flex-grow">
              {replacementProposals.map((proposal) => (
                <div key={proposal.id} className="flex items-center p-3 border-b hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id={proposal.id}
                    checked={selectedReplacements.has(proposal.id)}
                    onChange={() => toggleReplacement(proposal.id)}
                    className="mr-3"
                  />
                  <label htmlFor={proposal.id} className="flex-grow cursor-pointer text-sm">
                    <span className="font-mono">&quot;{proposal.original}&quot;</span>
                    <span className="mx-2">→</span>
                    <span className="font-mono text-green-700">&quot;{proposal.replacement}&quot;</span>
                  </label>
                </div>
              ))}
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-2 justify-end border-t pt-4">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-400 text-white font-bold hover:bg-gray-500"
                onClick={() => setShowReplacementModal(false)}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                className={blueButtonClasses}
                onClick={handleApplyReplacements}
                disabled={selectedReplacements.size === 0}
              >
                {(t('applyChanges') || 'Apply {{count}} Change{{plural}}')
                  .replace('{{count}}', String(selectedReplacements.size))
                  .replace('{{plural}}', selectedReplacements.size === 1 ? '' : 's')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-2 p-2 grid grid-cols-3 gap-2 rounded border border-slate-500">
        <section>
          <label className="my-2 font-bold block text-center">{t('transliteration')}:</label>

          <textarea rows={20} value={input} placeholder={t('transliteration') || 'transliteration'} disabled={disabled}
                    className="p-2 rounded border border-slate-500 w-full disabled:opacity-50"
                    onChange={(event) => handleInputChange(event.target.value)}/>
        </section>

        <section className="col-span-2">
          <label className="my-2 font-bold block text-center">{t('parseResult')}:</label>

          {parsed.length > 0
            ? <ParseResultComponent xmlContent={xmlContent} showStatusLevel={true} lines={parsed} mainIdentifier={xmlCreationValues.mainIdentifier}/>
            : <div className="p-2 italic text-cyan-500 text-center">{t('no_result_yet')}...</div>}
        </section>
      </div>
    </>
  );
}
