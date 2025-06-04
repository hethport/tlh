import {XmlElementNode} from 'simple_xml';
import {saveGloss} from './glossUpdater';
import {convertDictionary, updateDictionary} from './utility';

export const dictionary: Map<string, Set<string>> = new Map();

export function updateHurrianDictionary(node: XmlElementNode, number: number, value: string): void
{
	const transcription: string = node.attributes.trans || '';
	let possibilities: Set<string> | undefined;
	if (dictionary.has(transcription))
	{
		possibilities = dictionary.get(transcription);
	}
	else
	{
		possibilities = new Set<string>();
		dictionary.set(transcription, possibilities);
	}
	if (possibilities === undefined)
	{
		throw new Error();
	}
	possibilities.add(value);
	saveGloss(number, value);
}

export function getDictionary(): { [key: string]: string[] } {
  return convertDictionary(dictionary);
}

export function upgradeDictionary(object: { [key: string]: string[] }): void {
  updateDictionary(dictionary, object);
}
