#!/usr/bin/env tsx

import { Command } from 'commander';
import { loadConfig } from './src/utils/config-loader';
import { showMainMenu } from './src/menu/main-menu';
import type { Config } from './src/types';

// Global config - will be loaded at startup
let config: Config;

async function main(): Promise<void> {
  try {
    // Load configuration
    config = loadConfig();
    
    // Start interactive mode
    await showMainMenu(config);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// CLI setup for future command-line options
const program = new Command();

program
  .name('barb-attack')
  .description(`D&D Combat Assistant`)
  .version('2.0.0');

program
  .command('interactive')
  .alias('i')
  .description('Interactive mode with menu system')
  .action(main);

// Default to interactive mode
if (process.argv.length === 2) {
  main();
} else {
  program.parse();
}

export { config };