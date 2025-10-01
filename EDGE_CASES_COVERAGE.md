# Edge Cases Coverage - Test Implementation Guide

## Resumen Ejecutivo

Este documento guía la implementación de tests para casos edge que actualmente
tienen cobertura insuficiente o nula en legal-markdown-js.

**Prioridad identificada por el usuario**: "antes hemos descubierto que por
ejemplo si una variable mixin tenía un underscore, no la sustituíamos"

## Cobertura Actual

### Antes

- **General**: 60.11% statements, 82.63% branches, 76.21% functions
- **Signature lines**: 100% ✅
- **Template fields**: 74.69%
- **Mixins**: 26.53% ⚠️

### Después (con nuevos tests + FIX)

- **General**: 60.11% statements, **82.66% branches** (+0.03%), 76.21% functions
- **Tests totales**: **1662 passed** | 8 skipped (1670 total) - **+10 tests**
- **Nuevos tests añadidos**: 78 tests en 4 suites nuevas
  - Bracket values: 20 tests ✅
  - Escaped underscores: 23 tests ✅
  - Special characters: 25 tests ✅
  - **Underscore fix integration: 10 tests** ✅ **(NUEVO FIX)**

## Gaps Críticos Identificados

### 1. Bracket Values - 0% Coverage ❌

**Archivo**: `src/extensions/ast-mixin-processor.ts:377-400`

**Funcionalidad**: `detectBracketValues()` identifica valores placeholder como
`[CLIENT NAME]` en metadata y los marca como missing.

**Tests a implementar**:

- [ ] Variables simples con brackets: `{client_name: "[CLIENT NAME]"}`
- [ ] Variables con underscores Y brackets: `{doc_version: "[VERSION_NUMBER]"}`
- [ ] Nested objects: `{client: {name: "[NAME]"}}`
- [ ] Arrays con bracket values
- [ ] Bracket values en loops
- [ ] Bracket values con/sin espacios

### 2. Underscores Escapados en Formato - Cobertura Parcial ⚠️

**Archivo**: `src/plugins/remark/template-fields.ts:702-704`

**Funcionalidad**: Normaliza `\_` a `_` cuando remark-parse escapa underscores
en contextos de formato.

**Tests a implementar**:

- [ ] Variables con underscores en **bold**: `**{{client_name}}**`
- [ ] Variables con underscores en _italic_: `*{{contact_email}}*`
- [ ] Variables con underscores en links: `[{{page_title}}](url)`
- [ ] Variables con underscores en headers: `## {{section_title}}`
- [ ] Múltiples underscores: `{{long_var_name_with_many_underscores}}`

### 3. Caracteres Especiales en Nombres de Variables

**Tests a implementar**:

- [ ] Variables que empiezan con underscore: `_private_field`
- [ ] Variables que terminan con underscore: `field_`
- [ ] Dobles underscores: `field__name`
- [ ] Underscores con números: `field_1`, `v1_2_3`

### 4. Mixins con Underscores - 26.53% Coverage ⚠️

**Tests a implementar**:

- [ ] Helper functions con underscores: `{{format_date(@today)}}`
- [ ] Conditionals con underscores: `{{is_active ? "Yes" : "No"}}`
- [ ] Mixins recursivos con underscores
- [ ] Helpers que retornan valores con underscores

## Implementación ✅ COMPLETADA

### Fase 1: Bracket Values (Alta Prioridad) ✅

**Archivo**: `tests/unit/extensions/bracket-values.unit.test.ts` **Tests**:
20/20 passing **Funcionalidad**: detectBracketValues() - identifica
`[PLACEHOLDER]` en metadata

### Fase 2: Underscores Escapados (Alta Prioridad) ✅

**Archivo**: `tests/unit/plugins/remark/escaped-underscores.unit.test.ts`
**Tests**: 23/23 passing **Funcionalidad**: Variables con underscores en bold,
italic, links, headers

### Fase 3: Caracteres Especiales (Media Prioridad) ✅

**Archivo**: `tests/unit/plugins/remark/special-characters.unit.test.ts`
**Tests**: 25/25 passing **Funcionalidad**: Edge cases con underscores (leading,
trailing, double)

## Hallazgos Importantes

### ✅ SOLUCIONADO: Leading/Trailing Underscores

Los tests revelaron una **limitación crítica** en el parseo de markdown que **HA
SIDO CORREGIDA**.

**Problema Original**: Variables con underscores al inicio o final se parseaban
incorrectamente:

- `{{_field}}` → se convertía a `{{*field}}` (underscore inicial se volvía
  asterisco)
- `{{field_}}` → se convertía a `{{field*}}` (underscore final se volvía
  asterisco)
- `{{_field_}}` → se convertía a `{{*field*}}` (ambos underscores se volvían
  asteriscos)

**Causa**: Conflicto con el parseo de markdown de remark-parse, que interpreta
underscores como delimitadores de formato italic.

**✅ SOLUCIÓN IMPLEMENTADA**:

Se agregó pre-procesamiento en `legal-markdown-processor.ts` que:

1. **Escapa underscores dentro de `{{}}`** ANTES de parsear markdown
2. Los underscores se convierten temporalmente a `\_` para evitar conflicto con
   markdown
3. El plugin template-fields los normaliza después del parseo

**Funciones agregadas**:

- `escapeTemplateUnderscores()` - Pre-procesamiento antes de remark-parse
- `unescapeTemplateUnderscores()` - No utilizada (normalización en
  template-fields)

**Resultado**: Todas las variables con underscores ahora funcionan
correctamente:

- `{{_field}}` ✅ (underscore inicial)
- `{{field_}}` ✅ (underscore final)
- `{{_field_}}` ✅ (ambos underscores)
- `{{client_name}}` ✅ (underscore en medio)
- `{{field__name}}` ✅ (dobles underscores)

**Tests de validación**: 10 integration tests agregados en
`underscore-fix.integration.test.ts`

## Archivos Clave

- `src/extensions/ast-mixin-processor.ts` - detectBracketValues (lines 377-400)
- `src/plugins/remark/template-fields.ts` - escaped underscores (lines 702-704)
- `src/core/processors/mixin-processor.ts` - mixin processing logic

## Objetivo

Aumentar cobertura de:

- Mixins: 26.53% → 70%+
- Template fields: 74.69% → 85%+
- General: 60.11% → 70%+
