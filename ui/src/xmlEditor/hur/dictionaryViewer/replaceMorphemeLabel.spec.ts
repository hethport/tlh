import replaceMorphemeLabel from './replaceMorphemeLabel';

const modification = replaceMorphemeLabel('-EQU', '-EQU2', '-nna');

describe('modifying morphological analyses', () => {

  test.each<[[string, string], string]>([
    [['āri-ne-nna', 'RELAT.SG-EQU'], 'RELAT.SG-EQU2'],
    [['nurandiġi-nna', 'EQU'], 'EQU2'],
    [['ḫinzori-nna', 'EQU'], 'EQU2'],
    [['naḫḫ+o+bade-oš=nna', 'EQU=3SG.ABS'], 'EQU=3SG.ABS'],
    [['Teššob-pe-ož=l', 'GEN-EQU=3PL.ABS'], 'GEN-EQU=3PL.ABS'],
    [['kiv+ōr+ġē-ne-v-ōž', 'RELAT.SG-GEN-EQU'], 'RELAT.SG-GEN-EQU'],
    [['kāze-ōž', 'Becher-EQU'], 'Becher-EQU']
  ])(
    'for %j, the morphological tag should be %s',
    ([segmentation, morphTag], newMorphTag) =>
    expect(modification(segmentation, morphTag))
    .toEqual(newMorphTag)
  );

});

const typeModification = replaceMorphemeLabel('-3SG.ABS', '=3SG.ABS', '=n');

describe('replacing a suffix gloss with an enclitic gloss', () => {

  test.each<[[string, string], string]>([
    [['ašḫo=n', '3SG.ABS'], '=3SG.ABS'],
    [['ašḫo=n', 'CON'], 'CON']
  ])(
    'for %j, the morphological tag should be %s',
     ([segmentation, morphTag], newMorphTag) =>
     expect(typeModification(segmentation, morphTag))
     .toEqual(newMorphTag)
  );

});

const boundaryAddition = replaceMorphemeLabel('3SG.ABS', '=3SG.ABS', '=n');

describe('adding a boundary to a morpheme which does not have one', () => {

  test.each<[[string, string], string]>([
    [['ašḫo=n', '3SG.ABS'], '=3SG.ABS'],
    [['ašḫo=n', 'CON'], 'CON']
  ])(
    'for %j, the morphological tag should be %s',
     ([segmentation, morphTag], newMorphTag) =>
     expect(boundaryAddition(segmentation, morphTag))
     .toEqual(newMorphTag)
  );

});
