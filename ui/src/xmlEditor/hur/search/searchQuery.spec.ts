import { IStem } from '../dictionaryViewer/StemViewer';
import { SearchQuery, selectMatching } from './searchQuery';

const stems: IStem[] = [
  {
    index: '1',
    form: 'nāli',
    translation: 'Rehbock',
    pos: 'noun'
  },
  {
    index: '2',
    form: 'ide',
    translation: 'Körper; Bezug',
    pos: 'noun'},
  {
    index: '3',
    form: 'paba+ni',
    translation: 'Berg',
    pos: 'noun'},
  {
    index: '4',
    form: 'mel+aḫḫ',
    translation: 'vertreiben',
    pos: 'verb'
  },
];

const query: SearchQuery<'form' | 'pos'> = [
  {
    name: 'form',
    value: '[ptkbdgfsšḫvzžġmnlrwW][aeiouāēīōū][ptkbdgfsšḫvzžġmnlrwW]',
    mode: 'pattern'
  },
  {
    name: 'pos',
    value: 'noun',
    mode: 'whole word'
  },
];

const expectedResult: IStem[] = [stems[0], stems[2]];

describe('Testing the search function', () => {
  test('Requesting nouns with a CVC substring', () => {
    const result = selectMatching(stems, query);
    expect(result).toEqual(expectedResult);
  });
});
