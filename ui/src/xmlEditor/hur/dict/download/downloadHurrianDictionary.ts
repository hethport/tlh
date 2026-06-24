import {hurrianDictionaryUrl} from '../../../../urls';
import {LexicalData, setLexicalData} from '../../lexicalData/lexicalData';

type DownloadStatus = 'Unitiated' | 'Success' | 'Failure';

export type DownloadReport = {
  downloadStatus: DownloadStatus;
  message: string | null;
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
      const {exportDate} = lexicalData;
      const message = exportDate === undefined ? 'Success!'
        : 'Success! The downloaded dictionary was created on ' + exportDate;
      setDownloadReport({
        downloadStatus: 'Success',
        message
      });
    } else {
      const message = `The server responded with an unexpected content type: ${contentType}.\nExpected: ${expectedContentType}.`;
      setDownloadReport({
        downloadStatus: 'Failure',
        message
      });
    }
  } else {
    const message = `The request has not been successful. The server response is ${response.status} ${response.statusText}`;
    setDownloadReport({
      downloadStatus: 'Failure',
      message
    });
  }
}
