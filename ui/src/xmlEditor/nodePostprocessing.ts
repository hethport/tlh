import { XmlElementNode } from 'simple_xml';
import { readSelectedMorphology, SelectedMorphAnalysis } from '../model/selectedMorphologicalAnalysis';
import { readMorphologiesFromNode, MorphologicalAnalysis } from '../model/morphologicalAnalysis';
import update, { Spec } from 'immutability-helper';
import { postprocessNodeMorphologies } from './morphologyPostprocessing';

function isSelected(morphologicalAnalysis: MorphologicalAnalysis): boolean {
  switch (morphologicalAnalysis._type) {
    case 'SingleMorphAnalysisWithoutEnclitics':
      return morphologicalAnalysis.selected;
    case 'SingleMorphAnalysisWithSingleEnclitics':
      return morphologicalAnalysis.selected;
    case 'SingleMorphAnalysisWithMultiEnclitics':
      return morphologicalAnalysis.encliticsAnalysis.analysisOptions
        .some(analysisOption => analysisOption.selected);
    case 'MultiMorphAnalysisWithoutEnclitics':
      return morphologicalAnalysis.analysisOptions.some(analysisOption => analysisOption.selected);
    case 'MultiMorphAnalysisWithSingleEnclitics':
      return morphologicalAnalysis.analysisOptions.some(analysisOption => analysisOption.selected);
    case 'MultiMorphAnalysisWithMultiEnclitics':
      return morphologicalAnalysis.selectedAnalysisCombinations.length > 0;
    default:
      // This case should never occur because the list of cases abover is exhaustive.
      return true;
  }
}

function deleteNotSelectedMorphologies(node: XmlElementNode): XmlElementNode {
  const selectedMorphologies: SelectedMorphAnalysis[] = node.attributes.mrp0sel !== undefined
    ? readSelectedMorphology(node.attributes.mrp0sel)
    : [];
  const morphologies = readMorphologiesFromNode(node, selectedMorphologies);
  const notSelected = morphologies
    .filter((morphology: MorphologicalAnalysis) => !isSelected(morphology))
    .map((morphology: MorphologicalAnalysis) => 'mrp' + morphology.number.toString());
  const spec: Spec<XmlElementNode> = { attributes: { $unset: notSelected } };
  return update(node, spec);
}

export function postprocessNode(node: XmlElementNode): XmlElementNode {
  return postprocessNodeMorphologies(deleteNotSelectedMorphologies(node));
}
