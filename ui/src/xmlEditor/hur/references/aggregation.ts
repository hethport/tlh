import {References} from './references';
import {NumericIDs} from '../numericIDs/numericIDs';

const aggregatedReferencesSeparator = '; ';

export function aggregateReferences(oldReferences: References, allNumericIDs: NumericIDs): References {
  const newReferences: References = new Map();
  for (const numericIDs of allNumericIDs.values()) {
    const values = new Set<string>();
    for (const numericID of numericIDs) {
      const value = oldReferences.get(numericID);
      if (value !== undefined && value !== '') {
        values.add(value);
      }
    }
    const aggregatedValue = Array.from(values).sort().join(aggregatedReferencesSeparator);
    for (const numericID of numericIDs) {
      newReferences.set(numericID, aggregatedValue);
    }
  }
  return newReferences;
}
