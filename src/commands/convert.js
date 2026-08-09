/**
 * convert.js
 *
 * Single Responsibility: Orchestrate the image conversion flow.
 * Reads user options, delegates to FileScanner and ImageConverter,
 * and reports results to the user via logger and ora spinner.
 *
 * This module knows about the CLI options, but NOT about sharp or fs.
 */

import ora from 'ora';
import path from 'node:path';
import { FileScanner } from '../services/FileScanner.js';
import { ImageConverter } from '../services/ImageConverter.js';
import { logger } from '../utils/logger.js';
import { confirm, formatBytes, formatSavings } from '../utils/prompt.js';

/**
 * Execute the "convert" command.
 *
 * @param {string} directory  - Target directory from CLI argument
 * @param {Object} options    - Parsed CLI options from commander
 * @param {string}  options.quality  - WebP quality (1-100)
 * @param {boolean} options.backup   - Keep original files as .bak
 * @param {boolean} options.dryRun   - Preview without writing files
 * @param {boolean} options.yes      - Skip confirmation prompt
 */
export async function runConvert(directory, options) {
  const quality = Number(options.quality);
  const backup = Boolean(options.backup);
  const dryRun = Boolean(options.dryRun);
  const skipConfirm = Boolean(options.yes);

  // ── Step 1: Print a clear header so the user knows what's about to happen
  logger.title('img2webp — Convert Images');
  if (dryRun) {
    logger.warn('Dry-run mode enabled. No files will be modified.');
  }
  logger.dim(`Directory : ${path.resolve(directory)}`);
  logger.dim(`Quality   : ${quality}`);
  logger.dim(`Backup    : ${backup}`);

  // ── Step 2: Scan for images
  const scanner = new FileScanner();
  let imagePaths;

  try {
    imagePaths = await scanner.findImages(directory);
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }

  if (imagePaths.length === 0) {
    logger.warn('No PNG or JPEG images found in the specified directory.');
    return;
  }

  logger.info(`Found ${imagePaths.length} image(s) to convert.\n`);

  // ── Step 3: Validate quality before confirmation (fail fast)
  let converter;
  try {
    converter = new ImageConverter({ quality, backup, dryRun });
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }

  // ── Step 4: Confirmation prompt for destructive operations
  // Skip if: dry-run (safe), --backup (safe, originals kept), or --yes flag
  if (!dryRun && !backup && !skipConfirm) {
    logger.warn(`This will permanently delete ${imagePaths.length} original file(s).`);
    logger.dim('  Tip: use --backup to keep originals, or --dry-run to preview first.\n');

    const proceed = await confirm('Do you want to continue?');
    if (!proceed) {
      logger.info('Cancelled. No files were modified.');
      return;
    }
    console.log('');
  }

  // ── Step 5: Convert images
  const spinner = ora({ text: 'Converting...', color: 'cyan' }).start();
  const results = await converter.convertAll(imagePaths);
  spinner.stop();

  // ── Step 6: Print per-file results with size info
  let successCount = 0;
  let errorCount = 0;
  let totalSizeIn = 0;
  let totalSizeOut = 0;

  for (const result of results) {
    const shortInput = path.relative(process.cwd(), result.inputPath);
    const shortOutput = path.relative(process.cwd(), result.outputPath);

    if (result.skipped) {
      // Dry run — show what WOULD happen (no size data available without converting)
      logger.info(`${shortInput}  →  ${shortOutput}`);
    } else if (result.success) {
      const savings = formatSavings(result.sizeIn, result.sizeOut);
      const sizeInfo = `${formatBytes(result.sizeIn)} → ${formatBytes(result.sizeOut)}  ${savings}`;

      logger.success(`${shortInput}  →  ${shortOutput}`);
      logger.dim(sizeInfo);

      // Show backup path if created
      if (result.backupPath) {
        logger.dim(`  backup: ${path.relative(process.cwd(), result.backupPath)}`);
      }

      successCount++;
      totalSizeIn += result.sizeIn ?? 0;
      totalSizeOut += result.sizeOut ?? 0;
    } else {
      logger.error(`Failed: ${shortInput}`);
      logger.dim(`  Reason: ${result.error}`);
      errorCount++;
    }
  }

  // ── Step 7: Summary
  console.log('');
  if (dryRun) {
    logger.info(`Dry run complete. ${imagePaths.length} file(s) would be converted.`);
  } else {
    if (successCount > 0) {
      const totalSavings = formatSavings(totalSizeIn, totalSizeOut);
      logger.success(`${successCount} image(s) converted.  ${formatBytes(totalSizeIn)} → ${formatBytes(totalSizeOut)}  ${totalSavings} saved`);
    }
    if (errorCount > 0) logger.error(`${errorCount} image(s) failed.`);
    if (backup) logger.dim('Original files saved as .bak — delete them manually when done.');
  }
}
