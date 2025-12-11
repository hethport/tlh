import { replaceMorphemeForm } from './replaceMorphemeForm';

describe('replacing a morpheme form if the label is as specified', () => {

  test.each<[[string, string, string, string, string], string]>([
    [['-CVB', '-u+m+ae', '-u+m+ai', 'eg+ušš-u+m+ae=lla', 'CVB=3PL.ABS'], 'eg+ušš-u+m+ai=lla']
  ])(
    'for %j, the new segmentation %s should be returned',
    ([label, oldForm, newForm, segmentation, morphTag], newSegmentation) =>
    expect(replaceMorphemeForm(label, oldForm, newForm)(segmentation, morphTag))
    .toEqual(newSegmentation)
  );

});
