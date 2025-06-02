# ⚔️ D&D 2024 Damage Calculator

A beautiful CLI tool for calculating damage for Dumnorix the Barbarian in D&D 2024. Features interactive prompts, colorful output, and support for all barbarian abilities including Brutal Strike, Savage Attacks, and Heroic Inspiration.

![Demo](https://img.shields.io/badge/D%26D-2024-red) ![Node](https://img.shields.io/badge/Node.js-18%2B-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- 🎲 **Interactive Mode**: Beautiful prompts with checkbox selection
- ⚡ **Quick Commands**: Fast CLI flags for experienced users  
- 🎨 **Colorful Output**: Easy-to-read damage breakdowns
- 🧠 **Smart Logic**: Heroic Inspiration automatically targets lowest rolls
- 📊 **Damage Separation**: Weapon damage vs additional damage types
- 🔄 **D&D 2024 Rules**: Fully compliant with latest ruleset

### Supported Abilities

- **Brutal Strike**: Add 1d10 damage (once per turn)
- **Savage Attacks**: Reroll weapon dice, keep higher result
- **Heroic Inspiration**: Reroll lowest die for maximum benefit
- **Great Weapon Fighting**: Automatically rerolls 1s and 2s
- **Critical Hits**: Double weapon dice with Savage Attacks support

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tpwidman/damage-calc.git
   cd damage-calc
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the calculator:**
   ```bash
   node damage-calc.js
   ```

## 🎮 Usage

### Interactive Mode (Default)
```bash
node damage-calc.js
```
![Interactive Demo](https://via.placeholder.com/600x300/1a1a1a/00ff00?text=Interactive+Mode+Demo)

### Quick Commands
```bash
# Basic attack
node damage-calc.js roll

# Brutal Strike attack
node damage-calc.js roll --brutal

# Critical hit with Savage Attacks
node damage-calc.js roll --critical --savage

# Everything combined
node damage-calc.js roll --brutal --critical --savage --heroic
```

### Available Flags
- `-b, --brutal` - Add Brutal Strike damage (1d10)
- `-c, --critical` - Roll as critical hit (2d10 weapon damage)
- `-s, --savage` - Use Savage Attacks (reroll weapon dice, keep higher)
- `--heroic` - Use Heroic Inspiration (reroll lowest die)

## 📊 Example Output

```
⚔️  Dumnorix's Attack Result (--brutal --savage --heroic):
💥 Weapon Damage: 28 piercing
✨ Additional: 3 fire damage

🎲 For manual rolling:
Dice: d10(8) + d10(6) + 12 + d4(3) fire damage
Breakdown: 1d10 pike + Savage Attacks (8 > 4) + 1d10 Brutal Strike + 4 strength + 3 rage + 4 heavy weapon mastery + 1 magic weapon [Heroic Inspiration: pike damage 2→8] + 3 fire damage
```

## ⚙️ Configuration

Edit the config block at the top of `damage-calc.js` to customize for your character:

```javascript
// Character configuration
const CHARACTER_NAME = "Dumnorix";
const WEAPON_DIE = 10;  // d10 for pike
const WEAPON_NAME = "pike";

// Flat damage bonuses
const DAMAGE_BONUSES = {
  strength: 4,
  rage: 3,
  heavy_weapon_mastery: 4,
  magic_weapon: 1,
  // Add more bonuses here
};

// Additional damage dice (separate damage types)
const DAMAGE_DICE = {
  // fire_buff: { die: 4, description: "fire damage" },
  // radiant_weapon: { die: 6, description: "radiant damage" },
};
```

## 🎯 How It Works

### Damage Calculation Priority

1. **Weapon Damage**: Pike (1d10) with all barbarian bonuses
2. **Brutal Strike**: Additional 1d10 (if used)
3. **Flat Bonuses**: STR + Rage + Heavy Weapon Mastery + Magic Weapon
4. **Additional Damage**: Separate damage types (fire, radiant, etc.)

### Smart Features

- **Heroic Inspiration**: Automatically finds and rerolls the lowest die among all weapon/brutal dice
- **Savage Attacks**: Works on any attack (not just crits), compares original vs reroll
- **Great Weapon Fighting**: Rerolls 1s and 2s on damage dice automatically
- **Damage Separation**: Weapon damage gets all bonuses, additional damage stays separate

## 🛠️ Development

### Adding New Damage Sources

1. **Flat Bonuses** (add to weapon damage):
   ```javascript
   const DAMAGE_BONUSES = {
     // ... existing bonuses
     temp_blessing: 2,  // Adds +2 to weapon damage
   };
   ```

2. **Additional Damage Dice** (separate damage types):
   ```javascript
   const DAMAGE_DICE = {
     fire_sword: { die: 6, description: "fire damage" },
     radiant_blessing: { die: 4, description: "radiant damage" },
   };
   ```

### Dependencies

- **commander**: CLI argument parsing and commands
- **chalk**: Terminal colors and styling  
- **inquirer**: Interactive prompts and checkboxes

## 📝 D&D 2024 Rules Reference

This calculator implements the following D&D 2024 rules:

- **Savage Attacks**: "Once per turn when you hit a target with a weapon, you can roll the weapon's damage dice twice and use either roll against the target."
- **Brutal Strike**: "Instead of gaining advantage from Reckless Attack, you can add 1d10 damage to the attack if it hits" (once per turn)
- **Heroic Inspiration**: "You can expend it to reroll any die immediately after rolling it, and you must use the new roll."
- **Great Weapon Fighting**: "When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll, even if the new roll is a 1 or a 2."

## 🤝 Contributing

Feel free to submit issues or pull requests! This tool was built for personal use but can easily be adapted for other characters or campaigns.

## 📄 License

MIT License - feel free to use and modify for your own D&D games!

---

*Built for Dumnorix the Barbarian's epic adventures* ⚔️