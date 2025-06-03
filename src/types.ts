export interface Weapon {
  die: number;
  name: string;
}

export interface Feature {
  available: boolean;
  once_per_turn?: boolean;
  enabled?: boolean;
}

export interface Character {
  name: string;
  weapon: Weapon;
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
  };
  damage_bonuses: Record<string, number>;
  additional_damage_dice: Record<string, { die: number; description: string }>;
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
  temp_effects: TempEffect[];
}

export interface Settings {
  enable_crit_animations: boolean;
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