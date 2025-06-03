export interface Weapon {
  die: number;
  name: string;
}

export interface Feature {
  available: boolean;
  once_per_turn?: boolean;
  enabled?: boolean;
}

export interface WildMagicEffect {
  roll: number;
  description: string;
  effect_type: 'damage' | 'utility' | 'defensive' | 'offensive';
  duration: 'instant' | 'rage' | 'turn';
  bonus_action_repeatable?: boolean;
  requires_save?: boolean;
  save_type?: 'Constitution' | 'Dexterity';
  damage_type?: string;
}

export interface Character {
  name: string;
  level: number;
  class: string;
  subclass: string;
  weapon: Weapon;
  base_stats: {
    strength_modifier: number;
    constitution_modifier: number;
  };
  attack_modifiers: {
    strength: number;
    proficiency: number;
    magic_weapon: number;
  };
  features: {
    brutal_strike: Feature;
    gwm: Feature;
    savage_attacks: Feature;
    great_weapon_fighting: Feature;
    reckless_attack: Feature;
  };
  damage_bonuses: Record<string, number>;
  additional_damage_dice: Record<string, { die: number; description: string }>;
  magic_items: {
    weapon_bonus: number;
  };
}

export interface TempEffect {
  name: string;
  description: string;
  duration: number | 'encounter' | 'manual';
  effect_type: 'damage_bonus' | 'damage_die' | 'modifier';
  value: number | string;
}

export interface Session {
  heroic_inspiration: boolean;
  current_turn: number;
  rage_active: boolean;
  rages_remaining: number;
  current_wild_magic: WildMagicEffect | null;
  temp_effects: TempEffect[];
}

export interface Settings {
  enable_crit_animations: boolean;
  testing_mode?: {
    always_crit?: boolean;
    force_heroic_inspiration?: boolean;
  }
}

export interface Config {
  character: Character;
  session: Session;
  settings: Settings;
}

export interface AttackOptions {
  brutal?: boolean;
  critical?: boolean;
  savage?: boolean;
}

export interface DamageResult {
  weaponTotal: number;
  additionalDamage: Array<{ type: string; amount: number }>;
  breakdown: string;
  explanation: string;
  heroicUsed?: {
    originalRoll: number;
    newRoll: number;
    source: string;
  };
}

export interface AttackHistoryEntry {
  timestamp: string;
  damage: number;
  breakdown: string;
  explanation: string;
  flags: string;
  additionalDamage: Array<{ type: string; amount: number }>;
  turn: number;
  heroic_used?: {
    originalRoll: number;
    newRoll: number;
    source: string;
  };
}

export interface DieRoll {
  value: number;
  die: number;
  source: string;
}

export interface LevelProgression {
  level: number;
  proficiency_bonus: number;
  rages: number;
  rage_damage: number;
  features: string[];
}