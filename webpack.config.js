import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BUILD_DIR, BUNDLER_CONFIG_PATH, LIB_DIR, testDir } from './config.js';

let config = {};

try {
  if (BUNDLER_CONFIG_PATH) {
    config = await import(pathToFileURL(resolve(BUNDLER_CONFIG_PATH)).href);
  } else if (testDir) {
    config = await import(pathToFileURL(resolve(testDir, 'webpack.config.js')).href);
  } else {
    config = await import(pathToFileURL(resolve('webpack.config.js')).href);
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

export default async (...args) => {
  let userConfig = config;

  if (typeof config === 'function') {
    userConfig = config(...args);
  }

  // If user config is an array (multi-compiler), use the first config
  if (Array.isArray(userConfig)) {
    userConfig = userConfig[0] || {};
  }

  // Override module rules to ensure test files are not processed by user loaders
  const userModule = userConfig.module || {};
  const userRules = userModule.rules || [];

  // Filter out rules that might interfere with test files
  const filteredRules = userRules.map(rule => {
    // Skip babel-loader and other JS processors for test files
    if (rule.test && rule.test.toString().includes('\\.js')) {
      return {
        ...rule,
        exclude: [
          ...(Array.isArray(rule.exclude) ? rule.exclude : rule.exclude ? [rule.exclude] : []),
          /\.test\.js$/,
          /node_modules[\/\\]ektest/,
        ]
      };
    }
    return rule;
  });

  // Add rule for test files - keep them as ES modules with top-level await support
  filteredRules.unshift({
    test: /\.test\.js$/,
    type: 'javascript/esm',
    parser: {
      javascript: {
        dynamicImportMode: 'lazy',
        importMeta: true,
      }
    },
    resolve: {
      fullySpecified: false,
    },
  });

  // Load webpack dynamically to use EnvironmentPlugin
  const { default: webpack } = await import('webpack');

  // Filter out EnvironmentPlugin from user plugins to avoid errors, then add our own with defaults
  const filteredPlugins = (userConfig.plugins || []).filter(
    plugin => !(plugin && plugin.constructor && plugin.constructor.name === 'EnvironmentPlugin')
  );

  return {
    ...userConfig,
    target: 'node',
    mode: userConfig.mode || 'production',
    entry: {
      main: resolve(LIB_DIR, 'tests.js'),
    },
    output: {
      path: BUILD_DIR,
      filename: 'main.cjs',
      assetModuleFilename: '[name][ext]',
      publicPath: '/',
      clean: true,
    },
    module: {
      ...userModule,
      rules: filteredRules,
    },
    // Enable top-level await and other modern features
    experiments: {
      ...userConfig.experiments,
      topLevelAwait: true,
    },
    // Add EnvironmentPlugin with defaults to prevent undefined errors
    plugins: [
      ...filteredPlugins,
      new webpack.EnvironmentPlugin({
        HOST: 'localhost',
        PORT: '8080',
        NODE_ENV: 'test',
      }),
    ],
  };
};
