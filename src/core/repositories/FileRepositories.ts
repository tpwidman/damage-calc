import fs from 'fs';
import path from 'path';
import { CharacterData, Session, Settings } from '../../types';
import { ICharacterRepository, ISessionRepository, ISettingsRepository } from './interfaces';

export class FileCharacterRepository implements ICharacterRepository {
  constructor(private filePath: string) {}

  load(): CharacterData {
    try {
      const fullPath = path.resolve(this.filePath);
      const rawData = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error(`Failed to load character config from ${this.filePath}:`, error);
      throw new Error('Could not load character configuration');
    }
  }

  save(data: CharacterData): void {
    try {
      const fullPath = path.resolve(this.filePath);
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Failed to save character config to ${this.filePath}:`, error);
      throw new Error('Could not save character configuration');
    }
  }
}

export class FileSessionRepository implements ISessionRepository {
  constructor(private filePath: string) {}

  load(): Session {
    try {
      const fullPath = path.resolve(this.filePath);
      const rawData = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error(`Failed to load session data from ${this.filePath}:`, error);
      throw new Error('Could not load session data');
    }
  }

  save(data: Session): void {
    try {
      const fullPath = path.resolve(this.filePath);
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Failed to save session data to ${this.filePath}:`, error);
      throw new Error('Could not save session data');
    }
  }
}

export class FileSettingsRepository implements ISettingsRepository {
  constructor(private filePath: string) {}

  load(): Settings {
    try {
      const fullPath = path.resolve(this.filePath);
      const rawData = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error(`Failed to load settings from ${this.filePath}:`, error);
      throw new Error('Could not load settings');
    }
  }

  save(data: Settings): void {
    try {
      const fullPath = path.resolve(this.filePath);
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Failed to save settings to ${this.filePath}:`, error);
      throw new Error('Could not save settings');
    }
  }
}