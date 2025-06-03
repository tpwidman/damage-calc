import type { Config } from '../types';

export function isBrutalStrikeAvailable(config: Config): boolean {
  return config.character.features.brutal_strike.available;
}

export function useBrutalStrike(config: Config): void {
  if (config.character.features.brutal_strike.once_per_turn) {
    config.character.features.brutal_strike.available = false;
  }
}

export function resetBrutalStrike(config: Config): void {
  if (config.character.features.brutal_strike.once_per_turn) {
    config.character.features.brutal_strike.available = true;
  }
}

export function getBrutalStrikeStatus(config: Config): string {
  return config.character.features.brutal_strike.available ? 'Available' : 'Used this turn';
}