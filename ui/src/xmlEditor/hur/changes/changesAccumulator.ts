import { normalize } from '../dict/morphologicalAnalysisValidator';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import { writeMorphAnalysisValue } from '../../../model/morphologicalAnalysis';
import { loadSetValuedMapFromLocalStorage, locallyStoreSetValuedMap,
         loadMapFromLocalStorage, locallyStoreMap } from '../dictLocalStorage/localStorageUtils';

const changesLocalStorageKey = 'HurrianDictionaryChanges';
let changes: Map<string, string> = loadMapFromLocalStorage(changesLocalStorageKey);
export function locallyStoreHurrianDictionaryChanges(): void {
  locallyStoreMap(changes, changesLocalStorageKey);
}

const sourcesLocalStorageKey = 'HurrianMorphologicalAnalysisSources';
let sources: Map<string, Set<string>> = loadSetValuedMapFromLocalStorage(sourcesLocalStorageKey);
export function locallyStoreHurrianMorphologicalAnalysisSources(): void {
  locallyStoreSetValuedMap(sources, sourcesLocalStorageKey);
}

export function restartChangesAccumulation(): void {
  changes = new Map<string, string>();
  localStorage.removeItem(changesLocalStorageKey);
  sources = new Map<string, Set<string>>();
  localStorage.removeItem(sourcesLocalStorageKey);
}

function addChangeWithIdentityCheck(origin: string, target: string): void {
  if (target !== origin) {
    changes.set(origin, target);
  } else {
    // Do not store identity pairs in the changes list
    changes.delete(origin);
  }
}

export type Target = {
  target: string;
  targetIsExtant: boolean;
}

export function addChange(origin: string, target: string, targetIsExtant: boolean): void {
  // Stop if no actual change
  if (target === origin) {
    return;
  }
  // We will now have to store the sources of the target
  let targetSources = sources.get(target);
  if (targetSources === undefined) {
    targetSources = new Set<string>();
    sources.set(target, targetSources);
  }
  // An existing target is the source of itself
  if (targetIsExtant) {
    targetSources.add(target);
  }
  // Look up what the original analysis could be derived from
  const originSources = sources.get(origin);
  if (originSources === undefined) {
    // The original analysis is underived
    addChangeWithIdentityCheck(origin, target);
    // The target acquires an additional source
    targetSources.add(origin);
  } else {
    // The original analysis is derived from others (and possibly from itself)
    // The original analysis should no longer be mapped to its sources
    // because it has been replaced by target
    sources.delete(origin);
    // Its origins are now the origins of the target
    for (const source of originSources) {
      // The sources of the original analysis are mapped to the target
      addChangeWithIdentityCheck(source, target);
      // The target acquires its sources
      targetSources.add(source);
    }
  }
}

export function getChanges(): Map<string, string> {
  return changes;
}

export function getSources(): Map<string, Set<string>> {
  return sources;
}

export function updateChanges(newChanges: { [key: string]: string }): void {
  for (const [source, target] of Object.entries(newChanges)) {
    changes.set(source, target);
  }
}

export function updateSources(newSources: { [key: string]: string[] }): void {
  for (const [target, sourcesArray] of Object.entries(newSources)) {
    const sourcesSet = new Set<string>();
    for (const source of sourcesArray) {
      sourcesSet.add(source);
    }
    sources.set(target, sourcesSet);
  }
}

const pattern = /(?<=mrp\d+=")[^"]+(?=")|(lnr)="([^"]+)"/g;

export function applyChanges(text: string,
  onChange: (line: string, initialAnalysis: string, result: string) => void): string {
  let line = 'unk';
  const changeAnalysis = (analysis: string, attr: string, lnr: string) => {
    if (attr === 'lnr') {
      line = lnr;
      return analysis;
    }
    const normalized = normalize(analysis, true, false);
    if (normalized !== null) {
      const morphologicalAnalysis = readMorphAnalysisValue(normalized);
      if (morphologicalAnalysis !== undefined) {
        const morphAnalysisValue = writeMorphAnalysisValue(morphologicalAnalysis);
        const result = changes.get(morphAnalysisValue);
        if (result !== undefined) {
          onChange(line, analysis, result);
          return result;
        }
      }
    }
    return analysis;
  };
  text = text.replaceAll(pattern, changeAnalysis);
  return text;
}
