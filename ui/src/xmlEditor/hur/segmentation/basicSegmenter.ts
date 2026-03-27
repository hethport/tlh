import { getStemAndGrammaticalMorphemesWithBoundary } from '../common/splitter';
import { add, removeMacron, groupBy } from '../common/utils';
import SuffixTrie from './suffixTrie';
import { startsWithExceptForVowelLength, endsWithExceptForVowelLength } from '../common/stringUtils';
import { apllyMedialVoicing } from '../transduction/transcribe';
import { simplifyTranscription } from '../transduction/simplifyTranscription';
import { LookupConfig } from '../../lookupConfig';
import { getPrefixWithNonBracketSymbolCount } from '../common/brackets';
import { allomorphyIsValid, suffixChainAllomorphyIsValidInSomeContext } from './allomorphyValidation';
import { removeBrackets } from '../common/brackets';

const maximalDeletionCount = 1;
const minimalFrequency = 1;
const sep = '@';

export class Stem {
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
  surfaceForm: string;
  segmentation: string;
  morphTag: string;

  constructor(surfaceForm: string, segmentation: string, morphTag: string) {
    this.surfaceForm = surfaceForm;
    this.segmentation = segmentation;
    this.morphTag = morphTag;
  }

  toString(): string {
    return this.surfaceForm + '@' + this.segmentation + '@' + this.morphTag;
  }
}

export function parseSuffixChain(repr: string): SuffixChain {
  const [surfaceForm, segmentation, morphTag] = repr.split(sep);
  return new SuffixChain(surfaceForm, segmentation, morphTag);
}

const inParentheses = /\(.*\)/g;
const boundary = /[-=+]/g;

const initial = /(?<=^|\.)(\p{Lu})(?!\p{Lu}|$)/gu;
function lowerCaseInitials(stem: string) {
  return stem.replaceAll(initial, (letter: string) => letter.toLowerCase());
}

const dotNotBetweenUppercase = /(?<!\p{Lu})\.|\.(?!\p{Lu})/gu;
function removeDotsUnlessBetweenUppercase(stem: string): string {
  return apllyMedialVoicing(stem.replaceAll(dotNotBetweenUppercase, ''));
}

function preprocessStem(stem: string, lookupConfig: LookupConfig): string {
  return simplifyTranscription(
    removeDotsUnlessBetweenUppercase(
      lowerCaseInitials(
        stem
        .replaceAll(inParentheses, '')
        .replaceAll('+', '')
      )
    ),
    lookupConfig
  );
}

function preprocessSuffixChain(stem: string, lookupConfig: LookupConfig): string {
  return simplifyTranscription(
    stem.replaceAll(inParentheses, '')
        .replaceAll(boundary, ''),
    lookupConfig
  );
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
  suffixChainFrequency: number;


  constructor(segmentation: string, translation: string, morphTags: string[], surfaceSuffixChain: string, suffixChainFrequency: number) {
    this.segmentation = segmentation;
    this.translation = translation;
    this.morphTags = morphTags;
    this.surfaceSuffixChain = surfaceSuffixChain;
    this.suffixChainFrequency = suffixChainFrequency;
  }
}

export default class BasicSegmenter {
  stems = new Map<string, Set<string>>();
  suffixChains = new Map<string, Set<string>>();
  suffixTrie = new SuffixTrie();
  frequencies = new Map<string, number>();
  sources = new Map<string, Set<string>>();

  isFrequentEnough(suffixChain: SuffixChain): boolean {
    const frequency = this.frequencies.get(suffixChain.toString());
    return frequency !== undefined && frequency >= minimalFrequency;
  }

  getSources(suffixChain: SuffixChain): string[] {
    const sources = this.sources.get(suffixChain.toString());
    if (sources === undefined) {
      return [];
    } else {
      return Array.from(sources).sort();
    }
  }

  add(transcription: string, segmentation: string, translation: string, morphTags: string[],
      frequency: number, lookupConfig: LookupConfig, detailedTranscription: string) {
    const [underlyingStem, underlyingSuffixChain] =
      getStemAndGrammaticalMorphemesWithBoundary(segmentation);
    if (underlyingStem !== '') {
      const preprocessedStem = preprocessStem(underlyingStem, lookupConfig);
      const preprocessedSuffixChain = preprocessSuffixChain(underlyingSuffixChain, lookupConfig);
      const surfaceStem = endsWithExceptForVowelLength(transcription, preprocessedSuffixChain) ?
        transcription.substring(0, transcription.length - preprocessedSuffixChain.length) :
        preprocessedStem;
      const surfaceSuffixChain = startsWithExceptForVowelLength(transcription, preprocessedStem) ?
        transcription.substring(preprocessedStem.length) :
        preprocessedSuffixChain;
      if (surfaceStem.length > 0) {
        const stem = new Stem(underlyingStem, translation);
        add(this.stems, surfaceStem, stem.toString());
      }
      if (preprocessedSuffixChain.length - surfaceSuffixChain.length > maximalDeletionCount) {
        return;
      }
      if (!suffixChainAllomorphyIsValidInSomeContext(surfaceSuffixChain, underlyingSuffixChain)) {
        return;
      }
      for (const morphTag of morphTags) {
        const suffixChain = new SuffixChain(surfaceSuffixChain, underlyingSuffixChain, morphTag);
        const suffixChainRepr = suffixChain.toString();
        add(this.suffixChains, surfaceSuffixChain, suffixChainRepr);
        let suffixChainFrequency = this.frequencies.get(suffixChainRepr);
        if (suffixChainFrequency === undefined) {
          suffixChainFrequency = 0;
        }
        suffixChainFrequency += frequency;
        this.frequencies.set(suffixChainRepr, suffixChainFrequency);
        const source = detailedTranscription + ' @ ' + segmentation + ' @ ' + translation;
        add(this.sources, suffixChainRepr, source);
      }
      this.suffixTrie.add(surfaceSuffixChain);
    }
  }

