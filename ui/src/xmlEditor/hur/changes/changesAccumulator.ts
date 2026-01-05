import { loadSetValuedMapFromLocalStorage, locallyStoreSetValuedMap,
         loadItemOrArrayMapFromLocalStorage, locallyStoreMap } from '../dictLocalStorage/localStorageUtils';
import { add } from '../common/utils';

const changesLocalStorageKey = 'HurrianDictionaryChanges';
let changes: Map<string, string[]> = loadItemOrArrayMapFromLocalStorage(changesLocalStorageKey);
export function locallyStoreHurrianDictionaryChanges(): void {
  locallyStoreMap(changes, changesLocalStorageKey);
}

const sourcesLocalStorageKey = 'HurrianMorphologicalAnalysisSources';
let sources: Map<string, Set<string>> = loadSetValuedMapFromLocalStorage(sourcesLocalStorageKey);
export function locallyStoreHurrianMorphologicalAnalysisSources(): void {
  locallyStoreSetValuedMap(sources, sourcesLocalStorageKey);
}

export function restartChangesAccumulation(): void {
  changes = new Map<string, string[]>();
  localStorage.removeItem(changesLocalStorageKey);
  sources = new Map<string, Set<string>>();
  localStorage.removeItem(sourcesLocalStorageKey);
}

export type Target = {
  target: string;
  targetIsExtant: boolean;
}

function isIdentityReplacement(origin: string, targets: Target[]): boolean {
  return targets.length === 1 && targets[0].target === origin;
}

function getTargetStrings(targets: Target[]): string[] {
  return targets.map(({ target }) => target);
}

function basicAddChange(origin: string, targets: Target[]): void {
  changes.set(origin, getTargetStrings(targets));
}

function addChangeWithIdentityCheck(origin: string, targets: Target[]): void {
  if (isIdentityReplacement(origin, targets)) {
    // Do not store identity pairs in the changes list
    changes.delete(origin);
  } else {
    basicAddChange(origin, targets);
  }
}

function addChangeWithIdentityCheckForExistingSource(source: string, origin: string, targets: Target[]): void {
  if (!isIdentityReplacement(origin, targets)) {
    const oldTargets = changes.get(source);
    if (oldTargets === undefined) {
      basicAddChange(origin, targets);
    } else {
      const index = oldTargets.indexOf(origin);
      if (index !== -1) {
        oldTargets.splice(index, 1, ...getTargetStrings(targets));
      } else {
        oldTargets.push(...getTargetStrings(targets));
      }
    }
  }
}

export function addChange(origin: string, targets: Target[]): void {
  // Stop if no actual change
  if (isIdentityReplacement(origin, targets)) {
    return;
  }
  // We will now have to store the sources of each target
  for (const { target, targetIsExtant } of targets) {
    let targetSources = sources.get(target);
    if (targetSources === undefined) {
      targetSources = new Set<string>();
      sources.set(target, targetSources);
    }
    // An existing target is the source of itself
    if (targetIsExtant) {
      targetSources.add(target);
    }
  }
  // Look up what the original analysis could be derived from
  const originSources = sources.get(origin);
  if (originSources === undefined) {
    // The original analysis is underived
    addChangeWithIdentityCheck(origin, targets);
    // Each target acquires an additional source
    for (const { target } of targets) {
      add(sources, target, origin);
    }
  } else {
    // The original analysis is derived from others (and possibly from itself)
    // The original analysis should no longer be mapped to its sources
    // because it has been replaced by target
    sources.delete(origin);
    // Its origins are now the origins of the target
    for (const source of originSources) {
      // The sources of the original analysis are mapped to the target
      addChangeWithIdentityCheckForExistingSource(source, origin, targets);
      // The target acquires its sources
      for (const { target } of targets) {
        add(sources, target, source);
      }
    }
  }
}

export function getChanges(): Map<string, string[]> {
  return changes;
}

export function getSources(): Map<string, Set<string>> {
  return sources;
}

export function updateChanges(newChanges: { [key: string]: string[] }): void {
  for (const [source, targets] of Object.entries(newChanges)) {
    changes.set(source, targets);
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
