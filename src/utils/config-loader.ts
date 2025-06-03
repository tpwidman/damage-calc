import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import type { Config } from '../types';

export function loadConfig(): Config {
  const configPath = path.join(process.cwd(), 'config', 'character-config.json');
  
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(chalk.red('Error loading config/character-config.json:'), error);
    console.log(chalk.yellow('Please ensure character-config.json exists in the config/ folder.'));
    process.exit(1);
  }
}

export function saveConfig(config: Config): void {
  const configPath = path.join(process.cwd(), 'config', 'character-config.json');
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(chalk.red('Error saving character-config.json:'), error);
  }
}