import { getNumericIDs, setNumericIDs } from '../numericIDs';
import { makeDownload } from '../../../../downloadHelper';

export function downloadNumericIDs() {
  const numericIDs = getNumericIDs();
  const obj = {numericIDs};
  const jsonText = JSON.stringify(obj, undefined, '\t');
  makeDownload(jsonText, 'Stems.json');
}

export async function readNumericIDs(file: File) {
  const source = await file.text();
  const parsed = JSON.parse(source);
  if ('numericIDs' in parsed) {
    setNumericIDs(parsed.numericIDs);
  }
}
