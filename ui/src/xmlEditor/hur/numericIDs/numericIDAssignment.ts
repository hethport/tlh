import update from 'immutability-helper';
import {NumericIDs, getNumericIDKey} from './numericIDs';

interface IStem {
  form: string;
  pos: string;
  translation: string;
}

export function assignIDsToNewStems(oldNumericIDs: NumericIDs, stems: IStem[]): NumericIDs {
  const keys = stems.map(({form, pos, translation}) =>
    getNumericIDKey(form, pos, translation)
  );
  const newKeys = keys.filter(key => !oldNumericIDs.has(key));
  const existingIDs: number[] = Array.from(oldNumericIDs.values())
    .map((value: Set<number>) => Array.from(value)).flat();
  const maximalExistingID = existingIDs.reduce((a: number, b: number) => Math.max(a, b), -1);
  const delta = maximalExistingID + 1;
  const newIDs: [string, Set<number>][] = newKeys.map((newKey, index) => {
    const IDSet = new Set<number>();
    const numericID =  index + delta;
    IDSet.add(numericID);
    return [newKey, IDSet];
  });
  return update(oldNumericIDs, {$add: newIDs});
}
