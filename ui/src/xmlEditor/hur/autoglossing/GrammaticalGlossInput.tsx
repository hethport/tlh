import {JSX} from 'react';
import {getGrammaticalGlosses} from './grammaticalGlossProvider';

interface IProps {
  position: number;
  form: string;
  value: string;
  onChange: (newGrammaticalGloss: string) => void;
  inputElementSize: number;
}

/**
 * Renders an input element for the grammatical gloss of a morpheme
 * which retrieves the possible glosses for a morpheme with
 * the given form and shows them in a dropdown.
 */
export function GrammaticalGlossInput({position, form, value, onChange, inputElementSize}: IProps): JSX.Element {

  const datalistId = position.toString();

  const grammaticalGlosses = getGrammaticalGlosses(form);

  return (
    <div>
      <input value={value} list={datalistId}
        onChange={event => onChange(event.target.value)}
        size={inputElementSize} />

      <datalist id={datalistId}>
        {grammaticalGlosses.map((gloss: string) => <option key={gloss} value={gloss}>
          {gloss}
        </option>)}
      </datalist>
    </div>
  );
}
