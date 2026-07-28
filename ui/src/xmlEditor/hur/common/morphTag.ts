export function restoreLeftBoundary(morphTag: string): string {
  if (morphTag.startsWith('=') || morphTag.startsWith('.')) {
    return morphTag;
  }
  return '-' + morphTag;
}

export function joinTranslationAndMorphTag(translation: string, morphTag: string): string {
  return translation + restoreLeftBoundary(morphTag);
}
