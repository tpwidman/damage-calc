#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import readline from 'readline';

// =============================================================================
// CONFIG BLOCK - Modify this section for your character
// =============================================================================

const CHARACTER_NAME = "Dumnorix";
const WEAPON_DIE = 10;
const WEAPON_NAME = "pike";
const HEROIC_INSPIRATION_AVAILABLE = true; // Set to false when used up
let heroicInspirationAvailable = HEROIC_INSPIRATION_AVAILABLE;

const DAMAGE_BONUSES = {
  strength: 4,
  rage: 3,
  heavy_weapon_mastery: 4,
  magic_weapon: 1,
};

const DAMAGE_DICE = {
  // fire_buff: { die: 4, description: "fire damage" },
};

const BRUTAL_STRIKE_DIE = 10;
const GREAT_WEAPON_FIGHTING = true;

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

function rollDie(sides, rerollLow = false) {
  let roll = Math.floor(Math.random() * sides) + 1;
  if (rerollLow && roll <= 2) {
    roll = Math.floor(Math.random() * sides) + 1;
  }
  return roll;
}

// Readline-based prompt for better Git Bash compatibility
function askHeroicInspiration(roll, source) {
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

function rollWeaponDamage(isCritical, useSavage) {
  const diceRolled = [];
  const explanations = [];
  const allRolls = []; // Track all individual rolls for heroic inspiration
  let weaponDamage = 0;

  if (isCritical) {
    const die1 = rollDie(WEAPON_DIE, GREAT_WEAPON_FIGHTING);
    const die2 = rollDie(WEAPON_DIE, GREAT_WEAPON_FIGHTING);
    allRolls.push({ value: die1, die: WEAPON_DIE, source: `${WEAPON_NAME} crit die 1` });
    allRolls.push({ value: die2, die: WEAPON_DIE, source: `${WEAPON_NAME} crit die 2` });
    
    if (useSavage) {
      const savageDie1 = rollDie(WEAPON_DIE, GREAT_WEAPON_FIGHTING);
      const savageDie2 = rollDie(WEAPON_DIE, GREAT_WEAPON_FIGHTING);
      
      const originalTotal = die1 + die2;
      const savageTotal = savageDie1 + savageDie2;
      
      if (savageTotal > originalTotal) {
        weaponDamage = savageTotal;
        diceRolled.push(`d${WEAPON_DIE}(${savageDie1})`, `d${WEAPON_DIE}(${savageDie2})`);
        explanations.push(`2d${WEAPON_DIE} ${WEAPON_NAME} critical + Savage Attacks (${savageDie1}+${savageDie2}=${savageTotal} > ${die1}+${die2}=${originalTotal})`);
        // Update allRolls to reflect what we're actually using
        allRolls[0] = { value: savageDie1, die: WEAPON_DIE, source: `${WEAPON_NAME} savage die 1` };
        allRolls[1] = { value: savageDie2, die: WEAPON_DIE, source: `${WEAPON_NAME} savage die 2` };
      } else {
        weaponDamage = originalTotal;
        diceRolled.push(`d${WEAPON_DIE}(${die1})`, `d${WEAPON_DIE}(${die2})`);
        explanations.push(`2d${WEAPON_DIE} ${WEAPON_NAME} critical + Savage Attacks didn't help (${savageDie1}+${savageDie2}=${savageTotal} ≤ ${die1}+${die2}=${originalTotal})`);
      }
    } else {
      weaponDamage = die1 + die2;
      diceRolled.push(`d${WEAPON_DIE}(${die1})`, `d${WEAPON_DIE}(${die2})`);
      explanations.push(`2d${WEAPON_DIE} ${WEAPON_NAME} critical`);
    }
  } else {
    const die = rollDie(WEAPON_DIE, GREAT_WEAPON_FIGHTING);
    allRolls.push({ value: die, die: WEAPON_DIE, source: `${WEAPON_NAME} damage` });
    
    if (useSavage) {
      const savageDie = rollDie(WEAPON_DIE, GREAT_WEAPON_FIGHTING);
      
      if (savageDie > die) {
        weaponDamage = savageDie;
        diceRolled.push(`d${WEAPON_DIE}(${savageDie})`);
        explanations.push(`1d${WEAPON_DIE} ${WEAPON_NAME} + Savage Attacks (${savageDie} > ${die})`);
        allRolls[0] = { value: savageDie, die: WEAPON_DIE, source: `${WEAPON_NAME} savage` };
      } else {
        weaponDamage = die;
        diceRolled.push(`d${WEAPON_DIE}(${die})`);
        explanations.push(`1d${WEAPON_DIE} ${WEAPON_NAME} + Savage Attacks didn't help (${savageDie} ≤ ${die})`);
      }
    } else {
      weaponDamage = die;
      diceRolled.push(`d${WEAPON_DIE}(${die})`);
      explanations.push(`1d${WEAPON_DIE} ${WEAPON_NAME} damage`);
    }
  }

  return { damage: weaponDamage, diceRolled, explanations, allRolls };
}

async function calculateDamage(args = {}) {
  const { brutal = false, critical = false, savage = false } = args;
  
  let weaponDamage = 0;
  const additionalDamage = [];
  const weaponDiceRolled = [];
  const weaponExplanations = [];
  let heroicUsed = null;
  let allRolls = [];
  
  // Roll weapon damage first
  const weaponResult = rollWeaponDamage(critical, savage);
  weaponDamage += weaponResult.damage;
  weaponDiceRolled.push(...weaponResult.diceRolled);
  weaponExplanations.push(...weaponResult.explanations);
  allRolls.push(...weaponResult.allRolls);
  
  // Roll brutal strike if specified
  if (brutal) {
    const brutalDie = rollDie(BRUTAL_STRIKE_DIE, GREAT_WEAPON_FIGHTING);
    weaponDamage += brutalDie;
    weaponDiceRolled.push(`d${BRUTAL_STRIKE_DIE}(${brutalDie})`);
    weaponExplanations.push(`1d${BRUTAL_STRIKE_DIE} Brutal Strike`);
    allRolls.push({ value: brutalDie, die: BRUTAL_STRIKE_DIE, source: "Brutal Strike" });
  }
  
  // Check for Heroic Inspiration opportunity
  if (heroicInspirationAvailable && allRolls.length > 0) {
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
          const newRoll = rollDie(lowestRoll.die, false);
          console.log(`Heroic Inspiration: ${lowestRoll.value} -> ${newRoll}`);
          console.log(chalk.gray('(Heroic Inspiration used - no longer available this session)\n'));
          
          // Toggle off heroic inspiration for the rest of the session
          heroicInspirationAvailable = false;
          
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
  const flatBonuses = Object.values(DAMAGE_BONUSES).reduce((sum, bonus) => sum + bonus, 0);
  weaponDamage += flatBonuses;
  
  // Add additional damage dice
  for (const [source, config] of Object.entries(DAMAGE_DICE)) {
    const die = rollDie(config.die, false);
    additionalDamage.push({
      type: config.description,
      amount: die
    });
  }
  
  // Create breakdown string for manual rolling
  const weaponDiceString = weaponDiceRolled.join(' + ');
  const bonusString = flatBonuses > 0 ? ` + ${flatBonuses}` : '';
  const weaponBreakdown = weaponDiceString + bonusString;
  
  const additionalBreakdowns = additionalDamage.map(dmg => 
    `d${Object.entries(DAMAGE_DICE).find(([_, config]) => config.description === dmg.type)?.[1].die}(${dmg.amount}) ${dmg.type}`
  );
  
  const breakdown = [weaponBreakdown, ...additionalBreakdowns].join(' + ');
  
  const bonusExplanations = Object.entries(DAMAGE_BONUSES)
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

function printResult(result, args) {
  const flags = Object.entries(args)
    .filter(([key, value]) => value === true)
    .map(([key]) => `--${key}`)
    .join(' ');
  
  // Special animation for critical hits
  if (args.critical) {
    console.log('\n💥 CRITICAL HIT! 💥');
    
    // Quick flash effect
    const critMessages = [
      '⚡ DEVASTATING BLOW! ⚡',
      '🔥 MAXIMUM DAMAGE! 🔥',
      '💀 ENEMY TREMBLES! 💀'
    ];
    
    for (let i = 0; i < 3; i++) {
      process.stdout.write('\r' + critMessages[i % critMessages.length]);
      const start = Date.now();
      while (Date.now() - start < 200) {}
    }
    
    console.log('\r💥 CRITICAL HIT CONFIRMED! 💥');
    console.log('═'.repeat(50));
  }
  
  console.log(`\n⚔️  ${CHARACTER_NAME}'s Attack Result ${flags ? `(${flags})` : ''}:`);
  
  // Extra dramatic display for crits
  if (args.critical) {
    console.log(`💥💥 CRITICAL WEAPON DAMAGE: ${chalk.red.bold(result.weaponTotal)} piercing 💥💥`);
  } else {
    console.log(`💥 Weapon Damage: ${chalk.red.bold(result.weaponTotal)} piercing`);
  }
  
  if (result.additionalDamage.length > 0) {
    result.additionalDamage.forEach(dmg => {
      console.log(`✨ Additional: ${chalk.yellow(dmg.amount)} ${dmg.type}`);
    });
  }
  
  // Special message for high damage
  if (result.weaponTotal >= 25) {
    console.log('🎉 EPIC DAMAGE! The battlefield shakes! 🎉');
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

async function interactiveMode() {
  // Show greeting once at startup
  console.log(chalk.yellow.bold(`\n⚔️  Hello ${CHARACTER_NAME}!`));
  console.log('Ready for combat. Select your attack modifiers:\n');
  
  let firstAttack = true;
  
  try {
    while (true) {
      // Don't show extra spacing on first attack
      if (!firstAttack) {
        console.log('\n' + '─'.repeat(40));
        console.log('Next attack:');
      }
      firstAttack = false;
      
      // Show current status
      const heroicStatus = heroicInspirationAvailable 
        ? chalk.green('✨ Available') 
        : chalk.gray('✨ Used');
      console.log(`Heroic Inspiration: ${heroicStatus}\n`);
      
      const answers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'modifiers',
          message: 'Which modifiers apply to this attack?',
          choices: [
            { name: 'Brutal Strike (1d10 extra damage, once per turn)', value: 'brutal' },
            { name: 'Critical Hit (double weapon dice)', value: 'critical' },
            { name: 'Savage Attacks (reroll weapon dice, keep higher)', value: 'savage' }
          ]
        }
      ]);
      
      const options = {
        brutal: answers.modifiers.includes('brutal'),
        critical: answers.modifiers.includes('critical'),
        savage: answers.modifiers.includes('savage')
      };
      
      const result = await calculateDamage(options);
      printResult(result, options);
      
      const { again } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'again',
          message: 'Roll another attack?',
          default: false
        }
      ]);
      
      if (!again) {
        console.log(chalk.yellow.bold('\n⚔️  Farewell, ' + CHARACTER_NAME + '! May your blade stay sharp! ⚔️'));
        break;
      }
    }
  } catch (error) {
    console.log(chalk.yellow.bold('\n⚔️  Until next time, ' + CHARACTER_NAME + '! ⚔️'));
  }
}

// =============================================================================
// CLI SETUP
// =============================================================================

const program = new Command();

program
  .name('attack')
  .description(`${CHARACTER_NAME}'s D&D Damage Calculator`);

program
  .command('roll')
  .description('Roll damage with specified modifiers')
  .option('-b, --brutal', 'Add Brutal Strike damage')
  .option('-c, --critical', 'Roll as critical hit')
  .option('-s, --savage', 'Use Savage Attacks')
  .action(async (options) => {
    const result = await calculateDamage(options);
    printResult(result, options);
  });

program
  .command('interactive')
  .alias('i')
  .description('Interactive mode with prompts')
  .action(interactiveMode);

// Main execution
if (process.argv.length === 2) {
  interactiveMode();
} else {
  program.parse();
}