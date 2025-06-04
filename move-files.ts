#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const moves = [
  // === CORE APPLICATION COMPONENTS ===
  // classes/ → core/ (app components, not D&D classes)
  ['src/classes/Character.ts', 'src/core/Character.ts'],
  ['src/classes/GameSession.ts', 'src/core/GameSession.ts'],
  ['src/classes/GameSettings.ts', 'src/core/GameSettings.ts'],
  
  // services/ → core/ (business logic)
  ['src/services/CombatService.ts', 'src/core/CombatService.ts'],
  ['src/services/CombatServiceFactory.ts', 'src/core/CombatServiceFactory.ts'],
  
  // repositories/ → core/repositories/ (data access)
  ['src/repositories/interfaces.ts', 'src/core/repositories/interfaces.ts'],
  ['src/repositories/FileRepositories.ts', 'src/core/repositories/FileRepositories.ts'],

  // === VIEWS LAYER (UI/Console) ===
  // menu/ → views/menus/ (functional, lowercase)
  ['src/menu/main-menu.ts', 'src/views/menus/main-menu.ts'],
  ['src/menu/settings.ts', 'src/views/menus/settings-menu.ts'],
  ['src/menu/history.ts', 'src/views/menus/history-menu.ts'],
  
  // utils/ → views/components/ (UI-related utilities)
  ['src/utils/animations.ts', 'src/views/components/animations.ts'],
  
  // === GAME LAYER (D&D Mechanics) ===
  // features/barbarian/ → game/classes/barbarian/ (D&D class, not just ability)
  ['src/features/barbarian/rage-manager.ts', 'src/game/classes/barbarian/rage-manager.ts'],
  ['src/features/barbarian/brutal-strike.ts', 'src/game/classes/barbarian/brutal-strike.ts'],
  ['src/features/barbarian/barbarian-progression.ts', 'src/game/progression/barbarian-progression.ts'],
  ['src/features/barbarian/subclasses/wild-magic/wild-magic.ts', 'src/game/classes/barbarian/subclasses/wild-magic/wild-magic.ts'],
  
  // features/feats/ → game/abilities/feats/ (feats are abilities, not classes)
  ['src/features/feats/gwm.ts', 'src/game/abilities/feats/gwm.ts'],
  ['src/features/feats/savage-attacker.ts', 'src/game/abilities/feats/savage-attacker.ts'],
  
  // features/universal/ → game/abilities/universal/ (universal abilities)
  ['src/features/universal/heroic-inspiration.ts', 'src/game/abilities/universal/heroic-inspiration.ts'],
  ['src/features/temp-effects.ts', 'src/game/abilities/temp-effects.ts'],
  
  // rolls/ → game/combat/ (functional, lowercase)
  ['src/rolls/attack.ts', 'src/game/combat/attack-resolver.ts'],
  ['src/rolls/damage.ts', 'src/game/combat/damage-calculator.ts'],
  
  // turns/ → game/combat/ (functional, lowercase)
  ['src/turns/turn-manager.ts', 'src/game/combat/turn-manager.ts'],
  ['src/turns/turn-tracker.ts', 'src/game/combat/turn-tracker.ts'],
  ['src/turns/turn-history.ts', 'src/game/combat/turn-history.ts'],
  
  // utils/dice.ts → game/dice/ (functional, lowercase)
  ['src/utils/dice.ts', 'src/game/dice/dice-roller.ts'],
  
  // systems/ → game/progression/ (progression-related, functional)
  ['src/systems/character-progression.ts', 'src/game/progression/character-progression.ts'],
  ['src/systems/level-progression.ts', 'src/game/progression/level-progression.ts'],
  
  // systems/ → core/ (business logic that was in systems)
  ['src/systems/progression-manager.ts', 'src/core/ProgressionService.ts'],
  
  // systems/ → game/combat/ (combat-related, functional)
  ['src/systems/bonus-actions.ts', 'src/game/combat/bonus-actions.ts'],
  
  // === CLEANUP ===
  // settings/ → views/menus/ (this is a menu/UI component, not a utility!)
  ['src/settings/combat-reset.ts', 'src/views/menus/combat-reset.ts'],
];

const createDirs = [
  // Core application layer
  'src/core/repositories',
  
  // Views layer
  'src/views/menus',
  'src/views/displays',
  'src/views/components',
  
  // Game layer
  'src/game/dice',
  'src/game/combat',
  'src/game/classes/barbarian/subclasses/wild-magic',
  'src/game/classes/fighter/fighting-styles',
  'src/game/abilities/feats',
  'src/game/abilities/universal',
  'src/game/progression',
];

