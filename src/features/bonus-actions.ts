import chalk from 'chalk';
import inquirer from 'inquirer';
import { rollAttackInteractive } from '../rolls/attack.js';
import { rollDamageInteractive } from '../rolls/damage.js';
import { useWildMagicBonusAction } from './wild-magic.js';
import { promptRageActivation, getRageStatus } from './rage-manager.js';
import { saveConfig } from '../utils/config-loader.js';
import type { Config } from '../types.js';

interface BonusActionOption {
  name: string;
  value: string;
  available: boolean;
  description: string;
}

export async function handleBonusActionMenu(config: Config, turnState: any): Promise<void> {
  console.clear();
  console.log(chalk.yellow.bold('⭐ Bonus Action Menu ⭐\n'));
  
  const options = getBonusActionOptions(config, turnState);
  const availableOptions = options.filter(opt => opt.available);
  
  if (availableOptions.length === 0) {
    console.log(chalk.gray('No bonus actions available this turn.\n'));
    await pause();
    return;
  }
  
  // Show what's available
  console.log('Available bonus actions:');
  availableOptions.forEach(opt => {
    console.log(chalk.green(`• ${opt.name}`));
    console.log(chalk.gray(`  ${opt.description}\n`));
  });
  
  const choices = availableOptions.map(opt => ({
    name: opt.name,
    value: opt.value
  }));
  choices.push({ name: '← Back to Turn Menu', value: 'back' });
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose a bonus action:',
      choices: choices
    }
  ]);
  
  if (action === 'back') return;
  
  const success = await executeBonusAction(action, config, turnState);
  if (success) {
    turnState.bonusActionUsed = true;
    console.log(chalk.green('\n✅ Bonus action used!'));
  }
  
  await pause();
}

function getBonusActionOptions(config: Config, turnState: any): BonusActionOption[] {
  const options: BonusActionOption[] = [];
  
  // Rage activation
  if (!config.session.rage_active && config.session.rages_remaining > 0) {
    options.push({
      name: '🔥 Activate Rage',
      value: 'activate_rage',
      available: true,
      description: `Start raging (${config.session.rages_remaining} uses remaining)`
    });
  }
  
  // End rage (if raging and want to end early)
  if (config.session.rage_active) {
    options.push({
      name: '🧘 End Rage Early',
      value: 'end_rage',
      available: true,
      description: 'Voluntarily end your rage before 10 rounds'
    });
  }
  
  // GWM Hew
  if (turnState.gwmHewAvailable && config.character.features.gwm.enabled) {
    options.push({
      name: '⚔️ GWM Hew Attack',
      value: 'gwm_hew',
      available: true,
      description: 'Extra attack after critical hit or kill (Great Weapon Master)'
    });
  }
  
  // Wild Magic repeatable effects
  if (config.session.current_wild_magic?.bonus_action_repeatable) {
    const effect = config.session.current_wild_magic;
    let effectName = 'Wild Magic Effect';
    
    if (effect.damage_type === 'teleport') effectName = '🌀 Wild Magic Teleport';
    else if (effect.damage_type === 'force') effectName = '👻 Summon Spirit';
    else if (effect.damage_type === 'radiant') effectName = '☀️ Radiant Bolt';
    
    options.push({
      name: effectName,
      value: 'wild_magic',
      available: true,
      description: effect.description.substring(0, 60) + '...'
    });
  }
  
  // Future bonus actions can be added here:
  // - Off-hand attack
  // - Healing potion
  // - Spell casting
  // - Magic item activations
  
  return options;
}

async function executeBonusAction(action: string, config: Config, turnState: any): Promise<boolean> {
  switch (action) {
    case 'activate_rage':
      const activated = await promptRageActivation(config);
      if (activated) {
        saveConfig(config);
        return true;
      }
      return false;
      
    case 'end_rage':
      config.session.rage_active = false;
      config.session.current_wild_magic = null;
      console.log(chalk.blue('\n🧘 Rage ended voluntarily.'));
      console.log(chalk.gray('Wild Magic effects fade away...'));
      saveConfig(config);
      return true;
      
    case 'gwm_hew':
      console.log(chalk.red.bold('\n⚔️ GWM HEW ATTACK! ⚔️'));
      console.log(chalk.yellow('Making bonus action attack with same weapon...'));
      
      // Use the attack system but mark it as bonus action
      await rollAttackInteractive(config, true); // auto-damage
      
      // Mark GWM as used
      turnState.gwmHewAvailable = false;
      
      console.log(chalk.gray('\n(GWM Hew bonus action attack completed)'));
      return true;
      
    case 'wild_magic':
      return await useWildMagicBonusAction(config);
      
    default:
      console.log(chalk.red('Unknown bonus action!'));
      return false;
  }
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