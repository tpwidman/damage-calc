import { rollDie } from '../../../../dice';
import { getProficiencyBonus } from '../../../../progression';
import chalk from 'chalk';
import { type WildMagicEffect } from '../../../../../types'
import type { Character, CombatService } from '../../../../../core';

interface WildMagicDecoration {
  color: (text: string) => string;
  icon: string;
  bgEffect?: string;
}

export const EFFECT_DECORATIONS: Record<string, WildMagicDecoration> = {
  'necrotic': {
    color: chalk.green.bold,
    icon: '💀☠️',
    bgEffect: 'dark energy swirls'
  },
  'force': {
    color: chalk.blue.bold,
    icon: '⚡🌊',
    bgEffect: 'magical energy pulses'
  },
  'radiant': {
    color: chalk.yellow.bold,
    icon: '✨☀️',
    bgEffect: 'divine light radiates'
  },
  'teleport': {
    color: chalk.magenta.bold,
    icon: '🌀💫',
    bgEffect: 'reality bends around you'
  },
  'protective': {
    color: chalk.cyan.bold,
    icon: '🛡️✨',
    bgEffect: 'shimmering barriers form'
  },
  'terrain': {
    color: chalk.green.dim,
    icon: '🌿🌱',
    bgEffect: 'nature responds to your rage'
  }
};

const WILD_MAGIC_TABLE: WildMagicEffect[] = [
  {
    roll: 1,
    description: "Each creature of your choice within 30 feet must make a Constitution save or take 1d12 necrotic damage. You gain 1d12 temporary hit points.",
    effect_type: 'offensive',
    duration: 'instant',
    requires_save: true,
    save_type: 'Constitution',
    damage_type: 'necrotic'
  },
  {
    roll: 2,
    description: "You teleport up to 30 feet. Until rage ends, you can use this as a bonus action each turn.",
    effect_type: 'utility',
    duration: 'rage',
    bonus_action_repeatable: true,
    damage_type: 'teleport'
  },
  {
    roll: 3,
    description: "A spirit appears within 5 feet of a creature within 30 feet. At turn end, creatures within 5 feet make Dex save or take 1d6 force damage. Repeatable as bonus action.",
    effect_type: 'offensive',
    duration: 'rage',
    bonus_action_repeatable: true,
    requires_save: true,
    save_type: 'Dexterity',
    damage_type: 'force'
  },
  {
    roll: 4,
    description: "One weapon becomes force damage with light and thrown properties (20/60 ft). Returns to hand at turn end.",
    effect_type: 'offensive',
    duration: 'rage',
    damage_type: 'force'
  },
  {
    roll: 5,
    description: "When hit by an attack, attacker takes 1d6 force damage.",
    effect_type: 'defensive',
    duration: 'rage',
    damage_type: 'force'
  },
  {
    roll: 6,
    description: "You and allies within 10 feet gain +1 AC.",
    effect_type: 'defensive',
    duration: 'rage',
    damage_type: 'protective'
  },
  {
    roll: 7,
    description: "Ground within 15 feet becomes difficult terrain for enemies.",
    effect_type: 'utility',
    duration: 'rage',
    damage_type: 'terrain'
  },
  {
    roll: 8,
    description: "Creature within 30 feet makes Con save or takes 1d6 radiant damage and is blinded until start of your next turn. Repeatable as bonus action.",
    effect_type: 'offensive',
    duration: 'rage',
    bonus_action_repeatable: true,
    requires_save: true,
    save_type: 'Constitution',
    damage_type: 'radiant'
  }
];

function decorateWildMagicEffect(effect: WildMagicEffect): void {
  const decoration = EFFECT_DECORATIONS[effect.damage_type || 'force'];
  
  console.log(decoration.color(`\n${decoration.icon} WILD MAGIC EFFECT ${decoration.icon}`));
  
  if (decoration.bgEffect) {
    console.log(chalk.gray.italic(`(${decoration.bgEffect})`));
  }
  
  console.log(decoration.color(`\n${effect.description}`));
}

function calculateSaveDC(character: Character): number {
  const constitutionModifier = character.baseStats.constitution_modifier;
  const proficiency_bonus = getProficiencyBonus(character);
  return 8 + proficiency_bonus + constitutionModifier;
}

export async function rollWildMagic(character: Character): Promise<WildMagicEffect> {
  const roll = rollDie(8);
  const effect = WILD_MAGIC_TABLE[roll - 1];
  
  console.log(chalk.magenta(`\n🎲 Wild Magic Roll: ${roll}`));
  
  decorateWildMagicEffect(effect);
  
  if (effect.requires_save) {
    const saveDC = calculateSaveDC(character);
    console.log(chalk.yellow(`\n💾 ${effect.save_type} Save DC: ${saveDC}`));
  }
  
  if (effect.bonus_action_repeatable) {
    console.log(chalk.blue.bold('\n🔄 BONUS ACTION: Can repeat this effect each turn while raging!'));
  }
  
  return effect;
}

export function displayCurrentWildMagic(service: CombatService): void {
  const character = service.character;
  const session = service.session;

  console.clear();
  
  if (!session.currentWildMagic) {
    console.log(chalk.gray('✨ No Wild Magic effect currently active.\n'));
    return;
  }
  
  const effect = session.currentWildMagic;
  console.log(chalk.magenta.bold('✨ CURRENT WILD MAGIC EFFECT ✨\n'));
  
  decorateWildMagicEffect(effect);
  
  if (effect.requires_save) {
    const saveDC = calculateSaveDC(character);
    console.log(chalk.yellow(`\n💾 Save DC: ${saveDC} ${effect.save_type}`));
  }
  
  if (effect.bonus_action_repeatable) {
    console.log(chalk.blue.bold('\n🔄 Available as bonus action this turn!'));
  }
  
  console.log(chalk.gray(`\n⏱️ Duration: ${effect.duration === 'rage' ? 'Until rage ends' : 'Instant'}`));
}

export async function useWildMagicBonusAction(service: CombatService): Promise<boolean> {
  const character = service.character;
  const session= service.session;
  if (!session.currentWildMagic?.bonus_action_repeatable) {
    return false;
  }
  
  const effect = session.currentWildMagic;
  console.log(chalk.magenta.bold('\n✨ Using Wild Magic Bonus Action!\n'));
  
  decorateWildMagicEffect(effect);
  
  if (effect.requires_save) {
    const saveDC = calculateSaveDC(character);
    console.log(chalk.yellow(`\n💾 ${effect.save_type} Save DC: ${saveDC}`));
  }
  
  // Roll any damage dice
  if (effect.damage_type === 'necrotic' && effect.roll === 1) {
    const tempHp = rollDie(12);
    console.log(chalk.green(`\n💚 You gain ${tempHp} temporary hit points!`));
  } else if (effect.damage_type === 'force' && effect.roll === 3) {
    const damage = rollDie(6);
    console.log(chalk.blue(`\n⚡ Spirit explosion: ${damage} force damage!`));
  } else if (effect.damage_type === 'radiant' && effect.roll === 8) {
    const damage = rollDie(6);
    console.log(chalk.yellow(`\n☀️ Radiant bolt: ${damage} radiant damage + blinded!`));
  }
  
  return true;
}