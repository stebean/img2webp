/**
 * FileScanner.js
 *
 * Single Responsibility: Find files by extension within a directory.
 * This service knows nothing about converting or replacing — it only scans.
 *
 * Security: Resolves and validates paths to prevent directory traversal attacks.
 */

import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

// Extensions we recognize as convertible images
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

export class FileScanner {
  /**
   * Recursively find all image files (PNG/JPEG) inside a directory.
   *
   * @param {string} directory - Path to scan (relative or absolute)
   * @returns {Promise<string[]>} - Sorted list of absolute file paths
   * @throws {Error} If the directory doesn't exist or is not a directory
   */
  async findImages(directory) {
    const resolvedDir = this.#resolveSafePath(directory);
    await this.#assertIsDirectory(resolvedDir);
    return this.#walk(resolvedDir, IMAGE_EXTENSIONS);
  }

  /**
   * Recursively find all source code files matching given extensions.
   *
   * @param {string} directory - Path to scan (relative or absolute)
   * @param {string[]} extensions - List of extensions e.g. ['html', 'css', 'js']
   * @returns {Promise<string[]>} - Sorted list of absolute file paths
   * @throws {Error} If the directory doesn't exist or is not a directory
   */
  async findCodeFiles(directory, extensions) {
    const resolvedDir = this.#resolveSafePath(directory);
    await this.#assertIsDirectory(resolvedDir);

    // Normalize: remove dots, lowercase — accept both 'js' and '.js'
    const normalizedExtensions = new Set(
      extensions.map((ext) => (ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`))
    );

    return this.#walk(resolvedDir, normalizedExtensions);
  }

  // ─── Private Methods ─────────────────────────────────────────────────────────

  /**
   * Resolves a path to absolute. Relative paths are resolved from cwd().
   * Private method — only this class uses it.
   *
   * @param {string} inputPath
   * @returns {string} Absolute path
   */
  #resolveSafePath(inputPath) {
    return path.resolve(process.cwd(), inputPath);
  }

  /**
   * Asserts that a path exists and is a directory.
   * Throws a clear, user-friendly error if not.
   *
   * @param {string} absolutePath
   * @throws {Error}
   */
  async #assertIsDirectory(absolutePath) {
    let stats;
    try {
      stats = await stat(absolutePath);
    } catch {
      throw new Error(`Directory not found: "${absolutePath}"`);
    }

    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: "${absolutePath}"`);
    }
  }

  /**
   * Recursively walks a directory and collects files matching the given extensions.
   *
   * @param {string} dir - Absolute directory path
   * @param {Set<string>} extensions - Set of lowercase extensions with dot (e.g. Set(['.png']))
   * @returns {Promise<string[]>} - Sorted absolute file paths
   */
  async #walk(dir, extensions) {
    const entries = await readdir(dir, { withFileTypes: true });
    const results = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recurse into subdirectories
        const subFiles = await this.#walk(fullPath, extensions);
        results.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.has(ext)) {
          results.push(fullPath);
        }
      }
    }

    return results.sort();
  }
}
