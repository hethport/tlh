/**
 * Legacy Text Replacement Module
 *
 * Converts legacy ODT format Hittite/Akkadian manuscript transliterations
 * to current XML format. Processes text line-by-line while preserving
 * philological markup (brackets, determinatives, etc.).
 *
 * @module legacyReplacements
 */

import replacementRulesData from './replacement-rules.json';

let replacementRules = replacementRulesData as ReplacementRules;

export interface ReplacementRules {
  description: string;
  version: string;
  categories: {
    [key: string]: {
      description: string;
      preserveBrackets?: boolean;
      rules: { [key: string]: string };
    };
  };
  placeholders?: {
    description: string;
    enabled: boolean;
    rules: { [key: string]: string };
  };
}

export interface ReplacementOptions {
  /** Enable debug logging */
  debug?: boolean;
  /** Categories to apply (default: all) */
  categories?: string[];
  /** Maximum iterations for bracket-preserving replacements (default: 24) */
  maxIterations?: number;
}

export interface ReplacementResult {
  /** The transformed text */
  text: string;
  /** Number of replacements made */
  replacementCount: number;
  /** Debug information if debug=true */
  log?: ReplacementLogEntry[];
}

export interface ReplacementLogEntry {
  category: string;
  pattern: string;
  replacement: string;
  before: string;
  after: string;
}

/** Pattern for splitting text into character/tag tokens */
const TOKEN_PATTERN = /^(([^<])|(<[^>]*>))(.*)/u;

/**
 * Characters to use in regex "dirt" pattern (optional brackets between tokens)
 * Matches philological brackets: [ ] ⸢ ⸣ 〈 〉 and markers: ! ? ° _ *
 */
const DIRT_PATTERN = ')([\\[\\]\\*⸢⸣〈〉!?°_]*)(';

/**
 * Special characters used in Hittite/Akkadian philology:
 * - ‗ (U+2017 DOUBLE LOW LINE): Encoded space within gaps
 * - ˽ (U+02FD MODIFIER LETTER SHELF): Tied space (non-breaking connection)
 *
 * Note: These are documented here for reference but not actively used in
 * the current implementation. They may be needed for gap text processing
 * if the corrTXTGAP category is added in the future.
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tokenizes a string into an array of individual characters and complete tags
 *
 * Example: "a<tag>b⸢c⸣" => ["a", "<tag>", "b", "⸢", "c", "⸣"]
 */
function tokenizeString(str: string): string[] {
  const tokens: string[] = [];
  let remaining = str;

  while (remaining.length > 0) {
    const match = remaining.match(TOKEN_PATTERN);
    if (!match) break;

    tokens.push(match[1]); // The token (char or complete tag)
    remaining = match[4];   // Rest of string
  }

  return tokens;
}

/**
 * Finds the length of common prefix and suffix between two token arrays
 */
function findCommonAffixes(
  oldTokens: string[],
  newTokens: string[]
): { prefixLen: number; oldSuffixStart: number; newSuffixStart: number } {
  // Find common prefix
  let prefixLen = 0;
  while (
    prefixLen < oldTokens.length &&
    prefixLen < newTokens.length &&
    oldTokens[prefixLen] === newTokens[prefixLen]
    ) {
    prefixLen++;
  }

  // Find common suffix
  let oldIdx = oldTokens.length - 1;
  let newIdx = newTokens.length - 1;

  while (
    oldIdx >= prefixLen &&
    newIdx >= prefixLen &&
    oldTokens[oldIdx] === newTokens[newIdx]
    ) {
    oldIdx--;
    newIdx--;
  }

  return {
    prefixLen,
    oldSuffixStart: oldIdx + 1,
    newSuffixStart: newIdx + 1
  };
}

/**
 * Builds a regex pattern that captures text and brackets separately
 */
function buildSearchPattern(tokens: string[]): string {
  const escapedTokens = tokens.map(t => escapeRegex(t));
  return '(' + escapedTokens.join(DIRT_PATTERN) + ')';
}

/**
 * Normalizes bracket positions in text according to philological conventions:
 * - Brackets outside punctuation (hyphens, periods)
 * - Brackets outside spaces
 * - Punctuation after letters but before closing brackets
 */
