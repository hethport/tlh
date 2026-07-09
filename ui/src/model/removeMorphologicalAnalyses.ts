import update from 'immutability-helper';
import {Attributes} from 'simple_xml';
import {isMorphologyAttribute} from './morphologicalAnalysis';

export function removeMorphologicalAnalyses(attributes: Attributes): Attributes {
  const morphAttributes = Object.keys(attributes).filter(isMorphologyAttribute);
  return update(attributes, {$unset: morphAttributes});
}
