import { DEFAULT_CONFIG, type LegalMdConfig } from './schema';

function cloneConfig(config: LegalMdConfig): LegalMdConfig {
  if (typeof structuredClone === 'function') {
    return structuredClone(config);
  }

  return JSON.parse(JSON.stringify(config)) as LegalMdConfig;
}

let runtimeConfig: LegalMdConfig = cloneConfig(DEFAULT_CONFIG);

export function getRuntimeConfig(): LegalMdConfig {
  return cloneConfig(runtimeConfig);
}

export function setRuntimeConfig(config: LegalMdConfig): void {
  runtimeConfig = cloneConfig(config);
}