function normalizeBrackets(text: string): string {
  let result = text;

  // Move opening brackets outside of hyphens and periods
  result = result.replace(/⸢-/g, '-⸢');
  result = result.replace(/⸢\./g, '.⸢');
  result = result.replace(/\[-/g, '-[');
  result = result.replace(/\[\./g, '.[');

  // Move closing brackets outside of hyphens and periods
  result = result.replace(/-⸣/g, '⸣-');
  result = result.replace(/\.⸣/g, '⸣.');
  result = result.replace(/-\]/g, ']-');
  result = result.replace(/\.\]/g, '].');

  // Move brackets outside of spaces
  result = result.replace(/ ⸣/g, '⸣ ');
  result = result.replace(/ \]/g, '] ');
  result = result.replace(/⸢ /g, ' ⸢');
  result = result.replace(/\[ /g, ' [');

  // Move punctuation after letters to outside closing brackets
  const letterPattern = /⸣([a-zA-ZḪḫáàâéèêíìîúùûÁÀÂÉÈÊÍÌÎÚÙÛšŠṣṢṭṬ₀₁₂₃₄₅₆₇₈₉ₓ])-/gu;
  result = result.replace(letterPattern, '$1⸣-');

  const periodPattern = /⸣([a-zA-ZḪḫáàâéèêíìîúùûÁÀÂÉÈÊÍÌÎÚÙÛšŠṣṢṭṬ₀₁₂₃₄₅₆₇₈₉ₓ])\./gu;
  result = result.replace(periodPattern, '$1⸣.');

  return result;
}

/**
 * Performs simple string replacement from a dictionary
 */
function applySimpleReplacements(
  text: string,
  rules: { [key: string]: string },
  category: string,
  debug: boolean,
  log: ReplacementLogEntry[]
): { text: string; count: number } {
  let result = text;
  let count = 0;

  for (const [pattern, replacement] of Object.entries(rules)) {
    if (result.includes(pattern)) {
      const before = result;
      result = result.replace(new RegExp(escapeRegex(pattern), 'g'), replacement);
      count++;

      if (debug) {
        log.push({
          category,
          pattern,
          replacement,
          before,
          after: result
        });
      }
    }
  }

  return { text: result, count };
}

/**
 * Performs bracket-preserving replacement
 *
 * When replacing text that contains philological brackets, this algorithm:
 * 1. Identifies common prefix/suffix that remains unchanged
 * 2. Redistributes brackets proportionally in the variable middle section
 * 3. Normalizes bracket positions according to conventions
 */
function applyBracketPreservingReplacement(
  text: string,
  oldPattern: string,
  newPattern: string,
  maxIterations: number,
  debug: boolean,
  log: ReplacementLogEntry[],
  category: string
): { text: string; count: number } {
  let result = text;
  let count = 0;

  // Tokenize patterns
  const oldTokens = tokenizeString(oldPattern);
  const newTokens = tokenizeString(newPattern);

  // Find common prefix and suffix
  const { prefixLen, oldSuffixStart, newSuffixStart } = findCommonAffixes(
    oldTokens,
    newTokens
  );

  // Build search regex
  const searchPattern = buildSearchPattern(oldTokens);
  const regex = new RegExp(searchPattern, 'gu');

  // Prepare replacement template with slots for brackets
  const replacementTemplate: string[] = [];
  for (let i = 0; i < newTokens.length; i++) {
    replacementTemplate.push(newTokens[i]); // Character/tag
    replacementTemplate.push('');            // Slot for brackets
  }

  let iterations = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(result)) && iterations < maxIterations) {
    iterations++;

    const matchedText = match[0];
    const before = result;

    // Copy template for this instance
    const instance = [...replacementTemplate];

    // Copy prefix brackets (positions remain the same)
    for (let i = 0; i < prefixLen; i++) {
      const bracketIdx = i * 2 + 1;
      if (bracketIdx < match.length) {
        instance[i * 2 + 1] = match[bracketIdx] || '';
      }
    }

    // Redistribute middle brackets proportionally
    const middleCount = oldSuffixStart - prefixLen;
    for (let i = 0; i < middleCount; i++) {
      const oldIdx = (prefixLen + i) * 2 + 1;

      // Calculate proportional position in new array
      const proportion = (newSuffixStart - prefixLen) / (oldSuffixStart - prefixLen);
      const newIdx = Math.round((prefixLen + i * proportion) * 2 + 1);

      if (oldIdx < match.length && newIdx < instance.length) {
        instance[newIdx] = (instance[newIdx] || '') + (match[oldIdx] || '');
      }
    }

    // Copy suffix brackets
    const oldSuffixCount = oldTokens.length - oldSuffixStart;
    for (let i = 0; i < oldSuffixCount; i++) {
      const oldIdx = (oldSuffixStart + i) * 2 + 1;
      const newIdx = (newSuffixStart + i) * 2 + 1;

      if (oldIdx < match.length && newIdx < instance.length) {
        instance[newIdx] = match[oldIdx] || '';
      }
    }

    // Join and normalize
    let replacement = instance.join('');
    replacement = normalizeBrackets(replacement);

    // Apply replacement
    result = result.substring(0, match.index) +
      replacement +
      result.substring(match.index + matchedText.length);

    // Update regex lastIndex
    regex.lastIndex = match.index + replacement.length;

    count++;

    if (debug) {
      log.push({
        category,
        pattern: oldPattern,
        replacement: newPattern,
        before,
        after: result
      });
    }
  }

  return { text: result, count };
}

