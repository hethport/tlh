const brackets = /[[\]]/g;

export function containsBrackets(transcription: string): boolean {
  return transcription.search(brackets) !== -1;
}

export function removeBrackets(transcription: string): string {
  return transcription.replaceAll(brackets, '');
}

export function getBracketBalance(word: string): number {
  let bracketBalance = 0;
  for (const character of word) {
    switch (character) {
      case '[':
        bracketBalance += 1;
        break;
      case ']':
        bracketBalance -= 1;
        break;
    }
  }
  return bracketBalance;
}
