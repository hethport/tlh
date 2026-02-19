import { getStemAndGrammaticalMorphemesWithBoundary } from '../common/splitter';
import { add, removeMacron, groupBy } from '../common/utils';
import SuffixTrie from './suffixTrie';
import { startsWithExceptForVowelLength, endsWithExceptForVowelLength } from '../common/stringUtils';

const maximalDeletionCount = 1;
const minimalFrequency = 1;
const sep = '@';

class Stem {
  form: string;
  translation: string;

  constructor(form: string, translation: string) {
    this.form = form;
    this.translation = translation;
  }

  toString(): string {
    return this.form + sep + this.translation;
  }
}

export function parseStem(repr: string): Stem {
  const [form, translation] = repr.split(sep);
  return new Stem(form, translation);
}

export class SuffixChain {
  segmentation: string;
  morphTag: string;

  constructor(segmentation: string, morphTag: string) {
    this.segmentation = segmentation;
    this.morphTag = morphTag;
  }

  toString(): string {
    return this.segmentation + '@' + this.morphTag;
  }
}

export function parseSuffixChain(repr: string): SuffixChain {
  const [segmentation, morphTag] = repr.split(sep);
  return new SuffixChain(segmentation, morphTag);
}

const inParentheses = /\(.*\)/g;
const boundary = /[-=]/g;

function preprocessStem(stem: string): string {
  return stem.replaceAll(inParentheses, '')
    .replaceAll('+', '');
}

function preprocessSuffixChain(stem: string): string {
  return stem.replaceAll(inParentheses, '').replaceAll(boundary, '');
}

function joinStemAndSuffixChain(stem: string, suffixChain: string): string {
  const joined = stem + suffixChain;
  // This occurs after Sumerographic stems
  return joined.replaceAll('--', '-');
}

export class PartialAnalysis {
  segmentation: string;
  translation: string;
  morphTags: string[];
  surfaceSuffixChain: string;


  constructor(segmentation: string, translation: string, morphTags: string[], surfaceSuffixChain: string) {
    this.segmentation = segmentation;
    this.translation = translation;
    this.morphTags = morphTags;
    this.surfaceSuffixChain = surfaceSuffixChain;
  }
}

export default class BasicSegmenter {
  stems = new Map<string, Set<string>>();
  suffixChains = new Map<string, Set<string>>();
  suffixTrie = new SuffixTrie();
  frequencies = new Map<string, number>();

  isFrequentEnough(suffixChain: SuffixChain): boolean {
    const frequency = this.frequencies.get(suffixChain.toString());
    return frequency !== undefined && frequency >= minimalFrequency;
  }

  add(transcription: string, segmentation: string, translation: string, morphTags: string[],
      frequency: number) {
    const [underlyingStem, underlyingSuffixChain] =
      getStemAndGrammaticalMorphemesWithBoundary(segmentation);
    if (underlyingStem !== '') {
      const preprocessedStem = preprocessStem(underlyingStem);
      const preprocessedSuffixChain = preprocessSuffixChain(underlyingSuffixChain);
      const surfaceStem = endsWithExceptForVowelLength(transcription, preprocessedSuffixChain) ?
        transcription.substring(0, transcription.length - preprocessedSuffixChain.length) :
        preprocessedStem;
      const surfaceSuffixChain = startsWithExceptForVowelLength(transcription, preprocessedStem) ?
        transcription.substring(preprocessedStem.length) :
        preprocessedSuffixChain;
      const stem = new Stem(underlyingStem, translation);
      add(this.stems, surfaceStem, stem.toString());
      if (preprocessedSuffixChain.length - surfaceSuffixChain.length > maximalDeletionCount) {
        return;
      }
      for (const morphTag of morphTags) {
        const suffixChain = new SuffixChain(underlyingSuffixChain, morphTag);
        const suffixChainRepr = suffixChain.toString();
        add(this.suffixChains, surfaceSuffixChain, suffixChainRepr);
        let suffixChainFrequency = this.frequencies.get(suffixChainRepr);
        if (suffixChainFrequency === undefined) {
          suffixChainFrequency = 0;
        }
        suffixChainFrequency += frequency;
        this.frequencies.set(suffixChainRepr, suffixChainFrequency);
      }
      this.suffixTrie.add(surfaceSuffixChain);
    }
  }

  segment(wordform: string): PartialAnalysis[] {
    const segmentations: PartialAnalysis[] = [];
    const candidates: string[] = this.suffixTrie.getAllSuffixes(wordform);
    const simplified = removeMacron(wordform);
    if (simplified !== wordform) {
      for (const newCandidate in this.suffixTrie.getAllSuffixes(simplified)) {
        if (!candidates.includes(newCandidate)) {
          candidates.push(newCandidate);
        }
      }
    }
    for (const suffixChain of candidates) {
      const options = this.suffixChains.get(suffixChain);
      if (options !== undefined) {
        const surfaceStem = wordform.substring(0, wordform.length - suffixChain.length);
        const stems = this.stems.has(surfaceStem) ?
          this.stems.get(surfaceStem) :
          this.stems.get(removeMacron(surfaceStem));
        if (stems !== undefined) {
          const suffixChains: SuffixChain[] = Array.from(options).map(option => {
            const [segmentation, morphTag] = option.split('@');
            return new SuffixChain(segmentation, morphTag);
          }).filter(this.isFrequentEnough.bind(this));
          const grouped: Map<string, Set<string>> = groupBy(
            suffixChains,
            (suffixChain: SuffixChain) => suffixChain.segmentation,
            (suffixChain: SuffixChain) => suffixChain.morphTag
          );
          for (const [segmentedSuffixChain, morphTagSet] of grouped) {
            const morphTags = Array.from(morphTagSet).sort();
            for (const stem of stems) {
              const [underlyingStem, translation] = stem.split('@');
              const segmentation = joinStemAndSuffixChain(underlyingStem, segmentedSuffixChain);
              const result =
                new PartialAnalysis(segmentation, translation, morphTags, suffixChain);
              segmentations.push(result);
            }
          }
        }
      }
    }
    return segmentations;
  }
  
  segmentOov(wordform: string): PartialAnalysis[] {
    const segmentations: PartialAnalysis[] = [];
    const suffixChain: string | null = this.suffixTrie.getLongestSuffix(wordform);
    if (suffixChain !== null && suffixChain !== '') {
      const options = this.suffixChains.get(suffixChain);
      if (options !== undefined) {
        const surfaceStem = wordform.substring(0, wordform.length - suffixChain.length);
        const suffixChains: SuffixChain[] = Array.from(options).map(option => {
          const [segmentation, morphTag] = option.split('@');
          return new SuffixChain(segmentation, morphTag);
        }).filter(this.isFrequentEnough.bind(this));
        const grouped: Map<string, Set<string>> = groupBy(
          suffixChains,
          (suffixChain: SuffixChain) => suffixChain.segmentation,
          (suffixChain: SuffixChain) => suffixChain.morphTag
        );
        for (const [segmentedSuffixChain, morphTagSet] of grouped) {
          const morphTags = Array.from(morphTagSet).sort();
          const underlyingStem = surfaceStem; 
          const translation = '';
          const segmentation = joinStemAndSuffixChain(underlyingStem, segmentedSuffixChain);
          const result =
            new PartialAnalysis(segmentation, translation, morphTags, suffixChain);
          segmentations.push(result);
        }
      }
    }
    return segmentations;
  }
}