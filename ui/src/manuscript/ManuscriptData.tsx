import {useTranslation} from 'react-i18next';
import {ReactElement, useState} from 'react';
import {Link, Navigate, useParams, useNavigate} from 'react-router-dom';
import {
  ManuscriptMetaDataFragment,
  ManuscriptStatus,
  Rights,
  useManuscriptQuery,
  useReleaseTransliterationMutation,
  useUpdateManuscriptIdentifiersMutation,
  ManuscriptIdentifierType
} from '../graphql';
import {useSelector} from 'react-redux';
import {activeUserSelector, User} from '../newStore';
import {getNameForPalaeoClassification} from '../model/manuscriptProperties/palaeoClassification';
import {PicturesBlock} from './PicturesBlock';
import {createTransliterationUrl, homeUrl, managePicturesUrl} from '../urls';
import {TLHParser} from 'simtex';
import {convertLine} from './LineParseResult';
import {TransliterationParseResultDisplay} from './ParseResultComponent';
import {getNameForManuscriptLanguageAbbreviation} from '../forms/manuscriptLanguageAbbreviations';
import update from 'immutability-helper';
import {WithQuery} from '../WithQuery';
import {blueButtonClasses, greenButtonClasses, amberButtonClasses, greyButtonClasses} from '../defaultDesign';

interface IProps {
  initialManuscript: ManuscriptMetaDataFragment;
}

interface IdentifierEdit {
  identifier: string;
  identifierType: ManuscriptIdentifierType;
}

