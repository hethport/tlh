import { Stem, preprocessStem } from './basicSegmenter';
import { LookupConfig } from '../../lookupConfig';

const partsOfSpeechElidingFinalVowel = ['noun', 'ADJ'];
const finalVowelAfterCoronalSonorant = /(?<=[lnr])[aeiouāēīōū]$/;

function endsWithVowelAfterCoronalSonorant(stem: string): boolean {
  return finalVowelAfterCoronalSonorant.test(stem);
}

export function generateSurfaceAllomorphs(stem: Stem, lookupConfig: LookupConfig, pos: string): string[] {
  const surfaceAllomorphs: string[] = [];
  const mainAllomorph = preprocessStem(stem.form, lookupConfig);
  if (partsOfSpeechElidingFinalVowel.includes(pos)) {
    if (endsWithVowelAfterCoronalSonorant(mainAllomorph)) {
      const surfaceAllomorph = mainAllomorph.substring(0, mainAllomorph.length - 1);
      surfaceAllomorphs.push(surfaceAllomorph);
    }
  }
  return surfaceAllomorphs;
}
