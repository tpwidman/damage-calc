import type { Config } from '../types';

let savageAttacksUsedThisTurn = false;

export function isSavageAttacksAvailable(config: Config): boolean {
  return config.character.features.savage_attacks.enabled && !savageAttacksUsedThisTurn || false;
}

export function useSavageAttacks(): void {
  savageAttacksUsedThisTurn = true;
}

export function resetSavageAttacks(): void {
  savageAttacksUsedThisTurn = false;
}

export function getSavageAttacksStatus(config: Config): string {
  if (!config.character.features.savage_attacks.enabled) {
    return 'Not Available';
  }
  return savageAttacksUsedThisTurn ? 'Used this turn' : 'Available';
}