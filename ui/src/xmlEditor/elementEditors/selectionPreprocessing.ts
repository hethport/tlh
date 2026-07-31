import {removePotentiallyImproperPrefix} from '../hur/common/auxiliary';

const fragmentaryFormSelection = 'DEL';

/**
 * Remove the marking of a form as fragmentary
 * before adding the number of a selected
 * morphological analysis.
 */
export function preprocessSelection(selection: string): string {
  selection = removePotentiallyImproperPrefix(selection, fragmentaryFormSelection);
  return selection;
}
