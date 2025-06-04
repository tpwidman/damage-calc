#!/usr/bin/env tsx

import { Command } from 'commander';
import CombatServiceFactory from './src/core/CombatServiceFactory';
import { showMainMenu } from './src/views/menus';
import CombatService from './src/core/CombatService';

// Global service - will be loaded at startup
let combatService: CombatService;

async function main(): Promise<void> {
  try {
    // Create the service with all dependencies (replaces loadConfig)
    console.log('Loading character, session, and settings...');
    combatService = CombatServiceFactory.create();
    
    // Welcome message using the service
    console.log(`Welcome back, ${combatService.character.name}!`);
    console.log(`Level ${combatService.character.level} ${combatService.character.primaryClass}`);
    if (combatService.character.primarySubclass) {
      console.log(`Subclass: ${combatService.character.primarySubclass}`);
    }
    console.log(`Turn ${combatService.session.currentTurn}`);
    console.log('');
    
    // Start interactive mode with service (not config)
    await showMainMenu(combatService);
  } catch (error) {
    console.error('Failed to start application:', error);
    console.error('Make sure all config files exist:');
    console.error('- config/character-config.json');
    console.error('- config/session-data.json'); 
    console.error('- config/settings.json');
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

export { combatService };