import { Spec } from 'immutability-helper';
import { MorphologicalAnalysis } from '../../model/morphologicalAnalysis';
import { updateHurrianAnalysis } from '../hur/translations/analysisUpdater';
import { formIsFragment } from '../hur/common/utils';
import { prestemBoundary, splitSegmentation, splitAnalysis } from '../hur/common/morphemeSplitting';

interface IProps {
  segmentation: string,
  translation: string,
  analysis: string,
  updateMorphology: (ma: Spec<MorphologicalAnalysis>, analysis: string | null) => void;
  paradigmClass: string;
}

const stemFragmentGloss = '?';

const kindToBoundary: { [key: string]: string } = {
  'stem': prestemBoundary,
  'zero': '.',
  'suffix': '-',
  'enclitic': '=',
  'fragment': '-',
};

const boundaryToKind: { [key: string]: string } = {
  ' ': 'stem',
  '.':'zero',
  '-': 'suffix',
  '=': 'enclitic'
};

class Morpheme {
  form: string;
  tag: string;
  kind: string;
  constructor(form: string, tag: string, kind: string) {
    this.form = form;
    this.tag = tag;
    this.kind = kind;
  }
  getForm(i: number): string {
    if (this.kind === 'zero') {
      return '';
    }
    let form = this.form;
    if (i > 0) {
      form = kindToBoundary[this.kind] + form;
    }
    return form;
  }
  getTag(i: number): string {
    let tag = this.tag;
    if (i > 0 || this.kind === 'zero' || this.kind === 'enclitic') {
      tag = kindToBoundary[this.kind] + tag;
    }
    return tag;
  }
}

function makeSegmentation(morphemes: Morpheme[]): string {
  return morphemes.map((morpheme, i) => morpheme.getForm(i)).join('');
}

function makeAnalysis(morphemes: Morpheme[]): string {
  return morphemes.slice(1).filter(morpheme => morpheme.kind !== 'fragment').map((morpheme, i) => morpheme.getTag(i)).join('');
}

function removeSuffix(suffix: string, s: string) {
  while(s.endsWith(suffix)) {
    s = s.substring(0, s.length - suffix.length);
  }
  return s;
}

function buildMorphemes(segmentation: string, translation: string, analysis: string): Morpheme[] {
  const forms: [string, string][] = splitSegmentation(segmentation);
  analysis = removeSuffix('-', analysis);
  const tags: [string, string][] = analysis === '' ? []
    : splitAnalysis(analysis);
  const morphemes: Morpheme[] = [];
  let j = tags.length - 1;
  for (let i = forms.length - 1; i >= 0; i--) {
    const [form, boundary] = forms[i];
    let tag: string;
    while (j >= 0 && tags[j][1] === '.') {
      tag = tags[j][0];
      const zero = new Morpheme('', tag, 'zero');
      morphemes.push(zero);
      j--;
    }
    if (formIsFragment(form)) {
      const kind = 'fragment';
      if (i === 0) {
        tag = translation;
      } else {
        tag = '<fragm>';
      }
      const morpheme = new Morpheme(form, tag, kind);
      morphemes.push(morpheme);
    } else {
      const kind: string = boundaryToKind[boundary];
      if (i === 0) {
        tag = translation;
      } else if (j >= 0) {
        tag = tags[j][0];
      } else {
        tag = '';
      }
      const morpheme = new Morpheme(form, tag, kind);
      morphemes.push(morpheme);
      j--;
    }
  }
  return morphemes.reverse();
}

export function MorphemesEditor({
  segmentation, translation, analysis, updateMorphology,
  paradigmClass
} : IProps) {

  const onSegmentationChange = (value: string): void => {
    updateMorphology(updateHurrianAnalysis(value, paradigmClass), null);
  };

  const onTranslationChange = (value: string): void => {
    updateMorphology({ translation: { $set: value } }, null);
  };

  const onSegmentationAndTranslationChange = (segmentation: string, translation: string): void => {
    updateMorphology({
      referenceWord: { $set: segmentation },
      translation: { $set: translation }
    }, null);
  };

  const onAnalysisChange = (analysis: string): void => {
    updateMorphology({}, analysis);
  };

  const onSegmentationAndAnalysisChange = (segmentation: string, analysis: string): void => {
    updateMorphology(updateHurrianAnalysis(segmentation, paradigmClass), analysis);
  };

  const morphemes = buildMorphemes(segmentation, translation, analysis);
  const newAnalysis = makeAnalysis(morphemes);
  if (newAnalysis !== analysis) {
    onAnalysisChange(newAnalysis);
  }
  return (
    <div className="segmentation-box">
    {morphemes.map((morpheme: Morpheme, i: number) => {
      return (
        <div key={i.toString()} className="morpheme-box">
          <div className="field-box">
            <select
              className="morpheme-input"
              value={morpheme.kind}
              onChange={(event) => {
                morphemes[i].kind = event.target.value;
                onSegmentationAndAnalysisChange(
                  makeSegmentation(morphemes),
                  makeAnalysis(morphemes)
                );
              }}>
              <option value='stem'>Stamm</option>
              <option value='suffix'>Suffix</option>
              <option value='enclitic'>Enklitik</option>
              <option value='zero'>Nullsuf.</option>
              <option value='fragment'>Fragm.</option>
            </select>
          </div>
          <div className="field-box">
            <input
              type="text"
              className="morpheme-input"
              defaultValue={morpheme.form}
              onChange={(event) => {
                const newForm = event.target.value;
                morphemes[i].form = newForm;
                if (i == 0 && formIsFragment(newForm) &&
                  (translation === '' || translation === 'u.B.' ||
                    translation === 'u. B.')) {
                  morphemes[i].tag = stemFragmentGloss;
                  onSegmentationAndTranslationChange(
                    makeSegmentation(morphemes),
                    stemFragmentGloss
                  );
                } else {
                  onSegmentationChange(makeSegmentation(morphemes));
                }
              }}
            >
            </input>
          </div>
          {!(morpheme.kind === 'fragment') &&
            <div className="field-box">
              <input
                type="text"
                className="morpheme-input"
                defaultValue={morpheme.tag}
                onChange={(event) => {
                  morphemes[i].tag = event.target.value;
                  if (i == 0) {
                    onTranslationChange(event.target.value);
                  }
                  else {
                    onAnalysisChange(makeAnalysis(morphemes));
                  }
                }}
              >
              </input>
            </div>
          }
        </div>
      );
    })}
    </div>
  );
}