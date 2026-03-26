import BasicSegmenter, {PartialAnalysis} from './basicSegmenter';
import { getPos } from '../partsOfSpeech/partsOfSpeech';
import { MorphologicalAnalysis, SingleMorphologicalAnalysisWithoutEnclitics,
  MultiMorphologicalAnalysisWithoutEnclitics
} from '../../../model/morphologicalAnalysis';
import { makeAnalysisOptions, getMorphTags, formIsFragment } from '../common/utils';
import { basicGetStem } from '../common/splitter';
import { isValid } from '../dict/morphologicalAnalysisValidator';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import { quickGetAttestations } from '../concordance/concordance';
import { LookupConfig } from '../../lookupConfig';
import { simplifyTranscription } from '../transduction/simplifyTranscription';

const openClassPartsOfSpeech = ['noun', 'verb', 'NF', 'ADJ'];

function getFrequency(ma: MorphologicalAnalysis): number {
  return quickGetAttestations(ma).length;
}

export class Analysis extends PartialAnalysis {
  pos: string;

  constructor(segmentation: string, translation: string, morphTags: string[], pos: string,
              surfaceSuffixChain: string, suffixChainFrequency: number) {
    super(segmentation, translation, morphTags, surfaceSuffixChain, suffixChainFrequency);
    this.pos = pos;
  }

  toMorphologicalAnalysis(): MorphologicalAnalysis {
    if (this.morphTags.length === 1) {
      const ma: SingleMorphologicalAnalysisWithoutEnclitics = {
        _type: 'SingleMorphAnalysisWithoutEnclitics',
        number: 1,
        selected: false,
        encliticsAnalysis: undefined,
        referenceWord: this.segmentation,
        translation: this.translation,
        analysis: this.morphTags[0],
        paradigmClass: this.pos,
        determinative: ''
      };
      return ma;
    } else {
      const ma: MultiMorphologicalAnalysisWithoutEnclitics = {
        _type: 'MultiMorphAnalysisWithoutEnclitics',
        number: 1,
        encliticsAnalysis: undefined,
        referenceWord: this.segmentation,
        translation: this.translation,
        analysisOptions: makeAnalysisOptions(this.morphTags),
        paradigmClass: this.pos,
        determinative: ''
      };
      return ma;
    }
  }
}

function compareAnalyses(analysis1: Analysis, analysis2: Analysis): number {
  // We negate the frequency difference to get descending
  // sorting by frequency.
  return - (analysis1.suffixChainFrequency - analysis2.suffixChainFrequency);
}

export class Segmenter {
  segmenters = new Map<string, BasicSegmenter>();

  add(transcription: string, analysis: MorphologicalAnalysis, lookupConfig: LookupConfig,
      detailedTranscription: string) {
    const morphTags = getMorphTags(analysis);
    if (morphTags !== null) {
      const segmentation = analysis.referenceWord;
      const translation = analysis.translation;
      const template = analysis.paradigmClass;
      const pos = getPos(template, morphTags[0], translation);
      let segmenter = this.segmenters.get(pos);
      if (segmenter === undefined) {
        segmenter = new BasicSegmenter();
        this.segmenters.set(pos, segmenter);
      }
      const frequency = getFrequency(analysis);
      segmenter.add(transcription, segmentation, translation, morphTags, frequency, lookupConfig,
                    detailedTranscription);
    }
  }

  segment(wordform: string, detailedTranscription: string): MorphologicalAnalysis[] {
    let result: Analysis[] = [];
    for (const [pos, segmenter] of this.segmenters) {
      const partialAnalyses = segmenter.segment(wordform);
      for (const partialAnalysis of partialAnalyses) {
        const analysis = new Analysis(
          partialAnalysis.segmentation,
          partialAnalysis.translation,
          partialAnalysis.morphTags,
          pos,
          partialAnalysis.surfaceSuffixChain,
          partialAnalysis.suffixChainFrequency
        );
        result.push(analysis);
      }
    }
    if (result.length === 0) {
      let maxLength = 0;
      for (const pos of openClassPartsOfSpeech) {
        const segmenter = this.segmenters.get(pos);
        if (segmenter === undefined) {
          continue;
        }
        const partialAnalyses = segmenter.segmentOov(wordform, detailedTranscription);
        for (const partialAnalysis of partialAnalyses) {
          const { segmentation, surfaceSuffixChain } = partialAnalysis;
          const stem = basicGetStem(segmentation);
          if (stem.length >= 2) {
            if (surfaceSuffixChain.length > maxLength) {
              maxLength = surfaceSuffixChain.length;
              result = [];
            } else if (surfaceSuffixChain.length < maxLength) {
              continue;
            }
            const analysis = new Analysis(
              partialAnalysis.segmentation,
              partialAnalysis.translation,
              partialAnalysis.morphTags,
              pos,
              surfaceSuffixChain,
              partialAnalysis.suffixChainFrequency
            );
            result.push(analysis);
          }
        }
      }
    }
    return result.sort(compareAnalyses)
      .map(analysis => analysis.toMorphologicalAnalysis());
  }
}

export function createSegmenter(dict: Map<string, Set<string>>, lookupConfig: LookupConfig): Segmenter {
  const segmenter = new Segmenter();
  for (const [transcription, analyses] of dict.entries()) {
    if (!formIsFragment(transcription)) {
      for (const analysis of analyses) {
        if (isValid(analysis)) {
          const morphologicalAnalysis = readMorphAnalysisValue(analysis);
          if (morphologicalAnalysis !== undefined) {
            const simplifiedTranscription = simplifyTranscription(transcription, lookupConfig);
            segmenter.add(simplifiedTranscription, morphologicalAnalysis, lookupConfig, transcription);
          }
        }
      }
    }
  }
  return segmenter;
}
