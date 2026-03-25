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

function isBracket(symbol: string): boolean {
  return symbol === '[' || symbol === ']';
}

export function getPrefixWithNonBracketSymbolCount(s: string, requiredNonBracketSymbolCount: number): string {
  let prefixLength = 0, nonBracketSymbolCount = 0;
  while (prefixLength < s.length && nonBracketSymbolCount < requiredNonBracketSymbolCount) {
    const symbol = s[prefixLength];
    prefixLength += 1;
    if (!isBracket(symbol)) {
      nonBracketSymbolCount += 1;
    }
  }
  return s.substring(0, prefixLength);
}
