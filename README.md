# ektest 🚀

A lightweight, zero-configuration testing library for modern JavaScript applications with ES modules and bundler support.

## Why ektest?

Tired of complex configuration setups with Jest, Mocha, and other testing frameworks when working with ES modules and bundlers? ektest is designed to work out of the box with minimal to zero configuration, especially for projects using:

- ✅ ES Modules (`type: "module"`)
- ✅ Webpack bundling
- ✅ Modern JavaScript features
- ✅ Node.js testing

## Features

- 🎯 **Zero Configuration** - Works out of the box
- 📦 **Bundler Integration** - Built-in Webpack support
- 🔄 **ES Modules** - Native support for modern JavaScript
- 🎨 **Beautiful Output** - Clean, readable test results
- 🚀 **Lightweight** - Minimal dependencies
- 🔧 **Configurable** - Optional configuration when needed

## Installation

```bash
npm install ektest
```

## Quick Start

1. **Create a test file** (e.g., `math.test.js`):

```javascript
// math.test.js
test('addition should work', () => {
  expect('2 + 2', 2 + 2).toBe(4);
});

test('subtraction should work', () => {
  expect('5 - 3', 5 - 3).toBe(2);
});

test('arrays should contain elements', () => {
  expect('[1, 2, 3]', [1, 2, 3]).toHave([1, 2]);
});
```

1. **Run your tests**:

```bash
npx ektest
```

That's it! 🎉

## Available Matchers

ektest provides a comprehensive set of matchers for your assertions:

**Note:** The `expect` function takes two parameters: `expect(name, value)` where `name` is a descriptive string and `value` is the actual value to test.

```javascript
// Equality
expect('value', value).toBe(4);
expect('value', value).not.toBe(5);

// Truthiness
expect('value', value).toBeTruthy();
expect('value', value).toBeFalsy();
expect('value', value).toBeNull();
expect('value', value).toBeDefined();

// Numbers
expect('value', value).toBeGreaterThan(3);
expect('value', value).toBeLessThan(5);
expect('value', value).toBeNumber();

// Strings
expect('string', string).toMatch(/pattern/);
expect('string', string).toBeString();

// Arrays and Objects
expect('array', array).toHave(item);
expect('array', array).toHave([item1, item2]); // Multiple items
expect('array', array).toBeArray();
expect('object', object).toHave('property');
expect('object', object).toBeObject();
expect('value', value).toBeEmpty();

// Type checking
expect('value', value).toBeInstanceOf(Array);
expect('value', value).toBeBoolean();

// Inclusion
expect('value', value).toBeIn([1, 2, 3, 4]);
```

## CLI Options

```bash
# Basic usage
npx ektest

# Detailed output
npx ektest --detailed
npx ektest -d

# Summary only
npx ektest --summary
npx ektest -s
```

## Configuration

ektest works with zero configuration, but you can customize it by creating a `ektest.config.json` file:

```json
{
  "testDir": "tests",
  "bundler": "webpack",
  "bundlerConfig": "custom-webpack.config.js"
}
```

### Configuration Options

- **`testDir`** (string): Directory to search for test files (default: current directory)
- **`bundler`** (string): Bundler to use (default: "webpack")
- **`bundlerConfig`** (string): Path to custom bundler configuration

## Test File Discovery

ektest automatically finds test files with the pattern `*.test.js` in your project directory, excluding:

- `node_modules`
- `dist`
- `build`
- `coverage`
- `tools`
- `docs`
- `examples`
- `scripts`
- `vendor`
- `public`
- `assets`
- `static`
- `bin`
- `fixtures`
- `data`
- `temp`

## Examples

### Basic Test

```javascript
// calculator.test.js
test('calculator adds numbers correctly', () => {
  const result = 2 + 3;
  expect('result', result).toBe(5);
});
```

### Array and Object Tests

```javascript
// collections.test.js
test('array contains elements', () => {
  const numbers = [1, 2, 3, 4, 5];
  expect('numbers', numbers).toHave(3);
  expect('numbers', numbers).toHave([1, 2]);
});

test('object has properties', () => {
  const user = { name: 'John', age: 30 };
  expect('user', user).toHave('name');
  expect('user', user).toHave(['name', 'age']);
});
```

### Type Checking Tests

```javascript
// types.test.js
test('type checking works', () => {
  expect('hello', 'hello').toBeString();
  expect('number', 42).toBeNumber();
  expect('boolean', true).toBeBoolean();
  expect('array', [1, 2, 3]).toBeArray();
  expect('object', {}).toBeObject();
});
```

### Async Tests

```javascript
// async.test.js
test('async operation works', async () => {
  const data = await fetchData();
  expect('data', data).toBeDefined();
  expect('data', data).toBeObject();
});

test('async calculation', async () => {
  const result = await new Promise(resolve => {
    setTimeout(() => resolve(10 + 5), 100);
  });
  expect('result', result).toBe(15);
});

test('async array processing', async () => {
  const numbers = [1, 2, 3, 4, 5];
  const doubled = await Promise.all(numbers.map(async n => n * 2));
  expect('doubled', doubled).toHave([2, 4, 6, 8, 10]);
  expect('doubled', doubled).toBeArray();
});
```

## Project Structure

```text
your-project/
├── src/
│   ├── math.js
│   └── utils.js
├── tests/
│   ├── math.test.js
│   └── utils.test.js
├── package.json
└── ektest.config.json (optional)
```

## Roadmap

- 🎯 **More Matchers** - Add toEqual, toThrow, toContain, and promise matchers
- 🌐 **Browser Testing** - Run tests in real browsers
- 📊 **Code Coverage** - Built-in coverage reporting
- 🔄 **More Bundlers** - Support for Vite, Rollup, esbuild
- 🎯 **Test Runners** - Parallel test execution
- 📸 **Snapshot Testing** - Visual regression testing
- 🔍 **Test Debugging** - Better debugging experience

## Why Choose ektest?

### Before (with other frameworks)

```javascript
// Complex configuration required
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
```

### After (with ektest)

```bash
npm install ektest
npx ektest
```

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## License

MIT © Ajit Kumar

---

**Made with ❤️ for developers who want to focus on writing tests, not configuring them.**
