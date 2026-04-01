import { SearchQueryField, matchesField } from './searchQueryField';

export type SearchQuery<F extends string> = SearchQueryField<F>[];

export function matchesQuery<F extends string>(obj: { [key in F]: string }, query: SearchQuery<F>): boolean {
  return query.every(field => matchesField(obj, field));
}

export function selectMatching<F extends string, T extends { [key in F]: string }>(objects: T[], query: SearchQuery<F>): T[] {
  return objects.filter(obj => matchesQuery(obj, query));
}
