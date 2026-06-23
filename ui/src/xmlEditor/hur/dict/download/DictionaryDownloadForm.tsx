import {JSX} from 'react';
import {useTranslation} from 'react-i18next';
import {ErrorMessage, Field, Form, Formik} from 'formik';
import {blueButtonClasses, explTextClasses, inputClasses} from '../../../../defaultDesign';
import {downloadHurrianDictionary} from './downloadHurrianDictionary';

type FormValues = {
  username: string;
  password: string;
}

const initialValues: FormValues = {username: '', password: ''};

export function HurrianDictionaryDownloadForm(): JSX.Element {

  const {t} = useTranslation('common');

  function handleSubmit(values: FormValues): void {
    const {username, password} = values;
    downloadHurrianDictionary(username, password);
  }

  return (
    <div className="container mx-auto">
      <h1 className="font-bold text-2xl text-center">{t('login')}</h1>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({touched, errors}) => <Form>

          <div className="my-4">
            <label htmlFor="username" className="font-bold">{t('username')}:</label>
            <Field name="username" id="username" placeholder={t('username')} required autoFocus
                   className={inputClasses(!!touched.username, !!errors.username)}/>
            <ErrorMessage name="username">{(msg) => <p className={explTextClasses}>{msg}</p>}</ErrorMessage>
          </div>

          <div className="my-4">
            <label htmlFor="password" className="font-bold">{t('password')}</label>
            <Field type="password" name="password" id="password" placeholder={t('password')} required
                   className={inputClasses(!!touched.password, !!errors.password)}/>
            <ErrorMessage name="password">{(msg) => <p className={explTextClasses}>{msg}</p>}</ErrorMessage>
          </div>

          <div className="text-center">
            <button type="submit" className={blueButtonClasses}>{t('performHurrianDictionaryDownload')}</button>
          </div>
        </Form>}
      </Formik>
    </div>
  );
}
