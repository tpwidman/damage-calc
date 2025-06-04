import chalk from 'chalk';
import { resetBrutalStrike } from '../classes/barbarian/brutal-strike';
import type { CombatService, Character, GameSession } from '../../core';
import { sleep } from '../../utils';

export function getCurrentTurn(session: GameSession): number {
  return session.currentTurn;
}

export function nextTurn(service: CombatService): void {
  const character = service.character;
  const session = service.session;
  
  // Advance turn counter (auto-saves)
  session.advanceTurn();
  
  // Reset all once-per-turn features
  resetBrutalStrike(character);
  
  // TODO: Reset other once-per-turn features when added
  // resetActionSurge(service);
  // resetGWMBonusAction(service);
  
  // No need to save - service handles it automatically
}

export function getResetFeatures(character: Character): string[] {
  const resetFeatures: string[] = [];
  
  if (character.features.brutal_strike?.available) {
    resetFeatures.push('Brutal Strike');
  }
  
  // TODO: Add other features when implemented
  // if (character.features.action_surge?.once_per_turn) {
  //   resetFeatures.push('Action Surge');
  // }
  
  return resetFeatures;
}

export async function displayTurnAdvancement(service: CombatService): Promise<void> {
  const character = service.character;
  const session = service.session;
  
  const resetFeatures = getResetFeatures(character);
  
  console.log(chalk.green(`\n🔄 Advanced to Turn ${session.currentTurn}`));
  console.log(chalk.yellow('✨ Once-per-turn features reset!'));
  
  resetFeatures.forEach(feature => {
    console.log(chalk.green(`  • ${feature} available`));
  });
  
  // Simple sleep function
  await sleep(2000);
}