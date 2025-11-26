import BasicSegmenter, {PartialAnalysis} from './basicSegmenter';
import { getPos } from '../partsOfSpeech/partsOfSpeech';
import { MorphologicalAnalysis, SingleMorphologicalAnalysisWithoutEnclitics,
  MultiMorphologicalAnalysisWithoutEnclitics
} from '../../../model/morphologicalAnalysis';
import { makeAnalysisOptions, getMorphTags, formIsFragment } from '../common/utils';
import { basicGetStem } from '../common/splitter';
import { isValid } from '../dict/morphologicalAnalysisValidator';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';

export class Analysis extends PartialAnalysis {
  pos: string;

  constructor(segmentation: string, translation: string, morphTags: string[], pos: string) {
    super(segmentation, translation, morphTags);
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

export class Segmenter {
  segmenters = new Map<string, BasicSegmenter>();

  add(transcription: string, analysis: MorphologicalAnalysis) {
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
      segmenter.add(transcription, segmentation, translation, morphTags);
    }
  }

  segment(wordform: string): MorphologicalAnalysis[] {
    const result: MorphologicalAnalysis[] = [];
    for (const [pos, segmenter] of this.segmenters) {
      const partialAnalyses = segmenter.segment(wordform);
      for (const partialAnalysis of partialAnalyses) {
        const analysis = new Analysis(
          partialAnalysis.segmentation,
          partialAnalysis.translation,
          partialAnalysis.morphTags,
          pos
        );
        result.push(analysis.toMorphologicalAnalysis());
      }
    }
    if (result.length === 0) {
      for (const [pos, segmenter] of this.segmenters) {
        const partialAnalyses = segmenter.segmentOov(wordform);
        for (const partialAnalysis of partialAnalyses) {
          const segmentation = partialAnalysis.segmentation;
          const stem = basicGetStem(segmentation);
          if (stem.length >= 2) {
            const analysis = new Analysis(
              partialAnalysis.segmentation,
              partialAnalysis.translation,
              partialAnalysis.morphTags,
              pos
            );
            result.push(analysis.toMorphologicalAnalysis());
          }
        }
      }
    }
    return result;
  }
}

export function createSegmenter(dict: Map<string, Set<string>>): Segmenter {
  const segmenter = new Segmenter();
  for (const [transcription, analyses] of dict.entries()) {
    if (!formIsFragment(transcription)) {
      for (const analysis of analyses) {
        if (isValid(analysis)) {
          const morphologicalAnalysis = readMorphAnalysisValue(analysis);
          if (morphologicalAnalysis !== undefined) {
            segmenter.add(transcription, morphologicalAnalysis);
          }
        }
      }
    }
  }
  return segmenter;
}
