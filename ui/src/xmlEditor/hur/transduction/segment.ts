import {partsOfSpeech} from './analyze';
import {patterns, firstEnclitics} from './patterns';
import {removeMacron} from '../common/utils';

const indecl = new Set(['tiššan', 'ḫenni']);

function postprocessSegmentation(segmentation: string): string {
  segmentation = segmentation.replace('-=', '=');
  if (segmentation.endsWith('-')) {
    return segmentation.substring(0, segmentation.length - 1);
  }
  return segmentation;
}

function joinSegments(groups: string[], firstEnclitic: number)
{
    const morphs = groups
		.slice(0, firstEnclitic)
		.filter((morph: string | undefined) => morph !==  undefined).join('-');
    const enclitics = groups
		.slice(firstEnclitic)
		.filter((enclitic: string | undefined) => enclitic !==  undefined).join('=');
    const segmented = enclitics === '' ? morphs : morphs + '=' + enclitics;
    return postprocessSegmentation(segmented);
}

export function segment(word: string): [string, string][]
{
	const result: [string, string][] = [];
    if (indecl.has(word))
	{
		result.push([word, 'indecl']);
    }
	for (const partOfSpeech of partsOfSpeech)
	{
		const firstEnclitic: number = firstEnclitics[partOfSpeech];
		const match = word.match(patterns[partOfSpeech]);
		if (match !== null)
		{
			const groups = match.slice(1);
			if (groups.filter(group => group !== undefined).length > 1)
			{
				result.push([removeMacron(joinSegments(groups, firstEnclitic)), partOfSpeech]);
			}
		}
	}
    return result;
}
