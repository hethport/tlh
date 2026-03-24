import {ReactElement} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {amberButtonClasses} from './defaultDesign';

interface IProps {
  mainIdentifier: string;
}

export function EditIdentifiersButton({mainIdentifier}: IProps): ReactElement {
  const {t} = useTranslation('common');

  return (
    <Link
      to={`/manuscripts/${encodeURIComponent(mainIdentifier)}/data`}
      className={amberButtonClasses + ' inline-block'}
    >
      ✏️ {t('editIdentifiers')}
    </Link>
  );
}
