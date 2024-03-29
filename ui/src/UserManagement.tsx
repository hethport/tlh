import {useTranslation} from 'react-i18next';
import {Navigate} from 'react-router-dom';
import {homeUrl} from './urls';
import {Rights, UsersOverviewQuery, useUpdateUserRightsMutation, useUsersOverviewLazyQuery} from './graphql';
import {WithQuery} from './WithQuery';
import {PaginatedTable} from './PaginatedTable';
import {JSX, useState} from 'react';

const allRights = [Rights.ExecutiveEditor, Rights.Reviewer, Rights.Author];

interface IProps extends UsersOverviewQuery {
  page: number;
  queryPage: (number: number) => void;
}

function Inner({page, queryPage, executiveEditorQueries}: IProps): JSX.Element {

  const {t} = useTranslation('common');
  const [updateUserRights] = useUpdateUserRightsMutation();

  function onUpdateUserRights(username: string, newRights: Rights): void {
    updateUserRights({variables: {username, newRights}})
      .then(() => window.location.reload())
      .catch((error) => console.error(error));
  }

  if (!executiveEditorQueries) {
    return <Navigate to={homeUrl}/>;
  }

  const {userCount, users} = executiveEditorQueries;

  const columnNames = [t('username'), t('name'), t('affilitation'), t('email'), t('rights')];

  return (
    <PaginatedTable count={userCount} data={users} columnNames={columnNames} emptyMessage={t('noUsersYet')} page={page} queryPage={queryPage}>
      {({username, name, affiliation, email, rights}) =>
        <tr key={username} className="border-t border-slate-600 text-center">
          <td className="p-2">{username}</td>
          <td className="p-2">{name}</td>
          <td className="p-2">{affiliation || '--'}</td>
          <td className="p-2">{email}</td>
          <td className="p-2">
            <select defaultValue={rights} onChange={(event) => onUpdateUserRights(username, event.target.value as Rights)}
                    className="p-2 rounded border border-slate-500 bg-white w-full">
              {allRights.map((right) => <option key={right}>{right}</option>)}
            </select></td>
        </tr>}
    </PaginatedTable>
  );
}

export function UserManagement(): JSX.Element {

  const {t} = useTranslation('common');
  const [page, setPage] = useState(0);
  const [executeUsersOverviewQuery, usersOverviewQuery] = useUsersOverviewLazyQuery();

  if (!usersOverviewQuery.called) {
    executeUsersOverviewQuery({variables: {page}})
      .catch((error) => console.error(error));
  }

  const queryPage = (page: number): void => {
    executeUsersOverviewQuery({variables: {page}})
      .then(({data}) => {
        if (data) {
          setPage(page);
        }
      })
      .catch((error) => console.error(error));
  };

  return (
    <div className="container mx-auto">
      <h1 className="mb-4 font-bold text-2xl text-center">{t('userManagement')}</h1>

      <WithQuery query={usersOverviewQuery}>{(data) => <Inner {...data} page={page} queryPage={queryPage}/>}</WithQuery>
    </div>
  );
}