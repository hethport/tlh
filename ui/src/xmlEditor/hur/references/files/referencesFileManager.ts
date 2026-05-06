import { getReferences, setReferences } from '../../references/references';
import { makeDownload } from '../../../../downloadHelper';

export function downloadReferences() {
  const references = getReferences();
  const obj = {references};
  const jsonText = JSON.stringify(obj, undefined, '\t');
  makeDownload(jsonText, 'References.json');
}

export async function readReferences(file: File) {
  const source = await file.text();
  const parsed = JSON.parse(source);
  if ('references' in parsed) {
    setReferences(parsed.references);
  }
}
