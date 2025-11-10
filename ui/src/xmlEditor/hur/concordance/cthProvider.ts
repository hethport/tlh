import { updateMapping } from '../common/utility';

const textToCTHGroup = new Map<string, string>();

fetch('textToCTHGroup.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Unexpected response status ${response.status}`);
    } else {
      const contentType = response.headers.get('Content-Type');
      if (contentType !== null && contentType.startsWith('application/json')) {
        return response.json();
      } else {
        //response.text().then(text => console.log(text));
        throw new Error(`Unexpected content type ${contentType}`);
      }
    }
  })
  .then(obj => {
    updateMapping(textToCTHGroup, obj);
  })
  .catch(error => {
    console.log('Error while fethcing the text to CTH group mapping:', error);
  });

const unknown = '(unknown)';

export function getCTH(textName: string): string {
  const cth = textToCTHGroup.get(textName);
  if (cth === undefined) {
    return unknown;
  } else {
    return cth;
  }
}
