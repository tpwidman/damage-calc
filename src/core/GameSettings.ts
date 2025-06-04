import { Settings } from '../types';
import { ISettingsRepository } from './repositories/interfaces';

export default class GameSettings {
  private settingsRepo: ISettingsRepository;
  private data: Settings;

  constructor(settingsRepo: ISettingsRepository) {
    this.settingsRepo = settingsRepo;
    this.data = settingsRepo.load();
  }

  // Settings getters
  get enableCritAnimations(): boolean { 
    return this.data.enable_crit_animations; 
  }
  
  get testingMode() { 
    return this.data.testing_mode; 
  }

  get alwaysCrit(): boolean {
    return this.data.testing_mode?.always_crit || false;
  }

  get forceHeroicInspiration(): boolean {
    return this.data.testing_mode?.force_heroic_inspiration || false;
  }

  // Settings operations
  toggleCritAnimations(): void {
    this.data.enable_crit_animations = !this.data.enable_crit_animations;
    this.save();
  }

  setAlwaysCrit(enabled: boolean): void {
    if (!this.data.testing_mode) {
      this.data.testing_mode = {};
    }
    this.data.testing_mode.always_crit = enabled;
    this.save();
  }

  setForceHeroicInspiration(enabled: boolean): void {
    if (!this.data.testing_mode) {
      this.data.testing_mode = {};
    }
    this.data.testing_mode.force_heroic_inspiration = enabled;
    this.save();
  }

  toggleTestingMode(): void {
    if (!this.data.testing_mode) {
      this.data.testing_mode = { always_crit: true, force_heroic_inspiration: false };
    } else {
      this.data.testing_mode = undefined;
    }
    this.save();
  }

  private save(): void {
    this.settingsRepo.save(this.data);
  }
}