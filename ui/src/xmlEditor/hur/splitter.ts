function findBoundary(segmentation: string): number
{
	let i;
	for (i = 0; i < segmentation.length; i++)
	{
		const char: string = segmentation[i];
		if (char == '-' || char == '=' || char == '.')
		{
			break;
		}
	}
	return i;
}

export function getStem(segmentation: string): string {
  const i: number = findBoundary(segmentation);
  return segmentation.substring(0, i);
}

export function getGrammaticalMorphemes(segmentation: string): string {
  const i: number = findBoundary(segmentation);
  if (i == segmentation.length) {
    return '';
  }
  else {
    return segmentation.substring(i);
  }
}

export function getStemAndGrammaticalMorphemes(segmentation: string): [string, string] {
  const i: number = findBoundary(segmentation);
  const stem: string = segmentation.substring(0, i);
  const grammaticalMorphemes =
    i == segmentation.length ? '' : segmentation.substring(i);
  return [stem, grammaticalMorphemes];
}
