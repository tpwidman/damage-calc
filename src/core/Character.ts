import { CharacterData, CharacterClass } from '../types';

export default class Character {
  // Public properties - direct access to data
  public readonly name: string;
  public readonly classes: CharacterClass[];
  public readonly primaryClass: string;
  public readonly weapon: CharacterData['weapon'];
  public readonly baseStats: CharacterData['base_stats'];
  public readonly attackModifiers: CharacterData['attack_modifiers'];
  public readonly features: CharacterData['features'];
  public readonly damageBonuses: CharacterData['damage_bonuses'];
  public readonly additionalDamageDice: CharacterData['additional_damage_dice'];
  public readonly magicItems: CharacterData['magic_items'];

  // Private cache for class lookups
  private classLevelCache: Map<string, number> = new Map();
  private subclassCache: Map<string, string | undefined> = new Map();

  constructor(data: CharacterData) {
    this.name = data.name;
    this.classes = data.classes;
    this.primaryClass = data.primaryClass;
    this.weapon = data.weapon;
    this.baseStats = data.base_stats;
    this.attackModifiers = data.attack_modifiers;
    this.features = data.features;
    this.damageBonuses = data.damage_bonuses;
    this.additionalDamageDice = data.additional_damage_dice;
    this.magicItems = data.magic_items;

    // Pre-cache class levels for performance
    this.buildCache();
  }

  private buildCache(): void {
    for (const classData of this.classes) {
      const className = classData.name.toLowerCase();
      this.classLevelCache.set(className, classData.level);
      this.subclassCache.set(className, classData.subclass);
    }
  }

  // Calculated properties - these deserve getters
  get level(): number {
    return this.classes.reduce((total, cls) => total + cls.level, 0);
  }

  get barbarianLevel(): number {
    return this.classLevelCache.get('barbarian') || 0;
  }

  get fighterLevel(): number {
    return this.classLevelCache.get('fighter') || 0;
  }

  get primarySubclass(): string | undefined {
    return this.subclassCache.get(this.primaryClass.toLowerCase());
  }

  get isWildMagic(): boolean {
    return this.subclassCache.get('barbarian')?.toLowerCase() === 'wild_magic';
  }

  // Character methods - "Can this character do X?"
  canUseFeature(featureName: string): boolean {
    switch (featureName) {
      case 'brutal_strike':
        return this.barbarianLevel >= 9;
      case 'wild_magic':
        return this.isWildMagic && this.barbarianLevel >= 3;
      case 'action_surge':
        return this.fighterLevel >= 2;
      case 'second_wind':
        return this.fighterLevel >= 1;
      case 'rage':
        return this.barbarianLevel >= 1;
      case 'reckless_attack':
        return this.barbarianLevel >= 2;
      default:
        return false;
    }
  }
  
  getAttackModifier(): number {
    return this.baseStats.strength_modifier + 
           this.attackModifiers.proficiency + 
           this.magicItems.weapon_bonus;
  }
  
  getRageDamage(): number {
    if (this.barbarianLevel === 0) return 0;
    if (this.barbarianLevel >= 16) return 4;
    if (this.barbarianLevel >= 9) return 3;
    return 2;
  }
  
  getTotalRages(): number {
    if (this.barbarianLevel === 0) return 0;
    if (this.barbarianLevel >= 20) return 999;
    if (this.barbarianLevel >= 17) return 6;
    if (this.barbarianLevel >= 12) return 5;
    if (this.barbarianLevel >= 6) return 4;
    if (this.barbarianLevel >= 3) return 3;
    return 2;
  }

  getMaxAttacks(): number {
    let attacks = 1; // Base attack
    
    // Barbarian doesn't get extra attacks beyond 1
    if (this.barbarianLevel >= 5) {
      attacks = Math.max(attacks, 2);
    }
    
    // Fighter gets more extra attacks
    if (this.fighterLevel >= 20) {
      attacks = Math.max(attacks, 4);
    } else if (this.fighterLevel >= 11) {
      attacks = Math.max(attacks, 3);
    } else if (this.fighterLevel >= 5) {
      attacks = Math.max(attacks, 2);
    }
    
    return attacks;
  }

  // Dynamic class lookups
  getClassLevel(className: string): number {
    return this.classLevelCache.get(className.toLowerCase()) || 0;
  }

  getSubclass(className: string): string | undefined {
    return this.subclassCache.get(className.toLowerCase());
  }

  hasClass(className: string): boolean {
    return this.getClassLevel(className) > 0;
  }

  hasSubclass(className: string, subclassName: string): boolean {
    const subclass = this.getSubclass(className);
    return subclass?.toLowerCase() === subclassName.toLowerCase();
  }
}