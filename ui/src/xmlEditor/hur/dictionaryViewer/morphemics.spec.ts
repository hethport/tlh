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
    [
      ['RELAT.PL.ABS=CON', '-na=m'],
      [
        ['-RELAT.PL', '-na'],
        ['.ABS', ''],
        ['=CON', '=m']
      ]
    ],
    [
      ['3POSS-PL.ABS=3PL.ABS', '-ī-až=l'],
      [
        ['-3POSS', '-ī'],
        ['-PL', '-až'],
        ['.ABS', ''],
        ['=3PL.ABS', '=l']
      ]
    ],
    [
      ['PL.A-PAT-PTCP.ABS', '-id-ō-re'],
      [
        ['-PL.A', '-id'],
        ['-PAT', '-ō'],
        ['-PTCP', '-re'],
        ['.ABS', '']
      ]
    ],
    [
      ['1A.SG-NOM.ABS', '-aw-šše'],
      [
        ['-1A.SG', '-aw'],
        ['-NOM', '-šše'],
        ['.ABS', '']
      ]
    ],
    [
      ['1POSS.SG.ABS=3PL.ABS', '-iffe=l'],
      [
        ['-1POSS.SG', '-iffe'],
        ['.ABS', ''],
        ['=3PL.ABS', '=l']
      ]
    ],
    [
      ['RELAT.PL-PL-DAT/ESS=3PL.ABS', '-na-až-a=lla'],
      [
        ['-RELAT.PL', '-na'],
        ['-PL', '-až'],
        ['-DAT/ESS', '-a'],
        ['=3PL.ABS', '=lla']
      ]
    ],
    [
      ['MOD.ACT-POT=1SG.ABS', '-i-evā=tta'],
      [
        ['-MOD.ACT', '-i'],
        ['-POT', '-evā'],
        ['=1SG.ABS', '=tta']
      ]
    ],
    [
      ['.ABS=2PL.ABS=CON', '=ffa=an'],
      [
        ['.ABS', ''],
        ['=2PL.ABS', '=ffa'],
        ['=CON', '=an']
      ]
    ],
    [
      ['uġ-3A.SG=2PL.ABS', '-uġ-a=ffa'],
      [
        ['-uġ', '-uġ'],
        ['-3A.SG', '-a'],
        ['=2PL.ABS', '=ffa']
      ]
    ]
  ])(
    'for %j, an array of grammatical morphemes %j should be returned',
     ([morphTag, gramString], labelFormPairs) =>
     expect(getInflectionalSuffixesAndEnclitics(morphTag, gramString))
      .toEqual(labelFormPairs.map(([label, form]) =>
        new GrammaticalMorpheme(label, form))
      )
  );

});