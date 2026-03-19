import BasicSegmenter, { SuffixChain, parseSuffixChain } from './basicSegmenter';
import { Segmenter } from './segmenter';

type SuffixChainInventory = {
  [surfaceForm: string]: SuffixChain[];
};

export type SuffixChainInventories = {
  [pos: string]: SuffixChainInventory;
}

function getSuffixChainInverntory(basicSegmenter: BasicSegmenter): SuffixChainInventory {
  const { suffixChains } = basicSegmenter;
  const inventory: SuffixChainInventory = {};
  for (const [surfaceForm, suffixChainReprs] of suffixChains) {
    const suffixChainObjects: SuffixChain[] = Array.from(suffixChainReprs).sort().map(parseSuffixChain);
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
