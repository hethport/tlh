export function escapeHtmlSpecialCharacters(s: string): string {
  return s.replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll('\'', '&#x27;')
          .replaceAll('/', '&#x2F;');
}