const indexFiles = [
  // Core layer indices
  {
    path: 'src/core/index.ts',
    exports: ['./Character', './GameSession', './GameSettings', './CombatService', './CombatServiceFactory', './repositories/interfaces']
  },
  {
    path: 'src/core/repositories/index.ts',
    exports: ['./interfaces', './FileRepositories']
  },
  
  // Utility indices
  {
    path: 'src/utils/index.ts',
    exports: ['./logger', './config-loader']
  },
  
  // Views layer indices
  {
    path: 'src/views/components/index.ts', 
    exports: ['./animations']
  },
  {
    path: 'src/views/menus/index.ts',
    exports: ['./main-menu', './settings-menu', './history-menu', './combat-reset']
  },
  
  // Game layer indices
  {
    path: 'src/game/dice/index.ts',
    exports: ['./dice-roller']
  },
  {
    path: 'src/game/combat/index.ts',
    exports: ['./attack-resolver', './damage-calculator', './turn-manager', './turn-tracker', './turn-history', './bonus-actions']
  },
  {
    path: 'src/game/classes/barbarian/index.ts',
    exports: ['./rage-manager', './brutal-strike', './subclasses/wild-magic/wild-magic']
  },
  {
    path: 'src/game/abilities/feats/index.ts',
    exports: ['./gwm', './savage-attacker']
  },
  {
    path: 'src/game/abilities/universal/index.ts',
    exports: ['./heroic-inspiration']
  },
  {
    path: 'src/game/abilities/index.ts',
    exports: ['./feats', './universal', './temp-effects']
  },
  {
    path: 'src/game/progression/index.ts',
    exports: ['./character-progression', './barbarian-progression', './level-progression']
  },
  {
    path: 'src/game/index.ts',
    exports: ['./dice', './combat', './classes/barbarian', './abilities', './progression']
  }
];

const filesToDelete = [
  'src/systems/create-character.ts', // No longer needed with new service pattern
];

console.log('🏗️  Starting file reorganization to new /core structure...\n');

// Create directories
console.log('📁 Creating new directories...');
createDirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`✅ Created directory: ${dir}`);
});

console.log('\n📦 Moving files...');
// Move files
moves.forEach(([src, dest]) => {
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    console.log(`📁 Moved: ${src} → ${dest}`);
  } else {
    console.log(`⚠️  File not found: ${src}`);
  }
});

console.log('\n📋 Creating index.ts files for clean imports...');
// Create index.ts files
indexFiles.forEach(({ path: filePath, exports }) => {
  const indexContent = exports
    .map(exportPath => `export * from '${exportPath}';`)
    .join('\n') + '\n';
  
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, indexContent);
  console.log(`📄 Created: ${filePath}`);
});

console.log('\n🗑️  Cleaning up old files...');
// Delete obsolete files
filesToDelete.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`🗑️  Deleted: ${file}`);
  }
});

console.log('\n🧹 Removing empty directories...');
// Remove empty directories
const dirsToRemove = [
  'src/menu',
  'src/rolls', 
  'src/turns',
  'src/features/barbarian/subclasses/wild-magic',
  'src/features/barbarian/subclasses',
  'src/features/barbarian',
  'src/features/feats',
  'src/features/universal',
  'src/features',
  'src/systems',
  'src/settings',
  'src/classes',
  'src/services',
  'src/repositories'
];

dirsToRemove.forEach(dir => {
  try {
    if (fs.existsSync(dir)) {
      fs.rmdirSync(dir);
      console.log(`🗑️  Removed empty directory: ${dir}`);
    }
  } catch (error) {
    console.log(`ℹ️  Directory not empty or already removed: ${dir}`);
  }
});

console.log('\n🎉 File reorganization complete!');
console.log('\n📋 NEW STRUCTURE:');
console.log('├── core/                # 🏗️ CORE APP COMPONENTS');
console.log('│   ├── Character.ts     # Character entity class');
console.log('│   ├── GameSession.ts   # Session state class');
console.log('│   ├── GameSettings.ts  # Settings class');
console.log('│   ├── CombatService.ts # Main service');
console.log('│   ├── CombatServiceFactory.ts # Factory');
console.log('│   └── repositories/    # Data access layer');
console.log('├── game/                # 🎲 D&D MECHANICS');
console.log('│   ├── classes/         # D&D classes (barbarian, fighter)');
console.log('│   ├── abilities/       # Feats & universal abilities');
console.log('│   ├── combat/          # Combat mechanics');
console.log('│   ├── dice/            # Dice rolling');
console.log('│   └── progression/     # Level progression');
console.log('├── views/               # 🖥️ UI LAYER');
console.log('│   ├── menus/           # Interactive menus');
console.log('│   ├── displays/        # Info displays (to create)');
console.log('│   └── components/      # UI components');
console.log('├── utils/               # 🛠️ UTILITIES');
console.log('└── types.ts             # Type definitions');

console.log('\n✨ CLEAN IMPORTS WITH INDEX FILES:');
console.log('// Core application components:');
console.log("import { Character, CombatService } from '../core';");
console.log("import { FileCharacterRepository } from '../core/repositories';");
console.log('');
console.log('// D&D mechanics (no confusion with app classes!):');
console.log("import { getRageStatus } from '../game/classes/barbarian';");
console.log("import { rollDie } from '../game/dice';");
console.log("import { logDebug } from '../utils';");

console.log('\n🔧 NEXT STEPS:');
console.log('1. Update import statements in moved files');
console.log('2. Update function signatures: (config: Config) → (service: CombatService)');
console.log('3. Update main.ts to use new file locations');
console.log('4. Test the application');
console.log('5. Create new display functions in views/displays/');

console.log('\n💡 CLEAR SEPARATION:');
console.log('✅ App Classes: core/Character.ts, core/CombatService.ts');
console.log('✅ D&D Classes: game/classes/barbarian/, game/classes/fighter/');
console.log('✅ No confusion: core/ = app components, game/classes/ = D&D classes');