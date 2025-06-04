import chalk from 'chalk';
import inquirer from 'inquirer';

interface TurnAction {
  type: 'attack' | 'damage' | 'bonus_action';
  timestamp: string;
  details: string;
  result: string;
}

interface TurnSummary {
  turnNumber: number;
  startTime: string;
  actions: TurnAction[];
  totalDamage: number;
}

let turnHistory: TurnSummary[] = [];
let currentTurn: TurnSummary | null = null;

export function startTurnHistory(turnNumber: number): void {
  currentTurn = {
    turnNumber,
    startTime: new Date().toLocaleTimeString(),
    actions: [],
    totalDamage: 0
  };
}

export function addTurnAction(action: TurnAction): void {
  if (currentTurn) {
    currentTurn.actions.push(action);
    
    // Extract damage from result if it's a damage action
    if (action.type === 'damage') {
      const damageMatch = action.result.match(/(\d+) damage/);
      if (damageMatch) {
        currentTurn.totalDamage += parseInt(damageMatch[1]);
      }
    }
  }
}

export function endTurnHistory(): void {
  if (currentTurn) {
    turnHistory.push(currentTurn);
    currentTurn = null;
  }
}

export function getTurnHistoryCount(): number {
  return turnHistory.length;
}

export function clearTurnHistory(): void {
  turnHistory = [];
  currentTurn = null;
}

export async function showTurnHistory(): Promise<void> {
  console.clear();
  
  if (turnHistory.length === 0) {
    console.log(chalk.yellow('📜 No turn history yet!'));
    console.log('Use "Start Turn" to begin tracking combat turns.\n');
  } else {
    console.log(chalk.yellow.bold('📜 Combat Turn History\n'));
    console.log('═'.repeat(60));
    
    turnHistory.forEach((turn) => {
      console.log(chalk.cyan.bold(`Turn ${turn.turnNumber} (${turn.startTime}) - Total: ${chalk.red.bold(turn.totalDamage)} damage`));
      
      turn.actions.forEach((action, index) => {
        const actionIcon = getActionIcon(action.type);
        console.log(chalk.gray(`  ${actionIcon} ${action.details} → ${action.result}`));
      });
      
      console.log('');
    });
    
    console.log('═'.repeat(60));
  }
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'History options:',
      choices: [
        { name: '← Back to Main Menu', value: 'back' },
        { name: '🗑️  Clear History', value: 'clear' }
      ]
    }
  ]);
  
  if (action === 'clear') {
    clearTurnHistory();
    console.log(chalk.yellow('Turn history cleared!'));
    await sleep(1000);
  }
}

function getActionIcon(type: string): string {
  switch (type) {
    case 'attack': return '⚔️';
    case 'damage': return '💥';
    case 'bonus_action': return '🎯';
    default: return '•';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper functions to add specific actions
export function addAttackAction(attackType: string, roll: number, hit: boolean): void {
  addTurnAction({
    type: 'attack',
    timestamp: new Date().toLocaleTimeString(),
    details: `${attackType} attack (${roll})`,
    result: hit ? 'HIT' : 'MISS'
  });
}

export function addDamageAction(damage: number, breakdown: string, modifiers: string): void {
  addTurnAction({
    type: 'damage',
    timestamp: new Date().toLocaleTimeString(),
    details: `${breakdown}${modifiers ? ` (${modifiers})` : ''}`,
    result: `${damage} damage`
  });
}

export function addBonusAction(actionName: string, result: string): void {
  addTurnAction({
    type: 'bonus_action',
    timestamp: new Date().toLocaleTimeString(),
    details: actionName,
    result: result
  });
}