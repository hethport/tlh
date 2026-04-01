import { SearchQueryField, matchesField } from './searchQueryField';
import { LookupConfig } from '../../lookupConfig';

export type SearchQuery<F extends string> = SearchQueryField<F>[];

export function matchesQuery<F extends string>(obj: { [key in F]: string }, query: SearchQuery<F>,
                                               lookupConfig: LookupConfig): boolean {
  return query.every(field => matchesField(obj, field, lookupConfig));
}

export function selectMatching<F extends string, T extends { [key in F]: string }>(objects: T[], query: SearchQuery<F>,
                                                                                   lookupConfig: LookupConfig): T[] {
  return objects.filter(obj => matchesQuery(obj, query, lookupConfig));
}
