import chalk from "chalk";
import { Config } from "../types";

export function rollDie(sides: number, rerollLow: boolean = false, config?: Config): number {
  // Check for testing overrides
  if (config?.settings.testing_mode?.always_crit && sides === 20) {
    console.log(chalk.cyan('🧪 TESTING: Forced critical hit (natural 20)'));
    return 20;
  }
  
  let roll = Math.floor(Math.random() * sides) + 1;
  if (rerollLow && roll <= 2) {
    roll = Math.floor(Math.random() * sides) + 1;
  }
  return roll;
}

export interface DieRoll {
  value: number;
  die: number;
  source: string;
}