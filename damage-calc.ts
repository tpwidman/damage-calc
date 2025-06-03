#!/usr/bin/env tsx

import { Command } from 'commander';
import chalk from 'chalk';
import chalkAnimation from 'chalk-animation';
import inquirer from 'inquirer';
import readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

import type {
  Config,
  AttackOptions,
  DamageResult,
  AttackHistoryEntry,
  DieRoll
} from './src/types.js';

// =============================================================================
// CONFIG LOADING
// =============================================================================

let config: Config;
let attackHistory: AttackHistoryEntry[] = [];

function loadConfig(): Config {
  const configPath = path.join(process.cwd(), 'character-config.json');
  
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(chalk.red('Error loading character-config.json:'), error);
    console.log(chalk.yellow('Please ensure character-config.json exists in the project root.'));
    process.exit(1);
  }
}

function saveConfig(): void {
  const configPath = path.join(process.cwd(), 'character-config.json');
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(chalk.red('Error saving character-config.json:'), error);
  }
}

// =============================================================================
// ANIMATION HELPERS
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function animateText(text: string, animationType: keyof typeof chalkAnimation = 'rainbow', duration: number = 2000): Promise<void> {
  const animation = chalkAnimation[animationType](text);
  await sleep(duration);
  animation.stop();
}

async function showCharacterIntro(): Promise<void> {
  console.clear();
  
  if (!config.settings.enable_crit_animations) {
    console.log(chalk.yellow.bold(`\n⚔️  ${config.character.name} THE DESTROYER ⚔️`));
    console.log(`\nWielding the mighty ${config.character.weapon.name} of legend!`);
    console.log(chalk.yellow('Ready for combat! 💀\n'));
    return;
  }
  
  // Animated character name
  const nameAnimation = chalkAnimation.rainbow(`\n⚔️  ${config.character.name} THE DESTROYER ⚔️`);
  await sleep(3000);
  nameAnimation.stop();
  
  // Pulsing weapon info
  const weaponAnimation = chalkAnimation.pulse(`\nWielding the mighty ${config.character.weapon.name} of legend!`);
  await sleep(2500);
  weaponAnimation.stop();
  
  console.log(chalk.yellow('\nReady for combat! 💀'));
}

