import { MorphologicalAnalysis, readMorphologiesFromNode, writeMorphAnalysisValue }
  from '../model/morphologicalAnalysis';
import { readSelectedMorphology, SelectedMorphAnalysis }
  from '../model/selectedMorphologicalAnalysis';
import { SelectableLetteredAnalysisOption as Option } from '../model/analysisOptions';
import { XmlElementNode, Attributes } from 'simple_xml';
import update, { Spec } from 'immutability-helper';

function postprocessMorphology(ma: MorphologicalAnalysis): MorphologicalAnalysis | null {
  if (ma._type === 'MultiMorphAnalysisWithoutEnclitics') {
    const { analysisOptions } = ma;
    const newAnalysisOptions: Option[] = analysisOptions
      .filter((analysisOption: Option) => analysisOption.selected);
    if (newAnalysisOptions.length < analysisOptions.length) {
      return update(ma, { analysisOptions: { $set: newAnalysisOptions } });
    }
  }
  return null;
}

function generateSpecWithPostprocessedMorphologies(node: XmlElementNode): Spec<XmlElementNode> | null {
  const attributes: Spec<Attributes> = {};
  const selectedMorphologies: SelectedMorphAnalysis[] =
    node.attributes.mrp0sel !== undefined
    ? readSelectedMorphology(node.attributes.mrp0sel)
    : [];
  const morphologies = readMorphologiesFromNode(node, selectedMorphologies);
  for (const morphology of morphologies) {
    const postprocessedMorphology = postprocessMorphology(morphology);
    if (postprocessedMorphology !== null) {
      const analysis = writeMorphAnalysisValue(postprocessedMorphology);
      attributes['mrp' + morphology.number] = { $set: analysis };
    }
  }
  if (Object.keys(attributes).length > 0) {
    const spec: Spec<XmlElementNode> = { attributes };
    return spec;
  } else {
    return null;
  }
}

export function postprocessNodeMorphologies(node: XmlElementNode): XmlElementNode {
  const spec = generateSpecWithPostprocessedMorphologies(node);
  if (spec === null) {
    return node;
  } else {
    return update(node, spec);
  }
}
