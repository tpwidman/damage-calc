import chalk from 'chalk';
import inquirer from 'inquirer';
import { rollWildMagic } from './wild-magic';
import { getProgression } from './level-progression';
import { Config } from '../types';
import { sleep } from '../utils/animations';

export async function promptRageActivation(config: Config): Promise<boolean> {
  if (config.session.rage_active) return false;
  if (config.session.rages_remaining <= 0) return false;
  
  const { activateRage } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'activateRage',
      message: `Activate Rage? (${config.session.rages_remaining} remaining)`,
      default: true
    }
  ]);
  
  if (activateRage) {
    await activateRageFunction(config); // Call the function, not the boolean!
    return true;
  }
  
  return false;
}

export async function activateRageFunction(config: Config): Promise<void> {
  config.session.rage_active = true;
  config.session.rages_remaining--;
  
  console.log(chalk.red.bold('\n🔥 RAGE ACTIVATED! 🔥'));
  console.log(chalk.yellow(`Rages remaining: ${config.session.rages_remaining}`));
  
  if (config.character.subclass === 'wild_magic') {
    console.log(chalk.magenta('\n✨ Wild Magic surge!'));
    const wildMagicEffect = await rollWildMagic(config);
    config.session.current_wild_magic = wildMagicEffect;
  }
  
  await sleep(2000);
}

export function getRageStatus(config: Config): string {
  if (!config.session.rage_active) {
    return config.session.rages_remaining > 0 
      ? chalk.blue(`Available (${config.session.rages_remaining} left)`)
      : chalk.gray('No rages remaining');
  }
  return chalk.red.bold('ACTIVE');
}

export function resetRages(config: Config): void {
  const progression = getProgression(config.character.level);
  config.session.rages_remaining = progression.rages;
  config.session.rage_active = false;
  config.session.current_wild_magic = null;
}