import { Segmenter } from './segmenter';
import { parseStem } from './basicSegmenter';
import { add } from '../common/utils';

const sep = '@';

export interface IStem {
  form: string;
  translation: string;
  pos: string;
}

class Lemma implements IStem {
  form: string;
  translation: string;
  pos: string;

  constructor({ form, translation, pos }: IStem) {
    this.form = form;
    this.translation = translation;
    this.pos = pos;
  }

  toString(): string {
    return [this.form, this.translation, this.pos].join(sep);
  }
}

export class SegmenterInfo {
  stemVariants: Map<string, Set<string>>;

  constructor(segmenter: Segmenter) {
    this.stemVariants = new Map<string, Set<string>>();
    for (const [pos, basicSegmenter] of segmenter.segmenters) {
      for (const [stemVariant, stemReprs] of basicSegmenter.stems) {
        for (const stemRepr of stemReprs) {
          const stem = parseStem(stemRepr);
          const { form, translation } = stem;
          const lemma = new Lemma({ form, translation, pos });
          add(this.stemVariants, lemma.toString(), stemVariant);
        }
      }
    }
  }

  getStemVariants(stem: IStem): Set<string> {
    const lemma = new Lemma(stem);
    const stemVariants = this.stemVariants.get(lemma.toString());
    if (stemVariants === undefined) {
      return new Set<string>();
    } else {
      return stemVariants;
    }
  }
}
