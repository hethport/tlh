import { getInflectionalSuffixesAndEnclitics } from './morphemics';
import { GrammaticalMorpheme as GM } from './grammaticalMorpheme';

describe('aligning a string of morphemes and a morphological tag', () => {

  test.each<[[string, string], GM[]]>([
    [
      ['MED-PL.A-3A-NMLZ-RELAT.PL.ABS=CON', '-u-nd-a-šše-na=mma'],
      [
        new GM('-MED', '-u'),
        new GM('-PL.A', '-nd'),
        new GM('-3A', '-a'),
        new GM('-NMLZ', '-šše'),
        new GM('-RELAT.PL.ABS', '-na'),
        new GM('=CON', '=mma')
      ]
    ],
    [
      ['.ABS=CON', '=an'],
      [
        new GM('.ABS', ''),
        new GM('=CON', '=an')
      ]
    ],
  ])(
    'for %j, an array of grammatical morphemes %j should be returned',
     ([morphTag, gramString], grammaticalMorphemes) =>
     expect(getInflectionalSuffixesAndEnclitics(morphTag, gramString))
      .toEqual(grammaticalMorphemes)
  );

});