async function animateCriticalHit(): Promise<void> {
  if (!config.settings.enable_crit_animations) {
    // Simple static critical hit display
    console.log('\n💥 CRITICAL HIT! 💥');
    console.log(chalk.red.bold('⚡ DEVASTATING BLOW! ⚡'));
    console.log('');
    return;
  }

  console.log('\n💥 CRITICAL HIT! 💥');
  
  // Random animation and phrase for variety
  const animations: (keyof typeof chalkAnimation)[] = ['rainbow', 'neon', 'pulse', 'karaoke', 'radar'];
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

async function animateDamageResult(damage: number, isCritical: boolean = false): Promise<void> {
  if (!config.settings.enable_crit_animations && isCritical) {
    // Skip damage animation for crits when animations are disabled
    return;
  }
  
  if (isCritical) {
    // Pulse the damage number for crits
    const damageAnimation = chalkAnimation.pulse(`DAMAGE: ${damage}`);
    await sleep(2000);
    damageAnimation.stop();
  } else if (damage >= 20) {
    // Neon for high damage
    const damageAnimation = chalkAnimation.neon(`DAMAGE: ${damage}`);
    await sleep(1500);
    damageAnimation.stop();
  } else {
    // Simple glow for normal hits
    const damageAnimation = chalkAnimation.glitch(`DAMAGE: ${damage}`);
    await sleep(1000);
    damageAnimation.stop();
  }
}

async function animateHeroicInspiration(): Promise<void> {
  if (!config.settings.enable_crit_animations) {
    console.log(chalk.yellow('✨ HEROIC INSPIRATION ACTIVATED! ✨'));
    return;
  }
  
  const heroicAnimation = chalkAnimation.pulse('✨ HEROIC INSPIRATION ACTIVATED! ✨');
  await sleep(2000);
  heroicAnimation.stop();
}

// =============================================================================
// MENU SYSTEM FUNCTIONS
// =============================================================================

function addToHistory(result: DamageResult, options: AttackOptions, heroicUsed?: { originalRoll: number; newRoll: number; source: string }): void {
  const timestamp = new Date().toLocaleTimeString();
  const flags = Object.entries(options)
    .filter(([key, value]) => value === true)
    .map(([key]) => key)
    .join(', ');
  
  attackHistory.push({
    timestamp,
    damage: result.weaponTotal,
    breakdown: result.breakdown,
    explanation: result.explanation,
    flags: flags || 'normal',
    additionalDamage: result.additionalDamage,
    turn: config.session.current_turn,
    heroic_used: heroicUsed
  });
}

async function showHistory(): Promise<void> {
  console.clear();
  
  if (attackHistory.length === 0) {
    console.log(chalk.yellow('📜 No attack history yet!'));
    console.log('Make some attacks to see them here.\n');
  } else {
    console.log(chalk.yellow.bold('📜 Attack History\n'));
    console.log('═'.repeat(60));
    
    attackHistory.forEach((attack, index) => {
      const number = chalk.gray(`#${index + 1}`);
      const time = chalk.blue(attack.timestamp);
      const turn = chalk.magenta(`T${attack.turn}`);
      const damage = chalk.red.bold(attack.damage);
      const flags = attack.flags === 'normal' ? '' : chalk.gray(`(${attack.flags})`);
      
      console.log(`${number} ${turn} ${time} - ${damage} damage ${flags}`);
      console.log(chalk.gray(`   ${attack.breakdown}`));
      
      if (attack.additionalDamage.length > 0) {
        attack.additionalDamage.forEach(dmg => {
          console.log(chalk.gray(`   +${dmg.amount} ${dmg.type}`));
        });
      }
      
      if (attack.heroic_used) {
        console.log(chalk.cyan(`   ✨ Heroic: ${attack.heroic_used.source} ${attack.heroic_used.originalRoll}→${attack.heroic_used.newRoll}`));
      }
      console.log('');
    });
    
    console.log('═'.repeat(60));
  }
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'History options:',
      choices: [
        { name: '← Back to Main Menu', value: 'back' },
        { name: '🗑️  Clear History', value: 'clear' }
      ]
    }
  ]);
  
  if (action === 'clear') {
    attackHistory = [];
    console.log(chalk.yellow('History cleared!'));
    await sleep(1000);
  }
}

async function toggleHeroicInspiration(): Promise<void> {
  console.clear();
  
  console.log(chalk.yellow.bold('✨ Heroic Inspiration Status\n'));
  console.log(`Current status: ${config.session.heroic_inspiration ? chalk.green('Available') : chalk.red('Used')}\n`);
  
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
    config.session.heroic_inspiration = !config.session.heroic_inspiration;
    const newStatus = config.session.heroic_inspiration ? chalk.green('Available') : chalk.red('Used');
    console.log(`\nHeroic Inspiration is now: ${newStatus}`);
    saveConfig();
    await sleep(1500);
  }
}

async function attackPlaceholder(): Promise<void> {
  console.clear();
  console.log(chalk.yellow.bold('⚔️ Attack Roll (Coming Soon!)\n'));
  
  console.log('This will eventually include:');
  console.log('• Ask DM if attack hits');
  console.log('• Reckless Attack option');
  console.log('• Advantage/Disadvantage');
  console.log('• Auto-transition to damage on hit\n');
  
  console.log(chalk.gray('For now, use "Roll Damage" directly.\n'));
  
  await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Press Enter to return to main menu'
    }
  ]);
}

async function mainMenu(): Promise<string> {
  console.clear();
  
  // Show character status
  console.log(chalk.yellow.bold(`⚔️ ${config.character.name} - Combat Menu\n`));
  
  const heroicStatus = config.session.heroic_inspiration 
    ? chalk.green('Available') 
    : chalk.gray('Used');
  const historyCount = attackHistory.length;
  const currentTurn = config.session.current_turn;
  
  console.log(`Turn: ${chalk.magenta(currentTurn)}`);
  console.log(`Heroic Inspiration: ${heroicStatus}`);
  console.log(`Attack History: ${chalk.blue(historyCount)} recorded\n`);
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '⚔️  Attack Roll', value: 'attack' },
        { name: '💥 Roll Damage', value: 'damage' },
        { name: '📜 View History', value: 'history' },
        { name: '🔄 Next Turn', value: 'next_turn' },
        { name: '✨ Toggle Heroic Inspiration', value: 'heroic' },
        { name: '🚪 Exit', value: 'exit' }
      ]
    }
  ]);
  
  return action;
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

