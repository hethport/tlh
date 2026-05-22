import { LexicalData } from '../../lexicalData/lexicalData';
import { setCorpus } from '../basicCorpus';

export async function readCorpus(file: File): Promise<void> {
  const lexicalDataString = await file.text();
  const lexicalData: LexicalData = JSON.parse(lexicalDataString);
  const { corpus } = lexicalData;
  setCorpus(corpus);
}
