import os from 'node:os';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const configPath = resolve(process.cwd(), 'ektest.config.json');

const userConfig = (() => {
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
})();

export const LIB_DIR = `${os.tmpdir()}/ektest`;
export const BUILD_DIR = resolve(LIB_DIR, 'build');
export const BUNDLER = userConfig.bundler || 'webpack';
export const BUNDLER_CONFIG_PATH = userConfig.bundlerConfigPath;
export let testDir = userConfig.testDir ? resolve(process.cwd(), userConfig.testDir) : '';

export default {
  set testDir(dir) {
    testDir = dir;
  },
  get testDir() {
    return testDir;
  },
}