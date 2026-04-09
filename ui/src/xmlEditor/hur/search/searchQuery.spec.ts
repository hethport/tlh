import { IStem } from '../dictionaryViewer/StemViewer';
import { SearchQuery, selectMatching } from './searchQuery';
import { defaultLookupConfig } from '../../lookupConfig';

const stems: IStem[] = [
  {
    form: 'nāli',
    translation: 'Rehbock',
    pos: 'noun'
  },
  {
    form: 'ide',
    translation: 'Körper; Bezug',
    pos: 'noun'},
  {
    form: 'paba+ni',
    translation: 'Berg',
    pos: 'noun'},
  {
    form: 'mel+aḫḫ',
    translation: 'vertreiben',
    pos: 'verb'
  },
];

const query: SearchQuery<'form' | 'pos'> = [
  {
    name: 'form',
    value: '[ptkbdgfsšḫvzžġmnlrwW][aeiouāēīōū][ptkbdgfsšḫvzžġmnlrwW]',
    mode: 'pattern',
    fuzzy: false,
  },
  {
    name: 'pos',
    value: 'noun',
    mode: 'whole word',
    fuzzy: false,
  },
];

const expectedResult: IStem[] = [stems[0], stems[2]];

describe('Testing the search function', () => {
  test('Requesting nouns with a CVC substring', () => {
    const result = selectMatching(stems, query, defaultLookupConfig);
    expect(result).toEqual(expectedResult);
  });
});
