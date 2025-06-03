import chalk from 'chalk';
import chalkAnimation from 'chalk-animation';
import inquirer from 'inquirer';
import { rollDie } from '../utils/dice';
import { addToHistory } from '../menu/history';
import { sleep } from '../utils/animations';
import type { Config } from '../types';
import { calculateDamageFromAttack } from './damage';
import { addAttackAction } from '../turns/turn-history';
import { isBrutalStrikeAvailable } from '../features/brutal-strike';


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

export async function rollAttackInteractive(config: Config, autoDamage: boolean = true): Promise<void> {
  console.clear();
  console.log(chalk.yellow.bold(`⚔️ ${config.character.name} - Attack Roll\n`));
  
  // Calculate attack modifier
  const attackModifier = calculateAttackModifier(config);
  console.log(`Attack Modifier: ${chalk.blue(`+${attackModifier}`)}`);
  console.log(`Weapon: ${chalk.yellow(config.character.weapon.name)}\n`);
  
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
          disabled: !isBrutalStrikeAvailable(config)
        }
      ]
    }
  ]);
  
  const result = await performAttackRoll(config, attackType, attackModifier);
  await displayAttackResult(config, result);
  
  // Ask if attack hit for ALL attack types
  await handleAttackOutcome(config, result, attackModifier, autoDamage);
}
async function handleAttackOutcome(config: Config, result: AttackRollResult, modifier: number, autoDamage: boolean): Promise<void> {
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
    addAttackToHistory(config, result, true);
    
    if (result.isCritical) {
      console.log(chalk.green.bold('🎉 Attack hits! Rolling damage with critical hit...'));
    } else {
      console.log(chalk.green('✅ Attack hits! Rolling damage...'));
    }
    
    if (autoDamage) {
      await sleep(1000);
      
      const damageOptions = {
        critical: result.isCritical,
        brutal: result.attackType === 'brutal',
        savage: false // Let user choose in damage roll
      };
      
      const context = result.isCritical 
        ? `Critical Hit from ${result.attackType} attack`
        : `Hit from ${result.attackType} attack`;
      
      await calculateDamageFromAttack(config, damageOptions, context);
    } else {
      const hitType = result.isCritical ? 'Critical hit' : 'Hit';
      console.log(chalk.yellow(`\n✅ ${hitType} logged!`));
      await pause();
    }
    
  } else {
    // Attack missed
    addAttackToHistory(config, result, false);
    
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
        const recklessResult = await performAttackRoll(config, 'reckless', modifier);
        await displayAttackResult(config, recklessResult);
        
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
          addAttackToHistory(config, recklessResult, true);
          
          if (recklessResult.isCritical) {
            console.log(chalk.green.bold('🎉 Reckless attack hits! Rolling damage with critical hit...'));
          } else {
            console.log(chalk.green('✅ Reckless attack hits! Rolling damage...'));
          }
          
          if (autoDamage) {
            await sleep(1000);
            
            const damageOptions = {
              critical: recklessResult.isCritical,
              brutal: false, // Can't use brutal with reckless
              savage: false
            };
            
            const context = recklessResult.isCritical 
              ? `Critical Hit from reckless attack (reroll)`
              : `Hit from reckless attack (reroll)`;
            
            await calculateDamageFromAttack(config, damageOptions, context);
          } else {
            const hitType = recklessResult.isCritical ? 'Critical hit' : 'Hit';
            console.log(chalk.yellow(`\n✅ ${hitType} logged!`));
            await pause();
          }
        } else {
          // Reckless reroll also missed
          addAttackToHistory(config, recklessResult, false);
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

function calculateAttackModifier(config: Config): number {
  const { strength, proficiency, magic_weapon } = config.character.attack_modifiers;
  return strength + proficiency + magic_weapon;
}

async function performAttackRoll(config: Config, attackType: 'normal' | 'reckless' | 'brutal', modifier: number): Promise<AttackRollResult> {
  let d20Roll: number;
  let explanation: string;
  
  if (config.settings.enable_crit_animations) {
    const rollingAnimation = chalkAnimation.pulse('🎲 Rolling attack... 🎲');
    await sleep(1000);
    rollingAnimation.stop();
  }
  
  if (attackType === 'reckless') {
    // Roll with advantage (2d20, keep higher)
    const roll1 = rollDie(20);
    const roll2 = rollDie(20);
    d20Roll = Math.max(roll1, roll2);
    explanation = `d20(${roll1}, ${roll2}) + ${modifier} [Advantage]`;
  } else if (attackType === 'brutal') {
    // Normal roll (foregoing advantage)
    d20Roll = rollDie(20);
    explanation = `d20(${d20Roll}) + ${modifier} [Brutal Strike - no advantage]`;
  } else {
    // Normal attack
    d20Roll = rollDie(20);
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

async function displayAttackResult(config: Config, result: AttackRollResult): Promise<void> {
  console.log('');
  
  if (result.isCritical) {
    if (config.settings.enable_crit_animations) {
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

// async function handleNormalAttackMissCheck(config: Config, result: AttackRollResult, modifier: number, autoDamage: boolean): Promise<void> {
//   const { didHit } = await inquirer.prompt([
//     {
//       type: 'confirm',
//       name: 'didHit',
//       message: `Did the attack roll of ${result.total} hit the target?`,
//       default: true
//     }
//   ]);
  
//   if (didHit) {
//     await handleRegularHit(config, result, autoDamage);
//   } else {
//     // House rule: offer reckless attack on miss
//     console.log(chalk.yellow('\n🎯 House Rule: Attack missed!'));
    
//     const { useReckless } = await inquirer.prompt([
//       {
//         type: 'confirm',
//         name: 'useReckless',
//         message: 'Would you like to reroll with Reckless Attack?',
//         default: true
//       }
//     ]);
    
//     if (useReckless) {
//       console.log(chalk.yellow('\n🔥 Rerolling with Reckless Attack!'));
//       const recklessResult = await performAttackRoll(config, 'reckless', modifier);
//       await displayAttackResult(config, recklessResult);
      
//       const { didHit2 } = await inquirer.prompt([
//         {
//           type: 'confirm',
//           name: 'didHit2',
//           message: `Did the reckless attack roll of ${recklessResult.total} hit?`,
//           default: true
//         }
//       ]);
      
//       if (didHit2) {
//         if (recklessResult.isCritical) {
//           await handleCriticalHit(config, recklessResult, autoDamage);
//         } else {
//           await handleRegularHit(config, recklessResult, autoDamage);
//         }
//       } else {
//         await handleMiss(config, recklessResult);
//       }
//     } else {
//       await handleMiss(config, result);
//     }
//   }
// }


// async function handleCriticalHit(config: Config, result: AttackRollResult, autoDamage: boolean): Promise<void> {
//   console.log(chalk.green.bold('🎉 Attack hits! Rolling damage with critical hit...'));
  
//   // Add to attack history
//   addAttackToHistory(config, result, true);
  
//   if (autoDamage) {
//     await sleep(1000);
    
//     // Auto-transition to damage with critical
//     const damageOptions = {
//       critical: true,
//       brutal: result.attackType === 'brutal',
//       savage: false
//     };
    
//     await calculateDamageFromAttack(config, damageOptions, `Critical Hit from ${result.attackType} attack`);
//   } else {
//     console.log(chalk.yellow('\n✅ Critical hit logged!'));
//     await pause();
//   }
// }

// async function handleRegularHit(config: Config, result: AttackRollResult, autoDamage: boolean): Promise<void> {
//   console.log(chalk.green('✅ Attack hits! Rolling damage...'));
  
//   // Add to attack history
//   addAttackToHistory(config, result, true);
  
//   if (autoDamage) {
//     await sleep(1000);
    
//     const damageOptions = {
//       critical: false,
//       brutal: result.attackType === 'brutal',
//       savage: false
//     };
    
//     await calculateDamageFromAttack(config, damageOptions, `Hit from ${result.attackType} attack`);
//   } else {
//     console.log(chalk.yellow('\n✅ Hit logged!'));
//     await pause();
//   }
// }

// async function handleMiss(config: Config, result: AttackRollResult): Promise<void> {
//   console.log(chalk.red('❌ Attack misses!'));
  
//   // Add to attack history
//   addAttackToHistory(config, result, false);
  
//   await pause();
// }

function addAttackToHistory(config: Config, result: AttackRollResult, hit: boolean): void {
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
    turn: config.session.current_turn,
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