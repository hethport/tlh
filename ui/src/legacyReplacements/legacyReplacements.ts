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
  /** Whether we're in an XML editor context - enables XML-dependent word-split rules */
  isXmlContext?: boolean;
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

const TOKEN_PATTERN = /^(([^<])|(<[^>]*>))(.*)/u;

const DIRT_PATTERN = ')([\\[\\]\\*⸢⸣〈〉!?°_]*)(';

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

    tokens.push(match[1]);
    remaining = match[4];
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
  let prefixLen = 0;
  while (
    prefixLen < oldTokens.length &&
    prefixLen < newTokens.length &&
    oldTokens[prefixLen] === newTokens[prefixLen]
    ) {
    prefixLen++;
  }

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

  result = result.replace(/⸢-/g, '-⸢');
  result = result.replace(/⸢\./g, '.⸢');
  result = result.replace(/\[-/g, '-[');
  result = result.replace(/\[\./g, '.[');

  result = result.replace(/-⸣/g, '⸣-');
  result = result.replace(/\.⸣/g, '⸣.');
  result = result.replace(/-\]/g, ']-');
  result = result.replace(/\.\]/g, '].');

  result = result.replace(/ ⸣/g, '⸣ ');
  result = result.replace(/ \]/g, '] ');
  result = result.replace(/⸢ /g, ' ⸢');
  result = result.replace(/\[ /g, ' [');

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

  // Skip bracket-preserving for XML - only use it for philological brackets
  // If the line contains any XML tags, use simple replacement for ALL patterns
  const HAS_XML_TAGS_IN_TEXT = /<[a-zA-Z]/;
  if (HAS_XML_TAGS_IN_TEXT.test(text)) {
    // This line contains XML tags - use simple replacement to avoid corrupting them
    const before = result;
    result = result.replace(new RegExp(escapeRegex(oldPattern), 'g'), newPattern);
    if (before !== result) {
      count = 1;
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

  // Check if the pattern actually contains philological brackets
  // If not, use simple replacement instead
  // eslint-disable-next-line no-useless-escape
  const BRACKET_PATTERN = /[\[\]⸢⸣〈〉]/;
  if (!BRACKET_PATTERN.test(oldPattern) && !BRACKET_PATTERN.test(text)) {
    const before = result;
    result = result.replace(new RegExp(escapeRegex(oldPattern), 'g'), newPattern);
    if (before !== result) {
      count = 1;
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

  const oldTokens = tokenizeString(oldPattern);
  const newTokens = tokenizeString(newPattern);

  const { prefixLen, oldSuffixStart, newSuffixStart } = findCommonAffixes(
    oldTokens,
    newTokens
  );

  const searchPattern = buildSearchPattern(oldTokens);
  const regex = new RegExp(searchPattern, 'gu');

  const replacementTemplate: string[] = [];
  for (let i = 0; i < newTokens.length; i++) {
    replacementTemplate.push(newTokens[i]);
    replacementTemplate.push('');
  }

  let iterations = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(result)) && iterations < maxIterations) {
    iterations++;

    const matchedText = match[0];
    const before = result;

    const instance = [...replacementTemplate];

    for (let i = 0; i < prefixLen; i++) {
      const bracketIdx = i * 2 + 1;
      if (bracketIdx < match.length) {
        instance[i * 2 + 1] = match[bracketIdx] || '';
      }
    }

    const middleCount = oldSuffixStart - prefixLen;
    for (let i = 0; i < middleCount; i++) {
      const oldIdx = (prefixLen + i) * 2 + 1;

      const proportion = (newSuffixStart - prefixLen) / (oldSuffixStart - prefixLen);
      const newIdx = Math.round((prefixLen + i * proportion) * 2 + 1);

      if (oldIdx < match.length && newIdx < instance.length) {
        instance[newIdx] = (instance[newIdx] || '') + (match[oldIdx] || '');
      }
    }

    const oldSuffixCount = oldTokens.length - oldSuffixStart;
    for (let i = 0; i < oldSuffixCount; i++) {
      const oldIdx = (oldSuffixStart + i) * 2 + 1;
      const newIdx = (newSuffixStart + i) * 2 + 1;

      if (oldIdx < match.length && newIdx < instance.length) {
        instance[newIdx] = match[oldIdx] || '';
      }
    }

    let replacement = instance.join('');
    replacement = normalizeBrackets(replacement);

    result = result.substring(0, match.index) +
      replacement +
      result.substring(match.index + matchedText.length);

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
 * // For raw simtex input (TransliterationTextArea)
 * const result = processLegacyLine(line, { isXmlContext: false });
 *
 * // For XML editor context (XmlDocumentEditor)
 * const result = processLegacyLine(line, { isXmlContext: true });
 * ```
 */
export function processLegacyLine(
  line: string,
  options: ReplacementOptions = {}
): ReplacementResult {
  const {
    debug = false,
    categories = ['varia', 'heth', 'logograms'],
    maxIterations = 24,
    isXmlContext = false
  } = options;

  let result = line;
  let totalReplacements = 0;
  const log: ReplacementLogEntry[] = [];

  for (const categoryName of categories) {
    const category = replacementRules.categories[categoryName];
    if (!category) {
      console.warn(`Unknown category: ${categoryName}`);
      continue;
    }

    // Filter rules based on context
    let rulesToApply = category.rules;
    if (!isXmlContext && categoryName === 'logograms') {
      // In non-XML context (e.g., TransliterationTextArea), exclude word-split rules
      rulesToApply = {};
      for (const [pattern, replacement] of Object.entries(category.rules)) {
        // Skip rules that split words across XML elements
        if (!replacement.includes('</w> <w><sGr>')) {
          rulesToApply[pattern] = replacement;
        }
      }
    }

    if (category.preserveBrackets) {
      const { text, count } = applyBracketPreservingReplacements(
        result,
        rulesToApply,
        categoryName,
        maxIterations,
        debug,
        log
      );
      result = text;
      totalReplacements += count;
    } else {
      const { text, count } = applySimpleReplacements(
        result,
        rulesToApply,
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

export default {
  processLegacyLine,
  processLegacyLines,
  processLegacyDocument,
  loadCustomRules,
  getReplacementRules,
  getAvailableCategories,
  tokenizeString,
  normalizeBrackets,
  escapeRegex
};