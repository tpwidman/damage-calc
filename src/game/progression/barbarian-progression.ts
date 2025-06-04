export interface BarbarianProgression {
  level: number;
  rages: number;
  rageDamage: number;
  extraAttacks: number;
  features: string[];
}

const BARBARIAN_PROGRESSION: BarbarianProgression[] = [
  { level: 1, rages: 2, rageDamage: 2, extraAttacks: 0, features: ['Rage', 'Unarmored Defense'] },
  { level: 2, rages: 2, rageDamage: 2, extraAttacks: 0, features: ['Reckless Attack', 'Danger Sense'] },
  { level: 3, rages: 3, rageDamage: 2, extraAttacks: 0, features: ['Primal Path'] },
  { level: 4, rages: 3, rageDamage: 2, extraAttacks: 0, features: ['Ability Score Improvement'] },
  { level: 5, rages: 3, rageDamage: 2, extraAttacks: 1, features: ['Extra Attack', 'Fast Movement'] },
  { level: 6, rages: 4, rageDamage: 2, extraAttacks: 1, features: ['Path feature'] },
  { level: 7, rages: 4, rageDamage: 2, extraAttacks: 1, features: ['Feral Instinct'] },
  { level: 8, rages: 4, rageDamage: 2, extraAttacks: 1, features: ['Ability Score Improvement'] },
  { level: 9, rages: 4, rageDamage: 3, extraAttacks: 1, features: ['Brutal Critical'] },
  { level: 10, rages: 4, rageDamage: 3, extraAttacks: 1, features: ['Path feature', 'Brutal Strike'] },
  { level: 11, rages: 4, rageDamage: 3, extraAttacks: 1, features: ['Relentless Rage'] },
  { level: 12, rages: 5, rageDamage: 3, extraAttacks: 1, features: ['Ability Score Improvement'] },
  { level: 13, rages: 5, rageDamage: 3, extraAttacks: 1, features: ['Brutal Critical (2 dice)'] },
  { level: 14, rages: 5, rageDamage: 3, extraAttacks: 1, features: ['Path feature'] },
  { level: 15, rages: 5, rageDamage: 3, extraAttacks: 1, features: ['Persistent Rage'] },
  { level: 16, rages: 5, rageDamage: 4, extraAttacks: 1, features: ['Ability Score Improvement'] },
  { level: 17, rages: 6, rageDamage: 4, extraAttacks: 1, features: ['Brutal Critical (3 dice)'] },
  { level: 18, rages: 6, rageDamage: 4, extraAttacks: 1, features: ['Indomitable Might'] },
  { level: 19, rages: 6, rageDamage: 4, extraAttacks: 1, features: ['Ability Score Improvement'] },
  { level: 20, rages: 999, rageDamage: 4, extraAttacks: 1, features: ['Primal Champion'] }
];

export function getBarbarianProgression(level: number): BarbarianProgression {
  return BARBARIAN_PROGRESSION[level - 1] || BARBARIAN_PROGRESSION[0];
}