const brackets = /[[\]]/g;

export function containsBrackets(transcription: string): boolean {
  return transcription.search(brackets) !== -1;
}

export function removeBrackets(transcription: string): string {
  return transcription.replaceAll(brackets, '');
}
