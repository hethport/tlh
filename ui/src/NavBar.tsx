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
} from './urls';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {activeUserSelector, logout} from './newStore';
import i18next from 'i18next';
import classNames from 'classnames';
import {Rights} from './graphql';

const languages: string[] = ['de', 'en'];

const buttonClasses = 'py-4 px-2 ml-2 hover:bg-slate-700';

export function NavBar(): JSX.Element {

  const {t} = useTranslation('common');
  const user = useSelector(activeUserSelector);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isTiveDropdownOpen, setIsTiveDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const buildDate = process.env.REACT_APP_BUILD_DATE;

  function onLogout() {
    dispatch(logout());
    navigate(loginUrl);
  }

  function changeLang(lang: string): void {
    i18next.changeLanguage(lang).catch((err) => console.error(err));
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTiveDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="flex flex-row bg-gray-800 text-white">
      <NavLink className="p-4 hover:bg-slate-700 font-extrabold" title={buildDate} to={homeUrl}>TLH<sup>dig</sup> ({process.env.REACT_APP_VERSION})</NavLink>

      {user && <NavLink className={buttonClasses} to={createManuscriptUrl}>{t('createManuscript')}</NavLink>}
      <NavLink className={buttonClasses} to={oxtedUrl}>{t('editDocument')}</NavLink>
      <NavLink className={buttonClasses} to={xmlComparatorUrl}>{t('xmlComparator')}</NavLink>
      <NavLink className={buttonClasses} to={documentMergerUrl}>{t('documentMerger')}</NavLink>

      {/* TIVE Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          className={buttonClasses}
          onClick={() => setIsTiveDropdownOpen(!isTiveDropdownOpen)}
        >
          TIVE {isTiveDropdownOpen ? '▴' : '▾'}
        </button>

        {isTiveDropdownOpen && (
          <div className="absolute left-0 mt-0 w-48 bg-gray-700 shadow-lg z-50">
            <NavLink
              className="block py-2 px-4 hover:bg-slate-600"
              to={dictionaryViewerUrl}
              onClick={() => setIsTiveDropdownOpen(false)}
            >
              {t('dictionaryViewer')}
            </NavLink>
            <NavLink
              className="block py-2 px-4 hover:bg-slate-600"
              to={macroeditorUrl}
              onClick={() => setIsTiveDropdownOpen(false)}
            >
              {t('macroeditor')}
            </NavLink>
            <NavLink
              className="block py-2 px-4 hover:bg-slate-600"
              to={suffixDictionaryUrl}
              onClick={() => setIsTiveDropdownOpen(false)}
            >
              {t('suffixDictionary')}
            </NavLink>
            <NavLink
              className="block py-2 px-4 hover:bg-slate-600"
              to={stopListViewerUrl}
              onClick={() => setIsTiveDropdownOpen(false)}
            >
              {t('stopList')}
            </NavLink>
          </div>
        )}
      </div>

      <div className="flex-grow"/>
      <div className="py-4 px-2"><a href="https://www.hethport3.uni-wuerzburg.de/SIMTEX_Guidelines/" target="_blank" rel="noopener noreferrer">SIMTEX {t('guidelines')}</a></div>
      <NavLink className={buttonClasses} to={preferencesUrl}>{t('preferences')}</NavLink>

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
