export type TrackingTokenKind = 'imported' | 'missing' | 'highlight' | 'crossref';

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeContent(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function lmFieldToken(fieldName: string, content: string, kind: TrackingTokenKind): string {
  return `<lm-field data-field="${escapeAttr(fieldName)}" data-kind="${escapeAttr(kind)}">${escapeContent(content)}</lm-field>`;
}

export function lmLogicStartToken(fieldName: string, helperName: string, result: boolean): string {
  return `<lm-logic-start data-field="${escapeAttr(fieldName)}" data-logic-helper="${escapeAttr(
    helperName
  )}" data-logic-result="${result ? 'true' : 'false'}"></lm-logic-start>`;
}

export function lmLogicEndToken(): string {
  return '<lm-logic-end></lm-logic-end>';
}
