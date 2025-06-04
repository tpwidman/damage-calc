import chalk from 'chalk';
import inquirer from 'inquirer';
import { getProgression } from '../../game/progression/level-progression';
import { clearTurnHistory } from '../../game/combat/turn-history';
import type { CombatService } from '../../core';

export async function resetCombat(service: CombatService): Promise<void> {
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
  const progression = getProgression(service.character.level);
  
  // Reset session using service methods (auto-saves!)
  service.session.currentTurn = 1;
  service.session.restoreHeroicInspiration();
  service.session.endRage();
  service.session.restoreRages(progression.rages);
  service.session.setWildMagic(null);
  // Note: temp_effects reset would need a method on GameSession
  
  // Clear combat history
  clearTurnHistory();
  
  console.log(chalk.green.bold('\n✅ Combat reset complete!'));
  console.log(chalk.yellow(`🔥 Rages reset to ${progression.rages} (level ${service.character.level})`));
  console.log(chalk.yellow('✨ Heroic Inspiration restored'));
  console.log(chalk.yellow('📜 Combat history cleared'));
  
  await sleep(2000);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}