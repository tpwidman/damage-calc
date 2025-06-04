import type { Character } from '../../../core';

export function isSavageAttacksAvailable(character: Character): boolean {
  return character.features.savage_attacks?.available ?? false;
}

export function useSavageAttacks(character: Character): void {
  if (character.features.savage_attacks?.once_per_turn) {
    character.features.savage_attacks.available = false;
  }
}

export function resetSavageAttacks(character: Character): void {
  if (character.features.savage_attacks?.once_per_turn) {
    character.features.savage_attacks.available = true;
  }
}

export function getSavageAttacksStatus(character: Character): string {
  return character.features.savage_attacks?.available ? 'Available' : 'Used this turn';
}