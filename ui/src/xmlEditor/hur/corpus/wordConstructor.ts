import { XmlElementNode } from 'simple_xml';
import { readSelectedMorphology, SelectedMorphAnalysis }
  from '../../../model/selectedMorphologicalAnalysis';
import { readMorphologiesFromNode, MorphologicalAnalysis,
  SingleMorphologicalAnalysisWithoutEnclitics,
  MultiMorphologicalAnalysisWithoutEnclitics } from '../../../model/morphologicalAnalysis';
import { LetteredAnalysisOption } from '../../../model/analysisOptions';
import { isSelected, getFirstSelectedMorphTag } from '../morphologicalAnalysis/auxiliary';
import { makeGloss } from '../common/auxiliary';
import { getTranslationAndMorphTag } from '../common/splitter';
import { xmlElementNode, writeNode, writeNodeWithDefaultWriteConfig } from 'simple_xml';
import { tlhXmlEditorConfig } from '../../tlhXmlEditorConfig';
import { Word } from './wordType';

/*
 * MORPHOLOGICAL ANALYSIS REPLACEMENT
 */

class CorpusMorphologicalAnalysis {
  segmentation: string;
  translation: string;
  morphTag: string;

  constructor(segmentation: string, translation: string, morphTag: string) {
    this.segmentation = segmentation;
    this.translation = translation;
    this.morphTag = morphTag;
  }

  toWord(transliteration: string): Word {
    const segmentation = this.segmentation;
    const gloss = makeGloss(this.translation, this.morphTag);
    return { transliteration, segmentation, gloss };
  }
}

/*
 * Assuming the user has requested the replacement of a morphological analysis oldMa
 * with an array of morphological analyses newMas,
 * check if the given word has the specified morphological analysis oldMa
 * and, if it is true, replace oldMa with an appropriate element of newMas.
 */
export function updateMorphologicalAnalysis(word: Word,
                                            oldMa: MorphologicalAnalysis | undefined,
                                            newMas: MorphologicalAnalysis[]): Word {
  if (oldMa !== undefined) {
    const { transliteration } = word;
    const corpusSegmentation = word.segmentation;
    const [corpusTranslation, corpusMorphTag] = getTranslationAndMorphTag(word.gloss);
    if (corpusSegmentation == oldMa.referenceWord && corpusTranslation == oldMa.translation) {
      const corpusMa = replaceIfMorphTagMatches(corpusMorphTag, oldMa, newMas);
      if (corpusMa !== null) {
        return corpusMa.toWord(transliteration);
      }
    }
  }
  return word;
}

/*
 * Assuming the user has requested the replacement of a morphological analysis oldMa
 * with an array of morphological analyses newMas,
 * check if the given word has a morphological tag
 * from the specified morphological analysis oldMa and, if it is true,
 * replace oldMa with an appropriate element of newMas.
 */
function replaceIfMorphTagMatches(corpusMorphTag: string, oldMa: MorphologicalAnalysis,
  newMas: MorphologicalAnalysis[]): CorpusMorphologicalAnalysis | null {
  switch (oldMa._type) {
    case 'SingleMorphAnalysisWithoutEnclitics': {
      if (corpusMorphTag == oldMa.analysis) {
        return replaceSingleMorph(oldMa, newMas);
      }
      break;
    }
    case 'MultiMorphAnalysisWithoutEnclitics': {
      const selectedOption = oldMa.analysisOptions.find(
        ({analysis}: LetteredAnalysisOption) => analysis == corpusMorphTag
      );
      if (selectedOption !== undefined) {
        return replaceMultiMorph(oldMa, selectedOption.letter, newMas);
      }
      break;
    }
  }
  return null;
}

/*
 * Replace oldMa with newMas
 * if newMas contains only one analysis
 * and it is a SingleMorphologicalAnalysis.
 */
function replaceSingleMorph(oldMa: SingleMorphologicalAnalysisWithoutEnclitics,
                            newMas: MorphologicalAnalysis[]): CorpusMorphologicalAnalysis | null {
  if (newMas.length === 1) {
    const newMa = newMas[0];
    if (newMa._type === 'SingleMorphAnalysisWithoutEnclitics') {
      return new CorpusMorphologicalAnalysis(
        newMa.referenceWord, newMa.translation, newMa.analysis
      );
    }
  }
  return null;
}

/*
 * Find an element of newMas which has an a option
 * with the same letter-index that is selected in oldMa
 * and use as a replacement for oldMa.
 */
function replaceMultiMorph(oldMa: MultiMorphologicalAnalysisWithoutEnclitics,
                           selectedLetter: string,
                           newMas: MorphologicalAnalysis[]): CorpusMorphologicalAnalysis | null {
  for (const newMa of newMas) {
    if (newMa._type === 'MultiMorphAnalysisWithoutEnclitics') {
      const matchingOption = newMa.analysisOptions.find(
        (option: LetteredAnalysisOption) => option.letter === selectedLetter
      );
      if (matchingOption !== undefined) {
        return new CorpusMorphologicalAnalysis(
          newMa.referenceWord, newMa.translation, matchingOption.analysis
        );
      }
    }
  }
  return null;
}

/*
 * NEW WORD CONSTRUCTION
 */

function getSegmentationAndGloss(morphologicalAnalysis: MorphologicalAnalysis | undefined): [string, string] {
  let segmentation: string;
  let gloss: string;
  if (morphologicalAnalysis !== undefined) {
    segmentation = morphologicalAnalysis.referenceWord;
    const { translation } = morphologicalAnalysis;
    const morphTag = getFirstSelectedMorphTag(morphologicalAnalysis);
    if (morphTag !== undefined) {
      gloss = makeGloss(translation, morphTag);
    } else {
      gloss = translation;
    }
  } else {
    segmentation = '';
    gloss = '';
  }
  return [segmentation, gloss];
}

export function makeWordFromMorphologies(transliteration: string,
                                         morphologies: MorphologicalAnalysis[]): Word {
  const morphologicalAnalysis = morphologies.find(isSelected);
  const [segmentation, gloss] = getSegmentationAndGloss(morphologicalAnalysis);
  const word = { transliteration, segmentation, gloss };
  return word;
}

export function makeWord(node: XmlElementNode): Word {
  switch (node.tagName) {
    case 'w': {
      const nodeCopyWithoutAttributes = xmlElementNode(node.tagName, undefined, node.children);
      const transliteration = writeNode(nodeCopyWithoutAttributes, tlhXmlEditorConfig.writeConfig)[0];
      const selectedMorphologies: SelectedMorphAnalysis[] = node.attributes.mrp0sel !== undefined
        ? readSelectedMorphology(node.attributes.mrp0sel)
        : [];
      const morphologies = readMorphologiesFromNode(node, selectedMorphologies);
      return makeWordFromMorphologies(transliteration, morphologies);
    }
    default: {
      const transliteration = writeNodeWithDefaultWriteConfig(node)[0];
      return {
        transliteration,
        segmentation: '',
        gloss: ''
      };
    }
  }
}

/*
 * INFORMATIONAL REQUESTS
 */

export function hasGivenAnalysis(word: Word, gloss: string, morphologicalAnalysis: MorphologicalAnalysis): boolean {
  const hasGivenSegmentation = word.segmentation === morphologicalAnalysis.referenceWord;
  const hasGivenGloss = word.gloss === gloss;
  return hasGivenSegmentation && hasGivenGloss;
}
