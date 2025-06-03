import chalk from 'chalk';
import inquirer from 'inquirer';
import { saveConfig } from '../utils/config-loader';
import { getProgression } from './level-progression';
import { clearTurnHistory } from '../turns/turn-history';
import type { Config } from '../types';

export async function resetCombat(config: Config): Promise<void> {
  console.clear();
  
  console.log(chalk.yellow.bold('🔃 Combat Reset\n'));
  console.log('This will reset:');
  console.log('• Turn counter to 1');
  console.log('• Heroic Inspiration to available');
  console.log('• Rage to inactive');
  console.log('• Rages remaining to full');
  console.log('• Wild Magic effects');
  console.log('• Temporary effects');
  console.log('• Combat history');
  console.log('');
  
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to reset combat?',
      default: false
    }
  ]);
  
  if (!confirm) {
    console.log(chalk.gray('Combat reset cancelled.'));
    await sleep(1000);
    return;
  }
  
  // Get level-appropriate values
  const progression = getProgression(config.character.level);
  
  // Reset session to defaults
  config.session = {
    heroic_inspiration: true,
    current_turn: 1,
    rage_active: false,
    rages_remaining: progression.rages, // Level-appropriate rages
    current_wild_magic: null,
    temp_effects: []
  };
  
  // Clear combat history
  clearTurnHistory();
  
  // Save the reset config
  saveConfig(config);
  
  console.log(chalk.green.bold('\n✅ Combat reset complete!'));
  console.log(chalk.yellow(`🔥 Rages reset to ${progression.rages} (level ${config.character.level})`));
  console.log(chalk.yellow('✨ Heroic Inspiration restored'));
  console.log(chalk.yellow('📜 Combat history cleared'));
  
  await sleep(2000);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}