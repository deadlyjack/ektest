import { resolve } from 'node:path';
import { BUILD_DIR, BUNDLER_CONFIG_PATH, LIB_DIR, testDir } from './config.js';

let config = {};

try {
  if (BUNDLER_CONFIG_PATH) {
    config = await import(resolve(BUNDLER_CONFIG_PATH));
  } else if (testDir) {
    config = await import(resolve(testDir, 'webpack.config.js'));
  } else {
    config = await import(resolve('webpack.config.js'));
  }

  if ('default' in config) {
    config = config.default;
  }

  if (!config) {
    throw new Error('Bundler configuration is not defined');
  }
} catch (error) {
  console.error('Error loading user bundler config:', error);
}

export default (...args) => {
  if (typeof config === 'function') {
    config = config(...args);
  }

  return {
    ...config,
    mode: config.mode || 'production',
    entry: {
      main: resolve(LIB_DIR, 'tests.js'),
    },
    output: {
      path: BUILD_DIR,
      filename: 'main.cjs',
      assetModuleFilename: '[name][ext]',
      publicPath: '/',
      clean: true,
    }
  }
};
