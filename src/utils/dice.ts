export function rollDie(sides: number, rerollLow: boolean = false): number {
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