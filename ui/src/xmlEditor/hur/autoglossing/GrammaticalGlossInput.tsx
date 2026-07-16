import {JSX} from 'react';
import {getGrammaticalGlosses} from './grammaticalGlossProvider';

interface IProps {
  datalistID: string;
  form: string;
  pos: string;
  value: string;
  onChange: (newGrammaticalGloss: string) => void;
  inputElementSize: number;
}

/**
 * Renders an input element for the grammatical gloss of a morpheme
 * which retrieves the possible glosses for a morpheme with
 * the given form and shows them in a dropdown.
 */
export function GrammaticalGlossInput({datalistID, form, pos, value, onChange, inputElementSize}: IProps): JSX.Element {

  const grammaticalGlosses = getGrammaticalGlosses(form, pos);

  return (
    <div>
      <input value={value} list={datalistID}
        onChange={event => onChange(event.target.value)}
        size={inputElementSize} />

      <datalist id={datalistID}>
        {grammaticalGlosses.map((gloss: string) => <option key={gloss} value={gloss}>
          {gloss}
        </option>)}
      </datalist>
    </div>
  );
}
