import { Dictionary } from './dictionary';
import { Entry } from '../dictionaryViewer/Wordform';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';

export function extractEntries(dictionary: Dictionary): Entry[] {
  const entries: Entry[] = [];
  for (const [transcription, analyses] of dictionary) {
    for (const analysis of analyses) {
      const ma = readMorphAnalysisValue(analysis);
      if (ma !== undefined) {
        const entry: Entry = {
          transcriptions: [transcription],
          morphologicalAnalysis: ma,
          initialMorphologicalAnalysis: ma
        };
        entries.push(entry);
      }
    }
  }
  return entries;
}
