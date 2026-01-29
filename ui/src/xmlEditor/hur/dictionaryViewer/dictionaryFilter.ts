const embracketedFragmentarySigns = /\[x+\]/;
function containsEmbracketedFragmentarySigns(stem: string): boolean {
  return stem.search(embracketedFragmentarySigns) !== -1;
}

export function stemIsFragmentary(stem: string) {
  return stem === '' || stem === '[' || stem.startsWith(']') ||
    containsEmbracketedFragmentarySigns(stem);
}
