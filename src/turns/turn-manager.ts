import chalk from 'chalk';
import inquirer from 'inquirer';
import { saveConfig } from '../utils/config-loader.js';
import { rollAttackInteractive } from '../rolls/attack.js';
// import { rollDamageInteractive } from '../rolls/damage.js';
import { resetBrutalStrike } from '../features/brutal-strike';
import { startTurnHistory, endTurnHistory } from './turn-history.js';
import { promptRageActivation, getRageStatus } from '../features/rage-manager';
import type { Config } from '../types.js';
import { displayCurrentWildMagic, useWildMagicBonusAction, EFFECT_DECORATIONS } from '../features/wild-magic';
import { logDebug } from '../utils/logger';

interface TurnState {
  attacksUsed: number;
  maxAttacks: number;
  bonusActionUsed: boolean;
  savageAttacksUsed: boolean;
  brutalStrikeUsed: boolean;
}

export async function startTurnSequence(config: Config): Promise<void> {
  logDebug('Starting turn sequence...');
  
  console.clear();
  console.log(chalk.yellow.bold(`🌟 Starting Turn ${config.session.current_turn} 🌟\n`));
  
  try {
    // Check if rage should be activated
    logDebug('Checking rage activation...');
    if (!config.session.rage_active && config.session.rages_remaining > 0) {
      logDebug('Prompting for rage activation...');
      const shouldRage = await promptRageActivation(config);
      logDebug('Rage activation result:', shouldRage);
      
      if (shouldRage) {
        logDebug('Saving config after rage activation...');
        saveConfig(config);
        logDebug('Config saved successfully');
      }
    }
    
    logDebug('Starting turn history tracking...');
    startTurnHistory(config.session.current_turn);
    
    logDebug('Creating turn state...');
    const turnState: TurnState = {
      attacksUsed: 0,
      maxAttacks: 2, // Level 5+ gets 2 attacks
      bonusActionUsed: false,
      savageAttacksUsed: false,
      brutalStrikeUsed: false
    };
    
    logDebug('Entering main turn loop...');
    while (true) {
      logDebug('Displaying turn menu...');
      const action = await displayTurnMenu(config, turnState);
      logDebug('Selected action:', action);
      
      switch (action) {
        case 'attack':
          logDebug('Processing attack...');
          if (turnState.attacksUsed < turnState.maxAttacks) {
            await rollAttackInteractive(config, true);
            turnState.attacksUsed++;
          } else {
            console.log(chalk.red('❌ No more attacks available this turn!'));
            await pause();
          }
          break;
          
        case 'bonus_action':
          logDebug('Processing bonus action...');
          if (!turnState.bonusActionUsed) {
            await handleBonusAction(config, turnState);
          } else {
            console.log(chalk.red('❌ Bonus action already used this turn!'));
            await pause();
          }
          break;
          
        case 'check_wild_magic':
          displayCurrentWildMagic(config);
          await pause();
          break;
          
        case 'wild_magic_bonus':
          if (!turnState.bonusActionUsed) {
            const used = await useWildMagicBonusAction(config);
            if (used) {
              turnState.bonusActionUsed = true;
            }
            await pause();
          }
          break;
          
        case 'end_turn':
          logDebug('Ending turn...');
          await endTurn(config);
          return;
          
        case 'exit':
          logDebug('Exiting turn sequence...');
          return;
      }
    }
  } catch (error) {
    console.error('DEBUG: Error in turn sequence:', error);
    console.log('Exiting turn sequence due to error...');
    throw error; // Re-throw so we can see the actual error
  }
}

async function displayTurnMenu(config: Config, turnState: TurnState): Promise<string> {
  logDebug('Entering displayTurnMenu...');
  
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
  
  const rageStatus = getRageStatus(config);
  
  console.log(`Attacks: ${attackStatus} (${turnState.attacksUsed}/${turnState.maxAttacks})`);
  console.log(`⭐ Bonus Action: ${bonusStatus}`);
  console.log(`🔥 Rage: ${rageStatus}`);
  
  // Show Wild Magic status
  if (config.session.current_wild_magic) {
    const effect = config.session.current_wild_magic;
    const decoration = EFFECT_DECORATIONS[effect.damage_type || 'force'];
    console.log(`✨ Wild Magic: ${decoration.color('Active')} ${decoration.icon}`);
  } else {
    console.log('✨ Wild Magic: None');
  }
  
  console.log('');
  
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
    }
  ];
  
  // Add Wild Magic options
  if (config.session.current_wild_magic) {
    choices.push({ name: '✨ Check Wild Magic Effect', value: 'check_wild_magic', disabled: false });
    
    if (config.session.current_wild_magic.bonus_action_repeatable && !turnState.bonusActionUsed) {
      choices.push({ name: '🌀 Use Wild Magic Bonus Action', value: 'wild_magic_bonus', disabled: false });
    }
  }
  
  choices.push(
    { name: '🔄 End Turn', value: 'end_turn', disabled: false },
    { name: '🚪 Exit to Main Menu', value: 'exit', disabled: false }
  );
  
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
  logDebug('In handleBonusAction...');
  console.log(chalk.yellow('⭐ Bonus Action - Coming Soon!'));
  console.log('Future features:');
  console.log('• GWM bonus attack (on crit/kill)');
  console.log('• Off-hand attack');
  console.log('• Other bonus action abilities\n');
  
  turnState.bonusActionUsed = true;
  await pause();
}

async function endTurn(config: Config): Promise<void> {
  logDebug('In endTurn...');
  console.log(chalk.green('\n🔄 Ending turn...'));
  
  // End turn history tracking
  endTurnHistory();
  
  // Advance turn counter
  config.session.current_turn += 1;
  
  // Reset once-per-turn features
  resetBrutalStrike(config);
  
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