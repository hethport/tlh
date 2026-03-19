import BasicSegmenter, { Stem, parseStem } from './basicSegmenter';
import { Segmenter } from './segmenter';

type StemInventory = {
  [surfaceForm: string]: Stem[];
};

export type StemInventories = {
  [pos: string]: StemInventory;
}

function getStemInventory(basicSegmenter: BasicSegmenter): StemInventory {
  const { stems } = basicSegmenter;
  const inventory: StemInventory = {};
  for (const [surfaceForm, stemReprs] of stems) {
    const stemObjects: Stem[] = Array.from(stemReprs).sort().map(parseStem);
    inventory[surfaceForm] = stemObjects;
  }
  return inventory;
}

export function getStemInventories(segmenter: Segmenter): StemInventories {
  const { segmenters } = segmenter;
  const inventories: StemInventories = {};
  for (const pos of Array.from(segmenters.keys()).sort()) {
    const basicSegmenter = segmenters.get(pos);
    if (basicSegmenter !== undefined) {
      const inventory = getStemInventory(basicSegmenter);
      inventories[pos] = inventory;
    }

  }
  return inventories;
}
