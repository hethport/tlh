import {useTranslation} from 'react-i18next';
import {JSX, useState, useEffect} from 'react';
import {IndexQuery, useIndexLazyQuery} from './graphql';
import {Link, useNavigate} from 'react-router-dom';
import {WithQuery} from './WithQuery';
import {createAnonymousTransliterationUrl, createManuscriptUrl} from './urls';
import {ManuscriptsOverview} from './ManuscriptsOverview';
import {ManuscriptLinkButtons} from './ManuscriptLinkButtons';
import {Box} from './Box';
import {ReviewerHomeBox} from './ReviewerHomeBox';
import {ExecutiveEditorHomeBox} from './ExecutiveEditorHomeBox';
import {
  getCurrentVersion,
  fetchLatestVersion,
  compareVersions,
  hardReload,
  VersionNotification
} from './VersionManager';

interface IProps extends IndexQuery {
  page: number;
  queryPage: (page: number) => void;
}

function Inner({manuscriptCount, allManuscripts, myManuscripts, page, queryPage, reviewerQueries, executiveEditorQueries}: IProps): JSX.Element {

  const {t} = useTranslation('common');

  return (
    <>
      {myManuscripts && <Box heading={t('myManuscripts')}>
        <ManuscriptLinkButtons manuscripts={myManuscripts} errorMsg={t('noOwnManuscriptsYet')}/>
      </Box>}

      {reviewerQueries && <ReviewerHomeBox {...reviewerQueries}/>}

      {executiveEditorQueries && <ExecutiveEditorHomeBox {...executiveEditorQueries}/>}

      <Box heading={t('newestManuscripts')}>
        <ManuscriptsOverview manuscriptCount={manuscriptCount} allManuscripts={allManuscripts} queryPage={queryPage} page={page}/>
      </Box>
    </>
  );
}

export function Home(): JSX.Element {

  const {t} = useTranslation('common');
  const navigate = useNavigate();
  const [executeIndexQuery, indexQuery] = useIndexLazyQuery();
  const [page, setPage] = useState(0);
  const [showVersionNotification, setShowVersionNotification] = useState(false);
  const [versionInfo, setVersionInfo] = useState<{current: string, latest: string} | null>(null);

  const currentVersion = getCurrentVersion();
  const isDevOrTive = currentVersion === 'DEV' || currentVersion === 'TIVE';

  useEffect(() => {
    const checkVersion = async () => {
      console.log('=== Version Check Started ===');
      const currentVersion = getCurrentVersion();

      if (!currentVersion || currentVersion === 'DEV' || currentVersion === 'TIVE') {
        console.log('Skipping version check (DEV/TIVE mode or no version detected)');
        return;
      }

      const latestVersion = await fetchLatestVersion();
      console.log('Version check result:', {currentVersion, latestVersion});

      if (latestVersion && compareVersions(currentVersion, latestVersion)) {
        console.log('New version available!');
        setVersionInfo({current: currentVersion, latest: latestVersion});
        console.log('Showing version notification');
        setShowVersionNotification(true);
      } else {
        console.log('Already on latest version or version check failed');
      }
      console.log('=== Version Check Complete ===');
    };

    checkVersion();

    const interval = setInterval(checkVersion, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === 'M') {
        event.preventDefault();
        navigate(createAnonymousTransliterationUrl);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  function queryPage(page: number) {
    executeIndexQuery({variables: {page}})
      .then((res) => {
        if (res.data) {
          setPage(page);
        }
      })
      .catch((error) => console.error(error));
  }

  function handleDismissNotification() {
    console.log('Dismissing notification');
    setShowVersionNotification(false);
  }

  if (!indexQuery.called) {
    queryPage(page);
  }

  return (
    <div className="container mx-auto">
      <h1 className="font-bold text-2xl text-center mb-4">TLH<sup>dig</sup></h1>

      <div className="my-8 text-center flex gap-4 justify-center items-center">
        <Link className="px-8 py-2 rounded bg-blue-600 text-white text-center" to={createManuscriptUrl}>
          {t('createManuscript')}
        </Link>

        {isDevOrTive && (
          <button
            onClick={hardReload}
            className="px-6 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
            title={t('clearCacheTooltip') || 'Clear browser cache and reload'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {t('clearCache') || 'Clear Cache'}
          </button>
        )}
      </div>

      {indexQuery.called && <WithQuery query={indexQuery}>
        {(data) => <Inner {...data} page={page} queryPage={queryPage}/>}
      </WithQuery>}

      {showVersionNotification && versionInfo && (
        <VersionNotification
          currentVersion={versionInfo.current}
          latestVersion={versionInfo.latest}
          onDismiss={handleDismissNotification}
        />
      )}
    </div>
  );
}
