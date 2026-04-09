import { LexicalData, getLexicalData, setLexicalData } from '../../lexicalData/lexicalData';
import { makeDownload } from '../../../../downloadHelper';

export const lexicalDataFileName = 'Dictionary.json';

export function downloadDictionary(): void {
  const lexicalData = getLexicalData();
  const lexicalDataString = JSON.stringify(lexicalData, undefined, '\t');
  makeDownload(lexicalDataString, lexicalDataFileName);
}

export async function readDict(file: File): Promise<void> {
  const lexicalDataString = await file.text();
  const lexicalData: LexicalData = JSON.parse(lexicalDataString);
  setLexicalData(lexicalData);
}