function rollDie(sides: number, rerollLow: boolean = false): number {
  let roll = Math.floor(Math.random() * sides) + 1;
  if (rerollLow && roll <= 2) {
    roll = Math.floor(Math.random() * sides) + 1;
  }
  return roll;
}

// Readline-based prompt for better Git Bash compatibility
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

function rollWeaponDamage(isCritical: boolean, useSavage: boolean): { damage: number; diceRolled: string[]; explanations: string[]; allRolls: DieRoll[] } {
  const diceRolled: string[] = [];
  const explanations: string[] = [];
  const allRolls: DieRoll[] = [];
  let weaponDamage = 0;

  const weaponDie = config.character.weapon.die;
  const weaponName = config.character.weapon.name;
  const greatWeaponFighting = config.character.features.great_weapon_fighting.enabled;

  if (isCritical) {
    const die1 = rollDie(weaponDie, greatWeaponFighting);
    const die2 = rollDie(weaponDie, greatWeaponFighting);
    allRolls.push({ value: die1, die: weaponDie, source: `${weaponName} crit die 1` });
    allRolls.push({ value: die2, die: weaponDie, source: `${weaponName} crit die 2` });
    
    if (useSavage) {
      const savageDie1 = rollDie(weaponDie, greatWeaponFighting);
      const savageDie2 = rollDie(weaponDie, greatWeaponFighting);
      
      const originalTotal = die1 + die2;
      const savageTotal = savageDie1 + savageDie2;
      
      if (savageTotal > originalTotal) {
        weaponDamage = savageTotal;
        diceRolled.push(`d${weaponDie}(${savageDie1})`, `d${weaponDie}(${savageDie2})`);
        explanations.push(`2d${weaponDie} ${weaponName} critical + Savage Attacks (${savageDie1}+${savageDie2}=${savageTotal} > ${die1}+${die2}=${originalTotal})`);
        allRolls[0] = { value: savageDie1, die: weaponDie, source: `${weaponName} savage die 1` };
        allRolls[1] = { value: savageDie2, die: weaponDie, source: `${weaponName} savage die 2` };
      } else {
        weaponDamage = originalTotal;
        diceRolled.push(`d${weaponDie}(${die1})`, `d${weaponDie}(${die2})`);
        explanations.push(`2d${weaponDie} ${weaponName} critical + Savage Attacks didn't help (${savageDie1}+${savageDie2}=${savageTotal} ≤ ${die1}+${die2}=${originalTotal})`);
      }
    } else {
      weaponDamage = die1 + die2;
      diceRolled.push(`d${weaponDie}(${die1})`, `d${weaponDie}(${die2})`);
      explanations.push(`2d${weaponDie} ${weaponName} critical`);
    }
  } else {
    const die = rollDie(weaponDie, greatWeaponFighting);
    allRolls.push({ value: die, die: weaponDie, source: `${weaponName} damage` });
    
    if (useSavage) {
      const savageDie = rollDie(weaponDie, greatWeaponFighting);
      
      if (savageDie > die) {
        weaponDamage = savageDie;
        diceRolled.push(`d${weaponDie}(${savageDie})`);
        explanations.push(`1d${weaponDie} ${weaponName} + Savage Attacks (${savageDie} > ${die})`);
        allRolls[0] = { value: savageDie, die: weaponDie, source: `${weaponName} savage` };
      } else {
        weaponDamage = die;
        diceRolled.push(`d${weaponDie}(${die})`);
        explanations.push(`1d${weaponDie} ${weaponName} + Savage Attacks didn't help (${savageDie} ≤ ${die})`);
      }
    } else {
      weaponDamage = die;
      diceRolled.push(`d${weaponDie}(${die})`);
      explanations.push(`1d${weaponDie} ${weaponName} damage`);
    }
  }

  return { damage: weaponDamage, diceRolled, explanations, allRolls };
}

