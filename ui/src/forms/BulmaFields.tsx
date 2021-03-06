import {ErrorMessage, Field, FieldProps} from 'formik';
import classNames from 'classnames';
import {ChangeEvent} from 'react';

interface CustomFieldProps extends FieldProps {
  label: string;
  id: string;
  asTextArea?: boolean;
}

export function MyField({label, id, field, form, ...props}: CustomFieldProps): JSX.Element {

  const classes = classNames(
    'p-2', 'rounded', 'border', 'w-full', 'mt-2',
    form.touched[field.name]
      ? (form.errors[field.name]
          ? 'border-red-500'
          : 'border-green-500'
      )
      : 'border-gray-400');

  return (
    <div className="mb-4">
      <label htmlFor={id} className="font-bold">{label}:</label>
      <Field {...props} {...field} id={id} placeholder={label} className={classes}/>
    </div>

  );
}

/**
 * @deprecated
 *
 * @param label
 * @param id
 * @param asTextArea
 * @param field
 * @param form
 * @param props
 * @constructor
 */
export function BulmaField({label, id, asTextArea, field, form, ...props}: CustomFieldProps): JSX.Element {
  const classes = classNames(
    asTextArea ? 'textarea' : 'input',
    {
      'is-success': form.touched[field.name] && !form.errors[field.name],
      'is-danger': form.touched[field.name] && !!form.errors[field.name],
    });

  return (
    <div className="field">
      <label htmlFor="id" className="label">{label}:</label>
      <div className="control">
        {asTextArea
          ? <Field as="textarea" {...props} {...field} id={id} className={classes} placeholder={label}/>
          : <Field  {...props} {...field} id={id} className={classes} placeholder={label}/>
        }
      </div>
      <ErrorMessage name={field.name}>{msg => <p className="help is-danger">{msg}</p>}</ErrorMessage>
    </div>
  );
}

// Object Select

export interface SelectOption<T> {
  value: T;
  label: string;
}

interface CustomSelectProps<T> {
  label: string;
  id: string;
  currentValue: T;
  options: SelectOption<T>[];
  onUpdate: (t: T) => void;
}

export function ObjectSelect<T>({label, id, currentValue, options, onUpdate}: CustomSelectProps<T>): JSX.Element {
  // FIXME: remove bulma stuff, make more generic!

  function onValueChange(event: ChangeEvent<HTMLSelectElement>) {
    onUpdate(options[event.target.selectedIndex].value);
  }

  const currentValueLabel = options.find(({value}) => value === currentValue)?.label;

  return (
    <div>
      <label htmlFor={id} className="font-bold">{label}:</label>
      <select id={id} onChange={onValueChange} defaultValue={currentValueLabel} className="mt-2 p-2 rounded bg-white border border-slate-500 w-full">
        {options.map(({/*value,*/ label}, index) =>
          <option key={index}>{label}</option>
        )}
      </select>
    </div>
  );
}