/**
 * Applies bracket-preserving replacements for all rules in a category
 */
function applyBracketPreservingReplacements(
  text: string,
  rules: { [key: string]: string },
  category: string,
  maxIterations: number,
  debug: boolean,
  log: ReplacementLogEntry[]
): { text: string; count: number } {
  let result = text;
  let totalCount = 0;

  for (const [pattern, replacement] of Object.entries(rules)) {
    if (result.includes(pattern)) {
      const { text: newText, count } = applyBracketPreservingReplacement(
        result,
        pattern,
        replacement,
        maxIterations,
        debug,
        log,
        category
      );
      result = newText;
      totalCount += count;
    }
  }

  return { text: result, count: totalCount };
}

/**
 * Processes a line of text through legacy replacement rules
 *
 * @param line - A single line from the XML document (e.g., `<lb.../> <w>text</w>`)
 * @param options - Processing options
 * @returns Result with transformed text and metadata
 *
 * @example
 * ```typescript
 * const result = processLegacyLine(
 *   '<lb txtid="KOR2_TEST_XML" lnr="Rs iv 833" lg="Hit"/> <w><aGr>LÚKUŠ₇</aGr></w>',
 *   { debug: true }
 * );
 * console.log(result.text); // '<lb.../> <w><d>LÚ</d><sGr>KUŠ₇</sGr></w>'
 * ```
 */
export function processLegacyLine(
  line: string,
  options: ReplacementOptions = {}
): ReplacementResult {
  const {
    debug = false,
    categories = ['varia', 'heth', 'logograms'],
    maxIterations = 24
  } = options;

  let result = line;
  let totalReplacements = 0;
  const log: ReplacementLogEntry[] = [];

  // Process each category in order
  for (const categoryName of categories) {
    const category = replacementRules.categories[categoryName];
    if (!category) {
      console.warn(`Unknown category: ${categoryName}`);
      continue;
    }

    if (category.preserveBrackets) {
      // Apply bracket-preserving replacements
      const { text, count } = applyBracketPreservingReplacements(
        result,
        category.rules,
        categoryName,
        maxIterations,
        debug,
        log
      );
      result = text;
      totalReplacements += count;
    } else {
      // Apply simple string replacements
      const { text, count } = applySimpleReplacements(
        result,
        category.rules,
        categoryName,
        debug,
        log
      );
      result = text;
      totalReplacements += count;
    }
  }

  return {
    text: result,
    replacementCount: totalReplacements,
    ...(debug && { log })
  };
}

/**
 * Processes multiple lines of text
 *
 * @param lines - Array of text lines to process
 * @param options - Processing options
 * @returns Array of results, one per line
 */
export function processLegacyLines(
  lines: string[],
  options: ReplacementOptions = {}
): ReplacementResult[] {
  return lines.map(line => processLegacyLine(line, options));
}

/**
 * Processes an entire document by splitting into lines
 *
 * @param document - Full document text
 * @param options - Processing options
 * @returns Processed document text
 */
export function processLegacyDocument(
  document: string,
  options: ReplacementOptions = {}
): string {
  const lines = document.split('\n');
  const results = processLegacyLines(lines, options);
  return results.map(r => r.text).join('\n');
}

/**
 * Loads custom replacement rules from a JSON object
 *
 * @param customRules - Custom rules to merge with or replace defaults
 * @param merge - If true, merge with defaults; if false, replace (default: true)
 */
export function loadCustomRules(
  customRules: Partial<ReplacementRules>,
  merge = true
): void {
  if (merge) {
    // Deep merge categories
    const categories = customRules.categories || {};
    for (const categoryName in categories) {
      const category = categories[categoryName];
      if (!category) continue;

      if (!replacementRules.categories[categoryName]) {
        replacementRules.categories[categoryName] = category;
      } else {
        replacementRules.categories[categoryName].rules = {
          ...replacementRules.categories[categoryName].rules,
          ...category.rules
        };
      }
    }
  } else {
    // Replace entirely
    replacementRules = customRules as ReplacementRules;
  }
}

/**
 * Gets the current replacement rules
 */
export function getReplacementRules(): ReplacementRules {
  return replacementRules;
}

/**
 * Gets list of available categories
 */
export function getAvailableCategories(): string[] {
  return Object.keys(replacementRules.categories);
}

// ============================================================================
// Exports
// ============================================================================

export default {
  processLegacyLine,
  processLegacyLines,
  processLegacyDocument,
  loadCustomRules,
  getReplacementRules,
  getAvailableCategories,
  // Also export helper functions for advanced usage
  tokenizeString,
  normalizeBrackets,
  escapeRegex
};