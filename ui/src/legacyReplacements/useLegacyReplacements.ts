import { useState, useCallback } from 'react';
import { XmlElementNode } from 'simple_xml';
import { writeXml } from '../xmlEditor/StandAloneOXTED';
import { processLegacyLine } from './legacyReplacements';
import { ReplacementProposal } from './LegacyReplacementModal';
import { parseNewXml } from 'simple_xml';
import { tlhXmlEditorConfig } from '../xmlEditor/tlhXmlEditorConfig';

/**
 * Extracts lines from the full XML string
 * A "line" is content between line break tags (lb, clb, parsep, gap)
 */
function extractLinesFromXml(xmlString: string): Array<{xml: string; context: string}> {
  const lines: Array<{xml: string; context: string}> = [];

  // Split by line break tags, but keep the tags to extract context
  const lineBreakPattern = /<(lb|clb|parsep|gap)([^>]*)>/g;

  let lastIndex = 0;
  let currentContext = 'Document start';
  const matches = [...xmlString.matchAll(lineBreakPattern)];

  matches.forEach((match) => {
    const tagName = match[1];
    const attributes = match[2];
    const matchStart = match.index;

    if (matchStart === undefined) return;

    // Extract content between last line break and this one
    if (lastIndex < matchStart) {
      // IMPORTANT: Don't trim! Preserve exact spacing from the XML
      const lineContent = xmlString.substring(lastIndex, matchStart);

      // Only skip completely empty lines
      if (lineContent && lineContent.trim().length > 0) {
        lines.push({
          xml: lineContent,
          context: currentContext
        });
      }
    }

    // Update context from this line break tag
    if (tagName === 'lb') {
      const lnrMatch = attributes.match(/lnr=["']([^"']+)["']/);
      if (lnrMatch) {
        currentContext = `Line ${lnrMatch[1]}`;
      }
    } else if (tagName === 'clb') {
      const idMatch = attributes.match(/id=["']([^"']+)["']/);
      if (idMatch) {
        currentContext = `Column break ${idMatch[1]}`;
      }
    } else if (tagName === 'parsep') {
      currentContext = 'Paragraph break';
    } else if (tagName === 'gap') {
      currentContext = 'Gap';
    }

    // Move past this line break tag
    lastIndex = matchStart + match[0].length;
  });

  // Process any remaining content after the last line break
  if (lastIndex < xmlString.length) {
    const lineContent = xmlString.substring(lastIndex);
    if (lineContent && lineContent.trim().length > 0) {
      lines.push({
        xml: lineContent,
        context: currentContext
      });
    }
  }

  return lines;
}

/**
 * Scans the document line-by-line for legacy patterns
 * A "line" is all content between line break markers (lb, clb, parsep, gap)
 * Also scans lnr attribute values for varia replacements
 */
function scanDocumentByLines(
  xmlString: string,
  proposals: ReplacementProposal[],
  processedCount: { value: number }
): void {
  const lines = extractLinesFromXml(xmlString);

  console.log(`Extracted ${lines.length} lines from document`);

  lines.forEach((line, lineIndex) => {
    // Process this line through legacy replacements
    const result = processLegacyLine(line.xml, { debug: true });

    if (result.replacementCount > 0 && result.text !== line.xml) {
      if (result.log && result.log.length > 0) {
        result.log.forEach((logEntry, logIndex) => {
          // Create unique ID based on line position
          const id = `line_${lineIndex}_${logIndex}`;

          // Each line occurrence is unique, don't deduplicate
          proposals.push({
            id,
            path: [],
            context: line.context,
            original: logEntry.pattern,
            replacement: logEntry.replacement,
            category: logEntry.category,
            accepted: true,
          });
          processedCount.value++;
        });
      }
    }
  });

  // Also scan lnr attribute values for varia replacements
  const lnrPattern = /lnr=["']([^"']+)["']/g;
  let lnrMatch: RegExpExecArray | null;
  let lnrScanned = 0;
  let lnrReplaced = 0;

  while ((lnrMatch = lnrPattern.exec(xmlString)) !== null) {
    const lnrValue = lnrMatch[1];
    const lnrIndex = lnrMatch.index;
    lnrScanned++;

    const result = processLegacyLine(lnrValue, { debug: true, categories: ['varia'] });

    if (result.replacementCount > 0 && result.text !== lnrValue) {
      lnrReplaced++;
      if (result.log && result.log.length > 0) {
        result.log.forEach((logEntry, logIndex) => {
          // Use a unique ID based on position in document to avoid deduplication
          const id = `lnr_${lnrIndex}_${logIndex}`;

          // For lnr attributes, don't deduplicate - each occurrence is unique
          // even if the pattern and replacement are the same
          proposals.push({
            id,
            path: [],
            context: `Line number: ${lnrValue}`,
            original: logEntry.pattern,
            replacement: logEntry.replacement,
            category: 'varia',
            accepted: true,
          });
          processedCount.value++;
        });
      }
    }
  }

  console.log(`Scanned ${lnrScanned} lnr attributes, found replacements in ${lnrReplaced}`);
}

