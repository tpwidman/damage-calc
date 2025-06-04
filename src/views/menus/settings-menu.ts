import chalk from 'chalk';
import inquirer from 'inquirer';
import { resetCombat } from './combat-reset';
import { toggleHeroicInspiration, getHeroicInspirationStatus } from '../../game/abilities/universal/heroic-inspiration';
import type { CombatService } from '../../core';
import { getProgression } from '../../game/progression/level-progression';

export async function showSettingsMenu(service: CombatService): Promise<void> {
  const session = service.session;
  while (true) {
    console.clear();
    console.log(chalk.cyan.bold('⚙️  Settings & Configuration\n'));
    
    // Show current settings status
    const heroicStatus = getHeroicInspirationStatus(session);
    const animationsStatus = service.settings.enableCritAnimations 
      ? chalk.green('Enabled') 
      : chalk.gray('Disabled');
    const testingMode = service.settings.alwaysCrit 
      ? chalk.yellow('Always Crit ON') 
      : chalk.gray('Normal');
    
    console.log('Current Settings:');
    console.log(`  Heroic Inspiration: ${heroicStatus}`);
    console.log(`  Animations: ${animationsStatus}`);
    console.log(`  Testing Mode: ${testingMode}`);
    console.log(`  Character Level: ${chalk.blue(service.character.level)}`);
    console.log(`  Current Turn: ${chalk.magenta(service.session.currentTurn)}\n`);
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Settings Options:',
        choices: [
          { name: '✨ Toggle Heroic Inspiration', value: 'toggle_heroic' },
          { name: '🎨 Toggle Animations', value: 'toggle_animations' },
          { name: '🧪 Toggle Testing Mode', value: 'toggle_testing' },
          { name: '🔃 Reset Combat', value: 'reset_combat' },
          { name: '📊 View Character Stats', value: 'view_stats' },
          { name: '🔄 Advance Turn Manually', value: 'advance_turn' },
          { name: '← Back to Main Menu', value: 'back' }
        ]
      }
    ]);
    
    switch (action) {
      case 'toggle_heroic':
        toggleHeroicInspiration(session);
        const newStatus = getHeroicInspirationStatus(session);
        console.log(`\nHeroic Inspiration is now: ${newStatus}`);
        await pause();
        break;
        
      case 'toggle_animations':
        service.settings.toggleCritAnimations();
        const status = service.settings.enableCritAnimations ? 'enabled' : 'disabled';
        console.log(chalk.yellow(`\nAnimations ${status}!`));
        await pause();
        break;
        
      case 'toggle_testing':
        service.settings.setAlwaysCrit(!service.settings.alwaysCrit);
        const testStatus = service.settings.alwaysCrit ? 'ON' : 'OFF';
        console.log(chalk.yellow(`\nTesting Mode (Always Crit): ${testStatus}`));
        await pause();
        break;
        
      case 'reset_combat':
        await resetCombat(service);
        break;
        
      case 'view_stats':
        await showCharacterStats(service);
        break;
        
      case 'advance_turn':
        service.session.advanceTurn();
        console.log(chalk.green(`\nAdvanced to Turn ${service.session.currentTurn}`));
        await pause();
        break;
        
      case 'back':
        return;
    }
  }
}

async function showCharacterStats(service: CombatService): Promise<void> {
  console.clear();
  console.log(chalk.blue.bold(`📊 ${service.character.name} - Character Stats\n`));
  
  const progression = getProgression(service.character.level);
  
  console.log(chalk.yellow('📈 Level Progression:'));
  console.log(`  Level: ${service.character.level}`);
  console.log(`  Proficiency Bonus: +${progression.proficiency_bonus}`);
  console.log(`  Rages per Long Rest: ${progression.rages}`);
  console.log(`  Rage Damage: +${progression.rage_damage}`);
  console.log('');
  
  console.log(chalk.red('⚔️ Combat Stats:'));
  console.log(`  Attack Bonus: +${calculateAttackModifier(service)}`);
  console.log(`  Weapon: ${service.character.weapon.name} (1d${service.character.weapon.die})`);
  console.log(`  Damage Bonuses: +${Object.values(service.character.damageBonuses).reduce((a, b) => a + b, 0)} + rage`);
  console.log('');
  
  console.log(chalk.green('✨ Features:'));
  Object.entries(service.character.features).forEach(([name, feature]) => {
    if (feature.enabled !== false) {
      const status = feature.available ? chalk.green('Available') : chalk.gray('Used');
      const displayName = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      console.log(`  ${displayName}: ${status}`);
    }
  });
  
  await pause();
}

function calculateAttackModifier(service: CombatService): number {
  return service.character.getAttackModifier();
}

async function pause(): Promise<void> {
  await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Press Enter to continue'
    }
  ]);
}