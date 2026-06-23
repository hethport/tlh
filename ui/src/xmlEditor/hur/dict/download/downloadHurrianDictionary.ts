import {hurrianDictionaryUrl} from '../../../../urls';
import {LexicalData, setLexicalData} from '../../lexicalData/lexicalData';

export function downloadHurrianDictionary(username: string, password: string): void {
  const headers = new Headers();
  headers.append('Authorization', 'Basic ' + btoa(username + ':' + password));
  fetch(hurrianDictionaryUrl, {method: 'GET', headers})
    .then(response => response.json())
    .then((lexicalData: LexicalData) => {
      setLexicalData(lexicalData);
    });
}
