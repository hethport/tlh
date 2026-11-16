import { LexicalData } from '../../lexicalData/lexicalData';
import { setConcordance } from '../../concordance/concordance';
import { setCorpus } from '../basicCorpus';

export async function readCorpus(file: File): Promise<void> {
  const lexicalDataString = await file.text();
  const lexicalData: LexicalData = JSON.parse(lexicalDataString);
  const { concordance, corpus } = lexicalData;
  setConcordance(concordance);
  setCorpus(corpus);
}
