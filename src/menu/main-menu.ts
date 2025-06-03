import chalk from 'chalk';
import inquirer from 'inquirer';
import { showCharacterIntro } from '../utils/animations';
import type { Config } from '../types';
import { rollDamageInteractive } from '../rolls/damage';
import { rollAttackInteractive } from '../rolls/attack';
import { startTurnSequence } from '../turns/turn-manager';
import { nextTurn as advanceTurn, displayTurnAdvancement } from '../turns/turn-tracker';
import { toggleHeroicInspiration as toggleHeroic, getHeroicInspirationStatus } from '../features/heroic-inspiration';
import { showTurnHistory, getTurnHistoryCount } from '../turns/turn-history';

export async function showMainMenu(config: Config): Promise<void> {
  // Show animated intro
  await showCharacterIntro(config);
  
  try {
    while (true) {
      const action = await displayMenu(config);
      
      switch (action) {
        case 'start_turn':
          await startTurnSequence(config);
          break;

        case 'attack':
          await rollAttackInteractive(config, false); // false = no auto-damage
          break;
          
        case 'damage':
          await rollDamageInteractive(config);
          break;
          
        case 'history':
          await showTurnHistory();
          break;

        case 'next_turn':
          await nextTurn(config);
          break;
          
        case 'heroic':
          await toggleHeroicInspiration(config);
          break;
          
        case 'exit':
          console.log(chalk.yellow.bold(`⚔️  Farewell, ${config.character.name}! May your blade stay sharp! ⚔️`));
          return;
      }
    }
  } catch (error) {
    console.log(chalk.yellow.bold(`⚔️  Until next time, ${config.character.name}! ⚔️`));
  }
}

async function displayMenu(config: Config): Promise<string> {
  console.clear();
  
  // Show character status
  console.log(chalk.yellow.bold(`⚔️ ${config.character.name} - Combat Menu\n`));
  
  const heroicStatus = getHeroicInspirationStatus(config);
  const turnHistoryCount = getTurnHistoryCount(); // Use getTurnHistoryCount instead of getHistoryCount
  const currentTurn = config.session.current_turn;
  
  console.log(`Turn: ${chalk.magenta(currentTurn)}`);
  console.log(`Heroic Inspiration: ${heroicStatus}`);
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
        { name: '🔄 Next Turn', value: 'next_turn' },
        { name: '✨ Toggle Heroic Inspiration', value: 'heroic' },
        { name: '🚪 Exit', value: 'exit' }
      ]
    }
  ]);
  
  return action;
}

async function nextTurn(config: Config): Promise<void> {
  advanceTurn(config);
  await displayTurnAdvancement(config);
  await pause();
}

// Replace the toggleHeroicInspiration function with:
async function toggleHeroicInspiration(config: Config): Promise<void> {
  console.clear();
  
  console.log(chalk.yellow.bold('✨ Heroic Inspiration Status\n'));
  console.log(`Current status: ${getHeroicInspirationStatus(config)}\n`);
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: config.session.heroic_inspiration ? '🔴 Mark as Used' : '🟢 Mark as Available', value: 'toggle' },
        { name: '← Back to Main Menu', value: 'back' }
      ]
    }
  ]);
  
  if (action === 'toggle') {
    toggleHeroic(config);
    const newStatus = getHeroicInspirationStatus(config);
    console.log(`\nHeroic Inspiration is now: ${newStatus}`);
    await pause();
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