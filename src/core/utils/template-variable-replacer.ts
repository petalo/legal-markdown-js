/**
 * Replace `{{ variable.path }}` placeholders in a template string with values
 * from a metadata object.
 *
 * Only simple variable paths (identifiers, dot-notation, bracket notation with
 * integer or quoted string indices) are resolved. Any expression that does not
 * pass the allowlist regex is left as-is, so template syntax never executes
 * arbitrary code. Missing or null values are also left as-is.
 */
export function replaceTemplateVariables(
  template: string,
  metadata: Record<string, unknown> = {}
): string {
  if (!template || typeof template !== 'string') {
    return template;
  }

  // Match {{ expr }} where expr contains no nested braces (lazy capture to
  // avoid greedily consuming adjacent placeholders on the same line).
  return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, expression) => {
    const variablePath = String(expression).trim();

    if (!isSimpleVariablePath(variablePath)) {
      return match;
    }

    const value = resolvePath(metadata, variablePath);

    if (value === undefined || value === null) {
      return match;
    }

    return String(value);
  });
}

function isSimpleVariablePath(path: string): boolean {
  // Security allowlist: permits only identifiers, dot-property access, integer
  // bracket indices, and quoted-string bracket indices. Anything else (function
  // calls, computed expressions, prototype chains) is rejected so that user-
  // supplied template content cannot execute arbitrary code via this helper.
  return /^[a-zA-Z_$][\w$]*(?:\[[0-9]+\]|\.[a-zA-Z_$][\w$]*|\[["'][^"'\]]+["']\])*$/u.test(path);
}

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const normalizedPath = path
    .replace(/\["([^"\]]+)"\]/g, '.$1')
    .replace(/\['([^'\]]+)'\]/g, '.$1')
    .replace(/\[([0-9]+)\]/g, '.$1');

  return normalizedPath.split('.').reduce<unknown>((current, key) => {
    if (current === undefined || current === null) {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, obj);
}