function Inner({initialManuscript}: IProps): ReactElement {

  const {t} = useTranslation('common');
  const navigate = useNavigate();
  const activeUser: User | null = useSelector(activeUserSelector);
  const [releaseTransliteration] = useReleaseTransliterationMutation();
  const [updateManuscriptIdentifiers] = useUpdateManuscriptIdentifiersMutation();
  const [manuscript, setManuscript] = useState(initialManuscript);
  const [isEditingIdentifiers, setIsEditingIdentifiers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit state for identifiers
  const [editMainIdentifier, setEditMainIdentifier] = useState<IdentifierEdit>({
    identifier: manuscript.mainIdentifier.identifier,
    identifierType: manuscript.mainIdentifier.identifierType
  });

  const [editOtherIdentifiers, setEditOtherIdentifiers] = useState<IdentifierEdit[]>(
    manuscript.otherIdentifiers.map(id => ({
      identifier: id.identifier,
      identifierType: id.identifierType
    }))
  );

  if (!manuscript) {
    return <Navigate to={homeUrl}/>;
  }

  const createdByUser: boolean = !!activeUser && activeUser.sub === manuscript.creatorUsername;
  const userIsReviewer = !!activeUser && activeUser.rights === Rights.Reviewer;
  const userIsAdmin = !!activeUser && activeUser.rights === Rights.ExecutiveEditor;

  // User can edit identifiers if they're the author, an assigned reviewer, or an admin
  // Note: For reviewers, backend will verify they are actually assigned to this manuscript
  const canEditIdentifiers = createdByUser || userIsReviewer || userIsAdmin;

  const parsedTransliteration = manuscript.provisionalTransliteration !== undefined && manuscript.provisionalTransliteration !== null
    ? new TLHParser(manuscript.provisionalTransliteration).getLines().map(convertLine)
    : undefined;

  const mainIdentifier = manuscript.mainIdentifier.identifier;

  const onReleaseTransliteration = async (): Promise<void> => {
    if (manuscript.transliterationReleased) {
      return;
    }

    try {
      const {data} = await releaseTransliteration({variables: {mainIdentifier}});

      if (data?.manuscript?.releaseTransliteration) {
        setManuscript((manuscript) => update(manuscript, {
          transliterationReleased: {$set: true},
          status: {$set: ManuscriptStatus.TransliterationReleased}
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancelEdit = () => {
    // Reset to current values
    setEditMainIdentifier({
      identifier: manuscript.mainIdentifier.identifier,
      identifierType: manuscript.mainIdentifier.identifierType
    });
    setEditOtherIdentifiers(
      manuscript.otherIdentifiers.map(id => ({
        identifier: id.identifier,
        identifierType: id.identifierType
      }))
    );
    setIsEditingIdentifiers(false);
  };

  const handleSaveIdentifiers = async () => {
    if (!editMainIdentifier.identifier.trim()) {
      alert(t('mainIdentifierCannotBeEmpty'));
      return;
    }

    if (editMainIdentifier.identifier.length > 20) {
      alert(t('identifierTooLong', {max: 20, current: editMainIdentifier.identifier.length}));
      return;
    }

    for (const otherId of editOtherIdentifiers) {
      if (otherId.identifier.trim() && otherId.identifier.length > 20) {
        alert(t('identifierTooLong', {max: 20, current: otherId.identifier.length}));
        return;
      }
    }

    setIsSaving(true);
    try {
      const { data } = await updateManuscriptIdentifiers({
        variables: {
          mainIdentifier: manuscript.mainIdentifier.identifier,
          newMainIdentifier: {
            identifier: editMainIdentifier.identifier,
            identifierType: editMainIdentifier.identifierType
          },
          newOtherIdentifiers: editOtherIdentifiers.filter(id => id.identifier.trim())
        }
      });

      if (data?.manuscript?.updateIdentifiers) {
        setManuscript(prev => update(prev, {
          mainIdentifier: {$set: {
              __typename: 'ManuscriptIdentifier',
              identifier: editMainIdentifier.identifier,
              identifierType: editMainIdentifier.identifierType
            }},
          otherIdentifiers: {$set: editOtherIdentifiers
              .filter(id => id.identifier.trim())
              .map(id => ({
                __typename: 'ManuscriptIdentifier' as const,
                identifier: id.identifier,
                identifierType: id.identifierType
              }))}
        }));
        setIsEditingIdentifiers(false);

        if (editMainIdentifier.identifier !== manuscript.mainIdentifier.identifier) {
          navigate(`/manuscripts/${encodeURIComponent(editMainIdentifier.identifier)}/data`, { replace: true });
        }
      }
    } catch (error) {
      console.error('Error updating identifiers:', error);
      alert(t('errorUpdatingIdentifiers'));
    } finally {
      setIsSaving(false);
    }
  };

  const addOtherIdentifier = () => {
    setEditOtherIdentifiers([
      ...editOtherIdentifiers,
      { identifier: '', identifierType: ManuscriptIdentifierType.CollectionNumber }
    ]);
  };

  const removeOtherIdentifier = (index: number) => {
    setEditOtherIdentifiers(editOtherIdentifiers.filter((_, i) => i !== index));
  };

  const updateOtherIdentifier = (index: number, field: 'identifier' | 'identifierType', value: string) => {
    setEditOtherIdentifiers(
      editOtherIdentifiers.map((id, i) =>
        i === index ? { ...id, [field]: value } : id
      )
    );
  };

  const identifierTypes = [
    ManuscriptIdentifierType.CollectionNumber,
    ManuscriptIdentifierType.ExcavationNumber,
    ManuscriptIdentifierType.InventoryNumber,
    ManuscriptIdentifierType.PublicationNumber,
    ManuscriptIdentifierType.PublicationShortReference
  ];

  const disabledIdentifierTypes = new Set([
    ManuscriptIdentifierType.CollectionNumber,
    ManuscriptIdentifierType.ExcavationNumber,
    ManuscriptIdentifierType.PublicationShortReference
  ]);

  return (
    <div className="container mx-auto">
      <h1 className="font-bold text-2xl text-center">
        {t('manuscript')} {mainIdentifier}: {t('generalData_plural')}
      </h1>

      <div className="my-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-xl">{t('data_plural')}</h2>
          {canEditIdentifiers && !isEditingIdentifiers && (
            <button
              type="button"
              className={amberButtonClasses}
              onClick={() => setIsEditingIdentifiers(true)}
            >
              ✏️ {t('editIdentifiers')}
            </button>
          )}
        </div>

        {isEditingIdentifiers ? (
          <div className="p-4 border-2 border-amber-400 rounded bg-amber-50">
            <div className="mb-4">
              <h3 className="font-bold mb-2">{t('mainIdentifier')}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('identifier')}
                    <span className={editMainIdentifier.identifier.length > 20 ? 'text-red-600 ml-2' : 'text-gray-500 ml-2'}>
                      ({editMainIdentifier.identifier.length}/20)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={editMainIdentifier.identifier}
                    onChange={(e) => setEditMainIdentifier({...editMainIdentifier, identifier: e.target.value})}
                    className={'w-full p-2 border rounded ' + (editMainIdentifier.identifier.length > 20 ? 'border-red-500' : 'border-gray-300')}
                    disabled={isSaving}
                    maxLength={25}
                  />
                  {editMainIdentifier.identifier.length > 20 && (
                    <p className="text-red-600 text-sm mt-1">{t('identifierTooLong', {max: 20, current: editMainIdentifier.identifier.length})}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('identifierType')}</label>
                  <select
                    value={editMainIdentifier.identifierType}
                    onChange={(e) => setEditMainIdentifier({...editMainIdentifier, identifierType: e.target.value as ManuscriptIdentifierType})}
                    className="w-full p-2 border border-gray-300 rounded"
                    disabled={isSaving}
                  >
                    {identifierTypes.map(type => (
                      <option key={type} value={type} disabled={disabledIdentifierTypes.has(type)}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">{t('otherIdentifier_plural')}</h3>
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600 disabled:opacity-50"
                  onClick={addOtherIdentifier}
                  disabled={isSaving}
                >
                  + {t('add')}
                </button>
              </div>

              {editOtherIdentifiers.map((otherId, index) => (
                <div key={index} className="mb-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={otherId.identifier}
                        onChange={(e) => updateOtherIdentifier(index, 'identifier', e.target.value)}
                        placeholder={t('identifier')}
                        className={'p-2 border rounded w-full ' + (otherId.identifier.length > 20 ? 'border-red-500' : 'border-gray-300')}
                        disabled={isSaving}
                        maxLength={25}
                      />
                      {otherId.identifier.length > 20 && (
                        <p className="text-red-600 text-xs mt-1">
                          {otherId.identifier.length}/20 - {t('tooLong')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={otherId.identifierType}
                        onChange={(e) => updateOtherIdentifier(index, 'identifierType', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded"
                        disabled={isSaving}
                      >
                        {identifierTypes.map(type => (
                          <option key={type} value={type} disabled={disabledIdentifierTypes.has(type)}>{type}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeOtherIdentifier(index)}
                        className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                        disabled={isSaving}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className={greyButtonClasses + ' disabled:opacity-50'}
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className={greenButtonClasses + ' disabled:opacity-50'}
                onClick={handleSaveIdentifiers}
                disabled={isSaving}
              >
                {isSaving ? t('saving') + '...' : t('save')}
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <tbody>
            <tr>
              <th className="text-right px-4 py-2">{t('mainIdentifier')}</th>
              <td className="px-4 py-2">
                {manuscript.mainIdentifier.identifier} ({manuscript.mainIdentifier.identifierType})
              </td>
            </tr>
            <tr>
              <th className="text-right px-4 py-2">{t('otherIdentifier_plural')}</th>
              <td className="px-4 py-2">
                {manuscript.otherIdentifiers.length === 0
                  ? <span className="italic">{t('noOtherIdentifiersFound')}.</span>
                  : <ul className="content">
                    {manuscript.otherIdentifiers.map(({identifier, identifierType}) => <li key={identifier}>{identifier} ({identifierType})</li>)}
                  </ul>}
              </td>
            </tr>
            <tr>
              <th className="text-right px-4 py-2">{t('defaultLanguage')}</th>
              <td className="px-4 py-2">{getNameForManuscriptLanguageAbbreviation(manuscript.defaultLanguage, t)}</td>
            </tr>
            <tr>
              <th className="text-right px-4 py-2">{t('palaeographicClassification')}</th>
              <td className="px-4 py-2">
                {getNameForPalaeoClassification(manuscript.palaeographicClassification, t)}
                {manuscript.palaeographicClassificationSure ? '' : '?'}
              </td>
            </tr>
            <tr>
              <th className="text-right px-4 py-2">{t('(proposed)CthClassification')}</th>
              <td className="px-4 py-2">{manuscript.cthClassification || '--'}</td>
            </tr>
            <tr>
              <th className="text-right px-4 py-2">{t('provenance')}</th>
              <td className="px-4 py-2">{manuscript.provenance || '--'}</td>
            </tr>
            <tr>
              <th className="text-right px-4 py-2">{t('bibliography')}</th>
              <td className="px-4 py-2">{manuscript.bibliography || '--'}</td>
            </tr>
            <tr>
              <th className="text-right px-4 py-2">{t('status')}</th>
              <td className="px-4 py-2">{manuscript.status}</td>
            </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="my-3">
        <h2 className="font-bold text-xl">{t('picture_plural')}</h2>

        {manuscript.pictureUrls.length === 0
          ? <div className="my-4 italic text-cyan-500 text-center">{t('noPicturesUploadedYet')}.</div>
          : <PicturesBlock mainIdentifier={manuscript.mainIdentifier.identifier} pictures={manuscript.pictureUrls}/>}

        {(createdByUser || userIsAdmin) && <div className="text-center">
          <Link className={blueButtonClasses} to={`../${managePicturesUrl}`}>{t('managePictures')}</Link>
        </div>}
      </div>

      <div className="my-3">
        <h2 className="font-bold text-xl">{t('transliteration')}</h2>

        {parsedTransliteration !== undefined
          ? (
            <div className="my-3">
              <TransliterationParseResultDisplay showStatusLevel={false} lines={parsedTransliteration}/>
            </div>
          )
          : <div className="my-4 p-2 italic text-cyan-500 text-center">{t('noTransliterationCreatedYet')}.</div>}

        {createdByUser && !manuscript.transliterationReleased &&
          <div className="space-x-2">
            {parsedTransliteration !== undefined
              ? (
                <div className="my-2 grid grid-cols-2 gap-2">
                  <Link className={blueButtonClasses} to={`../${createTransliterationUrl}`}>{t('updateTransliteration')}</Link>
                  <button type="button" className={greenButtonClasses} onClick={onReleaseTransliteration}>{t('releaseTransliteration')}</button>
                </div>
              )
              : <Link className={blueButtonClasses} to={`../${createTransliterationUrl}`}>{t('createTransliteration')}</Link>}
          </div>}
      </div>
    </div>
  );
}

export function ManuscriptData(): ReactElement {

  const {mainIdentifier} = useParams<'mainIdentifier'>();

  if (mainIdentifier === undefined) {
    return <Navigate to={homeUrl}/>;
  }

  const query = useManuscriptQuery({variables: {mainIdentifier}});

  return (
    <WithQuery query={query}>
      {({manuscript}) => manuscript
        ? <Inner initialManuscript={manuscript}/>
        : <Navigate to={homeUrl}/>
      }
    </WithQuery>
  );
}
