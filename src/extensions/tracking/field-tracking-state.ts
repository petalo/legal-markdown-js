/**
 * Shared field-tracking enablement flag.
 *
 * Lives in its own module so both `template-loops` (which sets it before each
 * Handlebars compilation) and `handlebars-engine` (which reads it inside
 * helper callbacks) can import it without creating a circular dependency.
 */

let _enabled = false;
let _astFieldTracking = false;
let _logicBranchHighlighting = false;
let _logicBranchCounter = 0;

interface HelperInvocationInfo {
  topLevel: boolean;
  sourceFields: string[];
}

const _helperInvocations = new Map<string, HelperInvocationInfo>();

export function setFieldTrackingEnabled(enabled: boolean): void {
  _enabled = enabled;
}

export function isFieldTrackingEnabled(): boolean {
  return _enabled;
}

export function setAstFieldTrackingEnabled(enabled: boolean): void {
  _astFieldTracking = enabled;
}

export function isAstFieldTrackingEnabled(): boolean {
  return _astFieldTracking;
}

export function setLogicBranchHighlightingEnabled(enabled: boolean): void {
  _logicBranchHighlighting = enabled;
}

export function isLogicBranchHighlightingEnabled(): boolean {
  return _logicBranchHighlighting;
}

/**
 * @deprecated Use setAstFieldTrackingEnabled.
 */
export function setExperimentalAstFieldTracking(enabled: boolean): void {
  setAstFieldTrackingEnabled(enabled);
}

/**
 * @deprecated Use isAstFieldTrackingEnabled.
 */
export function isExperimentalAstFieldTrackingEnabled(): boolean {
  return isAstFieldTrackingEnabled();
}

/**
 * @deprecated Use setLogicBranchHighlightingEnabled.
 */
export function setExperimentalLogicBranchHighlighting(enabled: boolean): void {
  setLogicBranchHighlightingEnabled(enabled);
}

/**
 * @deprecated Use isLogicBranchHighlightingEnabled.
 */
export function isExperimentalLogicBranchHighlightingEnabled(): boolean {
  return isLogicBranchHighlightingEnabled();
}

export function resetLogicBranchCounter(): void {
  _logicBranchCounter = 0;
}

export function nextLogicBranchId(): number {
  _logicBranchCounter += 1;
  return _logicBranchCounter;
}

export function setHelperInvocationInfo(
  helperName: string,
  line: number,
  column: number,
  info: HelperInvocationInfo
): void {
  _helperInvocations.set(`${helperName}:${line}:${column}`, info);
}

export function getHelperInvocationInfo(
  helperName: string,
  line: number,
  column: number
): HelperInvocationInfo | undefined {
  return _helperInvocations.get(`${helperName}:${line}:${column}`);
}

export function clearHelperInvocationInfo(): void {
  _helperInvocations.clear();
}
