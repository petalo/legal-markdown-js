import { DEFAULT_CONFIG, type LegalMdConfig } from './schema';

let runtimeConfig: LegalMdConfig = { ...DEFAULT_CONFIG };

export function getRuntimeConfig(): LegalMdConfig {
  return runtimeConfig;
}

export function setRuntimeConfig(config: LegalMdConfig): void {
  runtimeConfig = config;
}
