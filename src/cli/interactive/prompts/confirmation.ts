/**
 * @fileoverview Confirmation prompt for Interactive CLI
 */

import { confirm } from '@inquirer/prompts';
import { InteractiveConfig } from '../types';
import { formatConfigSummary } from '../utils/format-helpers';

/**
 * Show configuration summary and prompt for confirmation
 */
export async function confirmConfiguration(config: InteractiveConfig): Promise<boolean> {
  console.log(formatConfigSummary(config));

  const confirmed = await confirm({
    message: 'Proceed with this configuration?',
    default: true,
  });

  return confirmed;
}
