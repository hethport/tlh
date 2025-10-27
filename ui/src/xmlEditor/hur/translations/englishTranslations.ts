const fieldSeparator = ' @ ';
export function getEnglishTranslationKey(stem: string, pos: string, germanTranslation: string): string {
  return [stem, pos, germanTranslation].join(fieldSeparator);
}
