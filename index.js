#!/usr/bin/env node

import { exec, spawn } from 'node:child_process';
import { readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import Loader from './lib/loader.js';
import config from './lib/config.js';
import { BUILD_DIR, LIB_DIR, testDir } from './config.js';

const excludedDirs = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  'tools',
  'docs',
  'examples',
  'scripts',
  'vendor',
  'public',
  'assets',
  'static',
  'bin',
  'fixtures',
  'data',
  'temp',
];

const loader = new Loader('Preparing test files', 'spinner');
const detailed = process.argv.includes('--detailed') || process.argv.includes('-d');
const summary = process.argv.includes('--summary') || process.argv.includes('-s');
const webpackConfig = resolve(process.cwd(), 'node_modules', 'ektest', 'webpack.config.js');

let verbose = config.VERBOSE_TYPE_NONE;

if (detailed) {
  verbose = config.VERBOSE_TYPE_DETAILED;
} else if (summary) {
  verbose = config.VERBOSE_TYPE_SUMMARY;
}

(async () => {
  loader.start();

  await mkdir(BUILD_DIR, { recursive: true });

  const testFiles = (await getTestFiles(testDir || process.cwd())).sort((a, b) => a.localeCompare(b));

  if (testFiles.length === 0) {
    loader.clear();
    console.error('No test files found. Please ensure you have test files in the specified directory.');
    process.exit(1);
  }

  const testLibPath = pathToFileURL(resolve(process.cwd(), 'node_modules/ektest/lib/test.js')).href;
  const expectLibPath = pathToFileURL(resolve(process.cwd(), 'node_modules/ektest/lib/expect.js')).href;
  const summaryLibPath = pathToFileURL(resolve(process.cwd(), 'node_modules/ektest/lib/summary.js')).href;
  const configLibPath = pathToFileURL(resolve(process.cwd(), 'node_modules/ektest/lib/config.js')).href;
  const loaderLibPath = pathToFileURL(resolve(process.cwd(), 'node_modules/ektest/lib/loader.js')).href;
  const queryLibPath = pathToFileURL(resolve(process.cwd(), 'node_modules/ektest/lib/query.js')).href;

  let tests = `
  import test from "${testLibPath}";
  import expect from "${expectLibPath}";
  import summary from "${summaryLibPath}";
  import config from '${configLibPath}';
  import Loader from '${loaderLibPath}';
  import query, { setupElectron, waitFor } from '${queryLibPath}';

  globalThis = (typeof globalThis === 'object' && globalThis) || (typeof self === 'object' && self) || (typeof window === 'object' && window) || {};
  globalThis.test = test;
  globalThis.expect = expect;
  globalThis.query = query;
  globalThis.setupElectron = setupElectron;
  globalThis.waitFor = waitFor;

  config.verbose = ${verbose};

  const loader = new Loader('Loading test files', 'spinner');
  loader.start();

  (async () => {
    try {`;

  for (const file of testFiles) {
    const cwd = process.cwd().replace(/\\/g, '/');
    const normalizedFile = file.replace(/\\/g, '/');
    const relativePath = normalizedFile.replace(`${cwd}/`, '');
    const fileURL = pathToFileURL(file).href;
    tests += `
    config.file = '${relativePath}';
    await import('${fileURL}');
`;
  }

  tests += `  } catch (error) {
    console.error('Error loading test files', error);
  }
  
  loader.update('Running tests');

  try {
    await summary(loader);
  } catch (error) {
    loader.stop('Error during summary');
    console.error('Error during summary:', error);
  }

  process.exit(0);
})();
`;

  await writeFile(resolve(LIB_DIR, 'tests.js'), tests, 'utf8');
  await new Promise((resolve, reject) => {
    // Use proper quoting for cross-platform compatibility
    exec(`npx webpack --config "${webpackConfig}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Webpack compilation failed:');
        if (stderr) console.error(stderr);
        if (stdout) console.log(stdout);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
  loader.clear();

  spawn('node', [resolve(BUILD_DIR, 'main.cjs')], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  }).on('exit', (code) => {
    process.exit(code);
  });
})();

/**
 * Recursively get all test files in the given path.
 * @param {string} path - The directory path to search for test files.
 * @returns {Promise<string[]>} - A promise that resolves to an array of test file paths.
 */
async function getTestFiles(path) {
  loader.update(`Searching for test files in ${path}`);
  const files = await readdir(path);
  const allTestFiles = [];
  for (const file of files) {
    if (excludedDirs.includes(file) || file.startsWith('.')) {
      continue; // Skip excluded directories
    }

    const fullPath = resolve(path, file);
    const fileStat = await stat(fullPath);
    if (fileStat.isFile() && file.endsWith('.test.js')) {
      allTestFiles.push(fullPath);
    } else if (fileStat.isDirectory()) {
      allTestFiles.push(...await getTestFiles(fullPath));
    }
  }
  return allTestFiles;
}
