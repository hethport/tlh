import { XmlElementNode } from 'simple_xml';
import { readSelectedMorphology, SelectedMorphAnalysis }
  from '../../../model/selectedMorphologicalAnalysis';
import { readMorphologiesFromNode, MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { isSelected, getFirstSelectedMorphTag } from '../morphologicalAnalysis/auxiliary';
import { makeGloss } from '../common/auxiliary';
import { getTranslationAndMorphTag } from '../common/splitter';
import { xmlElementNode, writeNode, writeNodeWithDefaultWriteConfig } from 'simple_xml';
import { tlhXmlEditorConfig } from '../../tlhXmlEditorConfig';

export type Word = {
  transliteration: string;
  segmentation: string;
  gloss: string;
}

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

/*
 * Assuming the user has requested the replacement of a morpholofical analysis oldMa
 * with newMa, check if the given word has a morphological tag
 * from the specified morphological analysis oldMa and, if it is true,
 * return a morphological tag from newMa occupying the same position.
 * Otherwise, return null.
 */
function getNewMorphTag(corpusMorphTag: string, oldMa: MorphologicalAnalysis,
                        newMa: MorphologicalAnalysis): string | null {
  switch (oldMa._type) {
    case 'SingleMorphAnalysisWithoutEnclitics': {
      if (newMa._type === 'SingleMorphAnalysisWithoutEnclitics') {
        if (corpusMorphTag == oldMa.analysis) {
          return newMa.analysis;
        }
      }
      break;
    }
    case 'MultiMorphAnalysisWithoutEnclitics': {
      if (newMa._type === 'MultiMorphAnalysisWithoutEnclitics') {
        const matchingTagIndex = oldMa.analysisOptions.findIndex(
          analysisOption => analysisOption.analysis == corpusMorphTag
        );
        if (matchingTagIndex !== -1) {
          return newMa.analysisOptions[matchingTagIndex].analysis;
        }
      }
      break;
    }
  }
  return null;
}

/*
 * Assuming the user has requested the replacement of a morpholofical analysis oldMa
 * with newMa, check if the given word has the specified morphological analysis oldMa
 * and, if it is true, replace it with newMa.
 */
export function updateMorphologicalAnalysis(word: Word,
                                            oldMa: MorphologicalAnalysis | undefined,
                                            newMa: MorphologicalAnalysis | undefined): Word {
  if (oldMa !== undefined && newMa !== undefined) {
    const { transliteration } = word;
    const corpusSegmentation = word.segmentation;
    const [corpusTranslation, corpusMorphTag] = getTranslationAndMorphTag(word.gloss);
    const segmentation = newMa.referenceWord;
    if (corpusSegmentation == oldMa.referenceWord && corpusTranslation == oldMa.translation) {
      const newMorphTag = getNewMorphTag(corpusMorphTag, oldMa, newMa);
      if (newMorphTag !== null) {
        const gloss = makeGloss(newMa.translation, newMorphTag);
        return { transliteration, segmentation, gloss };
      }
    }
  }
  return word;
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

export function hasGivenAnalysis(word: Word, gloss: string, morphologicalAnalysis: MorphologicalAnalysis): boolean {
  const hasGivenSegmentation = word.segmentation === morphologicalAnalysis.referenceWord;
  const hasGivenGloss = word.gloss === gloss;
  return hasGivenSegmentation && hasGivenGloss;
}
