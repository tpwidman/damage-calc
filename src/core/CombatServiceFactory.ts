import Character from './Character';
import GameSession from './GameSession';
import GameSettings from './GameSettings';
import CombatService from './CombatService';
import { 
  FileCharacterRepository, 
  FileSessionRepository, 
  FileSettingsRepository 
} from './repositories/FileRepositories';

export default class CombatServiceFactory {
  
  static create(): CombatService {
    // Create file-based repositories with default paths
    const characterRepo = new FileCharacterRepository('config/character-config.json');
    const sessionRepo = new FileSessionRepository('config/session-data.json');
    const settingsRepo = new FileSettingsRepository('config/settings.json');
    
    // Load data and create domain objects
    const character = new Character(characterRepo.load());
    const session = new GameSession(sessionRepo);
    const settings = new GameSettings(settingsRepo);
    
    return new CombatService(character, session, settings);
  }
  
  static createWithCustomPaths(
    characterPath: string, 
    sessionPath: string, 
    settingsPath: string
  ): CombatService {
    const characterRepo = new FileCharacterRepository(characterPath);
    const sessionRepo = new FileSessionRepository(sessionPath);
    const settingsRepo = new FileSettingsRepository(settingsPath);
    
    const character = new Character(characterRepo.load());
    const session = new GameSession(sessionRepo);
    const settings = new GameSettings(settingsRepo);
    
    return new CombatService(character, session, settings);
  }
  
  // Future: API-based factory
  // static createWithApi(apiUrl: string, apiKey: string): CombatService {
  //   const characterRepo = new ApiCharacterRepository(apiUrl, apiKey);
  //   const sessionRepo = new ApiSessionRepository(apiUrl, apiKey);
  //   const settingsRepo = new ApiSettingsRepository(apiUrl, apiKey);
  //   
  //   const character = new Character(characterRepo.load());
  //   const session = new GameSession(sessionRepo);
  //   const settings = new GameSettings(settingsRepo);
  //   
  //   return new CombatService(character, session, settings);
  // }
}