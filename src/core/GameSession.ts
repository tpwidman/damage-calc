import { Session, WildMagicEffect } from '../types';
import { ISessionRepository } from './repositories/interfaces';
import Character from './Character';

export default class GameSession {
  private sessionRepo: ISessionRepository;
  private data: Session;

  constructor(sessionRepo: ISessionRepository) {
    this.sessionRepo = sessionRepo;
    this.data = sessionRepo.load();
  }

  // Session getters
  get currentTurn(): number { 
    return this.data.current_turn; 
  }
  set currentTurn(turn: number){
    this.data.current_turn = turn;
    this.save();
  }
  
  get isRageActive(): boolean { 
    return this.data.rage_active; 
  }
  
  get ragesRemaining(): number { 
    return this.data.rages_remaining; 
  }
  
  get heroicInspiration(): boolean { 
    return this.data.heroic_inspiration; 
  }
  set heroicInspiration(value) {
    this.data.heroic_inspiration = value;
    this.save();
  }
  
  get currentWildMagic(): WildMagicEffect | null { 
    return this.data.current_wild_magic; 
  }
  
  get tempEffects() { 
    return this.data.temp_effects; 
  }

  // Session operations - "Update session state"
  advanceTurn(): void {
    this.data.current_turn += 1;
    this.save();
  }

  startRage(character: Character): boolean {
    if (this.ragesRemaining > 0 && character.hasClass('barbarian')) {
      this.data.rage_active = true;
      this.data.rages_remaining -= 1;
      this.save();
      return true;
    }
    return false;
  }

  endRage(): void {
    this.data.rage_active = false;
    this.data.current_wild_magic = null;
    this.save();
  }

  useHeroicInspiration(): void {
    this.data.heroic_inspiration = false;
    this.save();
  }

  restoreHeroicInspiration(): void {
    this.data.heroic_inspiration = true;
    this.save();
  }

  toggleHeroicInspiration(): void {
    this.data.heroic_inspiration = !this.data.heroic_inspiration;
    this.save();
  }

  setWildMagic(effect: WildMagicEffect | null): void {
    this.data.current_wild_magic = effect;
    this.save();
  }

  // Reset for new combat
  resetCombat(): void {
    this.data.current_turn = 1;
    this.data.rage_active = false;
    this.data.current_wild_magic = null;
    this.data.temp_effects = [];
    // Don't reset heroic_inspiration or rages_remaining
    this.save();
  }

  // Long rest restoration
  restoreRages(totalRages: number): void {
    this.data.rages_remaining = totalRages;
    this.save();
  }

  private save(): void {
    this.sessionRepo.save(this.data);
  }
}