import { getCharacterProgression } from '../game/progression/character-progression'
import { getBarbarianProgression } from '../game/progression/barbarian-progression';
import Character from './Character';

export function getProgression(character: Character) {
  const characterProgression = getCharacterProgression(character.level);
  
  return {
    level: character.level,
    proficiencyBonus: characterProgression.proficiencyBonus,
    classes: character.classes,
    primaryClass: character.primaryClass
  };
}

export function getProficiencyBonus(character: Character): number {
  const characterProgression = getCharacterProgression(character.level);
  return characterProgression.proficiencyBonus;
}

export function getRageDamage(character: Character, isRageActive: boolean): number {
  if (!isRageActive || character.barbarianLevel === 0) return 0;
  
  const barbarianProgression = getBarbarianProgression(character.barbarianLevel);
  return barbarianProgression.rageDamage;
}

export function getRagesTotal(character: Character): number {
  if (character.barbarianLevel === 0) return 0;
  
  const barbarianProgression = getBarbarianProgression(character.barbarianLevel);
  return barbarianProgression.rages;
}

export function getAttackModifier(character: Character): number {
  const proficiency = getProficiencyBonus(character);
  return character.baseStats.strength_modifier + 
         proficiency + 
         character.magicItems.weapon_bonus;
}