async function calculateDamage(args: AttackOptions = {}): Promise<DamageResult> {
  const { brutal = false, critical = false, savage = false } = args;
  
  let weaponDamage = 0;
  const additionalDamage: Array<{ type: string; amount: number }> = [];
  const weaponDiceRolled: string[] = [];
  const weaponExplanations: string[] = [];
  let heroicUsed: { originalRoll: number; newRoll: number; source: string } | undefined;
  let allRolls: DieRoll[] = [];
  
  // Roll weapon damage first
const weaponResult = rollWeaponDamage(critical, savage && config.character.features.savage_attacks.enabled || false);
  weaponDamage += weaponResult.damage;
  weaponDiceRolled.push(...weaponResult.diceRolled);
  weaponExplanations.push(...weaponResult.explanations);
  allRolls.push(...weaponResult.allRolls);
  
  // Roll brutal strike if specified and available
  if (brutal && config.character.features.brutal_strike.available) {
    const brutalDie = rollDie(10, config.character.features.great_weapon_fighting.enabled);
    weaponDamage += brutalDie;
    weaponDiceRolled.push(`d10(${brutalDie})`);
    weaponExplanations.push(`1d10 Brutal Strike`);
    allRolls.push({ value: brutalDie, die: 10, source: "Brutal Strike" });
  }
  
  // Check for Heroic Inspiration opportunity
  if (config.session.heroic_inspiration && allRolls.length > 0) {
    // Find the lowest roll
    const lowestRoll = allRolls.reduce((lowest, roll) => 
      roll.value < lowest.value ? roll : lowest
    );
    
    // Prompt if the lowest roll is 4 or below
    if (lowestRoll.value <= 4) {
      console.log(`\nYou rolled a ${lowestRoll.value} on your ${lowestRoll.source}.`);
      
      try {
        const useHeroic = await askHeroicInspiration(lowestRoll.value, lowestRoll.source);
        
        if (useHeroic) {
          await animateHeroicInspiration();
          
          const newRoll = rollDie(lowestRoll.die, false);
          console.log(`Heroic Inspiration: ${lowestRoll.value} -> ${newRoll}`);
          console.log(chalk.gray('(Heroic Inspiration used - no longer available this session)\n'));
          
          // Toggle off heroic inspiration for the rest of the session
          config.session.heroic_inspiration = false;
          saveConfig();
          
          // Update the damage calculations
          const difference = newRoll - lowestRoll.value;
          weaponDamage += difference;
          
          // Update the dice display
          const dieIndex = weaponDiceRolled.findIndex(die => die.includes(`(${lowestRoll.value})`));
          if (dieIndex !== -1) {
            weaponDiceRolled[dieIndex] = weaponDiceRolled[dieIndex].replace(`(${lowestRoll.value})`, `(${newRoll})`);
          }
          
          heroicUsed = {
            originalRoll: lowestRoll.value,
            newRoll: newRoll,
            source: lowestRoll.source
          };
        } else {
          console.log('Keeping the original roll.\n');
        }
      } catch (error) {
        console.log('Skipping Heroic Inspiration.\n');
      }
    }
  }
  
  // Add flat bonuses to weapon damage
  const flatBonuses = Object.values(config.character.damage_bonuses).reduce((sum, bonus) => sum + bonus, 0);
  weaponDamage += flatBonuses;
  
  // Add additional damage dice
  for (const [source, diceConfig] of Object.entries(config.character.additional_damage_dice)) {
    const die = rollDie(diceConfig.die, false);
    additionalDamage.push({
      type: diceConfig.description,
      amount: die
    });
  }
  
  // Create breakdown string for manual rolling
  const weaponDiceString = weaponDiceRolled.join(' + ');
  const bonusString = flatBonuses > 0 ? ` + ${flatBonuses}` : '';
  const weaponBreakdown = weaponDiceString + bonusString;
  
  const additionalBreakdowns = additionalDamage.map(dmg => 
    `d${Object.entries(config.character.additional_damage_dice).find(([_, diceConfig]) => diceConfig.description === dmg.type)?.[1].die}(${dmg.amount}) ${dmg.type}`
  );
  
  const breakdown = [weaponBreakdown, ...additionalBreakdowns].join(' + ');
  
  const bonusExplanations = Object.entries(config.character.damage_bonuses)
    .map(([source, value]) => `${value} ${source.replace(/_/g, ' ')}`)
    .join(' + ');
  
  let weaponExplanation = [...weaponExplanations, bonusExplanations].join(' + ');
  
  if (heroicUsed) {
    weaponExplanation += ` [Heroic Inspiration: ${heroicUsed.source} ${heroicUsed.originalRoll}→${heroicUsed.newRoll}]`;
  }
  
  const additionalExplanations = additionalDamage.map(dmg => `${dmg.amount} ${dmg.type}`);
  const explanation = [weaponExplanation, ...additionalExplanations].join(' + ');
  
  return {
    weaponTotal: weaponDamage,
    additionalDamage,
    breakdown,
    explanation
  };
}

