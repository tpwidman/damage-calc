import chalk from 'chalk';
import chalkAnimation from 'chalk-animation';
import inquirer from 'inquirer';
import readline from 'readline';
import { rollDie } from '../dice/dice-roller';
import { addDamageAction } from './turn-history';
import { addToHistory } from '../../views/menus';
import { sleep } from '../../utils';
import type { CombatService }from '../../core'
import type { AttackOptions, DamageResult, DieRoll } from '../../types';
import { isSavageAttacksAvailable, useSavageAttacks } from '../../game/abilities/feats/savage-attacker';
import { isBrutalStrikeAvailable, useBrutalStrike } from '../../game/classes/barbarian/brutal-strike';
import { isHeroicInspirationAvailable, useHeroicInspiration, getHeroicInspirationStatus } from '../../game/abilities/universal/heroic-inspiration';

export async function rollDamageInteractive(service: CombatService): Promise<void> {
  const character = service.character;
  const session = service.session;
  console.clear();
  console.log(chalk.yellow.bold('💥 Standalone Damage Roll\n'));
  
  // Show current status
  const heroicStatus = getHeroicInspirationStatus(session);
  const brutalStatus = isBrutalStrikeAvailable(character)
    ? chalk.green('⚡ Available')
    : chalk.gray('⚡ Used this turn');
    
  console.log(`Heroic Inspiration: ${heroicStatus}`);
  console.log(`Brutal Strike: ${brutalStatus}\n`);
  
  interface choice {
    name: string;
    value: string;
    disabled?: boolean;
  }
  const choices: choice[] = [
    { name: 'Critical Hit (double weapon dice)', value: 'critical' }
  ];
  
  if (isBrutalStrikeAvailable(character)) {
    choices.push({ name: 'Brutal Strike (1d10 extra damage, once per turn)', value: 'brutal' });
  }
  if (isSavageAttacksAvailable(character)) {
    choices.push({ name: 'Savage Attacks (reroll weapon dice, keep higher, once per turn)', value: 'savage' });
  }
  
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'modifiers',
      message: 'Which modifiers apply to this damage roll?',
      choices: choices.filter(choice => !choice.disabled)
    }
  ]);
  
  const options: AttackOptions = {
    brutal: answers.modifiers.includes('brutal'),
    critical: answers.modifiers.includes('critical'),
    savage: answers.modifiers.includes('savage')
  };
  
  // Show rolling animation only if animations are enabled
  if (service.settings.enableCritAnimations) {
    const rollingAnimation = chalkAnimation.pulse('🎲 Rolling dice... 🎲');
    await sleep(1500);
    rollingAnimation.stop();
  } else {
    console.log('🎲 Rolling dice...');
    await sleep(500);
  }
  
  const result = await calculateDamage(service, options);
  await printResult(service, result, options);
  
  // Mark brutal strike as used if it was used
  if (options.brutal && isBrutalStrikeAvailable(service.character)) {
    useBrutalStrike(service.character);
  }
  
  if (options.savage) {
    useSavageAttacks(character);
  }
  
  // Add to history
  const historyEntry = {
    timestamp: new Date().toLocaleTimeString(),
    damage: result.weaponTotal,
    breakdown: result.breakdown,
    explanation: result.explanation,
    flags: Object.entries(options)
      .filter(([key, value]) => value === true)
      .map(([key]) => key)
      .join(', ') || 'normal',
    additionalDamage: result.additionalDamage,
    turn: service.session.currentTurn,
    heroic_used: result.heroicUsed
  };
  
  addToHistory(historyEntry);
  console.log(chalk.gray('\n📝 Attack saved to history'));
  
  await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Press Enter to return to main menu'
    }
  ]);
}

