import {hurrianDictionaryUrl} from '../../../../urls';
import {LexicalData, setLexicalData} from '../../lexicalData/lexicalData';

type DownloadStatus = 'Unitiated' | 'Success' | 'Failure';

export type DownloadReport = {
  downloadStatus: DownloadStatus;
  errorMessage: string | null;
};

const expectedContentType = 'application/json';

export async function downloadHurrianDictionary(username: string, password: string, setDownloadReport: (downloadReport: DownloadReport) => void): Promise<void> {
  const headers = new Headers();
  headers.append('Authorization', 'Basic ' + btoa(username + ':' + password));
  const response = await fetch(hurrianDictionaryUrl, {method: 'GET', headers});
  if (response.ok) {
    const contentType = response.headers.get('Content-Type');
    if (contentType === expectedContentType) {
      const lexicalData: LexicalData = await response.json();
      setLexicalData(lexicalData);
      setDownloadReport({
        downloadStatus: 'Success',
        errorMessage: null
      });
    } else {
      const errorMessage = `The server responded with an unexpected content type: ${contentType}.\nExpected: ${expectedContentType}.`;
      setDownloadReport({
        downloadStatus: 'Failure',
        errorMessage
      });
    }
  } else {
    const errorMessage = `The request has not been successful. The server response is ${response.status} ${response.statusText}`;
    setDownloadReport({
      downloadStatus: 'Failure',
      errorMessage
    });
  }
}
