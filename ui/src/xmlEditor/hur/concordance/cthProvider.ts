import { textToCthGroup } from './textToCthGroup';

const unknown = '(unknown)';

export function getCTH(textName: string): string {
  const cth = textToCthGroup.get(textName);
  if (cth === undefined) {
    return unknown;
  } else {
    return cth;
  }
}