async function calculateDamage(service: CombatService, args: AttackOptions = {}): Promise<DamageResult> {
  const { brutal = false, critical = false, savage = false } = args;
  const character = service.character;
  const session = service.session;
  
  let weaponDamage = 0;
  const additionalDamage: Array<{ type: string; amount: number }> = [];
  const weaponDiceRolled: string[] = [];
  const weaponExplanations: string[] = [];
  let heroicUsed: { originalRoll: number; newRoll: number; source: string } | undefined;
  let allRolls: DieRoll[] = [];
  
  // Roll weapon damage first
  const weaponResult = rollWeaponDamage(service, critical, savage && service.character.features.savage_attacks?.enabled || false);
  weaponDamage += weaponResult.damage;
  weaponDiceRolled.push(...weaponResult.diceRolled);
  weaponExplanations.push(...weaponResult.explanations);
  allRolls.push(...weaponResult.allRolls);
  
  // Roll brutal strike if specified and available
  if (brutal && isBrutalStrikeAvailable(character)) {
    const brutalDie = rollDie(10, service.character.features.great_weapon_fighting?.enabled, service.settings.alwaysCrit);
    weaponDamage += brutalDie;
    weaponDiceRolled.push(`d10(${brutalDie})`);
    weaponExplanations.push(`1d10 Brutal Strike`);
    allRolls.push({ value: brutalDie, die: 10, source: "Brutal Strike" });
  }
  
  // Check for Heroic Inspiration opportunity
  if (isHeroicInspirationAvailable(session) && allRolls.length > 0) {
    const lowestRoll = allRolls.reduce((lowest, roll) => 
      roll.value < lowest.value ? roll : lowest
    );
    
    if (lowestRoll.value <= 4) {
      console.log(`\nYou rolled a ${lowestRoll.value} on your ${lowestRoll.source}.`);
      
      try {
        const useHeroic = await askHeroicInspiration(lowestRoll.value, lowestRoll.source);
        
        if (useHeroic) {
          const newRoll = rollDie(lowestRoll.die, false, service.settings.alwaysCrit);
          console.log(`Heroic Inspiration: ${lowestRoll.value} -> ${newRoll}`);
          console.log(chalk.gray('(Heroic Inspiration used - no longer available this session)\n'));
          useHeroicInspiration(session);
          
          const difference = newRoll - lowestRoll.value;
          weaponDamage += difference;
          
          const dieIndex = weaponDiceRolled.findIndex(die => die.includes(`(${lowestRoll.value})`));
          if (dieIndex !== -1) {
            weaponDiceRolled[dieIndex] = weaponDiceRolled[dieIndex].replace(`(${lowestRoll.value})`, `(${newRoll})`);
          }
          
          heroicUsed = {
            originalRoll: lowestRoll.value,
            newRoll: newRoll,
            source: lowestRoll.source
          };
        }
      } catch (error) {
        console.log('Skipping Heroic Inspiration.\n');
      }
    }
  }
  
  // Add flat bonuses to weapon damage
  const flatBonuses = Object.values(service.character.damageBonuses).reduce((sum, bonus) => sum + bonus, 0);
  weaponDamage += flatBonuses;
  
  // Create breakdown and explanation
  const weaponDiceString = weaponDiceRolled.join(' + ');
  const bonusString = flatBonuses > 0 ? ` + ${flatBonuses}` : '';
  const breakdown = weaponDiceString + bonusString;
  
  const bonusExplanations = Object.entries(service.character.damageBonuses)
    .map(([source, value]) => `${value} ${source.replace(/_/g, ' ')}`)
    .join(' + ');
  
  let explanation = [...weaponExplanations, bonusExplanations].join(' + ');
  
  if (heroicUsed) {
    explanation += ` [Heroic Inspiration: ${heroicUsed.source} ${heroicUsed.originalRoll}→${heroicUsed.newRoll}]`;
  }
  
  return {
    weaponTotal: weaponDamage,
    additionalDamage,
    breakdown,
    explanation,
    heroicUsed
  };
}

function rollWeaponDamage(service: CombatService, isCritical: boolean, useSavage: boolean): { damage: number; diceRolled: string[]; explanations: string[]; allRolls: DieRoll[] } {
  const diceRolled: string[] = [];
  const explanations: string[] = [];
  const allRolls: DieRoll[] = [];
  let weaponDamage = 0;

  const weaponDie = service.character.weapon.die;
  const weaponName = service.character.weapon.name;
  const greatWeaponFighting = service.character.features.great_weapon_fighting?.enabled;
  const alwaysCrit = service.settings.alwaysCrit;

  if (isCritical) {
    const die1 = rollDie(weaponDie, greatWeaponFighting, alwaysCrit);
    const die2 = rollDie(weaponDie, greatWeaponFighting, alwaysCrit);
    allRolls.push({ value: die1, die: weaponDie, source: `${weaponName} crit die 1` });
    allRolls.push({ value: die2, die: weaponDie, source: `${weaponName} crit die 2` });
    
    weaponDamage = die1 + die2;
    diceRolled.push(`d${weaponDie}(${die1})`, `d${weaponDie}(${die2})`);
    explanations.push(`2d${weaponDie} ${weaponName} critical`);
  } else {
    const die = rollDie(weaponDie, greatWeaponFighting, alwaysCrit);
    allRolls.push({ value: die, die: weaponDie, source: `${weaponName} damage` });
    
    weaponDamage = die;
    diceRolled.push(`d${weaponDie}(${die})`);
    explanations.push(`1d${weaponDie} ${weaponName} damage`);
  }

  return { damage: weaponDamage, diceRolled, explanations, allRolls };
}

function askHeroicInspiration(roll: number, source: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(`Use Heroic Inspiration to reroll the ${roll}? (Y/n): `, (answer) => {
      rl.close();
      const useHeroic = answer.toLowerCase() !== 'n' && answer.toLowerCase() !== 'no';
      resolve(useHeroic);
    });
  });
}

async function printResult(service: CombatService, result: DamageResult, args: AttackOptions): Promise<void> {
  const flags = Object.entries(args)
    .filter(([key, value]) => value === true)
    .map(([key]) => `--${key}`)
    .join(' ');
  
  // Critical hit animation
  if (args.critical) {
    await animateCriticalHit(service);
    console.log(chalk.red('═'.repeat(50)));
  }
  
  console.log(`\n⚔️  ${service.character.name}'s Attack Result ${flags ? `(${flags})` : ''}:`);
  
  if (args.critical) {
    console.log(`💥💥 CRITICAL WEAPON DAMAGE: ${chalk.red.bold(result.weaponTotal)} piercing 💥💥`);
  } else {
    console.log(`💥 Weapon Damage: ${chalk.red.bold(result.weaponTotal)} piercing`);
  }
  
  console.log(`\n🎲 For manual rolling:`);
  console.log(`Dice: ${result.breakdown}`);
  console.log(`Breakdown: ${result.explanation}`);
  
  if (args.critical) {
    console.log('═'.repeat(50));
  }
}

