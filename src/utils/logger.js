#!/usr/bin/env node

/**
 * logger.js
 *
 * Single Responsibility: All terminal output goes through here.
 * No other file should use chalk directly — they call logger instead.
 * This makes it easy to change the output style in one place.
 */

import chalk from 'chalk';

export const logger = {
  /**
   * Informational message — neutral, white
   * @param {string} message
   */
  info(message) {
    console.log(chalk.white(`  ${message}`));
  },

  /**
   * Success message — green with checkmark
   * @param {string} message
   */
  success(message) {
    console.log(chalk.green(`  ✔ ${message}`));
  },

  /**
   * Warning message — yellow with warning sign
   * @param {string} message
   */
  warn(message) {
    console.warn(chalk.yellow(`  ⚠ ${message}`));
  },

  /**
   * Error message — red with cross
   * @param {string} message
   */
  error(message) {
    console.error(chalk.red(`  ✖ ${message}`));
  },

  /**
   * Dimmed/secondary info — for less important details
   * @param {string} message
   */
  dim(message) {
    console.log(chalk.dim(`    ${message}`));
  },

  /**
   * Section title — bold and cyan, visually separates steps
   * @param {string} title
   */
  title(message) {
    console.log('\n' + chalk.bold.cyan(`  ${message}`));
  },
};
