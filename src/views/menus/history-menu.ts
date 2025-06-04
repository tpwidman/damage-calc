import chalk from 'chalk';
import inquirer from 'inquirer';
import { AttackHistoryEntry } from '../../types';

// Global history array - will be managed here
let attackHistory: AttackHistoryEntry[] = [];

export function addToHistory(entry: AttackHistoryEntry): void {
  attackHistory.push(entry);
}

export function clearHistory(): void {
  attackHistory = [];
}

export function getHistoryCount(): number {
  return attackHistory.length;
}

export async function showHistory(): Promise<void> {
  console.clear();
  
  if (attackHistory.length === 0) {
    console.log(chalk.yellow('📜 No attack history yet!'));
    console.log('Make some attacks to see them here.\n');
  } else {
    console.log(chalk.yellow.bold('📜 Attack History\n'));
    console.log('═'.repeat(60));
    
    attackHistory.forEach((attack, index) => {
      const number = chalk.gray(`#${index + 1}`);
      const time = chalk.blue(attack.timestamp);
      const turn = chalk.magenta(`T${attack.turn}`);
      const damage = chalk.red.bold(attack.damage);
      const flags = attack.flags === 'normal' ? '' : chalk.gray(`(${attack.flags})`);
      
      console.log(`${number} ${turn} ${time} - ${damage} damage ${flags}`);
      console.log(chalk.gray(`   ${attack.breakdown}`));
      
      if (attack.additionalDamage.length > 0) {
        attack.additionalDamage.forEach(dmg => {
          console.log(chalk.gray(`   +${dmg.amount} ${dmg.type}`));
        });
      }
      
      if (attack.heroic_used) {
        console.log(chalk.cyan(`   ✨ Heroic: ${attack.heroic_used.source} ${attack.heroic_used.originalRoll}→${attack.heroic_used.newRoll}`));
      }
      console.log('');
    });
    
    console.log('═'.repeat(60));
  }
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'History options:',
      choices: [
        { name: '← Back to Main Menu', value: 'back' },
        { name: '🗑️  Clear History', value: 'clear' }
      ]
    }
  ]);
  
  if (action === 'clear') {
    clearHistory();
    console.log(chalk.yellow('History cleared!'));
    await sleep(1000);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}