async function rollDamageInteractive(): Promise<void> {
  // Show current status
  const heroicStatus = config.session.heroic_inspiration 
    ? chalk.green('✨ Available') 
    : chalk.gray('✨ Used');
  const brutalStatus = config.character.features.brutal_strike.available
    ? chalk.green('⚡ Available')
    : chalk.gray('⚡ Used this turn');
    
  console.log(`Heroic Inspiration: ${heroicStatus}`);
  console.log(`Brutal Strike: ${brutalStatus}\n`);
  
  const choices = [
    { name: 'Critical Hit (double weapon dice)', value: 'critical' },
    { name: 'Savage Attacks (reroll weapon dice, keep higher)', value: 'savage', disabled: !config.character.features.savage_attacks.enabled }
  ];
  
  if (config.character.features.brutal_strike.available) {
    choices.unshift({ name: 'Brutal Strike (1d10 extra damage, once per turn)', value: 'brutal', disabled: false });
  }
  
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'modifiers',
      message: 'Which modifiers apply to this attack?',
      choices: choices.filter(choice => !choice.disabled)
    }
  ]);
  
  const options: AttackOptions = {
    brutal: answers.modifiers.includes('brutal'),
    critical: answers.modifiers.includes('critical'),
    savage: answers.modifiers.includes('savage')
  };
  
  // Show rolling animation only if animations are enabled
  if (config.settings.enable_crit_animations) {
    const rollingAnimation = chalkAnimation.pulse('🎲 Rolling dice... 🎲');
    await sleep(1500);
    rollingAnimation.stop();
  } else {
    console.log('🎲 Rolling dice...');
    await sleep(500);
  }
  
  const result = await calculateDamage(options);
  await printResult(result, options);
  
  // Mark brutal strike as used if it was used
  if (options.brutal && config.character.features.brutal_strike.available) {
    config.character.features.brutal_strike.available = false;
    saveConfig();
  }
  
  // Add to history
  addToHistory(result, options);
  console.log(chalk.gray('\n📝 Attack saved to history'));
  
  await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Press Enter to return to main menu'
    }
  ]);
}

async function printResult(result: DamageResult, args: AttackOptions): Promise<void> {
  const flags = Object.entries(args)
    .filter(([key, value]) => value === true)
    .map(([key]) => `--${key}`)
    .join(' ');
  
  // Animated critical hit sequence
  if (args.critical) {
    await animateCriticalHit();
    console.log(chalk.red('═'.repeat(50)));
  }
  
  console.log(`\n⚔️  ${config.character.name}'s Attack Result ${flags ? `(${flags})` : ''}:`);
  
  // Animated damage display
  if (args.critical) {
    console.log(`💥💥 CRITICAL WEAPON DAMAGE: ${chalk.red.bold(result.weaponTotal)} piercing 💥💥`);
    await animateDamageResult(result.weaponTotal, true);
  } else {
    console.log(`💥 Weapon Damage: ${chalk.red.bold(result.weaponTotal)} piercing`);
    await animateDamageResult(result.weaponTotal, false);
  }
  
  if (result.additionalDamage.length > 0) {
    result.additionalDamage.forEach(dmg => {
      console.log(`✨ Additional: ${chalk.yellow(dmg.amount)} ${dmg.type}`);
    });
  }
  
  // Animated celebration for high damage
  if (result.weaponTotal >= 30) {
    if (config.settings.enable_crit_animations) {
      const epicAnimation = chalkAnimation.rainbow('🎉 LEGENDARY DAMAGE! The gods themselves take notice! 🎉');
      await sleep(3000);
      epicAnimation.stop();
    } else {
      console.log(chalk.yellow.bold('🎉 LEGENDARY DAMAGE! The gods themselves take notice! 🎉'));
    }
  } else if (result.weaponTotal >= 25) {
    if (config.settings.enable_crit_animations) {
      const greatAnimation = chalkAnimation.pulse('🎉 EPIC DAMAGE! The battlefield shakes! 🎉');
      await sleep(2000);
      greatAnimation.stop();
    } else {
      console.log(chalk.yellow.bold('🎉 EPIC DAMAGE! The battlefield shakes! 🎉'));
    }
  } else if (result.weaponTotal >= 20) {
    console.log('⚡ Solid hit! Your enemy staggers! ⚡');
  }
  
  console.log(`\n🎲 For manual rolling:`);
  console.log(`Dice: ${result.breakdown}`);
  console.log(`Breakdown: ${result.explanation}`);
  
  if (args.critical) {
    console.log('═'.repeat(50));
  }
}

