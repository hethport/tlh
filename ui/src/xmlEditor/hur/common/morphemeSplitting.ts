const formSep = /((?<!\()-|-(?!\))|=| )/u;
const glossSep = /((?<!\()-|-(?!\))|=| |(?<!=[123](?:SG|PL)|=.*)\.(?=ABS)|^\.)/;
export const prestemBoundary = ' ';

export function splitSegmentation(segmentation: string): [string, string][] {
  const morphemes: [string, string][] = [];
  const spl = segmentation.split(formSep);
  morphemes.push([spl[0], prestemBoundary]);
  for (let i = 1; i < spl.length; i += 2) {
    morphemes.push([spl[i + 1], spl[i]]);
  }
  return morphemes;
}

export function splitAnalysis(analysis: string): [string, string][] {
  const morphemes: [string, string][] = [];
  const spl = analysis.split(glossSep);
  morphemes.push([spl[0], prestemBoundary]);
  for (let i = 1; i < spl.length; i += 2) {
    morphemes.push([spl[i + 1], spl[i]]);
  }
  return morphemes;
}