async function animateCriticalHit(service: CombatService): Promise<void> {
  if (!service.settings.enableCritAnimations) {
    console.log('\n💥 CRITICAL HIT! 💥');
    console.log(chalk.red.bold('⚡ DEVASTATING BLOW! ⚡'));
    return;
  }

  console.log('\n💥 CRITICAL HIT! 💥');
  
  const animations: (keyof typeof chalkAnimation)[] = ['rainbow', 'neon', 'pulse', 'karaoke'];
  const phrases: string[] = [
    '⚡ DEVASTATING BLOW! ⚡',
    '🔥 MAXIMUM CARNAGE! 🔥',
    '💀 ENEMY ANNIHILATED! 💀',
    '⭐ LEGENDARY STRIKE! ⭐',
    '🗡️ PERFECT TECHNIQUE! 🗡️'
  ];
  
  const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  
  console.log('');
  const critAnimation = chalkAnimation[randomAnimation](randomPhrase);
  await sleep(2000);
  critAnimation.stop();
  console.log('');
}

export async function calculateDamageFromAttack(
  service: CombatService, 
  presetOptions: AttackOptions, 
  context: string
): Promise<void> {
  const session = service.session;
  const character = service.character;
  console.clear();
  console.log(chalk.yellow.bold(`💥 ${context} - Rolling Damage\n`));
  
  // Show what's already determined
  if (presetOptions.critical) {
    console.log(chalk.red.bold('💥 CRITICAL HIT - Double weapon dice!'));
  }
  if (presetOptions.brutal) {
    console.log(chalk.red.bold('💀 BRUTAL STRIKE - Extra 1d10 damage!'));
  }
  
  // Show current status
  const heroicStatus = getHeroicInspirationStatus(session);
  
  console.log(`Heroic Inspiration: ${heroicStatus}\n`);
  
  // Only ask about options that aren't already determined and are available
  const choices = [];
  
  // Brutal Strike: only if not already applied AND available AND not from reckless attack
  if (!presetOptions.brutal && 
      isBrutalStrikeAvailable(character) && 
      !context.includes('reckless')) {
    choices.push({ name: 'Brutal Strike (1d10 extra damage, once per turn)', value: 'brutal' });
  }
  // Savage Attacks: always available if enabled (separate feature)
  if (isSavageAttacksAvailable(character)) {
    choices.push({ name: 'Savage Attacks (reroll weapon dice, keep higher, once per turn)', value: 'savage' });
  }
  
  let additionalOptions: AttackOptions = { brutal: false, critical: false, savage: false };
  
  if (choices.length > 0) {
    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'modifiers',
        message: 'Additional modifiers to apply:',
        choices: choices
      }
    ]);
    
    additionalOptions = {
      brutal: answers.modifiers.includes('brutal'),
      critical: false, // Already handled
      savage: answers.modifiers.includes('savage')
    };
  }
  
  // Combine preset and additional options
  const finalOptions: AttackOptions = {
    critical: presetOptions.critical,
    brutal: presetOptions.brutal || additionalOptions.brutal,
    savage: additionalOptions.savage
  };
  
  // Show rolling animation
  if (service.settings.enableCritAnimations) {
    const rollingAnimation = chalkAnimation.pulse('🎲 Rolling damage dice... 🎲');
    await sleep(1500);
    rollingAnimation.stop();
  } else {
    console.log('🎲 Rolling damage dice...');
    await sleep(500);
  }
  
  const result = await calculateDamage(service, finalOptions);
  await printResult(service, result, finalOptions);
  
  // Mark brutal strike as used if it was used
  if (finalOptions.brutal && isBrutalStrikeAvailable(character)) {
    useBrutalStrike(character);
  }
  
  const modifierFlags = Object.entries(finalOptions)
    .filter(([key, value]) => value === true)
    .map(([key]) => key)
    .join(', ') || '';
  
  addDamageAction(result.weaponTotal, result.breakdown, modifierFlags);

  if (additionalOptions.savage) {
    useSavageAttacks(character);
  }
  
  // Add to history with attack context
  const historyEntry = {
    timestamp: new Date().toLocaleTimeString(),
    damage: result.weaponTotal,
    breakdown: result.breakdown,
    explanation: result.explanation,
    flags: modifierFlags || 'normal',
    additionalDamage: result.additionalDamage,
    turn: service.session.currentTurn,
    heroic_used: result.heroicUsed
  };
  
  addToHistory(historyEntry);
  console.log(chalk.gray('\n📝 Damage saved to history'));
  
  await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Press Enter to continue'
    }
  ]);
}