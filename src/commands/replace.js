/**
 * replace.js
 *
 * Single Responsibility: Orchestrate the code reference replacement flow.
 * Reads user options, delegates to FileScanner and CodeReplacer,
 * and reports results to the user via logger and ora spinner.
 */

import ora from 'ora';
import path from 'node:path';
import { FileScanner } from '../services/FileScanner.js';
import { CodeReplacer } from '../services/CodeReplacer.js';
import { logger } from '../utils/logger.js';

// Default file extensions to scan when the user doesn't specify --ext
const DEFAULT_EXTENSIONS = ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'vue', 'svelte'];

/**
 * Execute the "replace" command.
 *
 * @param {string} directory - Target directory from CLI argument
 * @param {Object} options   - Parsed CLI options from commander
 * @param {string}  options.ext     - Comma-separated file extensions to scan
 * @param {boolean} options.dryRun  - Preview without writing files
 */
export async function runReplace(directory, options) {
  const dryRun = Boolean(options.dryRun);
  const extensions = parseExtensions(options.ext);

  // ── Step 1: Header
  logger.title('img2webp — Replace Code References');
  if (dryRun) {
    logger.warn('Dry-run mode enabled. No files will be modified.');
  }
  logger.dim(`Directory  : ${path.resolve(directory)}`);
  logger.dim(`Extensions : ${extensions.join(', ')}`);

  // ── Step 2: Scan for source code files
  const scanner = new FileScanner();
  let codeFiles;

  try {
    codeFiles = await scanner.findCodeFiles(directory, extensions);
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }

  if (codeFiles.length === 0) {
    logger.warn('No matching source files found in the specified directory.');
    return;
  }

  logger.info(`Found ${codeFiles.length} file(s) to scan.\n`);

  // ── Step 3: Replace references in each file
  const replacer = new CodeReplacer({ dryRun });
  const spinner = ora({ text: 'Scanning files...', color: 'cyan' }).start();
  const results = await replacer.replaceInFiles(codeFiles);
  spinner.stop();

  // ── Step 4: Print per-file results
  let changedCount = 0;
  let totalReplacements = 0;

  for (const result of results) {
    const shortPath = path.relative(process.cwd(), result.filePath);

    if (result.error) {
      logger.error(`Could not read: ${shortPath}`);
      logger.dim(`  Reason: ${result.error}`);
      continue;
    }

    if (!result.changed) {
      // File had no image references — don't clutter the output
      continue;
    }

    if (result.skipped) {
      // Dry run
      logger.info(`${shortPath}  (${result.count} reference(s) found)`);
      result.matches.forEach((match) => {
        const replacement = match.replace(/\.(png|jpe?g)$/i, '.webp');
        logger.dim(`  ${match}  →  ${replacement}`);
      });
    } else {
      logger.success(`${shortPath}  (${result.count} replaced)`);
      changedCount++;
      totalReplacements += result.count;
    }
  }

  // ── Step 5: Summary
  console.log('');
  if (dryRun) {
    const totalFound = results.reduce((acc, r) => acc + r.count, 0);
    if (totalFound > 0) {
      logger.info(`Dry run complete. ${totalFound} reference(s) would be replaced across ${results.filter((r) => r.changed).length} file(s).`);
    } else {
      logger.info('Dry run complete. No image references found — nothing to replace.');
    }
  } else {
    if (totalReplacements > 0) {
      logger.success(`Done. ${totalReplacements} reference(s) replaced in ${changedCount} file(s).`);
    } else {
      logger.info('No image references found — nothing was changed.');
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse a comma-separated extension string from the CLI.
 * Falls back to DEFAULT_EXTENSIONS if the input is empty or invalid.
 *
 * @param {string} extOption - e.g. "html,css,js" or ".tsx, .vue"
 * @returns {string[]}
 */
function parseExtensions(extOption) {
  if (!extOption || !extOption.trim()) return DEFAULT_EXTENSIONS;

  const parsed = extOption
    .split(',')
    .map((e) => e.trim().replace(/^\./, '')) // remove leading dot if present
    .filter(Boolean); // remove empty strings

  return parsed.length > 0 ? parsed : DEFAULT_EXTENSIONS;
}
