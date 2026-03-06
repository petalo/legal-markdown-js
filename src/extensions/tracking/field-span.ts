export type FieldKind = 'imported' | 'missing' | 'highlight' | 'crossref';

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeContent(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function fieldSpan(
  fieldName: string,
  content: string,
  kind: FieldKind = 'imported'
): string {
  const cls =
    kind === 'missing'
      ? 'legal-field missing-value'
      : kind === 'highlight' || kind === 'crossref'
        ? 'legal-field highlight'
        : 'legal-field imported-value';

  return `<span class="${cls}" data-field="${escapeAttr(fieldName)}">${escapeContent(content)}</span>`;
}

export function missingFieldSpan(fieldName: string): string {
  return fieldSpan(fieldName, `[[${fieldName}]]`, 'missing');
}
