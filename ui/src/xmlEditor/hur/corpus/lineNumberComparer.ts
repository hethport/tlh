const numericCompare = new Intl.Collator(undefined, {numeric: true}).compare;
const ordering = ['Vs.', 'Rs.', 'lk. Rd.', 'o. Rd.', 'r. Rd.', 'u. Rd.'];
const manuscriptIndex = /\{€\d+(\+\d+)*\} */;
function preprocess(lineNumber: string): string {
  lineNumber = lineNumber.trim().replace(manuscriptIndex, '');
  for (let i = 0; i < ordering.length; i++) {
    lineNumber = lineNumber.replace(ordering[i], i.toString() + '.');
  }
  return lineNumber;
}
export function compareLineNumbers(a: string, b: string): number {
  return numericCompare(preprocess(a), preprocess(b));
}
