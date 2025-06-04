import chalk from 'chalk';
import inquirer from 'inquirer';
import { showCharacterIntro } from '../components/animations';
import type { CombatService } from '../../core';
import { rollDamageInteractive } from '../../game/combat/damage-calculator';
import { rollAttackInteractive } from '../../game/combat/attack-resolver';
import { startTurnSequence } from '../../game/combat/turn-manager';
import { nextTurn as advanceTurn, displayTurnAdvancement } from '../../game/combat/turn-tracker';
import { getHeroicInspirationStatus } from '../../game/abilities/universal/heroic-inspiration';
import { showTurnHistory, getTurnHistoryCount } from '../../game/combat/turn-history';

import { showSettingsMenu } from './settings-menu';

export async function showMainMenu(service: CombatService): Promise<void> {
  // Show animated intro
  await showCharacterIntro(service.character);
  
  try {
    while (true) {
      const action = await displayMenu(service);
      
      switch (action) {
        case 'start_turn':
          await startTurnSequence(service);
          break;
          
        case 'attack':
          await rollAttackInteractive(service, false); // false = no auto-damage
          break;
          
        case 'damage':
          await rollDamageInteractive(service);
          break;
          
        case 'history':
          await showTurnHistory();
          break;
          
        case 'settings':
          await showSettingsMenu(service);
          break;
          
        case 'exit':
          console.log(chalk.yellow.bold(`⚔️  Farewell, ${service.character.name}! May your blade stay sharp! ⚔️`));
          return;
      }
    }
  } catch (error) {
    console.log(chalk.yellow.bold(`⚔️  Until next time, ${service.character.name}! ⚔️`));
  }
}

async function displayMenu(service: CombatService): Promise<string> {
  console.clear();
  
  // Show character status
  console.log(chalk.yellow.bold(`⚔️ ${service.character.name} - Combat Assistant\n`));
  
  const heroicStatus = getHeroicInspirationStatus(service.session);
  const turnHistoryCount = getTurnHistoryCount();
  const currentTurn = service.session.currentTurn;
  const rageStatus = service.session.isRageActive 
    ? chalk.red.bold('ACTIVE') 
    : chalk.blue(`${service.session.ragesRemaining} remaining`);
  
  console.log(`Turn: ${chalk.magenta(currentTurn)}`);
  console.log(`Heroic Inspiration: ${heroicStatus}`);
  console.log(`Rage: ${rageStatus}`);
  console.log(`Combat History: ${chalk.blue(turnHistoryCount)} turns recorded\n`);
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '🌟 Start Turn', value: 'start_turn' },
        { name: '⚔️  Quick Attack Roll', value: 'attack' },
        { name: '💥 Quick Damage Roll', value: 'damage' },
        { name: '📜 View Combat History', value: 'history' },
        { name: '⚙️  Settings', value: 'settings' },
        { name: '🚪 Exit', value: 'exit' }
      ]
    }
  ]);
  
  return action;
}

async function nextTurn(service: CombatService): Promise<void> {
  advanceTurn(service);
  await displayTurnAdvancement(service);
  await pause();
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