export const serverUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8066' : '';


export function pictureBaseUrl(manuscriptMainIdentifier: string): string {
  return `${serverUrl}/uploads/${manuscriptMainIdentifier}`;
}

export const homeUrl = '/';

export const createManuscriptUrl = '/createManuscript';

export const registerUrl = '/registerForm';
export const loginUrl = '/login';

export const preferencesUrl = '/preferences';

export const editDocumentUrl = '/editDocument';

export const xmlComparatorUrl = '/xmlComparator';

export const documentMergerUrl = '/documentMerger';


// Foreign urls

const tlhAnalyzerServerUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8057' : 'https://hethport3.uni-wuerzburg.de/TLHaly';

export const tlhAnalyzerUrl = `${tlhAnalyzerServerUrl}/webanalysis.php`;
