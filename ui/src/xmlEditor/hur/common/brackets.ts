const brackets = /[[\]]/g;
export function removeBrackets(transcription: string): string {
  return transcription.replaceAll(brackets, '');
}
