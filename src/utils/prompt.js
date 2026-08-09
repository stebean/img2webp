/**
 * prompt.js
 *
 * Single Responsibility: Ask the user a yes/no question in the terminal.
 * Uses Node's built-in readline — no external dependencies.
 */

import readline from 'node:readline';

/**
 * Ask a yes/no question. Returns true if the user answers "y" or "yes".
 * Pressing Enter without typing defaults to "no" (safe default).
 *
 * @param {string} question - The question to display
 * @returns {Promise<boolean>}
 */
export function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`  ${question} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

/**
 * Format bytes into a human-readable string.
 * Example: 245760 → "240.0 KB"
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calculate the size reduction percentage between two file sizes.
 * Returns a colored string: green if smaller, red if larger.
 *
 * @param {number} before - Original size in bytes
 * @param {number} after  - New size in bytes
 * @returns {string}
 */
export function formatSavings(before, after) {
  if (before === 0) return '';
  const diff = before - after;
  const pct = ((diff / before) * 100).toFixed(1);
  const sign = diff >= 0 ? '-' : '+';
  return `${sign}${Math.abs(pct)}%`;
}
