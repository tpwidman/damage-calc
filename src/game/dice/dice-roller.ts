import chalk from "chalk";

export interface DieRoll {
  value: number;
  die: number;
  source: string;
}

export function rollDie(sides: number, rerollLow: boolean = false, alwaysCrit: boolean = false): number {
  // Check for testing overrides
  if (alwaysCrit && sides === 20) {
    console.log(chalk.cyan('🧪 TESTING: Forced critical hit (natural 20)'));
    return 20;
  }
  
  let roll = Math.floor(Math.random() * sides) + 1;
  if (rerollLow && roll <= 2) {
    roll = Math.floor(Math.random() * sides) + 1;
  }
  return roll;
}

export function rollMultipleDice(count: number, sides: number, rerollLow: boolean = false, alwaysCrit: boolean = false): number[] {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(rollDie(sides, rerollLow, alwaysCrit));
  }
  return rolls;
}