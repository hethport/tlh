import { SearchQuery } from './searchQuery';
import { JSX, useState } from 'react';
import { SearchQueryField, searchModes, SearchMode } from './searchQueryField';
import update from 'immutability-helper';
import { whiteButtonClasses } from '../../../defaultDesign';

interface IProps<F extends string> {
  initialQuery: SearchQuery<F>;
  onSubmit: (query: SearchQuery<F>) => void;
}

export function SearchForm<F extends string>({ initialQuery, onSubmit }: IProps<F>): JSX.Element {
  const [query, setQuery] = useState<SearchQuery<F>>(initialQuery);

  return (<div>
    <div>
      {query.map((field: SearchQueryField<F>, index: number) => {
        return (<div key={field.name} className="table-row">
          <label className="table-cell p-2 border-y border-r border-slate-500"
                 htmlFor={field.name}>{field.name}</label>
          <input className="table-cell p-2 border-y border-r border-slate-500"
                 name={field.name} value={field.value}
                 onChange={event => setQuery(update(query, { [index]: { value: {$set: event.target.value }} }))}/>
          <select className="table-cell p-2 border-y border-r border-slate-500"
                  onChange={event => setQuery(update(query, { [index]: { mode: {$set: event.target.value as SearchMode }} }))}>
            {searchModes.map(searchMode => <option key={searchMode} value={searchMode}>{searchMode}</option>)}
          </select>
        </div>);
      })}
    </div>
    <button className={whiteButtonClasses} onClick={() => onSubmit(query)}>
      Submit
    </button>
  </div>);
}
