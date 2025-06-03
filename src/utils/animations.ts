import chalk from 'chalk';
import type { Config } from '../types';

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createCharacterASCII(name: string, weapon: string): string {
  const title = `⚔️  ${name.toUpperCase()} THE DESTROYER ⚔️`;
  const subtitle = `Wielding the mighty ${weapon} of legend!`;
  const readyLine = `Ready for combat! 💀`;
  
  // Center the text in the frame
  const titlePadding = Math.max(0, Math.floor((52 - title.length) / 2));
  const subtitlePadding = Math.max(0, Math.floor((52 - subtitle.length) / 2));
  const readyPadding = Math.max(0, Math.floor((52 - readyLine.length) / 2));
  
  const border = `
     .--..--..--..--..--..--..--..--..--..--..--..--..--..--..--..--.
    / .. \\.. \\.. \\.. \\.. \\.. \\.. \\.. \\.. \\.. \\.. \\.. \\.. \\.. \\.. \\.. \\
    \\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/ /
     \\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /
     / /\\/ /\`' /\`' /\`' /\`' /\`' /\`' /\`' /\`' /\`' /\`' /\`' /\`' /\`' /\\/ /\\
    / /\\ \\/\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\\ \\/\\ \\
    \\ \\/\\ \\                                                    /\\ \\/ /
     \\/ /\\ \\                                                  / /\\/ /
     / /\\/ /${' '.repeat(titlePadding)}${chalk.yellow.bold(title)}${' '.repeat(52 - title.length - titlePadding)}\\ \\/ /\\
    / /\\ \\/                                                    \\ \\/\\ \\
    \\ \\/\\ \\${' '.repeat(subtitlePadding)}${chalk.cyan.bold(subtitle)}${' '.repeat(52 - subtitle.length - subtitlePadding)}/\\ \\/ /
     \\/ /\\ \\                                                  / /\\/ /
     / /\\/ /${' '.repeat(readyPadding)}${chalk.green.bold(readyLine)}${' '.repeat(52 - readyLine.length - readyPadding)}\\ \\/ /\\
    / /\\ \\/                                                    \\ \\/\\ \\
    \\ \\/\\ \\.--..--..--..--..--..--..--..--..--..--..--..--..--./\\ \\/ /
     \\/ /\\/ ../ ../ ../ ../ ../ ../ ../ ../ ../ ../ ../ ../ ../ /\\/ /
     / /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\/ /\\
    / /\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\/\\ \\
    \\ \`'\\ \`'\\ \`'\\ \`'\\ \`'\\ \`'\\ \`'\\ \`'\\ \`'\\ \`'\\ \`'\\ \`'\\ \`'\\ \`'\\ \`'\\ \`' /
     \`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'\`--'
`;

  return chalk.green(border);
}

export async function showCharacterIntro(config: Config): Promise<void> {
  console.clear();
  
  const asciiArt = createCharacterASCII(config.character.name, config.character.weapon.name);
  
  console.log(asciiArt);
  console.log(''); // Just add a blank line after
  
  await sleep(2000);
}