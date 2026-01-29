export function stemIsFragmentary(stem: string) {
  return stem === '' || stem === '[' || stem.startsWith(']');
}
