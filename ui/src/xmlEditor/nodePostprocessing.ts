import { XmlElementNode } from 'simple_xml';
import { readSelectedMorphology, SelectedMorphAnalysis } from '../model/selectedMorphologicalAnalysis';
import { readMorphologiesFromNode, MorphologicalAnalysis } from '../model/morphologicalAnalysis';
import { isSelected } from './hur/morphologicalAnalysis/auxiliary';
import update, { Spec } from 'immutability-helper';

export function postprocessNode(node: XmlElementNode): XmlElementNode {
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
