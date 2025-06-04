import Character from './Character';
import GameSession from './GameSession';
import GameSettings from './GameSettings';

export default class CombatService {
  public readonly character: Character;
  public readonly session: GameSession;
  public readonly settings: GameSettings;

  constructor(
    character: Character,
    session: GameSession,
    settings: GameSettings
  ) {
    this.character = character;
    this.session = session;
    this.settings = settings;
  }

  // Convenience methods that coordinate between objects
  getCurrentRageDamage(): number {
    if (!this.session.isRageActive) return 0;
    return this.character.getRageDamage();
  }

  canActivateRage(): boolean {
    return this.character.canUseFeature('rage') && 
           this.session.ragesRemaining > 0 && 
           !this.session.isRageActive;
  }

  activateRage(): boolean {
    if (this.canActivateRage()) {
      return this.session.startRage(this.character);
    }
    return false;
  }

  // Reset methods that coordinate multiple objects
  resetForNewCombat(): void {
    this.session.resetCombat();
    // Could reset character features that are per-combat here
  }

  // Long rest - restore everything
  longRest(): void {
    // Restore rages based on character level
    const maxRages = this.character.getTotalRages();
    this.session.restoreRages(maxRages);
    this.session.restoreHeroicInspiration();
    this.resetForNewCombat();
  }
}