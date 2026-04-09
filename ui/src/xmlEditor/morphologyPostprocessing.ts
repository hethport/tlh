import { MorphologicalAnalysis, readMorphologiesFromNode, writeMorphAnalysisValue,
         MultiMorphologicalAnalysisWithoutEnclitics, MultiMorphologicalAnalysisWithSingleEnclitics,
         SingleMorphologicalAnalysisWithMultiEnclitics as SingleMorphWithMultiEncl,
         MultiMorphologicalAnalysisWithMultiEnclitics as MultiMorphWithMultiEncl }
  from '../model/morphologicalAnalysis';
import { readSelectedMorphology, SelectedMorphAnalysis }
  from '../model/selectedMorphologicalAnalysis';
import { SelectableLetteredAnalysisOption as Option } from '../model/analysisOptions';
import { XmlElementNode, Attributes } from 'simple_xml';
import update, { Spec } from 'immutability-helper';

type MultiMorphWithNoOrSingleEncl = MultiMorphologicalAnalysisWithoutEnclitics |
                                    MultiMorphologicalAnalysisWithSingleEnclitics;

function deleteNotSelectedAnalysisOptions(ma: MultiMorphWithNoOrSingleEncl): MultiMorphWithNoOrSingleEncl {
  const { analysisOptions } = ma;
  const newAnalysisOptions: Option[] = analysisOptions
    .filter((analysisOption: Option) => analysisOption.selected);
  if (newAnalysisOptions.length < analysisOptions.length) {
    return update(ma, { analysisOptions: { $set: newAnalysisOptions } });
  } else {
    return ma;
  }
}

function deleteNotSelectedEncliticsAnalysisOptions(ma: SingleMorphWithMultiEncl): SingleMorphWithMultiEncl {
  const { analysisOptions } = ma.encliticsAnalysis;
  const newAnalysisOptions: Option[] = analysisOptions
    .filter((analysisOption: Option) => analysisOption.selected);
  if (newAnalysisOptions.length < analysisOptions.length) {
    return update(ma, { encliticsAnalysis: { analysisOptions: { $set: newAnalysisOptions } } });
  } else {
    return ma;
  }
}

function deleteNotSelectedOptions(ma: MultiMorphWithMultiEncl): MultiMorphWithMultiEncl {
  const { analysisOptions, encliticsAnalysis, selectedAnalysisCombinations } = ma;
  const newAnalysisOptions = analysisOptions.filter(analysisOption =>
    selectedAnalysisCombinations.some(combination => combination.morphLetter === analysisOption.letter)
  );
  const newEncliticsAnalysisOptions = encliticsAnalysis.analysisOptions.filter(analysisOption =>
    selectedAnalysisCombinations.some(combination => combination.encLetter === analysisOption.letter)
  );
  return update(ma, { analysisOptions: { $set: newAnalysisOptions },
                      encliticsAnalysis: { analysisOptions: { $set: newEncliticsAnalysisOptions } } });
}

function postprocessMorphology(morphologicalAnalysis: MorphologicalAnalysis): MorphologicalAnalysis {
  switch (morphologicalAnalysis._type) {
    case 'SingleMorphAnalysisWithoutEnclitics':
      return morphologicalAnalysis;
    case 'SingleMorphAnalysisWithSingleEnclitics':
      return morphologicalAnalysis;
    case 'SingleMorphAnalysisWithMultiEnclitics':
      return deleteNotSelectedEncliticsAnalysisOptions(morphologicalAnalysis);
    case 'MultiMorphAnalysisWithoutEnclitics':
      return deleteNotSelectedAnalysisOptions(morphologicalAnalysis);
    case 'MultiMorphAnalysisWithSingleEnclitics':
      return deleteNotSelectedAnalysisOptions(morphologicalAnalysis);
    case 'MultiMorphAnalysisWithMultiEnclitics':
      return deleteNotSelectedOptions(morphologicalAnalysis);
    default:
      // This case should never occur because the list of cases abover is exhaustive.
      return morphologicalAnalysis;
  }
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
