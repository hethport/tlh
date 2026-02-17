import { Dictionary } from './dictionary';
import { Entry } from '../dictionaryViewer/Wordform';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import update from 'immutability-helper';

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

export function removeEmptyEntries(dictionary: Dictionary): Dictionary {
  const emptyEntries: string[] = [];
  for (const [transcription, analyses] of dictionary) {
    if (analyses.size === 0) {
      emptyEntries.push(transcription);
    }
  }
  return update(dictionary, { $remove: emptyEntries });
}