  getSuffixChainFrequency(surfaceSuffixChain: string,
                          segmentedSuffixChain: string, morphTags: string[]): number {
    let suffixChainFrequency = 0;
    for (const morphTag of morphTags) {
      const suffixChain = new SuffixChain(surfaceSuffixChain, segmentedSuffixChain, morphTag);
      const suffixChainRepr = suffixChain.toString();
      const currentFrequency = this.frequencies.get(suffixChainRepr);
      if (currentFrequency !== undefined) {
        suffixChainFrequency += currentFrequency;
      }
    }
    return suffixChainFrequency / morphTags.length;
  }

  getMorphTagComparer(surfaceSuffixChain: string, underlyingSuffixChain: string):
    ((morphTag1: string, morphTag2: string) => number) {
    const getFrequency = (morphTag: string) => {
      const suffixChain = new SuffixChain(surfaceSuffixChain, underlyingSuffixChain, morphTag);
      return this.frequencies.get(suffixChain.toString()) || 0;
    };
    return (morphTag1: string, morphTag2: string) => {
      return - (getFrequency(morphTag1) - getFrequency(morphTag2));
    };
  }

  segment(originalWordform: string): PartialAnalysis[] {
    const wordform = removeBrackets(originalWordform);
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
          const suffixChains: SuffixChain[] = Array.from(options)
            .map(parseSuffixChain).filter(this.isFrequentEnough.bind(this));
          const grouped: Map<string, Set<string>> = groupBy(
            suffixChains,
            (suffixChain: SuffixChain) => suffixChain.segmentation,
            (suffixChain: SuffixChain) => suffixChain.morphTag
          );
          for (const [segmentedSuffixChain, morphTagSet] of grouped) {
            const morphTags = Array.from(morphTagSet).sort(
              this.getMorphTagComparer.bind(this)(suffixChain, segmentedSuffixChain)
            );
            for (const stem of stems) {
              const [underlyingStem, translation] = stem.split('@');
              if (allomorphyIsValid(surfaceStem, underlyingStem, suffixChain, segmentedSuffixChain)) {
                const segmentation = joinStemAndSuffixChain(underlyingStem, segmentedSuffixChain);
                const suffixChainFrequency = this.getSuffixChainFrequency(suffixChain,
                                                                          segmentedSuffixChain,
                                                                          morphTags);
                const result = new PartialAnalysis(segmentation, translation, morphTags,
                                                   suffixChain, suffixChainFrequency);
                segmentations.push(result);
              }
            }
          }
        }
      }
    }
    return segmentations;
  }
  
  segmentOov(originalWordform: string, detailedTranscription: string): PartialAnalysis[] {
    const wordform = removeBrackets(originalWordform);
    const segmentations: PartialAnalysis[] = [];
    const suffixChain: string | null = this.suffixTrie.getLongestSuffix(wordform);
    if (suffixChain !== null) {
      const options = this.suffixChains.get(suffixChain);
      if (options !== undefined) {
        const surfaceStem = wordform.substring(0, wordform.length - suffixChain.length);
        const suffixChains: SuffixChain[] = Array.from(options)
          .map(parseSuffixChain).filter(this.isFrequentEnough.bind(this));
        const grouped: Map<string, Set<string>> = groupBy(
          suffixChains,
          (suffixChain: SuffixChain) => suffixChain.segmentation,
          (suffixChain: SuffixChain) => suffixChain.morphTag
        );
        for (const [segmentedSuffixChain, morphTagSet] of grouped) {
          let morphTags = Array.from(morphTagSet).sort(
            this.getMorphTagComparer.bind(this)(suffixChain, segmentedSuffixChain)
          );
          if (morphTags.length > 1) {
            morphTags = morphTags.filter((morphTag: string) => morphTag !== '');
          }
          const underlyingStem = getPrefixWithNonBracketSymbolCount(detailedTranscription,
                                                                    surfaceStem.length);
          if (allomorphyIsValid(surfaceStem, underlyingStem, suffixChain)) {
            const translation = '';
            const segmentation = joinStemAndSuffixChain(underlyingStem, segmentedSuffixChain);
            const suffixChainFrequency = this.getSuffixChainFrequency(suffixChain,
                                                                      segmentedSuffixChain, morphTags);
            const result =
              new PartialAnalysis(segmentation, translation, morphTags, suffixChain, suffixChainFrequency);
            segmentations.push(result);
          }
        }
      }
    }
    return segmentations;
  }
}