/**
 * Helper function to escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface LegacyReplacementResult {
  proposals: ReplacementProposal[];
  totalScanned: number;
}

export function useLegacyReplacements() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<LegacyReplacementResult | null>(null);

  /**
   * Scans the entire XML document for potential legacy replacements
   * Works line-by-line (content between lb, clb, parsep, gap tags)
   */
  const scanDocument = useCallback(async (rootNode: XmlElementNode): Promise<LegacyReplacementResult> => {
    setIsScanning(true);

    console.log('=== SCANNING DOCUMENT FOR LEGACY PATTERNS (LINE-BY-LINE) ===');

    try {
      const proposals: ReplacementProposal[] = [];
      const processedCount = { value: 0 };

      // Convert to XML string ONCE - this is the same format used for applying
      const xmlString = writeXml(rootNode, true);
      console.log(`Document XML length: ${xmlString.length} characters`);

      // Scan the XML string line-by-line
      scanDocumentByLines(xmlString, proposals, processedCount);

      console.log(`\nScan complete: found ${proposals.length} potential replacements`);
      console.log('Proposals by category:');

      // Group and log by category
      const byCategory = proposals.reduce((acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
      }, {} as Record<string, ReplacementProposal[]>);

      Object.entries(byCategory).forEach(([category, props]) => {
        console.log(`  ${category}: ${props.length} replacements`);
      });

      // Log all proposals in parseable format
      console.log('\n=== ALL PROPOSALS (CSV FORMAT) ===');
      console.log('Category,Context,Original,Replacement');
      proposals.forEach(p => {
        const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
        console.log(`${p.category},${escapeCsv(p.context)},${escapeCsv(p.original)},${escapeCsv(p.replacement)}`);
      });
      console.log('=== END PROPOSALS ===\n');

      const result = {
        proposals,
        totalScanned: processedCount.value,
      };

      setScanResult(result);
      return result;
    } finally {
      setIsScanning(false);
    }
  }, []);

  /**
   * Scans the document line-by-line for legacy patterns
   * Also applies varia replacements to line break tag attributes (lnr, etc.)
   */
  const applyReplacements = useCallback(
    (rootNode: XmlElementNode, acceptedProposalIds: string[]): XmlElementNode | null => {
      if (!scanResult) return null;

      // Get accepted proposals
      const acceptedProposals = scanResult.proposals.filter(p =>
        acceptedProposalIds.includes(p.id)
      );

      if (acceptedProposals.length === 0) return rootNode;

      console.log('=== APPLYING REPLACEMENTS ===');
      console.log(`Total accepted proposals: ${acceptedProposals.length}`);

      // Convert the entire document to XML string
      let xmlString = writeXml(rootNode, true);
      console.log('Original XML length:', xmlString.length);

      // Build replacement map (deduplicate same patterns)
      const replacementMap = new Map<string, string>();
      acceptedProposals.forEach(proposal => {
        replacementMap.set(proposal.original, proposal.replacement);
        console.log(`Replacement rule: "${proposal.original}" -> "${proposal.replacement}"`);
      });

      console.log(`\nUnique replacement patterns: ${replacementMap.size}`);

      // Apply all replacements to the full XML string
      let replacementsMade = 0;
      replacementMap.forEach((replacement, original) => {
        // Count occurrences before replacement
        const beforeCount = (xmlString.match(new RegExp(escapeRegex(original), 'g')) || []).length;

        // Escape special regex characters
        const escapedOriginal = escapeRegex(original);
        const beforeXml = xmlString;
        xmlString = xmlString.replace(new RegExp(escapedOriginal, 'g'), replacement);

        // Count occurrences after replacement
        const afterCount = (xmlString.match(new RegExp(escapeRegex(original), 'g')) || []).length;
        const actualReplacements = beforeCount - afterCount;

        if (actualReplacements > 0) {
          replacementsMade += actualReplacements;
          console.log(`✓ Applied "${original}" -> "${replacement}" (${actualReplacements} time(s))`);

          // Show a sample of what changed
          if (beforeXml !== xmlString) {
            const changedIndex = beforeXml.split(original)[0].length;
            const contextStart = Math.max(0, changedIndex - 30);
            const contextEnd = Math.min(xmlString.length, changedIndex + original.length + 30);
            console.log(`  Context: ...${xmlString.substring(contextStart, contextEnd)}...`);
          }
        } else {
          console.warn(`✗ Pattern not found in XML: "${original}"`);
          // Show what's near where it should be
          if (beforeCount === 0) {
            console.warn('  This pattern does not exist in the XML at all');
          }
        }
      });

      console.log(`\nTotal replacements made: ${replacementsMade}`);
      console.log('Modified XML length:', xmlString.length);

      // Parse the updated XML back into a node tree
      let resultNode: XmlElementNode | null = null;

      parseNewXml(xmlString, tlhXmlEditorConfig.readConfig).handle(
        (newRootNode) => {
          resultNode = newRootNode as XmlElementNode;
          console.log('✓ Successfully parsed updated XML');
        },
        (error) => {
          console.error('✗ Error parsing updated XML:', error);
          alert(`Error applying replacements: ${error}`);
          resultNode = null;
        }
      );

      console.log('=== END APPLYING REPLACEMENTS ===\n');

      return resultNode;
    },
    [scanResult]
  );

  /**
   * Clears the current scan result
   */
  const clearScanResult = useCallback(() => {
    setScanResult(null);
  }, []);

  return {
    isScanning,
    scanResult,
    scanDocument,
    applyReplacements,
    clearScanResult,
  };
}