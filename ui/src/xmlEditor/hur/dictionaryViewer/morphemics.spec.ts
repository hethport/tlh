import { getInflectionalSuffixesAndEnclitics } from './morphemics';
import { GrammaticalMorpheme } from './grammaticalMorpheme';

describe('aligning a string of morphemes and a morphological tag', () => {

  test.each<[[string, string], [string, string][]]>([
    [
      ['MED-PL.A-3A-NMLZ-RELAT.PL.ABS=CON', '-u-nd-a-šše-na=mma'],
      [
        ['-MED', '-u'],
        ['-PL.A', '-nd'],
        ['-3A', '-a'],
        ['-NMLZ', '-šše'],
        ['-RELAT.PL.ABS', '-na'],
        ['=CON', '=mma']
      ]
    ],
    [
      ['.ABS=CON', '=an'],
      [
        ['.ABS', ''],
        ['=CON', '=an']
      ]
    ],
  ])(
    'for %j, an array of grammatical morphemes %j should be returned',
     ([morphTag, gramString], labelFormPairs) =>
     expect(getInflectionalSuffixesAndEnclitics(morphTag, gramString))
      .toEqual(labelFormPairs.map(([label, form]) =>
        new GrammaticalMorpheme(label, form))
      )
  );

});