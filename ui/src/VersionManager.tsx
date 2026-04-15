import {JSX} from 'react';
import {useTranslation} from 'react-i18next';

export function compareVersions(current: string, latest: string): boolean {
  const parseCurrent = current.match(/^(\d+)\.(\d+)\.(\d+)$/);
  const parseLatest = latest.match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!parseCurrent || !parseLatest) {
    console.log('Version format invalid:', {current, latest});
    return false;
  }

  const [, curMajor, curMinor, curPatch] = parseCurrent.map(Number);
  const [, latMajor, latMinor, latPatch] = parseLatest.map(Number);

  console.log('Comparing versions:', {
    current: {major: curMajor, minor: curMinor, patch: curPatch},
    latest: {major: latMajor, minor: latMinor, patch: latPatch}
  });

  if (latMajor > curMajor) return true;
  if (latMajor < curMajor) return false;
  if (latMinor > curMinor) return true;
  if (latMinor < curMinor) return false;
  return latPatch > curPatch;
}

export function getCurrentVersion(): string | null {
  const version = process.env.REACT_APP_VERSION || null;

  if (version) {
    console.log('Current version from env:', version);
  } else {
    console.log('No version found in process.env.REACT_APP_VERSION');
  }

  return version;
}

export async function fetchLatestVersion(): Promise<string | null> {
  try {
    const pathMatch = window.location.pathname.match(/(.*?)\/\d+\.\d+\.\d+\//);
    const basePath = pathMatch ? pathMatch[1] : '/tlh_editor';

    const indexUrl = `${basePath}/index.php?version`;
    console.log('Fetching version from:', window.location.origin + indexUrl);

    const response = await fetch(indexUrl, {
      method: 'GET',
      cache: 'no-cache'
    });

    if (!response.ok) {
      console.error('Version fetch failed:', response.status, response.statusText);
      return null;
    }

    const versionText = await response.text();
    const version = versionText.trim();

    console.log('Latest version from server:', version);

    if (/^\d+\.\d+\.\d+$/.test(version)) {
      return version;
    } else {
      console.error('Invalid version format received:', version);
      return null;
    }

  } catch (error) {
    console.error('Failed to fetch latest version:', error);
    return null;
  }
}

export function hardReloadToNewVersion(newVersion: string): void {
  console.log('Reloading to new version:', newVersion);

  if ('caches' in window) {
    caches.keys().then((names) => {
      console.log('Clearing caches:', names);
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }

  const pathMatch = window.location.pathname.match(/(.*?)\/(DEV|TIVE|\d+\.\d+\.\d+)(\/.*)/);

  if (pathMatch) {
    const [, basePath, , remainingPath] = pathMatch;
    const newPath = `${basePath}/${newVersion}${remainingPath}`;
    console.log('Navigating to new path:', newPath);
    window.location.href = newPath;
  } else {
    console.warn('Could not parse path for version update, doing regular reload');
    window.location.reload();
  }
}

export function hardReload(): void {
  console.log('Performing hard reload...');

  if ('caches' in window) {
    caches.keys().then((names) => {
      console.log('Clearing caches:', names);
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }

  window.location.reload();
}

interface VersionNotificationProps {
  currentVersion: string;
  latestVersion: string;
  onDismiss: () => void;
}

export function VersionNotification({currentVersion, latestVersion, onDismiss}: VersionNotificationProps): JSX.Element {
  const {t} = useTranslation('common');

  console.log('Rendering version notification:', {currentVersion, latestVersion});

  return (
    <div className="fixed bottom-4 left-4 max-w-sm bg-blue-600 text-white rounded-lg shadow-lg p-4 z-50 animate-slide-in">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
          <h3 className="font-semibold">
            {t('newVersionAvailable') || 'New Version Available'}
          </h3>
        </div>
        <button
          onClick={onDismiss}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <p className="text-sm mb-3">
        {t('versionUpdateMessage', {current: currentVersion, latest: latestVersion}) ||
          `Version ${latestVersion} is now available (currently running ${currentVersion})`}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => hardReloadToNewVersion(latestVersion)}
          className="flex-1 bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition-colors font-medium text-sm"
        >
          {t('updateNow') || 'Update Now'}
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2 rounded border border-white hover:bg-blue-700 transition-colors text-sm"
        >
          {t('later') || 'Later'}
        </button>
      </div>
    </div>
  );
}
