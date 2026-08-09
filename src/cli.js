#!/usr/bin/env node

/**
 * cli.js — Entry point of the img2webp CLI tool.
 *
 * Single Responsibility: Parse arguments and delegate to commands.
 * This file should NEVER contain business logic (no file reading,
 * no image processing). It only wires up the CLI interface.
 */

import { program } from 'commander';
import { createRequire } from 'module';
import { logger } from './utils/logger.js';
import { runConvert } from './commands/convert.js';
import { runReplace } from './commands/replace.js';

// Load package.json to read the version dynamically
// We use createRequire because we are in ES Module context ("type": "module")
const require = createRequire(import.meta.url);
const { version, description } = require('../package.json');

program
  .name('img2webp')
  .description(description)
  .version(version, '-v, --version', 'Output the current version');

// ─── CONVERT command ──────────────────────────────────────────────────────────
// Converts PNG/JPEG images to WebP in the given directory
program
  .command('convert <directory>')
  .description('Convert all PNG/JPEG images in a directory to WebP')
  .option('-q, --quality <number>', 'WebP quality (1-100)', '80')
  .option('-b, --backup', 'Keep the original images after conversion')
  .option('-d, --dry-run', 'Preview what would be converted without making changes')
  .action(async (directory, options) => {
    await runConvert(directory, options);
  });

// ─── REPLACE command ──────────────────────────────────────────────────────────
// Replaces image references in source code files
program
  .command('replace <directory>')
  .description('Replace .png/.jpeg/.jpg references with .webp in source code files')
  .option('-e, --ext <extensions>', 'Comma-separated file extensions to scan', 'html,css,js,jsx,ts,tsx,vue,svelte')
  .option('-d, --dry-run', 'Preview what would be replaced without making changes')
  .action(async (directory, options) => {
    await runReplace(directory, options);
  });

// ─── Global error handling ────────────────────────────────────────────────────
// If the user types an unknown command, show a helpful error instead of crashing
program.on('command:*', (unknownCommand) => {
  logger.error(`Unknown command: "${unknownCommand[0]}"`);
  logger.dim('Run "img2webp --help" to see available commands.');
  process.exit(1);
});

program.parse(process.argv);
