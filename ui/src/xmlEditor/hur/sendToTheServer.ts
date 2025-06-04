import { updateHurrianDictionaryUrl } from '../../urls';

export function sendMorphologicalAnalysisToTheServer(word: string, analysis: string) {
  const formData = new FormData();
  formData.append('word', word);
  formData.append('analysis', analysis);

  fetch(updateHurrianDictionaryUrl, {method: 'POST', body: formData});
}