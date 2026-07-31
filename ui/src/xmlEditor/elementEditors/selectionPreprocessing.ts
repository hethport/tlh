import {removePotentiallyImproperPrefix} from '../hur/common/auxiliary';

const fragmentaryFormSelection = 'DEL';
const unclearFormSelection = '???';

/**
 * Remove the marking of a form as fragmentary
 * or unclear
 * before adding the number of a selected
 * morphological analysis.
 */
export function preprocessSelection(selection: string): string {
  selection = removePotentiallyImproperPrefix(selection, fragmentaryFormSelection);
  selection = removePotentiallyImproperPrefix(selection,
                                              unclearFormSelection);
  return selection;
}
