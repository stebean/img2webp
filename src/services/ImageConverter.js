/**
 * ImageConverter.js
 *
 * Single Responsibility: Convert image files to WebP format using sharp.
 * This service does not scan directories, does not touch source code,
 * and does not know about the CLI. It only converts images.
 */

import sharp from 'sharp';
import { rename, unlink } from 'node:fs/promises';
import path from 'node:path';

/**
 * @typedef {Object} ConvertOptions
 * @property {number}  quality  - WebP quality from 1 to 100 (default: 80)
 * @property {boolean} backup   - If true, keep original files as .bak
 * @property {boolean} dryRun   - If true, simulate without writing files
 */

/**
 * @typedef {Object} ConvertResult
 * @property {string}  inputPath   - Original file path
 * @property {string}  outputPath  - WebP output file path
 * @property {boolean} success     - Whether the conversion succeeded
 * @property {boolean} skipped     - True when dry-run mode is active
 * @property {string}  [error]     - Error message if success is false
 */

export class ImageConverter {
  /** @type {number} */
  #quality;

  /** @type {boolean} */
  #backup;

  /** @type {boolean} */
  #dryRun;

  /**
   * @param {ConvertOptions} options
   */
  constructor({ quality = 80, backup = false, dryRun = false } = {}) {
    this.#quality = this.#validateQuality(quality);
    this.#backup = backup;
    this.#dryRun = dryRun;
  }

  /**
   * Convert a list of image files to WebP.
   *
   * @param {string[]} imagePaths - Absolute paths to PNG/JPEG files
   * @returns {Promise<ConvertResult[]>}
   */
  async convertAll(imagePaths) {
    // Process files sequentially to avoid overwhelming the system with
    // parallel I/O on large image batches
    const results = [];
    for (const inputPath of imagePaths) {
      const result = await this.#convertOne(inputPath);
      results.push(result);
    }
    return results;
  }

  // ─── Private Methods ─────────────────────────────────────────────────────────

  /**
   * Convert a single image file to WebP.
   *
   * @param {string} inputPath - Absolute path to the source image
   * @returns {Promise<ConvertResult>}
   */
  async #convertOne(inputPath) {
    const outputPath = this.#buildOutputPath(inputPath);

    // Dry run: report what would happen without doing it
    if (this.#dryRun) {
      return { inputPath, outputPath, success: true, skipped: true };
    }

    try {
      // sharp reads the input, converts to WebP, writes output
      await sharp(inputPath)
        .webp({ quality: this.#quality })
        .toFile(outputPath);

      // Handle original file: backup or delete
      if (this.#backup) {
        // Rename original to .bak so the user can restore it if needed
        await rename(inputPath, `${inputPath}.bak`);
      } else {
        // Remove original — the WebP replaces it
        await unlink(inputPath);
      }

      return { inputPath, outputPath, success: true, skipped: false };
    } catch (err) {
      // Catch per-file errors so one bad file doesn't stop the whole batch
      return { inputPath, outputPath, success: false, skipped: false, error: err.message };
    }
  }

  /**
   * Build the WebP output path by replacing the original extension.
   * Example: /project/img/hero.png → /project/img/hero.webp
   *
   * @param {string} inputPath
   * @returns {string}
   */
  #buildOutputPath(inputPath) {
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    return path.join(dir, `${name}.webp`);
  }

  /**
   * Validates that quality is an integer between 1 and 100.
   * Throws early so the user gets a clear error before any files are touched.
   *
   * @param {number|string} value
   * @returns {number}
   * @throws {Error}
   */
  #validateQuality(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      throw new Error(`Quality must be an integer between 1 and 100. Got: "${value}"`);
    }
    return parsed;
  }
}
