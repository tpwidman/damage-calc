import { CharacterData, Session, Settings } from '../../types';

export interface ICharacterRepository {
  load(): CharacterData;
  save(data: CharacterData): void;
}

export interface ISessionRepository {
  load(): Session;
  save(data: Session): void;
}

export interface ISettingsRepository {
  load(): Settings;
  save(data: Settings): void;
}