async function nextTurn(): Promise<void> {
  config.session.current_turn += 1;
  
  // Reset once-per-turn features
  if (config.character.features.brutal_strike.once_per_turn) {
    config.character.features.brutal_strike.available = true;
  }
  
  // TODO: Reset other once-per-turn features like Action Surge when implemented
  
  saveConfig();
  
  console.log(chalk.green(`\n🔄 Advanced to Turn ${config.session.current_turn}`));
  console.log(chalk.yellow('✨ Once-per-turn features reset!'));
  
  if (config.character.features.brutal_strike.once_per_turn) {
    console.log(chalk.green('  • Brutal Strike available'));
  }
  
  await sleep(2000);
}

async function interactiveMode(): Promise<void> {
  // Show animated intro
  await showCharacterIntro();
  
  try {
    while (true) {
      const action = await mainMenu();
      
      switch (action) {
        case 'attack':
          await attackPlaceholder();
          break;
          
        case 'damage':
          await rollDamageInteractive();
          break;
          
        case 'history':
          await showHistory();
          break;
          
        case 'next_turn':
          await nextTurn();
          break;
          
        case 'heroic':
          await toggleHeroicInspiration();
          break;
          
        case 'exit':
          // Animated farewell
          if (config.settings.enable_crit_animations) {
            const farewellAnimation = chalkAnimation.rainbow(`⚔️  Farewell, ${config.character.name}! May your blade stay sharp! ⚔️`);
            await sleep(3000);
            farewellAnimation.stop();
          } else {
            console.log(chalk.yellow.bold(`⚔️  Farewell, ${config.character.name}! May your blade stay sharp! ⚔️`));
          }
          return;
      }
    }
  } catch (error) {
    if (config.settings.enable_crit_animations) {
      const exitAnimation = chalkAnimation.rainbow(`⚔️  Until next time, ${config.character.name}! ⚔️`);
      await sleep(2000);
      exitAnimation.stop();
    } else {
      console.log(chalk.yellow.bold(`⚔️  Until next time, ${config.character.name}! ⚔️`));
    }
  }
}

// =============================================================================
// CLI SETUP
// =============================================================================

const program = new Command();

// Load config at startup
config = loadConfig();

program
  .name('damage-calc')
  .description(`${config.character.name}'s D&D Damage Calculator`);

program
  .command('roll')
  .description('Roll damage with specified modifiers')
  .option('-b, --brutal', 'Add Brutal Strike damage')
  .option('-c, --critical', 'Roll as critical hit')
  .option('-s, --savage', 'Use Savage Attacks')
  .action(async (options: AttackOptions) => {
    const result = await calculateDamage(options);
    await printResult(result, options);
    
    // Mark brutal strike as used if it was used
    if (options.brutal && config.character.features.brutal_strike.available) {
      config.character.features.brutal_strike.available = false;
      saveConfig();
    }
    
    // Add to history for command line usage too
    addToHistory(result, options);
    console.log(chalk.gray('\n📝 Attack saved to history (use interactive mode to view)'));
  });

program
  .command('interactive')
  .alias('i')
  .description('Interactive mode with menu system')
  .action(interactiveMode);

program
  .command('next-turn')
  .alias('nt')
  .description('Advance to next turn and reset once-per-turn features')
  .action(async () => {
    await nextTurn();
  });

// Main execution
if (process.argv.length === 2) {
  interactiveMode();
} else {
  program.parse();
}