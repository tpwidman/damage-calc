import chalk from 'chalk';
import inquirer from 'inquirer';
import { rollAttackInteractiveWithCallback } from './attack-resolver';
import { resetBrutalStrike } from '../classes/barbarian/brutal-strike';
import { startTurnHistory, endTurnHistory } from './turn-history';
import { promptRageActivation, getRageStatus } from '../classes/barbarian/rage-manager';
import type { CombatService } from '../../core';
import { displayCurrentWildMagic, useWildMagicBonusAction } from '../classes/barbarian/subclasses/wild-magic/wild-magic';
import { logDebug } from '../../utils/logger';
import { sleep } from '../../utils';
import { handleBonusActionMenu } from './bonus-actions';

interface TurnState {
  attacksUsed: number;
  maxAttacks: number;
  bonusActionUsed: boolean;
  savageAttacksUsed: boolean;
  brutalStrikeUsed: boolean;
  // GWM tracking
  criticalHitThisTurn: boolean;
  gwmHewAvailable: boolean;
}

export async function startTurnSequence(service: CombatService): Promise<void> {
  const character = service.character;
  const session = service.session;
  
  logDebug('Starting turn sequence...');
  
  console.clear();
  console.log(chalk.yellow.bold(`🌟 Starting Turn ${session.currentTurn} 🌟\n`));
  
  try {
    // Check if rage should be activated
    logDebug('Checking rage activation...');
    if (!session.isRageActive && session.ragesRemaining > 0) {
      logDebug('Prompting for rage activation...');
      const shouldRage = await promptRageActivation(service);
      logDebug('Rage activation result:', shouldRage);
      
      // No need to save - service handles it automatically
      if (shouldRage) {
        logDebug('Rage activated successfully');
      }
    }
    
    logDebug('Starting turn history tracking...');
    startTurnHistory(session.currentTurn);
    
    logDebug('Creating turn state...');
    const turnState: TurnState = {
      attacksUsed: 0,
      maxAttacks: character.getMaxAttacks(), // Use character method
      bonusActionUsed: false,
      savageAttacksUsed: false,
      brutalStrikeUsed: false,
      criticalHitThisTurn: false,
      gwmHewAvailable: false
    };
    
    // Continue with existing logic...
    logDebug('Entering main turn loop...');
    while (true) {
      logDebug('Displaying turn menu...');
      const action = await displayTurnMenu(service, turnState);
      logDebug('Selected action:', action);
      
      switch (action) {
        case 'attack':
          logDebug('Processing attack...');
          if (turnState.attacksUsed < turnState.maxAttacks) {
            const wasCrit = await rollAttackInteractiveWithCallback(service, true, (isCrit) => {
              if (isCrit) {
                turnState.criticalHitThisTurn = true;
                turnState.gwmHewAvailable = true;
              }
            });
            turnState.attacksUsed++;
            
            // Remind about GWM if crit and bonus action available
            if (turnState.gwmHewAvailable && !turnState.bonusActionUsed) {
              console.log(chalk.yellow.bold('\n🎯 GWM HEW AVAILABLE! You can make a bonus action attack!'));
              await sleep(2000);
            }
          } else {
            console.log(chalk.red('❌ No more attacks available this turn!'));
            await pause();
          }
          break;
          
        case 'bonus_action':
          logDebug('Processing bonus action...');
          if (!turnState.bonusActionUsed) {
            await handleBonusActionMenu(service, turnState);
          } else {
            console.log(chalk.red('❌ Bonus action already used this turn!'));
            await pause();
          }
          break;
          
        case 'check_wild_magic':
          displayCurrentWildMagic(service);
          await pause();
          break;
          
        case 'wild_magic_bonus':
          if (!turnState.bonusActionUsed) {
            const used = await useWildMagicBonusAction(service);
            if (used) {
              turnState.bonusActionUsed = true;
            }
            await pause();
          }
          break;
          
        case 'end_turn':
          logDebug('Ending turn...');
          await endTurn(service);
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

async function displayTurnMenu(service: CombatService, turnState: TurnState): Promise<string> {
  const character = service.character;
  const session = service.session;
  
  logDebug('Entering displayTurnMenu...');
  
  console.clear();
  
  console.log(chalk.yellow.bold(`⚔️ ${character.name} - Turn ${session.currentTurn}\n`));
  
  // Display turn status
  const attacksRemaining = turnState.maxAttacks - turnState.attacksUsed;
  const attackStatus = attacksRemaining > 0 
    ? chalk.green(`${attacksRemaining} remaining`) 
    : chalk.gray('Used');
  const bonusStatus = turnState.bonusActionUsed 
    ? chalk.gray('Used') 
    : chalk.green('Available');
  
  const rageStatus = getRageStatus(service);
  
  console.log(`Attacks: ${attackStatus} (${turnState.attacksUsed}/${turnState.maxAttacks})`);
  console.log(`⭐ Bonus Action: ${bonusStatus}`);
  console.log(`🔥 Rage: ${rageStatus}`);
  
  // GWM status display
  if (turnState.gwmHewAvailable && !turnState.bonusActionUsed) {
    console.log(chalk.yellow.bold(`⚔️ GWM Hew: AVAILABLE!`));
  } else if (character.features.gwm?.enabled) {
    console.log(chalk.gray(`⚔️ GWM Hew: ${turnState.criticalHitThisTurn ? 'Used' : 'Waiting for crit'}`));
  }
  
  // Show Wild Magic status
  if (session.currentWildMagic) {
    console.log(`✨ Wild Magic: Active`);
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
  if (session.currentWildMagic) {
    choices.push({ name: '✨ Check Wild Magic Effect', value: 'check_wild_magic', disabled: false });
    
    if (session.currentWildMagic.bonus_action_repeatable && !turnState.bonusActionUsed) {
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

async function endTurn(service: CombatService): Promise<void> {
  const session = service.session;
  const character = service.character;
  
  logDebug('In endTurn...');
  console.log(chalk.green('\n🔄 Ending turn...'));
  
  // End turn history tracking
  endTurnHistory();
  
  // Advance turn counter
  session.advanceTurn();
  
  // Reset once-per-turn features
  resetBrutalStrike(character);
  
  // No need to save - service handles it automatically
  
  console.log(chalk.yellow('✨ Turn-based features reset!'));
  console.log(chalk.green(`🌟 Advanced to Turn ${session.currentTurn}`));
  
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