import BasicSegmenter, { SuffixChain, parseSuffixChain } from './basicSegmenter';
import { Segmenter } from './segmenter';

class ExtendedSuffixChain extends SuffixChain {
  sources: string[];
  constructor(surfaceForm: string, segmentation: string, morphTag: string, sources: string[]) {
    super(surfaceForm, segmentation, morphTag);
    this.sources = sources;
  }
}

type SuffixChainInventory = {
  [surfaceForm: string]: ExtendedSuffixChain[];
};

export type SuffixChainInventories = {
  [pos: string]: SuffixChainInventory;
}

function getSuffixChainInverntory(basicSegmenter: BasicSegmenter): SuffixChainInventory {
  const { suffixChains } = basicSegmenter;
  const inventory: SuffixChainInventory = {};
  for (const [surfaceForm, suffixChainReprs] of suffixChains) {
    const suffixChainObjects: ExtendedSuffixChain[] = Array.from(suffixChainReprs).sort().map(parseSuffixChain)
      .map((suffixChain: SuffixChain) => {
        const { surfaceForm, segmentation, morphTag } = suffixChain;
        return new ExtendedSuffixChain(
          surfaceForm, segmentation, morphTag, basicSegmenter.getSources(suffixChain)
        );
      });
    inventory[surfaceForm] = suffixChainObjects;
  }
  return inventory;
}

export function getSuffixChainInventories(segmenter: Segmenter): SuffixChainInventories {
  const { segmenters } = segmenter;
  const inventories: SuffixChainInventories = {};
  for (const pos of Array.from(segmenters.keys()).sort()) {
    const basicSegmenter = segmenters.get(pos);
    if (basicSegmenter !== undefined) {
      const inventory = getSuffixChainInverntory(basicSegmenter);
      inventories[pos] = inventory;
    }
  }
  return inventories;
}
