import {NavLink, useNavigate} from 'react-router-dom';
import {JSX, useState, useRef, useEffect} from 'react';
import {
  createManuscriptUrl,
  documentMergerUrl,
  homeUrl,
  loginUrl,
  oxtedUrl,
  pipelineManagementUrl,
  preferencesUrl,
  registerUrl,
  userManagementUrl,
  xmlComparatorUrl,
  dictionaryViewerUrl,
  macroeditorUrl,
  suffixDictionaryUrl,
  stopListViewerUrl,
  simtexGuidelinesUrl
} from './urls';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {activeUserSelector, logout} from './newStore';
import i18next from 'i18next';
import classNames from 'classnames';
import {Rights} from './graphql';
import {getCurrentVersion} from './VersionManager';

const languages: string[] = ['de', 'en'];

const buttonClasses = 'py-4 px-2 ml-2 hover:bg-sky-700 transition-colors';

export function NavBar(): JSX.Element {

  const {t} = useTranslation('common');
  const user = useSelector(activeUserSelector);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentVersion = getCurrentVersion();
  const isTiveVersion = currentVersion === 'TIVE';

  const [isTiveFlyoutOpen, setIsTiveFlyoutOpen] = useState(isTiveVersion);
  const flyoutRef = useRef<HTMLDivElement>(null);

  const buildDate = process.env.REACT_APP_BUILD_DATE;

  function onLogout() {
    dispatch(logout());
    navigate(loginUrl);
  }

  function changeLang(lang: string): void {
    i18next.changeLanguage(lang).catch((err) => console.error(err));
  }

  // Auto-open flyout for TIVE version
  useEffect(() => {
    if (isTiveVersion) {
      setIsTiveFlyoutOpen(true);
    }
  }, [isTiveVersion]);

  // Close flyout when clicking outside and not in TIVE
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node) && !isTiveVersion) {
        setIsTiveFlyoutOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="flex flex-row bg-sky-800 text-white">
      <NavLink className="p-4 hover:bg-sky-700 font-extrabold" title={buildDate} to={homeUrl}>TLH<sup>dig</sup> ({process.env.REACT_APP_VERSION})</NavLink>

      {user && <NavLink className={buttonClasses} to={createManuscriptUrl}>{t('createManuscript')}</NavLink>}
      <NavLink className={buttonClasses} to={oxtedUrl}>{t('editDocument')}</NavLink>
      <NavLink className={buttonClasses} to={xmlComparatorUrl}>{t('xmlComparator')}</NavLink>
      <NavLink className={buttonClasses} to={documentMergerUrl}>{t('documentMerger')}</NavLink>

      {/* TIVE Flyout Menu */}
      <div className="relative" ref={flyoutRef}>
        <button
          type="button"
          className={classNames(buttonClasses, {
            'bg-teal-800': isTiveFlyoutOpen
          })}
          onClick={() => setIsTiveFlyoutOpen(!isTiveFlyoutOpen)}
        >
          TIVE {isTiveFlyoutOpen ? '▸' : ''}
        </button>

        {isTiveFlyoutOpen && (
          <div className="absolute top-0 bottom-0 flex flex-row bg-teal-800 shadow-lg z-50 border border-gray-500/30 h-full rounded-r-md overflow-hidden">
            <button
              type="button"
              className="py-2 px-2 whitespace-nowrap flex items-center group hover:bg-teal-700 transition-colors"
              onClick={() => setIsTiveFlyoutOpen(!isTiveFlyoutOpen)}
            >
              {isTiveFlyoutOpen ? '◂' : ''}
            </button>
            <NavLink
              className="py-4 pl-2 pr-4 whitespace-nowrap flex items-center group hover:bg-teal-700 transition-colors"
              to={dictionaryViewerUrl}
            >
              {t('dictionaryViewer')}
            </NavLink>
            <NavLink
              className="py-4 px-4 whitespace-nowrap flex items-center group hover:bg-teal-700 transition-colors"
              to={macroeditorUrl}
            >
              {t('macroeditor')}
            </NavLink>
            <NavLink
              className="py-4 px-4 whitespace-nowrap flex items-center group hover:bg-teal-700 transition-colors"
              to={suffixDictionaryUrl}
            >
              {t('suffixDictionary')}
            </NavLink>
            <NavLink
              className="py-4 px-4 whitespace-nowrap flex items-center group hover:bg-teal-700 transition-colors"
              to={stopListViewerUrl}
            >
              {t('stopList')}
            </NavLink>
          </div>
        )}
      </div>

      <div className="flex-grow"/>
      <NavLink
        className={buttonClasses}
        to={simtexGuidelinesUrl}
      >
        SIMTEX {t('guidelines')}
      </NavLink>
      <NavLink
        className={buttonClasses}
        to={preferencesUrl}
      >
        {t('preferences')}
      </NavLink>

      <div className="py-4 px-2">{t('language')}:</div>
      {languages.map((lang) =>
        <button type="button" onClick={() => changeLang(lang)} className={classNames('py-4 pr-2', {'font-bold': i18next.language === lang})} key={lang}>
          {lang}
        </button>)}

      {user
        ? (
          <>
            {user.rights === Rights.ExecutiveEditor && <>
              <NavLink className={buttonClasses} to={pipelineManagementUrl}>{t('pipelineManagement')}</NavLink>
              <NavLink className={buttonClasses} to={userManagementUrl}>{t('userManagement')}</NavLink>
            </>}
            <button className={buttonClasses} onClick={onLogout}>{t('logout')} {user.sub}</button>
          </>
        )
        : (
          <>
            <NavLink className={buttonClasses} to={registerUrl}>{t('register')}</NavLink>
            <NavLink className={buttonClasses} to={loginUrl}>{t('login')}</NavLink>
          </>
        )
      }
    </nav>
  );
}
