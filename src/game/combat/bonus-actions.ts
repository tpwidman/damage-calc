import chalk from 'chalk';
import inquirer from 'inquirer';
import { rollAttackInteractive } from './attack-resolver';
import { useWildMagicBonusAction } from '../classes/barbarian/subclasses/wild-magic/wild-magic';
import { promptRageActivation } from '../classes/barbarian/rage-manager';
import type { CombatService, Character, GameSession } from '../../core';

interface BonusActionOption {
  name: string;
  value: string;
  available: boolean;
  description: string;
}

export async function handleBonusActionMenu(service: CombatService, turnState: any): Promise<void> {
  const character = service.character;
  const session = service.session;
  
  console.clear();
  console.log(chalk.yellow.bold('⭐ Bonus Action Menu ⭐\n'));
  
  const options = getBonusActionOptions(character, session, turnState);
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
  
  const success = await executeBonusAction(action, service, turnState);
  if (success) {
    turnState.bonusActionUsed = true;
    console.log(chalk.green('\n✅ Bonus action used!'));
  }
  
  await pause();
}

function getBonusActionOptions(character: Character, session: GameSession, turnState: any): BonusActionOption[] {
  const options: BonusActionOption[] = [];
  
  // Rage activation
  if (!session.isRageActive && session.ragesRemaining > 0) {
    options.push({
      name: '🔥 Activate Rage',
      value: 'activate_rage',
      available: true,
      description: `Start raging (${session.ragesRemaining} uses remaining)`
    });
  }
  
  // End rage (if raging and want to end early)
  if (session.isRageActive) {
    options.push({
      name: '🧘 End Rage Early',
      value: 'end_rage',
      available: true,
      description: 'Voluntarily end your rage before 10 rounds'
    });
  }
  
  // GWM Hew
  if (turnState.gwmHewAvailable && character.features.gwm?.enabled) {
    options.push({
      name: '⚔️ GWM Hew Attack',
      value: 'gwm_hew',
      available: true,
      description: 'Extra attack after critical hit or kill (Great Weapon Master)'
    });
  }
  
  // Wild Magic repeatable effects
  if (session.currentWildMagic?.bonus_action_repeatable) {
    const effect = session.currentWildMagic;
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

async function executeBonusAction(action: string, service: CombatService, turnState: any): Promise<boolean> {
  const session = service.session;
  
  switch (action) {
    case 'activate_rage':
      const activated = await promptRageActivation(service);
      if (activated) {
        // No need to save - service handles it automatically
        return true;
      }
      return false;
      
    case 'end_rage':
      session.endRage();
      console.log(chalk.blue('\n🧘 Rage ended voluntarily.'));
      console.log(chalk.gray('Wild Magic effects fade away...'));
      // No need to save - session.endRage() handles it
      return true;
      
    case 'gwm_hew':
      console.log(chalk.red.bold('\n⚔️ GWM HEW ATTACK! ⚔️'));
      console.log(chalk.yellow('Making bonus action attack with same weapon...'));
      
      // Use the attack system but mark it as bonus action
      await rollAttackInteractive(service, true); // auto-damage
      
      // Mark GWM as used
      turnState.gwmHewAvailable = false;
      
      console.log(chalk.gray('\n(GWM Hew bonus action attack completed)'));
      return true;
      
    case 'wild_magic':
      return await useWildMagicBonusAction(service);
      
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