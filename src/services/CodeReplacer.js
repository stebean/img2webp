/**
 * CodeReplacer.js
 *
 * Single Responsibility: Find and replace image extension references
 * (.png, .jpg, .jpeg) with .webp inside source code files.
 *
 * This service does not scan directories and does not convert images.
 * It only reads, transforms, and writes text files.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Matches file path-like strings ending in .png, .jpg, or .jpeg.
 *
 * Breakdown:
 *   [\w./\\-]+   — path characters: letters, digits, dots, slashes, hyphens
 *   \.           — literal dot before extension
 *   (png|jpe?g)  — png, jpg, or jpeg
 *
 * Flags:
 *   g — find ALL occurrences in the file, not just the first
 *   i — case-insensitive: also matches .PNG, .JPG, .JPEG
 */
const IMAGE_REF_REGEX = /[\w./\\-]+\.(png|jpe?g)/gi;

/**
 * @typedef {Object} ReplaceResult
 * @property {string}  filePath     - Absolute path of the processed file
 * @property {number}  count        - Number of replacements made (or found in dry-run)
 * @property {boolean} changed      - True if the file has (or would have) changes
 * @property {boolean} skipped      - True when dry-run mode is active
 * @property {string[]} matches     - The actual strings that were replaced
 * @property {string}  [error]      - Error message if processing failed
 */

export class CodeReplacer {
  /** @type {boolean} */
  #dryRun;

  /**
   * @param {{ dryRun?: boolean }} options
   */
  constructor({ dryRun = false } = {}) {
    this.#dryRun = dryRun;
  }

  /**
   * Process a list of source code files, replacing image references.
   *
   * @param {string[]} filePaths - Absolute paths to source code files
   * @returns {Promise<ReplaceResult[]>}
   */
  async replaceInFiles(filePaths) {
    const results = [];
    for (const filePath of filePaths) {
      const result = await this.#processFile(filePath);
      results.push(result);
    }
    return results;
  }

  // ─── Private Methods ─────────────────────────────────────────────────────────

  /**
   * Read a single file, apply replacements, and write it back.
   *
   * @param {string} filePath
   * @returns {Promise<ReplaceResult>}
   */
  async #processFile(filePath) {
    let originalContent;

    try {
      // Read as UTF-8 text — binary files are not expected here
      originalContent = await readFile(filePath, 'utf-8');
    } catch (err) {
      return { filePath, count: 0, changed: false, skipped: false, matches: [], error: err.message };
    }

    // Collect every match before replacing, so we can report them
    const foundMatches = [...originalContent.matchAll(IMAGE_REF_REGEX)].map((m) => m[0]);

    if (foundMatches.length === 0) {
      // No image references in this file — skip it silently
      return { filePath, count: 0, changed: false, skipped: false, matches: [] };
    }

    // Replace all matched references: change only the extension to .webp
    const updatedContent = originalContent.replace(IMAGE_REF_REGEX, (match) => {
      // Remove the old extension and add .webp
      const ext = path.extname(match);
      return match.slice(0, -ext.length) + '.webp';
    });

    // Dry run — report what would change, but don't write
    if (this.#dryRun) {
      return {
        filePath,
        count: foundMatches.length,
        changed: true,
        skipped: true,
        matches: [...new Set(foundMatches)], // deduplicate for cleaner output
      };
    }

    try {
      await writeFile(filePath, updatedContent, 'utf-8');
    } catch (err) {
      return { filePath, count: 0, changed: false, skipped: false, matches: [], error: err.message };
    }

    return {
      filePath,
      count: foundMatches.length,
      changed: true,
      skipped: false,
      matches: [...new Set(foundMatches)], // deduplicate for cleaner output
    };
  }
}
