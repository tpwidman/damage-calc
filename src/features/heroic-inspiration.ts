import chalk from 'chalk';
import { saveConfig } from '../utils/config-loader';
import type { Config } from '../types';

export function isHeroicInspirationAvailable(config: Config): boolean {
  return config.session.heroic_inspiration;
}

export function useHeroicInspiration(config: Config): void {
  config.session.heroic_inspiration = false;
  saveConfig(config);
}

export function restoreHeroicInspiration(config: Config): void {
  config.session.heroic_inspiration = true;
  saveConfig(config);
}

export function getHeroicInspirationStatus(config: Config): string {
  return config.session.heroic_inspiration 
    ? chalk.green('Available') 
    : chalk.gray('Used');
}

export function toggleHeroicInspiration(config: Config): void {
  config.session.heroic_inspiration = !config.session.heroic_inspiration;
  saveConfig(config);
}