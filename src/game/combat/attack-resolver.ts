import chalk from 'chalk';
import chalkAnimation from 'chalk-animation';
import inquirer from 'inquirer';
import { sleep } from '../../utils';
import { rollDie } from '../dice/dice-roller';
import { addToHistory } from '../../views/menus';
import type { CombatService, Character } from '../../core';
import type { AttackOptions } from '../../types';
import { calculateDamageFromAttack } from './damage-calculator';
import { addAttackAction } from './turn-history';
import { isBrutalStrikeAvailable } from '../classes/barbarian/brutal-strike';

interface AttackRollResult {
  total: number;
  d20Roll: number;
  modifier: number;
  isCritical: boolean;
  isCriticalMiss: boolean;
  attackType: 'normal' | 'reckless' | 'brutal';
  breakdown: string;
  explanation: string;
}

export async function rollAttackInteractive(service: CombatService, autoDamage: boolean = true): Promise<void> {
  await rollAttackInteractiveWithCallback(service, autoDamage);
}

export async function rollAttackInteractiveWithCallback(
  service: CombatService, 
  autoDamage: boolean = true,
  onCritCallback?: (isCrit: boolean) => void
): Promise<boolean> {
  const character = service.character;
  const session = service.session;
  
  console.clear();
  console.log(chalk.yellow.bold(`⚔️ ${character.name} - Attack Roll\n`));
  
  // Calculate attack modifier
  const attackModifier = calculateAttackModifier(character);
  console.log(`Attack Modifier: ${chalk.blue(`+${attackModifier}`)}`);
  console.log(`Weapon: ${chalk.yellow(character.weapon.name)}\n`);
  
  const { attackType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'attackType',
      message: 'What type of attack?',
      choices: [
        { name: '⚔️  Normal Attack', value: 'normal' },
        { name: '🔥 Reckless Attack (Advantage)', value: 'reckless' },
        { 
          name: '💀 Brutal Strike (forgo advantage for extra damage)', 
          value: 'brutal',
          disabled: !isBrutalStrikeAvailable(character)
        }
      ]
    }
  ]);
  
  const result = await performAttackRoll(service, attackType, attackModifier);
  await displayAttackResult(service, result);
  
  // Notify callback if critical hit occurred
  if (onCritCallback && result.isCritical) {
    onCritCallback(true);
  }
  
  // Ask if attack hit for ALL attack types
  await handleAttackOutcome(service, result, attackModifier, autoDamage);
  
  return result.isCritical;
}

async function handleAttackOutcome(service: CombatService, result: AttackRollResult, modifier: number, autoDamage: boolean): Promise<void> {
  const session = service.session;
  
  const { didHit } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'didHit',
      message: `Did the attack roll of ${result.total} hit the target?`,
      default: true
    }
  ]);
  
  if (didHit) {
    // Attack hit - proceed to damage
    addAttackToHistory(service, result, true);
    
    if (result.isCritical) {
      console.log(chalk.green.bold('🎉 Attack hits! Rolling damage with critical hit...'));
    } else {
      console.log(chalk.green('✅ Attack hits! Rolling damage...'));
    }
    
    if (autoDamage) {
      await sleep(1000);
      
      const damageOptions: AttackOptions = {
        critical: result.isCritical,
        brutal: result.attackType === 'brutal',
        savage: false // Let user choose in damage roll
      };
      
      const context = result.isCritical 
        ? `Critical Hit from ${result.attackType} attack`
        : `Hit from ${result.attackType} attack`;
      
      await calculateDamageFromAttack(service, damageOptions, context);
    } else {
      const hitType = result.isCritical ? 'Critical hit' : 'Hit';
      console.log(chalk.yellow(`\n✅ ${hitType} logged!`));
      await pause();
    }
    
  } else {
    // Attack missed
    addAttackToHistory(service, result, false);
    
    if (result.attackType === 'normal') {
      // House rule: offer reckless attack on normal miss
      console.log(chalk.yellow('\n🎯 House Rule: Normal attack missed!'));
      
      const { useReckless } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useReckless',
          message: 'Would you like to reroll with Reckless Attack?',
          default: true
        }
      ]);
      
      if (useReckless) {
        console.log(chalk.yellow('\n🔥 Rerolling with Reckless Attack!'));
        const recklessResult = await performAttackRoll(service, 'reckless', modifier);
        await displayAttackResult(service, recklessResult);
        
        // Ask again if the reckless attack hit
        const { didHit2 } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'didHit2',
            message: `Did the reckless attack roll of ${recklessResult.total} hit?`,
            default: true
          }
        ]);
        
        if (didHit2) {
          // Reckless reroll hit
          addAttackToHistory(service, recklessResult, true);
          
          if (recklessResult.isCritical) {
            console.log(chalk.green.bold('🎉 Reckless attack hits! Rolling damage with critical hit...'));
          } else {
            console.log(chalk.green('✅ Reckless attack hits! Rolling damage...'));
          }
          
          if (autoDamage) {
            await sleep(1000);
            
            const damageOptions: AttackOptions = {
              critical: recklessResult.isCritical,
              brutal: false, // Can't use brutal with reckless
              savage: false
            };
            
            const context = recklessResult.isCritical 
              ? `Critical Hit from reckless attack (reroll)`
              : `Hit from reckless attack (reroll)`;
            
            await calculateDamageFromAttack(service, damageOptions, context);
          } else {
            const hitType = recklessResult.isCritical ? 'Critical hit' : 'Hit';
            console.log(chalk.yellow(`\n✅ ${hitType} logged!`));
            await pause();
          }
        } else {
          // Reckless reroll also missed
          addAttackToHistory(service, recklessResult, false);
          console.log(chalk.red('❌ Reckless attack also misses!'));
          await pause();
        }
      } else {
        // Don't use house rule
        console.log(chalk.red('❌ Attack misses!'));
        await pause();
      }
    } else {
      // Non-normal attack missed (reckless/brutal) - no house rule
      console.log(chalk.red(`❌ ${result.attackType} attack misses!`));
      await pause();
    }
  }
}

