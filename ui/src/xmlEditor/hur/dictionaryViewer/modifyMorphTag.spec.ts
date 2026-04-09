import modifyMorphTag from './modifyMorphTag';
import { readMorphAnalysisValue } from '../morphologicalAnalysis/auxiliary';
import { MorphologicalAnalysis, writeMorphAnalysisValue }
  from '../../../model/morphologicalAnalysis';
import replaceMorphemeLabel from './replaceMorphemeLabel';

const modification = replaceMorphemeLabel('-EQU', '-EQU2', '-nna');
const analysisModification = modifyMorphTag(modification);

describe('modifying morphological analyses', () => {

  test.each<[string, string]>([
    ['āri-ne-nna @ das Böse @ RELAT.SG-EQU @ noun @ ',
    'āri-ne-nna @ das Böse @ RELAT.SG-EQU2 @ noun @ '],
    ['nurandiġi-nna @ Granatapfel @ EQU @ noun @ ',
     'nurandiġi-nna @ Granatapfel @ EQU2 @ noun @ '],
    ['ḫinzori-nna @ Apfel @ EQU @ noun @ ',
     'ḫinzori-nna @ Apfel @ EQU2 @ noun @ '],
    ['naḫḫ+o+bade-oš=nna @ unbesiedelte @ EQU=3SG.ABS @ noun @ ',
     'naḫḫ+o+bade-oš=nna @ unbesiedelte @ EQU=3SG.ABS @ noun @ '],
    ['Teššob-pe-ož=l @ DN @ { a → GEN-EQU=3PL.ABS} { b → GEN-ERG=3PL.ABS} @ noun @ ',
     'Teššob-pe-ož=l @ DN @ { a → GEN-EQU=3PL.ABS} { b → GEN-ERG=3PL.ABS} @ noun @ '],
    ['kiv+ōr+ġē-ne-v-ōž @ u.B. @ RELAT.SG-GEN-EQU @ noun @ ',
     'kiv+ōr+ġē-ne-v-ōž @ u.B. @ RELAT.SG-GEN-EQU @ noun @ '],
    ['kāze-ōž @ Becher @ EQU @ noun @ ',
     'kāze-ōž @ Becher @ EQU @ noun @ '],
    // Not a real example - to test multi-morphological analyses
    ['Teššob-pe-nna=l @ DN @ { a → GEN-EQU=3PL.ABS} { b → GEN-ERG=3PL.ABS} @ noun @ ',
     'Teššob-pe-nna=l @ DN @ { a → GEN-EQU2=3PL.ABS} { b → GEN-ERG=3PL.ABS} @ noun @ '],

  ])(
    'for %s, the new analysis should be %s',
    (oldMorphologicalAnalysisString, newMorphologicalAnalysisString) =>
    expect(writeMorphAnalysisValue(analysisModification(
        readMorphAnalysisValue(oldMorphologicalAnalysisString) as MorphologicalAnalysis
    )))
    .toEqual(newMorphologicalAnalysisString)
  );

});
