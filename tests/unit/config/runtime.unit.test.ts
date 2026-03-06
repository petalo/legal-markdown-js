import { getRuntimeConfig, setRuntimeConfig } from '../../../src/config/runtime';
import { DEFAULT_CONFIG, type LegalMdConfig } from '../../../src/config/schema';

describe('runtime config', () => {
  it('returns default config initially', () => {
    const config = getRuntimeConfig();
    expect(config.pdf.connector).toBe(DEFAULT_CONFIG.pdf.connector);
  });

  it('updates config via setRuntimeConfig', () => {
    const custom: LegalMdConfig = {
      ...DEFAULT_CONFIG,
      logging: { ...DEFAULT_CONFIG.logging, level: 'debug' },
    };
    setRuntimeConfig(custom);
    expect(getRuntimeConfig().logging.level).toBe('debug');

    // Reset
    setRuntimeConfig({ ...DEFAULT_CONFIG });
  });
});
