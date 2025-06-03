import chalk from 'chalk';
import { saveConfig } from '../utils/config-loader';
import { resetBrutalStrike } from '../features/brutal-strike';
import type { Config } from '../types';

export function getCurrentTurn(config: Config): number {
  return config.session.current_turn;
}

export function nextTurn(config: Config): void {
  config.session.current_turn += 1;
  
  // Reset all once-per-turn features
  resetBrutalStrike(config);
  
  // TODO: Reset other once-per-turn features when added
  // resetActionSurge(config);
  // resetGWMBonusAction(config);
  
  saveConfig(config);
}

export function getResetFeatures(config: Config): string[] {
  const resetFeatures: string[] = [];
  
  if (config.character.features.brutal_strike.once_per_turn) {
    resetFeatures.push('Brutal Strike');
  }
  
  // TODO: Add other features when implemented
  // if (config.character.features.action_surge?.once_per_turn) {
  //   resetFeatures.push('Action Surge');
  // }
  
  return resetFeatures;
}

export async function displayTurnAdvancement(config: Config): Promise<void> {
  const resetFeatures = getResetFeatures(config);
  
  console.log(chalk.green(`\n🔄 Advanced to Turn ${config.session.current_turn}`));
  console.log(chalk.yellow('✨ Once-per-turn features reset!'));
  
  resetFeatures.forEach(feature => {
    console.log(chalk.green(`  • ${feature} available`));
  });
  
  // Simple sleep function
  await new Promise(resolve => setTimeout(resolve, 2000));
}