function calculateAttackModifier(character: Character): number {
  return character.getAttackModifier();
}

async function performAttackRoll(service: CombatService, attackType: 'normal' | 'reckless' | 'brutal', modifier: number): Promise<AttackRollResult> {
  const settings = service.settings;
  let d20Roll: number;
  let explanation: string;
  
  if (settings.enableCritAnimations) {
    const rollingAnimation = chalkAnimation.radar('🎲 Rolling attack... 🎲');
    await sleep(1000);
    rollingAnimation.stop();
  }
  
  if (attackType === 'reckless') {
    // Roll with advantage (2d20, keep higher)
    const roll1 = rollDie(20, false, settings.alwaysCrit);
    const roll2 = rollDie(20, false, settings.alwaysCrit);
    d20Roll = Math.max(roll1, roll2);
    explanation = `d20(${roll1}, ${roll2}) + ${modifier} [Advantage]`;
  } else if (attackType === 'brutal') {
    // Normal roll (foregoing advantage)
    d20Roll = rollDie(20, false, settings.alwaysCrit);
    explanation = `d20(${d20Roll}) + ${modifier} [Brutal Strike - no advantage]`;
  } else {
    // Normal attack
    d20Roll = rollDie(20, false, settings.alwaysCrit);
    explanation = `d20(${d20Roll}) + ${modifier}`;
  }
  
  const total = d20Roll + modifier;
  const isCritical = d20Roll === 20;
  const isCriticalMiss = d20Roll === 1;
  const breakdown = `${d20Roll} + ${modifier} = ${total}`;
  
  return {
    total,
    d20Roll,
    modifier,
    isCritical,
    isCriticalMiss,
    attackType,
    breakdown,
    explanation
  };
}

async function displayAttackResult(service: CombatService, result: AttackRollResult): Promise<void> {
  const settings = service.settings;
  
  console.log('');
  
  if (result.isCritical) {
    if (settings.enableCritAnimations) {
      const critAnimation = chalkAnimation.rainbow('🎯 CRITICAL HIT! 🎯');
      await sleep(2000);
      critAnimation.stop();
    } else {
      console.log(chalk.red.bold('🎯 CRITICAL HIT! 🎯'));
    }
    console.log(chalk.red.bold(`Attack Roll: ${result.total} (CRIT!)`));
  } else if (result.isCriticalMiss) {
    console.log(chalk.gray.bold('💥 CRITICAL MISS! 💥'));
    console.log(chalk.gray(`Attack Roll: ${result.total} (NAT 1)`));
  } else {
    console.log(`⚔️ Attack Roll: ${chalk.blue.bold(result.total)}`);
  }
  
  console.log(chalk.gray(`Roll: ${result.breakdown}`));
  console.log(chalk.gray(`Breakdown: ${result.explanation}`));
  
  if (result.attackType === 'reckless') {
    console.log(chalk.yellow('📍 Reckless Attack: Enemies have advantage against you until your next turn'));
  } else if (result.attackType === 'brutal') {
    console.log(chalk.red('💀 Brutal Strike: +1d10 damage if this hits'));
  }
  
  console.log('');
}

function addAttackToHistory(service: CombatService, result: AttackRollResult, hit: boolean): void {
  const session = service.session;
  const timestamp = new Date().toLocaleTimeString();
  
  // Add to turn history (new system)
  addAttackAction(result.attackType, result.total, hit);
  
  // Keep the old history system for now (we can remove this later if you prefer)
  const entry = {
    timestamp,
    damage: 0, // No damage for attack rolls
    breakdown: `Attack: ${result.breakdown} - ${hit ? 'HIT' : 'MISS'}`,
    explanation: `${result.explanation} - ${hit ? 'Hit' : 'Miss'}${result.isCritical ? ' (CRIT!)' : ''}`,
    flags: `attack,${result.attackType}`,
    additionalDamage: [],
    turn: session.currentTurn,
    heroic_used: undefined
  };
  
  addToHistory(entry);
}

async function pause(): Promise<void> {
  await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Press Enter to return to main menu'
    }
  ]);
}