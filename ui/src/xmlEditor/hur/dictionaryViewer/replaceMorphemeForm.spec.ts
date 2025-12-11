import { replaceMorphemeForm } from './replaceMorphemeForm';

describe('replacing a morpheme form if the label is as specified', () => {

  test.each<[[string, string, string, string, string], string]>([
    [['-CVB', '-u+m+ae', '-u+m+ai', 'eg+ušš-u+m+ae=lla', 'CVB=3PL.ABS'], 'eg+ušš-u+m+ai=lla'],
    [['-DIR', '-ūda', '-uda', 'ide-ž-ūda', '2POSS.PL-DIR'], 'ide-ž-uda'],
    // Should remain as is.
    [['-ANTIP', '-i', '-ī', 'for-i-va-en-i=ma', 'MOD.ACT-NEG-3JUSS-EPNTH=CON'], 'for-i-va-en-i=ma'],
    // Only the first -i should be replaced with -ī.
    [['-MOD.ACT', '-i', '-ī', 'for-i-va-en-i=ma', 'MOD.ACT-NEG-3JUSS-EPNTH=CON'], 'for-ī-va-en-i=ma'],
    // Only the second -i should be replaced with -ī.
    [['-EPNTH', '-i', '-ī', 'for-i-va-en-i=ma', 'MOD.ACT-NEG-3JUSS-EPNTH=CON'], 'for-i-va-en-ī=ma'],
    [['-RELAT.PL', '-na', '-nā', 'DAGAL-na=m', 'RELAT.PL.ABS=CON'], 'DAGAL-nā=m'],
    [['-PL', '-āž', '-až', 'eni-na-āž-e-ai', 'RELAT.PL-PL-GEN-INS'], 'eni-na-až-e-ai']
  ])(
    'for %j, the new segmentation %s should be returned',
    ([label, oldForm, newForm, segmentation, morphTag], newSegmentation) =>
    expect(replaceMorphemeForm(label, oldForm, newForm)(segmentation, morphTag))
    .toEqual(newSegmentation)
  );

});
