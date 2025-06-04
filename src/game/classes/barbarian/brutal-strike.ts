import type { Character } from '../../../core';

export function isBrutalStrikeAvailable(character: Character): boolean {
  return character.features.brutal_strike?.available ?? false;
}

export function useBrutalStrike(character: Character): void {
  if (character.features.brutal_strike?.once_per_turn) {
    character.features.brutal_strike.available = false;
  }
}

export function resetBrutalStrike(character: Character): void {
  if (character.features.brutal_strike?.once_per_turn) {
    character.features.brutal_strike.available = true;
  }
}

export function getBrutalStrikeStatus(character: Character): string {
  return character.features.brutal_strike?.available ? 'Available' : 'Used this turn';
}