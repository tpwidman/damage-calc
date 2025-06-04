import type { Character, CombatService } from "../../core";

interface LevelProgression {
  level: number;
  proficiency_bonus: number;
  rages: number;
  rage_damage: number;
  features: string[];
}

const BARBARIAN_PROGRESSION: LevelProgression[] = [
  { level: 1, proficiency_bonus: 2, rages: 2, rage_damage: 2, features: ['Rage', 'Unarmored Defense'] },
  { level: 2, proficiency_bonus: 2, rages: 2, rage_damage: 2, features: ['Reckless Attack', 'Danger Sense'] },
  { level: 3, proficiency_bonus: 2, rages: 3, rage_damage: 2, features: ['Primal Path'] },
  { level: 4, proficiency_bonus: 2, rages: 3, rage_damage: 2, features: ['Ability Score Improvement'] },
  { level: 5, proficiency_bonus: 3, rages: 3, rage_damage: 2, features: ['Extra Attack', 'Fast Movement'] },
  { level: 6, proficiency_bonus: 3, rages: 4, rage_damage: 2, features: ['Path feature'] },
  { level: 7, proficiency_bonus: 3, rages: 4, rage_damage: 2, features: ['Feral Instinct'] },
  { level: 8, proficiency_bonus: 3, rages: 4, rage_damage: 2, features: ['Ability Score Improvement'] },
  { level: 9, proficiency_bonus: 4, rages: 4, rage_damage: 3, features: ['Brutal Critical (1 die)'] },
  { level: 10, proficiency_bonus: 4, rages: 4, rage_damage: 3, features: ['Path feature'] },
  { level: 11, proficiency_bonus: 4, rages: 4, rage_damage: 3, features: ['Relentless Rage'] },
  { level: 12, proficiency_bonus: 4, rages: 5, rage_damage: 3, features: ['Ability Score Improvement'] },
  { level: 13, proficiency_bonus: 5, rages: 5, rage_damage: 3, features: ['Brutal Critical (2 dice)'] },
  { level: 14, proficiency_bonus: 5, rages: 5, rage_damage: 3, features: ['Path feature'] },
  { level: 15, proficiency_bonus: 5, rages: 5, rage_damage: 3, features: ['Persistent Rage'] },
  { level: 16, proficiency_bonus: 5, rages: 5, rage_damage: 4, features: ['Ability Score Improvement'] },
  { level: 17, proficiency_bonus: 6, rages: 6, rage_damage: 4, features: ['Brutal Critical (3 dice)'] },
  { level: 18, proficiency_bonus: 6, rages: 6, rage_damage: 4, features: ['Indomitable Might'] },
  { level: 19, proficiency_bonus: 6, rages: 6, rage_damage: 4, features: ['Ability Score Improvement'] },
  { level: 20, proficiency_bonus: 6, rages: 999, rage_damage: 4, features: ['Primal Champion'] }
];

export function getProgression(level: number): LevelProgression {
  return BARBARIAN_PROGRESSION[level - 1] || BARBARIAN_PROGRESSION[0];
}

// Character-only functions (cleaner parameters!)
export function getAttackModifier(character: Character): number {
  return character.getAttackModifier();
}

export function getProficiencyBonus(character: Character): number {
  const progression = getProgression(character.level);
  return progression.proficiency_bonus;
}

export function getTotalRages(character: Character): number {
  const progression = getProgression(character.barbarianLevel);
  return progression.rages;
}

export function getCharacterFeatures(character: Character): string[] {
  const progression = getProgression(character.barbarianLevel);
  return progression.features;
}

export function getBaseRageDamage(character: Character): number {
  return character.getRageDamage();
}

// Service-dependent functions (only when we need session data)
export function getRageDamage(service: CombatService): number {
  if (!service.session.isRageActive) return 0;
  return service.character.getRageDamage();
}

// Overloaded version that takes a boolean for flexibility
export function getRageDamageWithState(character: Character, isRaging: boolean): number {
  if (!isRaging) return 0;
  return character.getRageDamage();
}