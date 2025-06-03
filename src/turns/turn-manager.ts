import chalk from 'chalk';
import inquirer from 'inquirer';
import { saveConfig } from '../utils/config-loader';
import { rollAttackInteractive } from '../rolls/attack';
import { rollDamageInteractive } from '../rolls/damage';
import { resetBrutalStrike } from '../features/brutal-strike';
import type { Config } from '../types';
import { resetSavageAttacks, getSavageAttacksStatus } from '../features/savage-attacker';
import { startTurnHistory, endTurnHistory } from './turn-history';


interface TurnState {
  attacksUsed: number;
  maxAttacks: number;
  bonusActionUsed: boolean;
  savageAttacksUsed: boolean;
  brutalStrikeUsed: boolean;
}

export async function startTurnSequence(config: Config): Promise<void> {
  console.clear();
  console.log(chalk.yellow.bold(`🌟 Starting Turn ${config.session.current_turn} 🌟\n`));
  
  // Start turn history tracking
  startTurnHistory(config.session.current_turn);
  
  const turnState: TurnState = {
    attacksUsed: 0,
    maxAttacks: 2, // Level 5+ gets 2 attacks
    bonusActionUsed: false,
    savageAttacksUsed: false,
    brutalStrikeUsed: false
  };
  
  try {
    while (true) {
      const action = await displayTurnMenu(config, turnState);
      
      switch (action) {
        case 'attack':
            if (turnState.attacksUsed < turnState.maxAttacks) {
                await rollAttackInteractive(config, true); // true = auto-damage
                turnState.attacksUsed++;
            } else {
                console.log(chalk.red('❌ No more attacks available this turn!'));
                await pause();
            }
            break;
          
        case 'damage':
          await rollDamageInteractive(config);
          break;
          
        case 'bonus_action':
          if (!turnState.bonusActionUsed) {
            await handleBonusAction(config, turnState);
          } else {
            console.log(chalk.red('❌ Bonus action already used this turn!'));
            await pause();
          }
          break;
          
        case 'end_turn':
          await endTurn(config);
          return;
          
        case 'exit':
          return;
      }
    }
  } catch (error) {
    console.log(chalk.yellow('Exiting turn sequence...'));
  }
}

async function displayTurnMenu(config: Config, turnState: TurnState): Promise<string> {
  console.clear();
  
  console.log(chalk.yellow.bold(`⚔️ ${config.character.name} - Turn ${config.session.current_turn}\n`));
  
  // Display turn status
  const attacksRemaining = turnState.maxAttacks - turnState.attacksUsed;
  const attackStatus = attacksRemaining > 0 
    ? chalk.green(`${attacksRemaining} remaining`) 
    : chalk.gray('Used');
  const bonusStatus = turnState.bonusActionUsed 
    ? chalk.gray('Used') 
    : chalk.green('Available');
  const brutalStatus = config.character.features.brutal_strike.available
    ? chalk.green('Available')
    : chalk.gray('Used');
  const savageStatus = getSavageAttacksStatus(config);
  
  console.log(`Attacks: ${attackStatus} (${turnState.attacksUsed}/${turnState.maxAttacks})`);
  console.log(`⭐ Bonus Action: ${bonusStatus}`);
  console.log(`Brutal Strike: ${brutalStatus}`);
  console.log(`Savage Attacks: ${savageStatus}\n`);
  
  const choices = [
    { 
      name: `⚔️  Attack${attacksRemaining > 0 ? ` (${attacksRemaining} left)` : ' (NONE LEFT)'}`, 
      value: 'attack',
      disabled: attacksRemaining === 0
    },
    { 
      name: `⭐ Bonus Action${turnState.bonusActionUsed ? ' (USED)' : ''}`, 
      value: 'bonus_action',
      disabled: turnState.bonusActionUsed
    },
    { name: '🔄 End Turn', value: 'end_turn' },
    { name: '🚪 Exit to Main Menu', value: 'exit' }
  ];
  
  // Remove standalone damage roll from turn menu
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: choices.filter(choice => !choice.disabled)
    }
  ]);
  
  return action;
}

async function handleBonusAction(config: Config, turnState: TurnState): Promise<void> {
  console.log(chalk.yellow('🎯 Bonus Action - Coming Soon!'));
  console.log('Future features:');
  console.log('• GWM bonus attack (on crit/kill)');
  console.log('• Off-hand attack');
  console.log('• Other bonus action abilities\n');
  
  turnState.bonusActionUsed = true;
  await pause();
}

async function endTurn(config: Config): Promise<void> {
  console.log(chalk.green('\n🔄 Ending turn...'));
  
  // End turn history tracking
  endTurnHistory();
  
  // Advance turn counter
  config.session.current_turn += 1;
  
  // Reset once-per-turn features
  resetBrutalStrike(config);
  resetSavageAttacks();
  
  saveConfig(config);
  
  console.log(chalk.yellow('✨ Turn-based features reset!'));
  console.log(chalk.green(`🌟 Advanced to Turn ${config.session.current_turn}`));
  
  await new Promise(resolve => setTimeout(resolve, 2000));
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