import chalk from 'chalk';
import type { GameSession } from '../../../core';

export function isHeroicInspirationAvailable(session: GameSession): boolean {
  return session.heroicInspiration;
}

export function useHeroicInspiration(session: GameSession): void {
  session.heroicInspiration = false;
}

export function restoreHeroicInspiration(session: GameSession): void {
  session.heroicInspiration = false;
}

export function getHeroicInspirationStatus(session: GameSession): string {
  return session.heroicInspiration 
    ? chalk.green('Available') 
    : chalk.gray('Used');
}

export function toggleHeroicInspiration(session: GameSession): void {
  session.heroicInspiration = session.heroicInspiration;
}