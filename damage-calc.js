#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';

// =============================================================================
// CONFIG BLOCK - Modify this section for your character
// =============================================================================

const CHARACTER_NAME = "Dumnorix";
const WEAPON_DIE = 10;
const WEAPON_NAME = "pike";

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

function applyHeroicInspiration(rolls) {
  if (rolls.length === 0) {
    return { updatedRolls: rolls, heroicUsed: null };
  }

  let lowestIndex = 0;
  let lowestValue = rolls[0].value;
  
  for (let i = 1; i < rolls.length; i++) {
    if (rolls[i].value < lowestValue) {
      lowestValue = rolls[i].value;
      lowestIndex = i;
    }
  }

  const targetRoll = rolls[lowestIndex];
  const newRoll = rollDie(targetRoll.die, false);
  
  const updatedRolls = [...rolls];
  updatedRolls[lowestIndex] = { ...targetRoll, value: newRoll };
  
  return {
    updatedRolls,
    heroicUsed: {
      originalRoll: targetRoll.value,
      newRoll,
      source: targetRoll.source
    }
  };
}

function rollWeaponDamage(isCritical, useSavage, useHeroic) {
  const diceRolled = [];
  const explanations = [];
  let weaponDamage = 0;
  let heroicUsed = null;

  if (isCritical) {
    let die1 = rollDie(WEAPON_DIE, GREAT_WEAPON_FIGHTING);
    let die2 = rollDie(WEAPON_DIE, GREAT_WEAPON_FIGHTING);
    
    if (useHeroic) {
      const rolls = [
        { value: die1, die: WEAPON_DIE, source: `${WEAPON_NAME} crit die 1` },
        { value: die2, die: WEAPON_DIE, source: `${WEAPON_NAME} crit die 2` }
      ];
      const heroicResult = applyHeroicInspiration(rolls);
      die1 = heroicResult.updatedRolls[0].value;
      die2 = heroicResult.updatedRolls[1].value;
      heroicUsed = heroicResult.heroicUsed;
    }
    
    if (useSavage) {
      let savageDie1 = rollDie(WEAPON_DIE, GREAT_WEAPON_FIGHTING);
      let savageDie2 = rollDie(WEAPON_DIE, GREAT_WEAPON_FIGHTING);
      
      if (useHeroic && !heroicUsed) {
        const savageRolls = [
          { value: savageDie1, die: WEAPON_DIE, source: `${WEAPON_NAME} savage die 1` },
          { value: savageDie2, die: WEAPON_DIE, source: `${WEAPON_NAME} savage die 2` }
        ];
        const heroicResult = applyHeroicInspiration(savageRolls);
        savageDie1 = heroicResult.updatedRolls[0].value;
        savageDie2 = heroicResult.updatedRolls[1].value;
        heroicUsed = heroicResult.heroicUsed;
      }
      
      const originalTotal = die1 + die2;
      const savageTotal = savageDie1 + savageDie2;
      
      if (savageTotal > originalTotal) {
        weaponDamage = savageTotal;
        diceRolled.push(`d${WEAPON_DIE}(${savageDie1})`, `d${WEAPON_DIE}(${savageDie2})`);
        explanations.push(`2d${WEAPON_DIE} ${WEAPON_NAME} critical + Savage Attacks (${savageDie1}+${savageDie2}=${savageTotal} > ${die1}+${die2}=${originalTotal})`);
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
    let die = rollDie(WEAPON_DIE, GREAT_WEAPON_FIGHTING);
    
    if (useSavage) {
      let savageDie = rollDie(WEAPON_DIE, GREAT_WEAPON_FIGHTING);
      
      if (useHeroic) {
        const rolls = [
          { value: die, die: WEAPON_DIE, source: `${WEAPON_NAME} damage` },
          { value: savageDie, die: WEAPON_DIE, source: `${WEAPON_NAME} savage` }
        ];
        const heroicResult = applyHeroicInspiration(rolls);
        die = heroicResult.updatedRolls[0].value;
        savageDie = heroicResult.updatedRolls[1].value;
        heroicUsed = heroicResult.heroicUsed;
      }
      
      if (savageDie > die) {
        weaponDamage = savageDie;
        diceRolled.push(`d${WEAPON_DIE}(${savageDie})`);
        explanations.push(`1d${WEAPON_DIE} ${WEAPON_NAME} + Savage Attacks (${savageDie} > ${die})`);
      } else {
        weaponDamage = die;
        diceRolled.push(`d${WEAPON_DIE}(${die})`);
        explanations.push(`1d${WEAPON_DIE} ${WEAPON_NAME} + Savage Attacks didn't help (${savageDie} ≤ ${die})`);
      }
    } else {
      if (useHeroic) {
        const originalDie = die;
        die = rollDie(WEAPON_DIE, false);
        heroicUsed = {
          originalRoll: originalDie,
          newRoll: die,
          source: `${WEAPON_NAME} damage`
        };
      }
      
      weaponDamage = die;
      diceRolled.push(`d${WEAPON_DIE}(${die})`);
      explanations.push(`1d${WEAPON_DIE} ${WEAPON_NAME} damage`);
    }
  }

  return { damage: weaponDamage, diceRolled, explanations, heroicUsed };
}

function calculateDamage(args = {}) {
  const { brutal = false, critical = false, savage = false, heroic = false } = args;
  
  let weaponDamage = 0;
  const additionalDamage = [];
  const weaponDiceRolled = [];
  const weaponExplanations = [];
  let heroicUsed = null;
  
  const weaponResult = rollWeaponDamage(critical, savage, heroic);
  weaponDamage += weaponResult.damage;
  weaponDiceRolled.push(...weaponResult.diceRolled);
  weaponExplanations.push(...weaponResult.explanations);
  heroicUsed = weaponResult.heroicUsed || null;
  
  if (brutal) {
    let brutalDie = rollDie(BRUTAL_STRIKE_DIE, GREAT_WEAPON_FIGHTING);
    
    if (heroic && !heroicUsed) {
      const originalBrutal = brutalDie;
      brutalDie = rollDie(BRUTAL_STRIKE_DIE, false);
      heroicUsed = {
        originalRoll: originalBrutal,
        newRoll: brutalDie,
        source: "Brutal Strike"
      };
    }
    
    weaponDamage += brutalDie;
    weaponDiceRolled.push(`d${BRUTAL_STRIKE_DIE}(${brutalDie})`);
    weaponExplanations.push(`1d${BRUTAL_STRIKE_DIE} Brutal Strike`);
  }
  
  const flatBonuses = Object.values(DAMAGE_BONUSES).reduce((sum, bonus) => sum + bonus, 0);
  weaponDamage += flatBonuses;
  
  for (const [source, config] of Object.entries(DAMAGE_DICE)) {
    const die = rollDie(config.die, false);
    additionalDamage.push({
      type: config.description,
      amount: die
    });
  }
  
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
  
  console.log(chalk.yellow(`\n⚔️  ${CHARACTER_NAME}'s Attack Result`) + chalk.gray(` ${flags ? `(${flags})` : ''}:`));
  console.log(chalk.red.bold(`💥 Weapon Damage: ${result.weaponTotal} piercing`));
  
  if (result.additionalDamage.length > 0) {
    result.additionalDamage.forEach(dmg => {
      console.log(chalk.magenta(`✨ Additional: ${dmg.amount} ${dmg.type}`));
    });
  }
  
  console.log(chalk.blue(`\n🎲 For manual rolling:`));
  console.log(chalk.cyan(`Dice: ${result.breakdown}`));
  console.log(chalk.green(`Breakdown: ${result.explanation}`));
}

async function interactiveMode() {
  console.log(chalk.yellow.bold(`\n⚔️  Hello ${CHARACTER_NAME}!`));
  console.log(chalk.gray('Select your attack modifiers:\n'));
  
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'modifiers',
      message: 'Which modifiers apply to this attack?',
      choices: [
        { name: chalk.yellow('🗡️  Brutal Strike') + chalk.gray(' (1d10 extra damage, once per turn)'), value: 'brutal' },
        { name: chalk.red('💥 Critical Hit') + chalk.gray(' (double weapon dice)'), value: 'critical' },
        { name: chalk.blue('⚡ Savage Attacks') + chalk.gray(' (reroll weapon dice, keep higher)'), value: 'savage' },
        { name: chalk.magenta('✨ Heroic Inspiration') + chalk.gray(' (reroll lowest die)'), value: 'heroic' }
      ]
    }
  ]);
  
  const options = {
    brutal: answers.modifiers.includes('brutal'),
    critical: answers.modifiers.includes('critical'),
    savage: answers.modifiers.includes('savage'),
    heroic: answers.modifiers.includes('heroic')
  };
  
  const result = calculateDamage(options);
  printResult(result, options);
  
  const { again } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'again',
      message: chalk.yellow('Roll another attack?'),
      default: false
    }
  ]);
  
  if (again) {
    await interactiveMode();
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
  .option('--heroic', 'Use Heroic Inspiration')
  .action((options) => {
    const result = calculateDamage(options);
    printResult(result, options);
  });

program
  .command('interactive')
  .alias('i')
  .description('Interactive mode with prompts')
  .action(interactiveMode);

// Default to interactive mode if no command specified
if (process.argv.length === 2) {
  interactiveMode();
} else {
  program.parse();
}

program
  .name('attack')
  .description(chalk.yellow(`${CHARACTER_NAME}'s D&D Damage Calculator`))
  .version('1.0.0');

program
  .command('roll')
  .description('Roll damage with specified modifiers')
  .option('-b, --brutal', 'Add Brutal Strike damage')
  .option('-c, --critical', 'Roll as critical hit')
  .option('-s, --savage', 'Use Savage Attacks')
  .option('-h, --heroic', 'Use Heroic Inspiration')
  .action((options) => {
    const result = calculateDamage(options);
    printResult(result, options);
  });

program
  .command('interactive')
  .alias('i')
  .description('Interactive mode with prompts')
  .action(interactiveMode);

// Default to interactive mode if no command specified
if (process.argv.length === 2) {
  interactiveMode();
} else {
  program.parse();
}

export { calculateDamage, DAMAGE_BONUSES, WEAPON_DIE, WEAPON_NAME };