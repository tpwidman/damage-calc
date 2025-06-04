import chalk from 'chalk';
import inquirer from 'inquirer';
import { rollWildMagic } from './subclasses/wild-magic/wild-magic';
// import { getCharacterProgression } from '../../progression';
import { getProgression } from '../../progression';
import type { CombatService } from '../../../core';
import { sleep } from '../../../utils';

export async function promptRageActivation(service: CombatService): Promise<boolean> {
  if (service.session.isRageActive) return false;
  if (service.session.ragesRemaining <= 0) return false;
  
  const { activateRage } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'activateRage',
      message: `Activate Rage? (${service.session.ragesRemaining} remaining)`,
      default: true
    }
  ]);
  
  if (activateRage) {
    await activateRageFunction(service);
    return true;
  }
  
  return false;
}

export async function activateRageFunction(service: CombatService): Promise<void> {
  // Use service method instead of manual property setting
  service.session.startRage(service.character);
  
  console.log(chalk.red.bold('\n🔥 RAGE ACTIVATED! 🔥'));
  console.log(chalk.yellow(`Rages remaining: ${service.session.ragesRemaining}`));
  
  if (service.character.isWildMagic) {
    console.log(chalk.magenta('\n✨ Wild Magic surge!'));
    const wildMagicEffect = await rollWildMagic(service.character);
    service.session.setWildMagic(wildMagicEffect);
  }
  
  await sleep(2000);
}

export function getRageStatus(service: CombatService): string {
  if (!service.session.isRageActive) {
    return service.session.ragesRemaining > 0 
      ? chalk.blue(`Available (${service.session.ragesRemaining} left)`)
      : chalk.gray('No rages remaining');
  }
  return chalk.red.bold('ACTIVE');
}

export function resetRages(service: CombatService): void {
  const progression = getProgression(service.character.level);
  service.session.restoreRages(progression.rages);
  service.session.endRage();
}