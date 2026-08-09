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

/**
 * Execute the "convert" command.
 *
 * @param {string} directory  - Target directory from CLI argument
 * @param {Object} options    - Parsed CLI options from commander
 * @param {string} options.quality  - WebP quality (1-100)
 * @param {boolean} options.backup  - Keep original files as .bak
 * @param {boolean} options.dryRun  - Preview without writing files
 */
export async function runConvert(directory, options) {
  const quality = Number(options.quality);
  const backup = Boolean(options.backup);
  const dryRun = Boolean(options.dryRun);

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

  // ── Step 3: Convert images one by one
  let converter;
  try {
    converter = new ImageConverter({ quality, backup, dryRun });
  } catch (err) {
    // Catches invalid quality values before touching any files
    logger.error(err.message);
    process.exit(1);
  }

  const spinner = ora({ text: 'Converting...', color: 'cyan' }).start();
  const results = await converter.convertAll(imagePaths);
  spinner.stop();

  // ── Step 4: Print per-file results
  let successCount = 0;
  let errorCount = 0;

  for (const result of results) {
    const shortInput = path.relative(process.cwd(), result.inputPath);
    const shortOutput = path.relative(process.cwd(), result.outputPath);

    if (result.skipped) {
      // Dry run — show what WOULD happen
      logger.info(`${shortInput}  →  ${shortOutput}`);
    } else if (result.success) {
      logger.success(`${shortInput}  →  ${shortOutput}`);
      successCount++;
    } else {
      logger.error(`Failed: ${shortInput}`);
      logger.dim(`  Reason: ${result.error}`);
      errorCount++;
    }
  }

  // ── Step 5: Print summary
  console.log('');
  if (dryRun) {
    logger.info(`Dry run complete. ${imagePaths.length} file(s) would be converted.`);
  } else {
    if (successCount > 0) logger.success(`${successCount} image(s) converted successfully.`);
    if (errorCount > 0) logger.error(`${errorCount} image(s) failed.`);
    if (backup) logger.dim('Original files saved as .bak');
  }
}
