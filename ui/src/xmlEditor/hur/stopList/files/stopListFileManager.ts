import { getStopList, setStopList } from '../stopList';
import { makeDownload } from '../../../../downloadHelper';

const stopListFieldName = 'stopList';
const stopListFileName = 'StopList.json';

export function downloadStopList(): void {
  const stopList = getStopList();
  const obj = { stopList };
  const jsonText = JSON.stringify(obj, undefined, '\t');
  makeDownload(jsonText, stopListFileName);
}

export async function readStopList(file: File): Promise<void> {
  const source = await file.text();
  const parsed = JSON.parse(source);
  if (stopListFieldName in parsed) {
    const { stopList } = parsed;
    setStopList(stopList);
  } else {
    alert('The uploaded file does not contain a stop list.');
  }
}
