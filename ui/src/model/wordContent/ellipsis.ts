import {AOWordContent} from './wordContent';
import {XmlWriter} from '../../xmlEditor/transliterationEditor/xmlModel/xmlWriting';

export interface Ellipsis {
  type: 'AOEllipsis'
}

export const aoEllipsis: Ellipsis = {type: 'AOEllipsis'};

export function isEllipsis(c: AOWordContent): c is Ellipsis {
  return c.type === 'AOEllipsis';
}

export const ellipsisFormat: XmlWriter<Ellipsis> = {
  write: () => ['…']
};